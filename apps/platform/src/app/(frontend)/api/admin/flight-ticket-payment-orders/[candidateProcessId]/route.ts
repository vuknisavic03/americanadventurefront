import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { cancelFlightTicketPaymentOrder, FlightTicketPaymentError, flightTicketPaymentOrdersForAdmin, issueFlightTicketPaymentOrder, recordFlightTicketPayment } from '@/modules/flight-ticket-payments/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

const issueSchema = z.object({
  action: z.literal('ISSUE'), advanceInvoiceNumber: z.string().max(100).optional(), bankAccount: z.string().max(100),
  beneficiaryAddress: z.string().max(300), beneficiaryName: z.string().max(200), beneficiaryRegistrationNumber: z.string().max(32).optional(),
  beneficiaryTaxId: z.string().max(32).optional(), candidateInstructions: z.string().max(2_000), dueAt: z.iso.datetime(),
  exchangeRateDate: z.iso.datetime(), exchangeRateReference: z.string().max(500).optional(), exchangeRateScaled: z.number().int().positive(),
  exchangeRateSource: z.string().max(200), idempotencyKey: z.uuid(), includeAdvanceInvoice: z.boolean(), paymentModel: z.string().max(20).optional(),
  paymentPurpose: z.string().max(500), paymentReference: z.string().max(100),
})
const paymentSchema = z.object({ action: z.literal('RECORD_PAYMENT'), expectedStatusVersion: z.number().int().positive(), externalPaymentReference: z.string().max(160).optional(), orderId: z.number().int().positive(), paidAt: z.iso.datetime(), paymentNote: z.string().max(1_000).optional() })
const cancelSchema = z.object({ action: z.literal('CANCEL'), expectedStatusVersion: z.number().int().positive(), orderId: z.number().int().positive(), reason: z.string().min(5).max(1_000) })
const schema = z.discriminatedUnion('action', [issueSchema, paymentSchema, cancelSchema])
const json = (data: unknown, status = 200) => Response.json(data, { status })

async function context(candidateProcessId: string) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') throw new FlightTicketPaymentError('Administratorska prijava je obavezna.', 401)
  const id = Number(candidateProcessId)
  if (!Number.isSafeInteger(id) || id < 1) throw new FlightTicketPaymentError('Proces kandidata nije pronađen.', 404)
  return { administratorId: authentication.user.id, candidateProcessId: id, payload }
}

export async function GET(_request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  try { const value = await context((await params).candidateProcessId); return json(await flightTicketPaymentOrdersForAdmin(value)) }
  catch (error) { return error instanceof FlightTicketPaymentError ? json({ message: error.message }, error.status) : (console.error('Flight ticket payment state failed.', error), json({ message: 'Evidencija trenutno nije dostupna.' }, 500)) }
}

export async function POST(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  if (!isSameOriginRequest(request)) return json({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ message: 'Očekivan je JSON zahtev.' }, 415)
  try {
    const value = await context((await params).candidateProcessId)
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return json({ message: 'Podaci zahteva nisu ispravni.' }, 400)
    const now = new Date()
    if (parsed.data.action === 'ISSUE') return json(await issueFlightTicketPaymentOrder({ ...value, idempotencyKey: parsed.data.idempotencyKey, now, terms: parsed.data }), 201)
    if (parsed.data.action === 'RECORD_PAYMENT') return json(await recordFlightTicketPayment({ ...value, ...parsed.data, now, paidAt: new Date(parsed.data.paidAt) }))
    return json(await cancelFlightTicketPaymentOrder({ ...value, ...parsed.data, now }))
  } catch (error) {
    if (error instanceof FlightTicketPaymentError) return json({ message: error.message }, error.status)
    console.error('Flight ticket payment mutation failed.', error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error)
    return json({ message: 'Nalog trenutno nije moguće obraditi.' }, 500)
  }
}
