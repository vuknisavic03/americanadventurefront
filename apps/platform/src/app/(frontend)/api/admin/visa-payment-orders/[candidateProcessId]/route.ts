import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  cancelVisaPaymentOrder,
  issueVisaPaymentOrder,
  recordVisaPayment,
  VisaPaymentOrderError,
  visaPaymentOrdersForAdmin,
} from '@/modules/visa-payments/service.ts'

const issueSchema = z.object({
  action: z.literal('ISSUE'),
  amountMinor: z.number().int().positive().max(100_000_000_00),
  bankAccount: z.string().trim().min(5).max(100),
  beneficiaryAddress: z.string().trim().max(300).optional(),
  beneficiaryName: z.string().trim().min(2).max(200),
  candidateInstructions: z.string().trim().min(2).max(2_000),
  currency: z.enum(['RSD', 'USD']),
  dueAt: z.iso.datetime(),
  idempotencyKey: z.uuid(),
  paymentModel: z.string().trim().max(20).optional(),
  paymentPurpose: z.string().trim().min(5).max(500),
  paymentReference: z.string().trim().min(2).max(100),
}).strict()
const recordSchema = z.object({
  action: z.literal('RECORD_PAYMENT'),
  expectedStatusVersion: z.number().int().positive(),
  externalPaymentReference: z.string().trim().max(160).optional(),
  orderId: z.number().int().positive(),
  paidAt: z.iso.datetime(),
  paymentNote: z.string().trim().max(1_000).optional(),
}).strict()
const cancelSchema = z.object({
  action: z.literal('CANCEL'),
  expectedStatusVersion: z.number().int().positive(),
  orderId: z.number().int().positive(),
  reason: z.string().trim().min(5).max(1_000),
}).strict()
const requestSchema = z.discriminatedUnion('action', [issueSchema, recordSchema, cancelSchema])

function response(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

async function administrator() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') return { payload }
  return { administratorId: authentication.user.id, payload }
}

function processId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

export async function GET(_request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = processId((await params).candidateProcessId)
  if (!candidateProcessId) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  try {
    return response(await visaPaymentOrdersForAdmin({ candidateProcessId, payload: authentication.payload }))
  } catch (error) {
    if (error instanceof VisaPaymentOrderError) return response({ message: error.message }, error.status)
    console.error('Visa payment order state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Evidencija viznih naloga trenutno nije dostupna.' }, 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = processId((await params).candidateProcessId)
  if (!candidateProcessId) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  const parsed = requestSchema.safeParse(await request.json().catch(() => undefined))
  if (!parsed.success) return response({ message: 'Proverite obavezna polja, iznos i datume.' }, 400)
  try {
    if (parsed.data.action === 'ISSUE') {
      const result = await issueVisaPaymentOrder({ administratorId: authentication.administratorId, candidateProcessId, idempotencyKey: parsed.data.idempotencyKey, now: new Date(), payload: authentication.payload, terms: parsed.data })
      return response({ message: result.created ? 'Vizni nalog je izdat i dostupan kandidatu.' : 'Ovaj nalog je već izdat; duplikat nije napravljen.', order: result.order }, result.created ? 201 : 200)
    }
    if (parsed.data.action === 'RECORD_PAYMENT') {
      const result = await recordVisaPayment({ administratorId: authentication.administratorId, candidateProcessId, expectedStatusVersion: parsed.data.expectedStatusVersion, externalPaymentReference: parsed.data.externalPaymentReference, now: new Date(), orderId: parsed.data.orderId, paidAt: new Date(parsed.data.paidAt), paymentNote: parsed.data.paymentNote, payload: authentication.payload })
      return response({ message: result.changed ? 'Uplata viznih troškova je evidentirana.' : 'Uplata je već bila evidentirana.', order: result.order })
    }
    const order = await cancelVisaPaymentOrder({ administratorId: authentication.administratorId, candidateProcessId, expectedStatusVersion: parsed.data.expectedStatusVersion, now: new Date(), orderId: parsed.data.orderId, payload: authentication.payload, reason: parsed.data.reason })
    return response({ message: 'Vizni nalog je otkazan. Sada možete izdati ispravljenu verziju.', order })
  } catch (error) {
    if (error instanceof VisaPaymentOrderError) return response({ message: error.message }, error.status)
    console.error('Visa payment order mutation failed.', error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { name: 'UNKNOWN_ERROR' })
    return response({ message: 'Obrada viznog naloga trenutno nije dostupna.' }, 500)
  }
}
