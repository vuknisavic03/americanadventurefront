import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { translationQuerySchema } from '@/modules/document-translations/schema.ts'
import { listTranslations } from '@/modules/document-translations/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Administratorska sesija je istekla.' }, 401)
  }

  const { searchParams } = new URL(request.url)
  const queryParams = {
    candidateProcessId: searchParams.get('candidateProcessId') ?? undefined,
    documentType: searchParams.get('documentType') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  }

  const parsed = translationQuerySchema.safeParse(queryParams)
  if (!parsed.success) {
    return json({ message: 'Neispravni parametri pretrage.', errors: parsed.error.format() }, 400)
  }

  try {
    const result = await listTranslations({
      filters: parsed.data,
      payload,
    })

    return json(result)
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Admin list translations failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Pregled prevoda trenutno nije dostupan.' }, 500)
  }
}
