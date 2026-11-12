import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { acceptPassportAuthorization, PassportAuthorizationError } from '@/modules/passport-authorizations/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status: number) { return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status }) }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return json({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') return json({ message: 'Prijavite se da biste prihvatili punomoćje.' }, 401)
  const authorizationId = Number((await params).id)
  if (!Number.isSafeInteger(authorizationId) || authorizationId < 1) return json({ message: 'Punomoćje nije pronađeno.' }, 404)
  const body = await request.json().catch(() => undefined) as undefined | { confirmed?: unknown; sourcePdfSha256?: unknown }
  if (!body || body.confirmed !== true || typeof body.sourcePdfSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(body.sourcePdfSha256)) return json({ message: 'Morate izričito potvrditi prikazano punomoćje.' }, 400)
  try {
    const result = await acceptPassportAuthorization({ authorizationId, candidateAccountId: authentication.user.id, expectedSourcePdfSha256: body.sourcePdfSha256, now: new Date(), payload })
    return json({ authorizationId: result.authorization.id, message: result.created ? 'Punomoćje je elektronski prihvaćeno.' : 'Punomoćje je već bilo elektronski prihvaćeno.' }, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof PassportAuthorizationError) return json({ message: error.message }, error.status)
    console.error('Passport authorization acceptance failed.', error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { name: 'UNKNOWN_ERROR' })
    return json({ message: 'Prihvatanje punomoćja trenutno nije dostupno.' }, 500)
  }
}
