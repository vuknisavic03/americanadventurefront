import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { acceptCandidateContract, ContractAcceptanceError } from '@/modules/generated-contracts/acceptance.ts'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return Response.json({ message: 'Zahtev nije dozvoljen.' }, { status: 403 })
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ message: 'Zahtev mora biti poslat kao JSON.' }, { status: 415 })
  }
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return Response.json({ message: 'Prijavite se da biste prihvatili ugovor.' }, { status: 401 })
  }
  const contractId = Number((await params).id)
  if (!Number.isInteger(contractId) || contractId < 1) {
    return Response.json({ message: 'Ugovor nije pronađen.' }, { status: 404 })
  }
  try {
    const body = await request.json().catch(() => undefined) as undefined | { confirmed?: unknown; sourcePdfSha256?: unknown }
    if (!body || body.confirmed !== true || typeof body.sourcePdfSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(body.sourcePdfSha256)) {
      return Response.json({ message: 'Morate izričito potvrditi ugovor koji je prikazan.' }, { status: 400 })
    }
    const result = await acceptCandidateContract({
      candidateAccountId: authentication.user.id,
      contractId,
      expectedSourcePdfSha256: body.sourcePdfSha256,
      now: new Date(),
      payload,
    })
    return Response.json({
      acceptanceId: result.acceptance.id,
      message: result.created ? 'Ugovor je elektronski prihvaćen.' : 'Ugovor je već bio elektronski prihvaćen.',
    }, { headers: { 'Cache-Control': 'no-store' }, status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof ContractAcceptanceError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Contract acceptance failed.', error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: 'UNKNOWN_ERROR' })
    return Response.json({ message: 'Prihvatanje ugovora trenutno nije dostupno.' }, { status: 500 })
  }
}

