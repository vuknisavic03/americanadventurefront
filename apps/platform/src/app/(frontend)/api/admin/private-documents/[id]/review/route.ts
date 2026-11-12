import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { CandidateDocumentError, reviewCandidatePrivateDocument } from '@/modules/candidate-documents/service.ts'

const schema = z.object({
  action: z.enum(['REJECT', 'VERIFY']),
  rejectionReason: z.string().trim().max(600).optional(),
}).strict()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }
  const documentId = Number((await params).id)
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ message: 'Zahtev nije ispravan.' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!Number.isInteger(documentId) || documentId < 1 || !parsed.success) {
    return Response.json({ message: 'Zahtev nije ispravan.' }, { status: 400 })
  }
  try {
    const result = await reviewCandidatePrivateDocument({
      action: parsed.data.action,
      administratorId: authentication.user.id,
      documentId,
      now: new Date(),
      payload,
      rejectionReason: parsed.data.rejectionReason,
    })
    return Response.json({ ...result, message: result.status === 'VERIFIED' ? 'Dokument je verifikovan.' : 'Dokument je odbijen.' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof CandidateDocumentError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Private document review failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return Response.json({ message: 'Obrada dokumenta trenutno nije dostupna.' }, { status: 500 })
  }
}
