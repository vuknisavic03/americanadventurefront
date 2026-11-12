import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { FlightTicketRequestError, flightTicketRequestForCandidate, saveFlightTicketRequest } from '@/modules/flight-ticket-requests/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

const schema = z.object({ departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), expectedVersion: z.number().int().positive().optional(), returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), returnDestination: z.string().max(200), usaDestination: z.string().max(200) }).strict()
const json = (body: unknown, status = 200) => Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

async function authenticate(request: Request) {
  const payload = await getPayload({ config }); const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'candidate-accounts') throw new FlightTicketRequestError('Sesija je istekla. Prijavite se ponovo.', 401)
  return { payload, user }
}
function failure(error: unknown) {
  if (error instanceof FlightTicketRequestError) return json({ message: error.message }, error.status)
  console.error('Flight ticket request failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
  return json({ message: 'Zahtev za avionsku kartu trenutno nije dostupan. Pokušajte ponovo.' }, 500)
}
async function body(request: Request) {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > 4_096) throw new FlightTicketRequestError('Zahtev je prevelik.', 400)
  const text = await request.text(); if (Buffer.byteLength(text) > 4_096) throw new FlightTicketRequestError('Zahtev je prevelik.', 400)
  try { return JSON.parse(text) as unknown } catch { throw new FlightTicketRequestError('Podaci nisu ispravni.', 400) }
}

export async function GET(request: Request) { try { const { payload, user } = await authenticate(request); return json(await flightTicketRequestForCandidate(payload, user.id)) } catch (error) { return failure(error) } }
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) throw new FlightTicketRequestError('Zahtev nije dozvoljen.', 403)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new FlightTicketRequestError('Zahtev mora biti JSON.', 400)
    const parsed = schema.safeParse(await body(request)); if (!parsed.success) throw new FlightTicketRequestError('Proverite sve podatke o putovanju.', 400)
    const { payload, user } = await authenticate(request)
    const { expectedVersion, ...input } = parsed.data
    return json({ message: expectedVersion ? 'Izmene zahteva su sačuvane i prosleđene agenciji.' : 'Zahtev je sačuvan i prosleđen agenciji.', request: await saveFlightTicketRequest({ accountId: user.id, expectedVersion, input, now: new Date(), payload }) }, expectedVersion ? 200 : 201)
  } catch (error) { return failure(error) }
}
