import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { CandidateDocumentError, updateCandidatePersonalId } from '@/modules/candidate-documents/service.ts'

const schema = z.object({ personalId: z.string().max(32) }).strict()

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function PUT(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }
  let body: unknown
  try { body = await request.json() } catch { return json({ message: 'Uneti podaci nisu ispravni.' }, 400) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return json({ message: 'JMBG nije ispravno unet.' }, 400)

  try {
    const result = await updateCandidatePersonalId({ accountId: authentication.user.id, now: new Date(), payload, personalId: parsed.data.personalId })
    return json({ ...result, message: 'JMBG je bezbedno sačuvan i validiran.' }, 200)
  } catch (error) {
    if (error instanceof CandidateDocumentError) return json({ message: error.message }, error.status)
    console.error('Sensitive profile update failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Čuvanje JMBG-a trenutno nije dostupno. Pokušajte ponovo.' }, 500)
  }
}
