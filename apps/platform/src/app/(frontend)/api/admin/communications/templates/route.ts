import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { getCommunicationTemplatesCatalog } from '@/modules/admin-communications/service.ts'
import type { CommunicationChannel } from '@/modules/admin-communications/templates.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    const url = new URL(request.url)
    const channelParam = url.searchParams.get('channel')?.toUpperCase() as CommunicationChannel | undefined

    const templates = getCommunicationTemplatesCatalog(channelParam)

    return json({ templates }, 200)
  } catch (error) {
    console.error('Failed to get communication templates:', error)
    return json({ message: 'Greška pri učitavanju šablona komunikacije.' }, 500)
  }
}
