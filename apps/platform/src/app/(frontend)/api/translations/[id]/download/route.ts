import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { attachmentContentDisposition } from '@/lib/http/contentDisposition.ts'
import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { getTranslationPdf } from '@/modules/document-translations/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (
    !authentication.user ||
    !['candidate-accounts', 'users'].includes(authentication.user.collection)
  ) {
    return json({ message: 'Prijavite se da biste preuzeli prevedeni dokument.' }, 401)
  }

  const translationId = Number((await params).id)
  if (!Number.isInteger(translationId) || translationId < 1) {
    return json({ message: 'Prevedeni dokument nije pronađen.' }, 404)
  }

  try {
    const doc = await payload.findByID({
      collection: 'translated-documents',
      depth: 1,
      id: translationId,
      overrideAccess: true,
    })

    if (!doc) {
      return json({ message: 'Prevedeni dokument nije pronađen.' }, 404)
    }

    // Provera autorizacije za kandidata: kandidat sme preuzeti samo svoja dokumenta
    if (authentication.user.collection === 'candidate-accounts') {
      const candidateAccountId =
        typeof doc.candidateAccount === 'number'
          ? doc.candidateAccount
          : (doc.candidateAccount as { id?: number } | undefined)?.id

      if (candidateAccountId !== authentication.user.id) {
        return json({ message: 'Nemate dozvolu za preuzimanje ovog dokumenta.' }, 403)
      }
    }

    if (doc.status !== 'APPROVED' || !doc.pdfChecksum) {
      return json(
        { message: 'Prevedeni dokument još uvek nije odobren i spreman za preuzimanje.' },
        400,
      )
    }

    const result = await getTranslationPdf({
      payload,
      translationId,
    })

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': attachmentContentDisposition(result.filename),
        'Content-Length': String(result.buffer.length),
        'Content-Type': 'application/pdf',
        ETag: `"${result.checksum}"`,
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
      status: 200,
    })
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Translation PDF download failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Preuzimanje prevedenog dokumenta trenutno nije dostupno.' }, 500)
  }
}
