import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { CandidatePaymentError, recordCandidatePayment } from '@/modules/payments/service.ts'
import { generateInvoiceForPayment } from '@/modules/invoices/service.ts'

const schema = z.object({
  amountCents: z.number().int().positive(),
  buyerTaxId: z.string().trim().max(50).optional(),
  exchangeRateDate: z.string().optional(),
  exchangeRateScaled: z.number().int().positive().optional(),
  externalReference: z.string().trim().max(160).optional(),
  idempotencyKey: z.uuid(),
  note: z.string().trim().max(1_000).optional(),
  paymentPlanId: z.number().int().positive(),
  receivedAt: z.iso.datetime(),
}).strict()

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ message: 'Zahtev nije ispravan.' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ message: 'Proverite iznos, datum i dužinu unetih podataka.' }, { status: 400 })

  try {
    const result = await recordCandidatePayment({
      administratorId: authentication.user.id,
      amountCents: parsed.data.amountCents,
      externalReference: parsed.data.externalReference,
      idempotencyKey: parsed.data.idempotencyKey,
      note: parsed.data.note,
      now: new Date(),
      paymentPlanId: parsed.data.paymentPlanId,
      payload,
      receivedAt: new Date(parsed.data.receivedAt),
    })

    let invoiceNumber: string | undefined

    if (result.created) {
      try {
        const invoiceRes = await generateInvoiceForPayment({
          administratorId: authentication.user.id,
          buyerTaxId: parsed.data.buyerTaxId,
          candidatePaymentId: result.payment.id,
          exchangeRateDate: parsed.data.exchangeRateDate,
          exchangeRateScaled: parsed.data.exchangeRateScaled,
          payload,
        })
        invoiceNumber = invoiceRes.invoice.invoiceNumber
      } catch (err) {
        console.warn('Invoice generation during payment recording had a non-fatal error:', err)
      }
    }

    return Response.json({
      invoiceNumber,
      message: result.created
        ? `Uplata je evidentirana, saldo je ažuriran${invoiceNumber ? ` i izdata je faktura ${invoiceNumber} u KIR knjizi` : ''}.`
        : 'Ova uplata je već evidentirana; duplikat nije napravljen.',
      paymentId: result.payment.id,
    }, { headers: { 'Cache-Control': 'no-store' }, status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof CandidatePaymentError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Payment recording failed.', error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: 'UNKNOWN_ERROR' })
    return Response.json({ message: 'Evidentiranje uplate trenutno nije dostupno.' }, { status: 500 })
  }
}
