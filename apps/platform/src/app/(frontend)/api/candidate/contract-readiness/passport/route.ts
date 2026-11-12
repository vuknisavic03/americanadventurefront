import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { MAX_PRIVATE_DOCUMENT_BYTES } from '@/modules/candidate-documents/privateDocument.ts'
import {
  CandidateDocumentError,
  CandidateDocumentValidationError,
  uploadCandidatePassport,
} from '@/modules/candidate-documents/service.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }
  const declaredSize = Number(request.headers.get('content-length') ?? 0)
  if (!declaredSize) return json({ message: 'Veličina dokumenta nije navedena.' }, 411)
  if (declaredSize > MAX_PRIVATE_DOCUMENT_BYTES + 128 * 1_024) return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)

  let form: FormData
  try { form = await request.formData() } catch { return json({ message: 'Dokument nije ispravno poslat.' }, 400) }
  const file = form.get('passport')
  if (!(file instanceof File)) return json({ message: 'Izaberite dokument pasoša.' }, 400)
  if (file.size > MAX_PRIVATE_DOCUMENT_BYTES) return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)

  try {
    const result = await uploadCandidatePassport({
      accountId: authentication.user.id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
      now: new Date(),
      payload,
    })
    return json({ ...result, message: 'Pasoš je bezbedno postavljen i čeka proveru administratora.' }, 201)
  } catch (error) {
    if (error instanceof CandidateDocumentError) return json({ message: error.message }, error.status)
    if (error instanceof CandidateDocumentValidationError) {
      console.error('Private document upload validation failed.', {
        issues: error.issues,
        stage: error.stage,
      })
      return json({ message: 'Postavljanje dokumenta trenutno nije dostupno. Pokušajte ponovo.' }, 500)
    }
    console.error('Private document upload failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Postavljanje dokumenta trenutno nije dostupno. Pokušajte ponovo.' }, 500)
  }
}

