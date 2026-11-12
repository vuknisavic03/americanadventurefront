import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { MAX_PRIVATE_DOCUMENT_BYTES } from '@/modules/candidate-documents/privateDocument.ts'
import {
  GuarantorServiceError,
  uploadGuarantorIdCard,
} from '@/modules/guarantor/service.ts'

function json(body: unknown, status = 200) {
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
  if (declaredSize > MAX_PRIVATE_DOCUMENT_BYTES + 128 * 1_024) {
    return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ message: 'Dokument nije ispravno poslat.' }, 400)
  }

  const file = form.get('idCard') ?? form.get('document') ?? form.get('file')
  if (!(file instanceof File)) {
    return json({ message: 'Izaberite očitanu ličnu kartu jemca (PDF, JPEG ili PNG).' }, 400)
  }
  if (file.size > MAX_PRIVATE_DOCUMENT_BYTES) {
    return json({ message: 'Dokument može imati najviše 5 MB.' }, 413)
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = await uploadGuarantorIdCard({
      candidateAccountId: authentication.user.id,
      fileBytes: bytes,
      fileName: file.name,
      now: new Date(),
      payload,
    })

    return json(
      {
        ...result,
        message: 'Očitana lična karta jemca je bezbedno šifrovana i sačuvana.',
      },
      201,
    )
  } catch (error) {
    if (error instanceof GuarantorServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Error uploading guarantor ID card:', error)
    return json(
      {
        message: error instanceof Error ? error.message : 'Došlo je do greške prilikom postavljanja lične karte jemca.',
      },
      500,
    )
  }
}
