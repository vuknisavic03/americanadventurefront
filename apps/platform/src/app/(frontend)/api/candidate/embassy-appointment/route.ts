import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import { cancelEmbassyAppointment, EmbassyAppointmentError, embassyAppointmentForCandidate, saveEmbassyAppointment } from '@/modules/embassy-appointments/service.ts'

const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SAVE'), appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), appointmentTime: z.string().regex(/^\d{2}:\d{2}$/), expectedVersion: z.number().int().positive().optional() }).strict(),
  z.object({ action: z.literal('CANCEL'), expectedVersion: z.number().int().positive() }).strict(),
])
const json = (body: unknown, status = 200) => Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })

async function authenticate(request: Request) {
  const payload = await getPayload({ config }); const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'candidate-accounts') throw new EmbassyAppointmentError('Sesija je istekla. Prijavite se ponovo.', 401)
  return { payload, user }
}
function failure(error: unknown) {
  if (error instanceof EmbassyAppointmentError) return json({ message: error.message }, error.status)
  console.error('Embassy appointment request failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
  return json({ message: 'Termin u ambasadi trenutno nije dostupan. Pokušajte ponovo.' }, 500)
}
async function readBody(request: Request) {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > 4_096) throw new EmbassyAppointmentError('Zahtev je prevelik.', 400)
  const reader = request.body?.getReader()
  if (!reader) throw new EmbassyAppointmentError('Zahtev nema podatke.', 400)
  const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4_096) { await reader.cancel(); throw new EmbassyAppointmentError('Zahtev je prevelik.', 400) }; chunks.push(value) }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) { if (error instanceof EmbassyAppointmentError) throw error; throw new EmbassyAppointmentError('Podaci nisu ispravni.', 400) }
  finally { reader.releaseLock() }
}

export async function GET(request: Request) {
  try { const { payload, user } = await authenticate(request); return json(await embassyAppointmentForCandidate(payload, user.id)) }
  catch (error) { return failure(error) }
}
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) throw new EmbassyAppointmentError('Zahtev nije dozvoljen.', 403)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new EmbassyAppointmentError('Zahtev mora biti JSON.', 400)
    const parsed = mutation.safeParse(await readBody(request))
    if (!parsed.success) throw new EmbassyAppointmentError('Proverite datum i vreme termina.', 400)
    const { payload, user } = await authenticate(request)
    const appointment = parsed.data.action === 'SAVE'
      ? await saveEmbassyAppointment({ accountId: user.id, appointmentDate: parsed.data.appointmentDate, appointmentTime: parsed.data.appointmentTime, expectedVersion: parsed.data.expectedVersion, now: new Date(), payload })
      : await cancelEmbassyAppointment({ accountId: user.id, expectedVersion: parsed.data.expectedVersion, now: new Date(), payload })
    return json({ appointment, message: parsed.data.action === 'SAVE' ? 'Termin u ambasadi je sačuvan.' : 'Termin u ambasadi je otkazan.' })
  } catch (error) { return failure(error) }
}
