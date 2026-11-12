import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { MAX_PRIVATE_DOCUMENT_BYTES } from '@/modules/candidate-documents/privateDocument.ts'
import {
  CandidateDocumentError,
  CandidateDocumentValidationError,
  uploadCandidateProgramDocument,
} from '@/modules/candidate-documents/service.ts'
import {
  programDocumentRequirement,
  type ProgramDocumentType,
} from '@/modules/program-documents/requirements.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentType: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }
  const documentType = (await params).documentType
  if (!programDocumentRequirement(documentType)) {
    return json({ message: 'Vrsta dokumenta nije podržana.' }, 404)
  }
  const declaredSize = Number(request.headers.get('content-length') ?? 0)
  if (!declaredSize) return json({ message: 'Veličina dokumenta nije navedena.' }, 411)
  if (declaredSize > MAX_PRIVATE_DOCUMENT_BYTES + 128 * 1_024) {
    return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ message: 'Dokument nije ispravno poslat.' }, 400)
  }
  const file = form.get('document')
  if (!(file instanceof File)) return json({ message: 'Izaberite dokument.' }, 400)
  if (file.size > MAX_PRIVATE_DOCUMENT_BYTES) {
    return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)
  }

  try {
    const result = await uploadCandidateProgramDocument({
      accountId: authentication.user.id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      documentType: documentType as ProgramDocumentType,
      fileName: file.name,
      now: new Date(),
      payload,
    })
    return json({
      ...result,
      message: 'Dokument je bezbedno postavljen i čeka proveru agencije.',
    }, 201)
  } catch (error) {
    if (error instanceof CandidateDocumentError) return json({ message: error.message }, error.status)
    if (error instanceof CandidateDocumentValidationError) {
      console.error('Program document validation failed.', {
        issues: error.issues.map((issue) => ({ path: issue.path })),
        stage: error.stage,
      })
      return json({ message: 'Postavljanje dokumenta trenutno nije dostupno.' }, 500)
    }
    console.error('Program document upload failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Postavljanje dokumenta trenutno nije dostupno.' }, 500)
  }
}
