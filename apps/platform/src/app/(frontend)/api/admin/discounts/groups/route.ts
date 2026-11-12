import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { isValidDiscountCode, normalizeDiscountCode } from '@/modules/discounts/rules.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const createGroupSchema = z.object({
  discountPerMemberCents: z.number().int().min(0).default(5000),
  groupCode: z.string().trim().min(3).max(32),
  minMembers: z.number().int().min(2).default(3),
  name: z.string().trim().min(2),
  notes: z.string().trim().optional(),
})

export async function GET() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  try {
    const groups = await payload.find({
      collection: 'discount-groups',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: '-createdAt',
    })

    return json({ docs: groups.docs, totalDocs: groups.totalDocs })
  } catch (error) {
    console.error('List discount groups failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje grupa trenutno nije dostupno.' }, 500)
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

  const parsed = createGroupSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za kreiranje grupe.', issues: parsed.error.issues }, 400)
  }

  const groupCode = normalizeDiscountCode(parsed.data.groupCode)
  if (!isValidDiscountCode(groupCode)) {
    return json({ message: 'Format koda grupe nije ispravan.' }, 400)
  }

  try {
    const existing = await payload.find({
      collection: 'discount-groups',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { groupCode: { equals: groupCode } },
    })
    if (existing.docs.length > 0) {
      return json({ message: `Grupa sa kodom "${groupCode}" već postoji.` }, 409)
    }

    const group = await payload.create({
      collection: 'discount-groups',
      data: {
        discountPerMemberCents: parsed.data.discountPerMemberCents,
        groupCode,
        minMembers: parsed.data.minMembers,
        name: parsed.data.name,
        notes: parsed.data.notes,
        status: 'ACTIVE',
      },
      overrideAccess: true,
    })

    return json({ group, message: 'Grupa za popust je uspešno kreirana.' }, 201)
  } catch (error) {
    console.error('Create discount group failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Kreiranje grupe trenutno nije dostupno.' }, 500)
  }
}
