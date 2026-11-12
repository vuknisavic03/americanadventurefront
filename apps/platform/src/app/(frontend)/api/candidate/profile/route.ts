import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  candidateProfileUpdateSchema,
  candidateProfileValidationErrors,
} from '@/modules/candidate-profile/schema.ts'
import {
  CandidateProfileUpdateError,
  updateCandidateProfile,
} from '@/modules/candidate-profile/updateCandidateProfile.ts'

const MAXIMUM_BODY_SIZE = 8 * 1_024

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function PATCH(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  const declaredSize = Number(request.headers.get('content-length') ?? 0)
  if (declaredSize > MAXIMUM_BODY_SIZE) return json({ message: 'Zahtev je prevelik.' }, 413)

  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, 'utf8') > MAXIMUM_BODY_SIZE) {
    return json({ message: 'Zahtev je prevelik.' }, 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ message: 'Uneti podaci nisu ispravni.' }, 400)
  }

  const parsed = candidateProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return json({
      fieldErrors: candidateProfileValidationErrors(parsed.error),
      message: 'Proverite označena polja i pokušajte ponovo.',
    }, 400)
  }

  try {
    const result = await updateCandidateProfile({
      accountId: authentication.user.id,
      data: parsed.data,
      now: new Date(),
      payload,
    })
    return json({
      advanced: result.advanced,
      message: result.advanced
        ? 'Profil je potvrđen. Nastavljate na korak „Ugovor i način plaćanja“.'
        : 'Podaci profila su uspešno sačuvani.',
    }, 200)
  } catch (error) {
    if (error instanceof CandidateProfileUpdateError) return json({ message: error.message }, 403)
    console.error('Candidate profile update failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Izmena profila trenutno nije dostupna. Pokušajte ponovo.' }, 500)
  }
}
