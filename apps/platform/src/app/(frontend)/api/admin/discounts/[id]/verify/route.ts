import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { DiscountServiceError, verifyDiscount } from '@/modules/discounts/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const verifyDiscountSchema = z.object({
  customAmountCents: z.number().int().positive().optional(),
  note: z.string().trim().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  const { id } = await params
  const discountId = parseInt(id, 10)
  if (!discountId || isNaN(discountId)) {
    return json({ message: 'Neispravan ID popusta.' }, 400)
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // empty body is acceptable for standard verification
  }

  const parsed = verifyDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za verifikaciju.', issues: parsed.error.issues }, 400)
  }

  try {
    const verified = await verifyDiscount({
      adminUserId: authentication.user.id,
      customAmountCents: parsed.data.customAmountCents,
      discountId,
      note: parsed.data.note,
      payload,
    })

    return json({ discount: verified, message: 'Popust je uspešno verifikovan.' })
  } catch (error) {
    if (error instanceof DiscountServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Verify discount failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Verifikacija popusta trenutno nije dostupna.' }, 500)
  }
}
