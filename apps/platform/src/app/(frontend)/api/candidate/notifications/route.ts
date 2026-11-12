import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  candidateNotificationsQuerySchema,
  markNotificationReadSchema,
} from '@/modules/admin-communications/schema.ts'
import {
  listCandidateNotifications,
  markCandidateNotificationsAsRead,
} from '@/modules/admin-communications/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
      return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = candidateNotificationsQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return json({ message: 'Neispravni parametri upita.' }, 400)
    }

    const result = await listCandidateNotifications({
      candidateAccountId: authentication.user.id,
      filters: parsed.data,
      payload,
    })

    return json(result, 200)
  } catch (error) {
    console.error('Failed to get candidate notifications:', error)
    return json({ message: 'Greška pri učitavanju obaveštenja.' }, 500)
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return json({ message: 'Zahtev nije dozvoljen.' }, 403)
    }

    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
      return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
    }

    let notificationIds: number[] | undefined = undefined
    const text = await request.text()
    if (text && text.trim().length > 0) {
      try {
        const body = JSON.parse(text)
        const parsed = markNotificationReadSchema.safeParse(body)
        if (parsed.success) {
          notificationIds = parsed.data.notificationIds
        }
      } catch {
        return json({ message: 'Neispravan format zahteva.' }, 400)
      }
    }

    const result = await markCandidateNotificationsAsRead({
      candidateAccountId: authentication.user.id,
      notificationIds,
      payload,
    })

    return json(result, 200)
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return json({ message: 'Greška pri označavanju obaveštenja.' }, 500)
  }
}
