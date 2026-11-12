import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { CandidatePaymentError, reverseCandidatePayment } from '@/modules/payments/service.ts'

const schema = z.object({
  idempotencyKey: z.uuid(),
  paymentId: z.number().int().positive(),
  reason: z.string().trim().min(5).max(1_000),
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
  if (!parsed.success) return Response.json({ message: 'Unesite jasan razlog poništenja (najmanje pet znakova).' }, { status: 400 })

  try {
    const result = await reverseCandidatePayment({
      administratorId: authentication.user.id,
      idempotencyKey: parsed.data.idempotencyKey,
      now: new Date(),
      paymentId: parsed.data.paymentId,
      payload,
      reason: parsed.data.reason,
    })
    return Response.json({
      message: result.created ? 'Uplata je poništena novim finansijskim zapisom.' : 'Poništenje je već evidentirano; duplikat nije napravljen.',
      reversalId: result.reversal.id,
    }, { headers: { 'Cache-Control': 'no-store' }, status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof CandidatePaymentError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Payment reversal failed.', error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: 'UNKNOWN_ERROR' })
    return Response.json({ message: 'Poništavanje uplate trenutno nije dostupno.' }, { status: 500 })
  }
}
