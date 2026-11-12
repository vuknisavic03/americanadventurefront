import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { generatePassportAuthorization, passportAuthorizationForAdmin, PassportAuthorizationError } from '@/modules/passport-authorizations/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status = 200) { return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status }) }

async function authenticated() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  return { payload, user: authentication.user?.collection === 'users' ? authentication.user : undefined }
}

export async function GET(_request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const { payload, user } = await authenticated()
  if (!user) return json({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = Number((await params).candidateProcessId)
  if (!Number.isSafeInteger(candidateProcessId) || candidateProcessId < 1) return json({ message: 'Proces kandidata nije pronađen.' }, 404)
  try { return json(await passportAuthorizationForAdmin(payload, candidateProcessId)) }
  catch (error) {
    if (error instanceof PassportAuthorizationError) return json({ message: error.message }, error.status)
    console.error('Passport authorization state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Punomoćje trenutno nije dostupno.' }, 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  if (!isSameOriginRequest(request)) return json({ message: 'Zahtev nije dozvoljen.' }, 403)
  const { payload, user } = await authenticated()
  if (!user) return json({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = Number((await params).candidateProcessId)
  if (!Number.isSafeInteger(candidateProcessId) || candidateProcessId < 1) return json({ message: 'Proces kandidata nije pronađen.' }, 404)
  try {
    const result = await generatePassportAuthorization({ administratorId: user.id, candidateProcessId, now: new Date(), payload })
    return json({ authorizationId: result.authorization.id, message: result.created ? 'Punomoćje je generisano i dostupno kandidatu.' : 'Punomoćje je već bilo generisano.' }, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof PassportAuthorizationError) return json({ message: error.message }, error.status)
    console.error('Passport authorization generation failed.', error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { name: 'UNKNOWN_ERROR' })
    return json({ message: 'Generisanje punomoćja trenutno nije dostupno.' }, 500)
  }
}
