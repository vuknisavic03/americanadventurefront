import config from '@payload-config'
import { getPayload } from 'payload'

import { forgotPasswordSchema, normalizeCandidateEmail } from '@/modules/candidate-accounts/schema.ts'

const GENERIC_MESSAGE =
  'Ako nalog postoji, poslali smo uputstvo za postavljanje nove lozinke.'

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ message: 'Email adresa nije ispravna.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const accounts = await payload.find({
      collection: 'candidate-accounts',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { email: { equals: normalizeCandidateEmail(parsed.data.email) } },
          { accountStatus: { equals: 'ACTIVE' } },
        ],
      },
    })
    if (accounts.docs[0]) {
      await payload.forgotPassword({
        collection: 'candidate-accounts',
        data: { email: accounts.docs[0].email },
        overrideAccess: true,
      })
    }
  } catch (error) {
    console.error(
      'Candidate password recovery failed.',
      error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    )
  }

  return Response.json(
    { message: GENERIC_MESSAGE },
    { headers: { 'Cache-Control': 'no-store' }, status: 202 },
  )
}

