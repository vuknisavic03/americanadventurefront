import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { reviewTranslationSchema } from '@/modules/document-translations/schema.ts'
import { reviewDocumentTranslation } from '@/modules/document-translations/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return json({ message: 'Zabranjen pristup iz drugog izvora.' }, 403)
  }

  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  const translationId = Number((await params).id)
  if (!Number.isInteger(translationId) || translationId < 1) {
    return json({ message: 'Prevod nije pronađen.' }, 404)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Zahtev nije ispravan.' }, 400)
  }

  const parsed = reviewTranslationSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za verifikaciju prevoda.', errors: parsed.error.format() }, 400)
  }

  try {
    const result = await reviewDocumentTranslation({
      adminId: authentication.user.id,
      data: parsed.data,
      payload,
      translationId,
    })

    return json({
      message:
        result.status === 'APPROVED'
          ? 'Prevod je uspešno verifikovan, odobren i generisan kao overeni PDF dokument.'
          : 'Prevod je odbijen uz navedeni razlog.',
      pdfChecksum: result.status === 'APPROVED' ? result.pdfChecksum : undefined,
      reviewedAt: result.reviewedAt,
      status: result.status,
      success: true,
      translatedDocument: result.translatedDocument,
    })
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Translation review failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Verifikacija prevoda trenutno nije dostupna.' }, 500)
  }
}
