import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { DiscountServiceError, claimDiscount, getCandidateDiscounts } from '@/modules/discounts/service.ts'
import {
  discountTypeKeys,
  kinshipTypeKeys,
  lifeguardCertifyingBodyKeys,
} from '@/modules/discounts/types.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const claimDiscountSchema = z.object({
  candidateProcessId: z.number().int().positive().optional(),
  type: z.enum(discountTypeKeys),
  // FR-031
  groupCode: z.string().trim().optional(),
  // FR-032
  ambassadorCode: z.string().trim().optional(),
  // FR-033
  kinshipNotes: z.string().trim().optional(),
  kinshipType: z.enum(kinshipTypeKeys).optional(),
  relativeCandidateAccountId: z.number().int().positive().optional(),
  relativeFullName: z.string().trim().optional(),
  // FR-034 Returnee
  returneePreviousEmployer: z.string().trim().optional(),
  returneePreviousSponsor: z.string().trim().optional(),
  returneePreviousYear: z.number().int().optional(),
  // FR-034 Lifeguard
  lifeguardCertificateNumber: z.string().trim().optional(),
  lifeguardCertifyingBody: z.enum(lifeguardCertifyingBodyKeys).optional(),
  lifeguardValidUntil: z.string().trim().optional(),
})

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  try {
    const url = new URL(request.url)
    const processIdParam = url.searchParams.get('candidateProcessId')

    let candidateProcessId = processIdParam ? parseInt(processIdParam, 10) : undefined
    if (!candidateProcessId) {
      const activeProcess = await payload.find({
        collection: 'candidate-processes',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { candidateAccount: { equals: authentication.user.id } },
      })
      candidateProcessId = activeProcess.docs[0]?.id
    }

    if (!candidateProcessId) {
      return json({ discounts: [] })
    }

    const discounts = await getCandidateDiscounts({
      candidateProcessId,
      payload,
    })

    return json({ discounts })
  } catch (error) {
    if (error instanceof DiscountServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Candidate discounts lookup failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje popusta trenutno nije dostupno.' }, 500)
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Neispravan JSON format zahteva.' }, 400)
  }

  const parsed = claimDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci u zahtevu.', issues: parsed.error.issues }, 400)
  }

  try {
    let candidateProcessId = parsed.data.candidateProcessId
    if (!candidateProcessId) {
      const activeProcess = await payload.find({
        collection: 'candidate-processes',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { candidateAccount: { equals: authentication.user.id } },
      })
      candidateProcessId = activeProcess.docs[0]?.id
    }

    if (!candidateProcessId) {
      return json({ message: 'Aktivan kandidatski proces nije pronađen.' }, 404)
    }

    const discount = await claimDiscount({
      actor: { collection: 'candidate-accounts', id: authentication.user.id },
      candidateProcessId,
      input: parsed.data,
      payload,
    })

    return json({ discount, message: 'Popust je uspešno evidentiran.' }, 201)
  } catch (error) {
    if (error instanceof DiscountServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Claim discount failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Evidencija popusta trenutno nije dostupna.' }, 500)
  }
}
