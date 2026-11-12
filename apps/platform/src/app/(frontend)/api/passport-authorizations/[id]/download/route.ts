import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { attachmentContentDisposition } from '@/lib/http/contentDisposition.ts'
import { downloadPassportAuthorization, PassportAuthorizationError } from '@/modules/passport-authorizations/service.ts'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || !['candidate-accounts', 'users'].includes(authentication.user.collection)) return Response.json({ message: 'Prijavite se da biste pristupili punomoćju.' }, { status: 401 })
  const authorizationId = Number((await params).id)
  if (!Number.isSafeInteger(authorizationId) || authorizationId < 1) return Response.json({ message: 'Punomoćje nije pronađeno.' }, { status: 404 })
  const final = new URL(request.url).searchParams.get('version') === 'accepted'
  try {
    const result = await downloadPassportAuthorization({ actor: { collection: authentication.user.collection as 'candidate-accounts' | 'users', id: authentication.user.id }, authorizationId, final, now: new Date(), payload })
    return new Response(new Uint8Array(result.bytes), { headers: {
      'Cache-Control': 'private, no-store, max-age=0', 'Content-Disposition': attachmentContentDisposition(result.fileName),
      'Content-Length': String(result.bytes.length), 'Content-Type': 'application/pdf', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff',
    } })
  } catch (error) {
    if (error instanceof PassportAuthorizationError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Passport authorization download failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return Response.json({ message: 'Punomoćje trenutno nije dostupno.' }, { status: 500 })
  }
}
