import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'
import {
  InterviewPreparationError,
  interviewPreparationForAdmin,
  recordInterviewPreparationOutcome,
  scheduleInterviewPreparation,
} from '@/modules/interview-preparations/service.ts'

const scheduleSchema = z.object({
  action: z.literal('SCHEDULE'),
  candidateInstructions: z.string().trim().max(1_000).optional(),
  deliveryMode: z.enum(['IN_PERSON', 'ONLINE']),
  endsAt: z.iso.datetime().optional(),
  expectedVersion: z.number().int().positive().optional(),
  expectedAppointmentId: z.number().int().positive().optional(),
  internalNotes: z.string().trim().max(2_000).optional(),
  locationDetails: z.string().trim().min(3).max(500),
  startsAt: z.iso.datetime(),
  timeZone: z.string().trim().min(1).max(100),
}).strict()

const outcomeSchema = z.object({
  action: z.enum(['CANCELLED', 'COMPLETED', 'NO_SHOW']),
  appointmentId: z.number().int().positive(),
  expectedVersion: z.number().int().positive(),
  internalNotes: z.string().trim().max(2_000).optional(),
}).strict()
const requestSchema = z.discriminatedUnion('action', [scheduleSchema, outcomeSchema])

function response(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

async function administrator() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') return { payload }
  return { administratorId: authentication.user.id, payload }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ candidateProcessId: string }> },
) {
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const purpose = z.enum(['JOB_INTERVIEW', 'EMBASSY', 'ORIENTATION']).safeParse(new URL(request.url).searchParams.get('purpose') ?? 'JOB_INTERVIEW')
  if (!purpose.success) return response({ message: 'Vrsta pripreme nije ispravna.' }, 400)
  const candidateProcessId = Number((await params).candidateProcessId)
  if (!Number.isInteger(candidateProcessId) || candidateProcessId < 1) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  try {
    return response(await interviewPreparationForAdmin({ candidateProcessId, payload: authentication.payload, purpose: purpose.data }))
  } catch (error) {
    if (error instanceof InterviewPreparationError) return response({ message: error.message }, error.status)
    console.error('Interview preparation state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Evidencija pripreme trenutno nije dostupna.' }, 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateProcessId: string }> },
) {
  if (!isSameOriginRequest(request)) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti JSON.' }, 400)
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const purpose = z.enum(['JOB_INTERVIEW', 'EMBASSY', 'ORIENTATION']).safeParse(new URL(request.url).searchParams.get('purpose') ?? 'JOB_INTERVIEW')
  if (!purpose.success) return response({ message: 'Vrsta pripreme nije ispravna.' }, 400)
  const candidateProcessId = Number((await params).candidateProcessId)
  let body: unknown
  try { body = await request.json() } catch { return response({ message: 'Zahtev nije ispravan.' }, 400) }
  if (!Number.isInteger(candidateProcessId) || candidateProcessId < 1) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return response({ message: 'Proverite obavezna polja, datume i dužinu unosa.' }, 400)
  try {
    const appointment = parsed.data.action === 'SCHEDULE'
      ? await scheduleInterviewPreparation({
          administratorId: authentication.administratorId,
          candidateInstructions: parsed.data.candidateInstructions,
          candidateProcessId,
          purpose: purpose.data,
          deliveryMode: parsed.data.deliveryMode,
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
          expectedVersion: parsed.data.expectedVersion,
          expectedAppointmentId: parsed.data.expectedAppointmentId,
          internalNotes: parsed.data.internalNotes,
          locationDetails: parsed.data.locationDetails,
          now: new Date(),
          payload: authentication.payload,
          startsAt: new Date(parsed.data.startsAt),
          timeZone: parsed.data.timeZone,
        })
      : await recordInterviewPreparationOutcome({
          candidateProcessId,
          purpose: purpose.data,
          administratorId: authentication.administratorId,
          appointmentId: parsed.data.appointmentId,
          expectedVersion: parsed.data.expectedVersion,
          internalNotes: parsed.data.internalNotes,
          now: new Date(),
          outcome: parsed.data.action,
          payload: authentication.payload,
        })
    return response({
      appointment,
      message: parsed.data.action === 'SCHEDULE'
        ? parsed.data.expectedVersion
          ? 'Termin pripreme je promenjen.'
          : 'Termin pripreme je zakazan.'
        : parsed.data.action === 'COMPLETED'
          ? 'Prisustvo i završetak pripreme su evidentirani.'
          : parsed.data.action === 'NO_SHOW'
            ? 'Izostanak kandidata je evidentiran.'
            : 'Termin pripreme je otkazan.',
    }, parsed.data.action === 'SCHEDULE' && !parsed.data.expectedVersion ? 201 : 200)
  } catch (error) {
    if (error instanceof InterviewPreparationError) return response({ message: error.message }, error.status)
    console.error('Interview preparation mutation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Obrada termina trenutno nije dostupna.' }, 500)
  }
}
