import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { acceptEmploymentOffer, EmploymentOfferError } from '@/modules/employment-offers/service.ts'

function response(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') return response({ message: 'Prijavite se da biste prihvatili radnu ponudu.' }, 401)
  const employmentOfferId = Number((await params).id)
  if (!Number.isInteger(employmentOfferId) || employmentOfferId < 1) return response({ message: 'Radna ponuda nije pronađena.' }, 404)
  const body = await request.json().catch(() => undefined) as undefined | { confirmed?: unknown; snapshotChecksum?: unknown }
  if (!body || body.confirmed !== true || typeof body.snapshotChecksum !== 'string' || !/^[a-f0-9]{64}$/u.test(body.snapshotChecksum)) {
    return response({ message: 'Morate izričito potvrditi ponudu koja je prikazana.' }, 400)
  }
  try {
    const result = await acceptEmploymentOffer({ accountId: authentication.user.id, employmentOfferId, expectedSnapshotChecksum: body.snapshotChecksum, now: new Date(), payload })
    return response({ acceptanceId: result.acceptance.id, message: result.created ? 'Radna ponuda je elektronski prihvaćena.' : 'Radna ponuda je već bila prihvaćena.' }, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof EmploymentOfferError) return response({ message: error.message }, error.status)
    console.error('Employment offer acceptance failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Prihvatanje radne ponude trenutno nije dostupno.' }, 500)
  }
}
