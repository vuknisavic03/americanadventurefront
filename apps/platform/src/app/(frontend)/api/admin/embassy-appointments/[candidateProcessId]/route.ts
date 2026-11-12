import config from '@payload-config'
import { getPayload } from 'payload'

import { EmbassyAppointmentError, embassyAppointmentForAdmin } from '@/modules/embassy-appointments/service.ts'

const json = (body: unknown, status = 200) => Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

export async function GET(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  try {
    const payload = await getPayload({ config }); const { user } = await payload.auth({ headers: request.headers })
    if (!user || user.collection !== 'users') throw new EmbassyAppointmentError('Administratorska sesija je istekla.', 401)
    const id = Number((await params).candidateProcessId)
    if (!Number.isSafeInteger(id) || id < 1) throw new EmbassyAppointmentError('Proces kandidata nije ispravan.', 400)
    return json(await embassyAppointmentForAdmin(payload, id))
  } catch (error) {
    if (error instanceof EmbassyAppointmentError) return json({ message: error.message }, error.status)
    console.error('Admin embassy appointment request failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Termin u ambasadi trenutno nije dostupan.' }, 500)
  }
}
