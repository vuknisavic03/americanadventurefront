import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  claimDiscount,
  DiscountServiceError,
  listDiscountsForAdmin,
} from '@/modules/discounts/service.ts'
import type { DiscountStatus, DiscountType } from '@/modules/discounts/types.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const grantCustomDiscountSchema = z.object({
  adminNotes: z.string().trim().optional(),
  amountCents: z.number().int().positive(),
  candidateProcessId: z.number().int().positive(),
  label: z.string().trim().min(3),
})

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  const url = new URL(request.url)
  const status = (url.searchParams.get('status') as DiscountStatus) || undefined
  const discountType = (url.searchParams.get('discountType') as DiscountType) || undefined
  const search = url.searchParams.get('search') || undefined
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
  const limit = parseInt(url.searchParams.get('limit') || '20', 10) || 20

  try {
    const result = await listDiscountsForAdmin({
      discountType,
      limit,
      page,
      payload,
      search,
      status,
    })

    return json(result)
  } catch (error) {
    console.error('Admin discounts lookup failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje popusta trenutno nije dostupno.' }, 500)
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Neispravan JSON format zahteva.' }, 400)
  }

  const parsed = grantCustomDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za dodelu popusta.', issues: parsed.error.issues }, 400)
  }

  try {
    const discount = await claimDiscount({
      actor: { collection: 'users', id: authentication.user.id },
      candidateProcessId: parsed.data.candidateProcessId,
      input: {
        adminNotes: parsed.data.adminNotes,
        customAmountCents: parsed.data.amountCents,
        customLabel: parsed.data.label,
        type: 'CUSTOM',
      },
      payload,
    })

    return json({ discount, message: 'Prilagođeni popust je uspešno dodeljen.' }, 201)
  } catch (error) {
    if (error instanceof DiscountServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Grant custom discount failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Dodela popusta trenutno nije dostupna.' }, 500)
  }
}
