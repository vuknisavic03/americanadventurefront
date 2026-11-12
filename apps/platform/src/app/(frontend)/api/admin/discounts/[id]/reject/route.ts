import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { DiscountServiceError, rejectDiscount } from '@/modules/discounts/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const rejectDiscountSchema = z.object({
  reason: z.string().trim().min(3, 'Obavezno je navesti razlog odbijanja popusta.'),
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Neispravan JSON format zahteva.' }, 400)
  }

  const parsed = rejectDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za odbijanje.', issues: parsed.error.issues }, 400)
  }

  try {
    const rejected = await rejectDiscount({
      adminUserId: authentication.user.id,
      discountId,
      payload,
      reason: parsed.data.reason,
    })

    return json({ discount: rejected, message: 'Popust je odbijen.' })
  } catch (error) {
    if (error instanceof DiscountServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Reject discount failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Odbijanje popusta trenutno nije dostupno.' }, 500)
  }
}
