import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { requestTranslationSchema } from '@/modules/document-translations/schema.ts'
import { requestDocumentTranslation } from '@/modules/document-translations/service.ts'

const requestSchema = requestTranslationSchema.extend({
  candidateProcessId: z.number().int().positive().optional(),
})

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return json({ message: 'Zabranjen pristup iz drugog izvora.' }, 403)
  }

  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Zahtev nije ispravan.' }, 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: 'Neispravni podaci za prevod dokumenta.', errors: parsed.error.format() }, 400)
  }

  let candidateProcessId = parsed.data.candidateProcessId

  if (candidateProcessId) {
    const process = await payload.findByID({
      collection: 'candidate-processes',
      depth: 0,
      id: candidateProcessId,
      overrideAccess: true,
    })
    const accountId =
      typeof process?.candidateAccount === 'number'
        ? process.candidateAccount
        : (process?.candidateAccount as { id?: number } | undefined)?.id

    if (!process || accountId !== authentication.user.id) {
      return json({ message: 'Izabrani kandidatski proces ne pripada vašem nalogu.' }, 403)
    }
  } else {
    const processes = await payload.find({
      collection: 'candidate-processes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: '-createdAt',
      where: { candidateAccount: { equals: authentication.user.id } },
    })
    if (!processes.docs.length) {
      return json({ message: 'Nije pronađen aktivan proces kandidata za vaš nalog.' }, 404)
    }
    candidateProcessId = processes.docs[0].id
  }

  try {
    const result = await requestDocumentTranslation({
      input: {
        candidateProcessId,
        customSourceData: parsed.data.customSourceData,
        documentType: parsed.data.documentType,
        title: parsed.data.title,
      },
      payload,
      requesterId: authentication.user.id,
      requesterType: 'PUBLIC_APPLICANT',
    })

    return json(
      {
        item: result,
        message: 'Zahtev za prevod dokumenta je uspešno kreiran i prosleđen na administratorsku verifikaciju.',
      },
      201,
    )
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Translation request creation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Kreiranje zahteva za prevod trenutno nije dostupno.' }, 500)
  }
}
