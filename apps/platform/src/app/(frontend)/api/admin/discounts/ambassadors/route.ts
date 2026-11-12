import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { isValidDiscountCode, normalizeDiscountCode } from '@/modules/discounts/rules.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const createAmbassadorSchema = z.object({
  defaultDiscountCents: z.number().int().min(0).default(5000),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2),
  notes: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  referralCode: z.string().trim().min(3).max(32),
  rewardPerReferralCents: z.number().int().min(0).default(2500),
  season: z.string().trim().default('2026'),
})

export async function GET() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  try {
    const ambassadors = await payload.find({
      collection: 'brand-ambassadors',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: '-createdAt',
    })

    return json({ docs: ambassadors.docs, totalDocs: ambassadors.totalDocs })
  } catch (error) {
    console.error('List brand ambassadors failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje ambasadora trenutno nije dostupno.' }, 500)
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

  const parsed = createAmbassadorSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za kreiranje ambasadora.', issues: parsed.error.issues }, 400)
  }

  const referralCode = normalizeDiscountCode(parsed.data.referralCode)
  if (!isValidDiscountCode(referralCode)) {
    return json({ message: 'Format referral koda nije ispravan.' }, 400)
  }

  try {
    const existing = await payload.find({
      collection: 'brand-ambassadors',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { referralCode: { equals: referralCode } },
    })
    if (existing.docs.length > 0) {
      return json({ message: `Ambasador sa kodom "${referralCode}" već postoji.` }, 409)
    }

    const ambassador = await payload.create({
      collection: 'brand-ambassadors',
      data: {
        defaultDiscountCents: parsed.data.defaultDiscountCents,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        notes: parsed.data.notes,
        phone: parsed.data.phone,
        referralCode,
        rewardPerReferralCents: parsed.data.rewardPerReferralCents,
        season: parsed.data.season,
        status: 'ACTIVE',
      },
      overrideAccess: true,
    })

    return json({ ambassador, message: 'Brend ambasador je uspešno kreiran.' }, 201)
  } catch (error) {
    console.error('Create brand ambassador failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Kreiranje ambasadora trenutno nije dostupno.' }, 500)
  }
}
