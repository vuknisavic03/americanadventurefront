import config from '@payload-config'
import { getPayload } from 'payload'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import { updatePeerConsentSchema } from '@/modules/usa-stay/schema.ts'
import { updatePeerConsent } from '@/modules/usa-stay/service.ts'

const json = (body: unknown, status = 200) =>
  Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return json({ message: 'Zahtev nije dozvoljen.' }, 403)
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || user.collection !== 'candidate-accounts' || user.accountStatus !== 'ACTIVE' || !user._verified) {
      return json({ message: 'Prijavite se aktivnim kandidatskim nalogom.' }, 401)
    }

    let body: unknown
    try {
      const text = await request.text()
      body = JSON.parse(text)
    } catch {
      return json({ message: 'Neispravan format zahteva.' }, 400)
    }

    const parsed = updatePeerConsentSchema.safeParse(body)
    if (!parsed.success) {
      return json({ message: 'Neispravan format saglasnosti.' }, 400)
    }

    const result = await updatePeerConsent({
      accountId: user.id,
      consent: parsed.data.consent,
      payload,
    })

    return json({
      consent: result.consent,
      message: result.consent
        ? 'Pristanak za deljenje kontakta je uspešno aktiviran.'
        : 'Pristanak za deljenje kontakta je povučen.',
    })
  } catch (error) {
    console.error('Failed to update peer sharing consent:', error)
    return json({ message: 'Ažuriranje saglasnosti trenutno nije uspelo.' }, 500)
  }
}
