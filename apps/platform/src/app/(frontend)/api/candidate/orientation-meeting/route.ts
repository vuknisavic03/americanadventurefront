import config from '@payload-config'
import { getPayload } from 'payload'

import { preparationCalendar } from '@/modules/interview-preparations/calendar.ts'
import { interviewPreparationForCandidate } from '@/modules/interview-preparations/service.ts'

const json = (body: unknown, status = 200) => Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user || user.collection !== 'candidate-accounts' || user.accountStatus !== 'ACTIVE' || !user._verified) {
      return json({ message: 'Prijavite se aktivnim kandidatskim nalogom.' }, 401)
    }
    const appointments = await interviewPreparationForCandidate({ accountId: user.id, payload, purpose: 'ORIENTATION' })
    const calendar = new URL(request.url).searchParams.get('calendar')
    if (calendar !== null) {
      const id = Number(calendar)
      const appointment = appointments.find((entry) => entry.id === id && entry.status === 'SCHEDULED')
      if (!Number.isSafeInteger(id) || !appointment) return json({ message: 'Zakazan termin nije pronađen.' }, 404)
      return new Response(preparationCalendar(appointment, new Date(), 'ORIENTATION'), { headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="orijentacioni-sastanak.ics"',
        'Content-Type': 'text/calendar; charset=utf-8',
      } })
    }
    return json({ appointments })
  } catch (error) {
    console.error('Orientation meeting read failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Evidencija orijentacije trenutno nije dostupna.' }, 500)
  }
}
