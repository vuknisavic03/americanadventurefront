import config from '@payload-config'
import { getPayload } from 'payload'

import { FlightTicketRequestError, flightTicketRequestForAdmin } from '@/modules/flight-ticket-requests/service.ts'

const json = (body: unknown, status = 200) => Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
export async function GET(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  try {
    const payload = await getPayload({ config }); const { user } = await payload.auth({ headers: request.headers })
    if (!user || user.collection !== 'users') throw new FlightTicketRequestError('Administratorska sesija je istekla.', 401)
    const id = Number((await params).candidateProcessId); if (!Number.isSafeInteger(id) || id < 1) throw new FlightTicketRequestError('Proces kandidata nije ispravan.', 400)
    return json(await flightTicketRequestForAdmin(payload, id))
  } catch (error) {
    if (error instanceof FlightTicketRequestError) return json({ message: error.message }, error.status)
    console.error('Admin flight ticket request failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Zahtev za avionsku kartu trenutno nije dostupan.' }, 500)
  }
}
