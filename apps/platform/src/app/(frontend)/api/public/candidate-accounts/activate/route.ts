import config from '@payload-config'
import { getPayload } from 'payload'

import { activateCandidateAccount, CandidateActivationError } from '@/modules/candidate-accounts/activateCandidateAccount.ts'
import { candidateAccountValidationErrors, candidateActivationSchema } from '@/modules/candidate-accounts/schema.ts'

const MAXIMUM_BODY_SIZE = 8 * 1_024

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request) {
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

  const parsed = candidateActivationSchema.safeParse(body)
  if (!parsed.success) {
    return json({
      fieldErrors: candidateAccountValidationErrors(parsed.error),
      message: 'Proverite označena polja i pokušajte ponovo.',
    }, 400)
  }

  try {
    const payload = await getPayload({ config })
    await activateCandidateAccount({
      citizenship: parsed.data.citizenship,
      now: new Date(),
      password: parsed.data.password,
      payload,
      token: parsed.data.token,
    })
    return json({ message: 'Nalog je uspešno aktiviran.' }, 200)
  } catch (error) {
    if (error instanceof CandidateActivationError) return json({ message: error.message }, 410)
    console.error('Candidate account activation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Aktivacija trenutno nije dostupna. Pokušajte ponovo.' }, 500)
  }
}

