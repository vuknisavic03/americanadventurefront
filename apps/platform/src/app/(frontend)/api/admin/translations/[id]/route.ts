import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { updateTranslationDraftSchema } from '@/modules/document-translations/schema.ts'
import { updateTranslationDraft } from '@/modules/document-translations/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  const translationId = Number((await params).id)
  if (!Number.isInteger(translationId) || translationId < 1) {
    return json({ message: 'Prevod nije pronađen.' }, 404)
  }

  try {
    const doc = await payload.findByID({
      collection: 'translated-documents',
      depth: 2,
      id: translationId,
      overrideAccess: true,
    })

    if (!doc) {
      return json({ message: 'Prevod nije pronađen.' }, 404)
    }

    return json({ item: doc })
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Fetch translation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje prevoda trenutno nije dostupno.' }, 500)
  }
}

export async function PATCH(
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

  const parsed = updateTranslationDraftSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za izmenu prevoda.', errors: parsed.error.format() }, 400)
  }

  try {
    const updated = await updateTranslationDraft({
      adminId: authentication.user.id,
      data: parsed.data,
      payload,
      translationId,
    })

    return json({
      item: updated,
      message: 'Nacrt prevoda je uspešno sačuvan i spreman za dalju verifikaciju.',
    })
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Update translation draft failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Izmena prevoda trenutno nije dostupno.' }, 500)
  }
}
