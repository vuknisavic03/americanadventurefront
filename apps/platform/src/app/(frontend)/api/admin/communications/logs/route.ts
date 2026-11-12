import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { communicationLogsQuerySchema } from '@/modules/admin-communications/schema.ts'
import { listCommunicationLogs } from '@/modules/admin-communications/service.ts'

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
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = communicationLogsQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return json(
        {
          errors: parsed.error.issues.map((i) => ({ message: i.message, path: i.path })),
          message: 'Neispravni parametri za pretragu evidencije komunikacije.',
        },
        400,
      )
    }

    const result = await listCommunicationLogs({
      filters: parsed.data,
      payload,
    })

    return json(result, 200)
  } catch (error) {
    console.error('Failed to get communication logs:', error)
    return json({ message: 'Greška pri učitavanju evidencije komunikacije.' }, 500)
  }
}
