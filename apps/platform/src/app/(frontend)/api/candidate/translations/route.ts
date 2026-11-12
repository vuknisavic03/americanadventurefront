import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { DocumentTranslationError } from '@/modules/document-translations/rules.ts'
import { getCandidateTranslations } from '@/modules/document-translations/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  try {
    const result = await getCandidateTranslations({
      candidateAccountId: authentication.user.id,
      payload,
    })

    return json(result)
  } catch (error) {
    if (error instanceof DocumentTranslationError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Candidate translations lookup failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Učitavanje prevoda trenutno nije dostupno.' }, 500)
  }
}
