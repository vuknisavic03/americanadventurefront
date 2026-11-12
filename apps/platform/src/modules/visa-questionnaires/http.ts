import config from '@payload-config'
import { getPayload } from 'payload'
import { readPlatformEnvironment } from '../../config/environment.ts'
import { VisaQuestionnaireError } from './service.ts'

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
export async function authenticate(request: Request, collection: 'users' | 'candidate-accounts') {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== collection) throw new VisaQuestionnaireError('Sesija je istekla. Prijavite se ponovo.', 401)
  return { payload, user }
}
export async function readBody(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(readPlatformEnvironment().serverUrl).origin) throw new VisaQuestionnaireError('Zahtev nije dozvoljen.', 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new VisaQuestionnaireError('Zahtev mora biti JSON.', 400)
  const reader = request.body?.getReader()
  if (!reader) throw new VisaQuestionnaireError('Zahtev nema podatke.', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 32 * 1024) { await reader.cancel(); throw new VisaQuestionnaireError('Zahtev je prevelik.', 400) }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof VisaQuestionnaireError) throw error
    throw new VisaQuestionnaireError('Podaci nisu ispravni.', 400)
  } finally { reader.releaseLock() }
}
export function failure(error: unknown) {
  if (error instanceof VisaQuestionnaireError) return json({ message: error.message, fieldErrors: error.fieldErrors }, error.status)
  // Database exceptions can contain answers or encrypted content; do not log query parameters.
  console.error('Visa questionnaire request failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
  return json({ message: 'Vizni upitnik trenutno nije dostupan. Pokušajte ponovo.' }, 500)
}
