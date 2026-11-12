import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { CandidateJobOptionError, updateCandidateJobPreference } from '@/modules/job-options/service.ts'

const schema = z.object({ action: z.enum(['INTERESTED', 'NOT_INTERESTED', 'RECONSIDER']), expectedStatusVersion: z.number().int().positive() }).strict()
function response(body: unknown, status = 200) { return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status }) }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') return response({ message: 'Prijavite se da biste menjali izbor poslova.' }, 401)
  const candidateJobOptionId = Number((await params).id)
  if (!Number.isInteger(candidateJobOptionId) || candidateJobOptionId < 1) return response({ message: 'Opcija posla nije pronađena.' }, 404)
  const parsed = schema.safeParse(await request.json().catch(() => undefined))
  if (!parsed.success) return response({ message: 'Zahtev za promenu interesovanja nije ispravan.' }, 400)
  try {
    const option = await updateCandidateJobPreference({ accountId: authentication.user.id, action: parsed.data.action, candidateJobOptionId, expectedStatusVersion: parsed.data.expectedStatusVersion, now: new Date(), payload })
    return response({ message: parsed.data.action === 'INTERESTED' ? 'Opcija je označena kao posao koji vas interesuje.' : parsed.data.action === 'NOT_INTERESTED' ? 'Opcija je premeštena u ostale ponude i možete je kasnije vratiti.' : 'Opcija je vraćena u razmatranje.', option })
  } catch (error) {
    if (error instanceof CandidateJobOptionError) return response({ message: error.message }, error.status)
    console.error('Candidate job preference update failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Promena interesovanja trenutno nije dostupna.' }, 500)
  }
}
