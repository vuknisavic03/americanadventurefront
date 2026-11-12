import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { adminVisaDocumentChecklist, CandidateDocumentError } from '@/modules/candidate-documents/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(_request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') return json({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = Number((await params).candidateProcessId)
  if (!Number.isSafeInteger(candidateProcessId) || candidateProcessId < 1) return json({ message: 'Proces kandidata nije pronađen.' }, 404)
  try { return json(await adminVisaDocumentChecklist({ candidateProcessId, payload })) }
  catch (error) {
    if (error instanceof CandidateDocumentError) return json({ message: error.message }, error.status)
    console.error('Visa document checklist state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Vizna dokumentacija trenutno nije dostupna.' }, 500)
  }
}
