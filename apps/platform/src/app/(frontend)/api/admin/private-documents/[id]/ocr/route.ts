import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { CandidateDocumentError, runPassportOcrForDocument } from '@/modules/candidate-documents/service.ts'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }

  const documentId = Number((await params).id)
  if (!Number.isInteger(documentId) || documentId < 1) {
    return Response.json({ message: 'Identifikator dokumenta nije ispravan.' }, { status: 400 })
  }

  try {
    const ocrResult = await runPassportOcrForDocument({
      documentId,
      now: new Date(),
      payload,
    })

    return Response.json(
      {
        message: ocrResult.success
          ? 'Pasoš je uspešno očitan.'
          : ocrResult.status === 'NO_MRZ_DETECTED'
            ? 'MRZ zona nije detektovana, proverite vizuelni deo.'
            : 'Očitavanje pasoša nije uspelo.',
        ocr: ocrResult,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof CandidateDocumentError) {
      return Response.json({ message: error.message }, { status: error.status })
    }
    console.error('Passport OCR failed.', error instanceof Error ? error.message : 'UNKNOWN_ERROR')
    return Response.json({ message: 'OCR obrada trenutno nije dostupna.' }, { status: 500 })
  }
}
