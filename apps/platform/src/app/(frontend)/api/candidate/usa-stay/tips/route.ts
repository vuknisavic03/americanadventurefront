import config from '@payload-config'
import { getPayload } from 'payload'

import { tipsForCandidate } from '@/modules/usa-stay/service.ts'

const json = (body: unknown, status = 200) =>
  Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || user.collection !== 'candidate-accounts' || user.accountStatus !== 'ACTIVE' || !user._verified) {
      return json({ message: 'Prijavite se aktivnim kandidatskim nalogom.' }, 401)
    }

    const categoryParam = new URL(request.url).searchParams.get('category') || undefined
    const tips = await tipsForCandidate({
      category: categoryParam,
      payload,
    })

    return json({ tips })
  } catch (error) {
    console.error('Failed to get USA stay tips:', error)
    return json({ message: 'Učitavanje saveta trenutno nije uspelo.' }, 500)
  }
}
