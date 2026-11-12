import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { programApplicationMutationSchema } from '@/modules/program-applications/schema.ts'
import {
  CandidateProgramApplicationError,
  mutateCandidateProgramApplication,
  programApplicationForPortal,
} from '@/modules/program-applications/service.ts'

const MAXIMUM_BODY_SIZE = 64 * 1_024

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

async function handle(request: Request, mode: 'SAVE_DRAFT' | 'SUBMIT') {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ message: 'Zahtev nije dozvoljen.' }, 403)
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  }

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
  const parsed = programApplicationMutationSchema.safeParse(body)
  if (!parsed.success) return json({ message: 'Uneti podaci nisu ispravni.' }, 400)

  try {
    const application = await mutateCandidateProgramApplication({
      accountId: authentication.user.id,
      answers: parsed.data.answers,
      expectedRevision: parsed.data.expectedRevision,
      mode,
      now: new Date(),
      payload,
    })
    return json({
      application: programApplicationForPortal(application),
      message: mode === 'SUBMIT'
        ? 'Programska aplikacija je uspešno predata.'
        : 'Nacrt programske aplikacije je sačuvan.',
    }, 200)
  } catch (error) {
    if (error instanceof CandidateProgramApplicationError) {
      return json({ fieldErrors: error.fieldErrors, message: error.message }, error.status)
    }
    console.error('Candidate program application update failed.', error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: 'UNKNOWN_ERROR' })
    return json({ message: 'Programska aplikacija trenutno nije dostupna. Pokušajte ponovo.' }, 500)
  }
}

export async function PATCH(request: Request) {
  return handle(request, 'SAVE_DRAFT')
}

export async function POST(request: Request) {
  return handle(request, 'SUBMIT')
}
