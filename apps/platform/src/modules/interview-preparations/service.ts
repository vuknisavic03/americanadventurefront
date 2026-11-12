import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { PreApplication } from '../../payload-types.ts'
import {
  assertOutcomeAllowed,
  validateScheduleWindow,
  validateTimeZone,
  type InterviewPreparationMode,
  type InterviewPreparationOutcome,
  type InterviewPreparationPurpose,
} from './rules.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

function processStepForPurpose(purpose: InterviewPreparationPurpose) {
  if (purpose === 'EMBASSY') return 'VISA'
  if (purpose === 'ORIENTATION') return 'TRAVEL_PREPARATION'
  return 'JOB_PLACEMENT'
}

type PreparationAuditEvent =
  | 'INTERVIEW_PREPARATION_CANCELLED'
  | 'INTERVIEW_PREPARATION_COMPLETED'
  | 'INTERVIEW_PREPARATION_NO_SHOW'
  | 'INTERVIEW_PREPARATION_RESCHEDULED'
  | 'INTERVIEW_PREPARATION_SCHEDULED'
  | 'ORIENTATION_MEETING_CANCELLED'
  | 'ORIENTATION_MEETING_COMPLETED'
  | 'ORIENTATION_MEETING_NO_SHOW'
  | 'ORIENTATION_MEETING_RESCHEDULED'
  | 'ORIENTATION_MEETING_SCHEDULED'

function auditEventForPurpose(
  purpose: InterviewPreparationPurpose,
  action: 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'RESCHEDULED' | 'SCHEDULED',
): PreparationAuditEvent {
  return purpose === 'ORIENTATION'
    ? `ORIENTATION_MEETING_${action}`
    : `INTERVIEW_PREPARATION_${action}`
}

export class InterviewPreparationError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'InterviewPreparationError'
  }
}

async function lockCandidateProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | {
    execute: (query: unknown) => Promise<unknown>
  }
  if (!transaction) throw new Error('Candidate process transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

async function processAppointments(payload: Payload, candidateProcessId: number, purpose: InterviewPreparationPurpose, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'interview-preparation-appointments',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
    sort: '-attemptNumber',
    where: { and: [{ candidateProcess: { equals: candidateProcessId } }, { purpose: { equals: purpose } }] },
  })).docs
}

function candidateAppointmentView(appointment: Awaited<ReturnType<typeof processAppointments>>[number]) {
  return {
    attemptNumber: appointment.attemptNumber,
    candidateInstructions: appointment.candidateInstructions ?? undefined,
    deliveryMode: appointment.deliveryMode,
    endsAt: appointment.endsAt ?? undefined,
    id: appointment.id,
    locationDetails: appointment.locationDetails,
    outcomeRecordedAt: appointment.outcomeRecordedAt ?? undefined,
    startsAt: appointment.startsAt,
    status: appointment.status,
    timeZone: appointment.timeZone,
  }
}

function adminAppointmentView(appointment: Awaited<ReturnType<typeof processAppointments>>[number]) {
  return {
    ...candidateAppointmentView(appointment),
    internalNotes: appointment.internalNotes ?? undefined,
    version: appointment.version,
  }
}

export async function interviewPreparationForAdmin({
  candidateProcessId,
  payload,
  purpose = 'JOB_INTERVIEW',
}: {
  candidateProcessId: number
  payload: Payload
  purpose?: InterviewPreparationPurpose
}) {
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 0,
    id: candidateProcessId,
    overrideAccess: true,
  }).catch(() => undefined)
  if (!process) throw new InterviewPreparationError('Proces kandidata nije pronađen.', 404)
  const appointments = await processAppointments(payload, process.id, purpose)
  return {
    appointments: appointments.map(adminAppointmentView),
    currentStep: process.currentStep,
    processStatus: process.processStatus,
  }
}

export async function interviewPreparationForCandidate({
  accountId,
  payload,
  purpose = 'JOB_INTERVIEW',
}: {
  accountId: number
  payload: Payload
  purpose?: InterviewPreparationPurpose
}) {
  const process = (await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { candidateAccount: { equals: accountId } },
  })).docs[0]
  if (!process) return []
  return (await processAppointments(payload, process.id, purpose))
    .map(candidateAppointmentView)
}

async function createAudit({
  administratorId,
  application,
  eventType,
  metadata,
  now,
  payload,
  req,
}: {
  administratorId: number
  application: PreApplication
  eventType: PreparationAuditEvent
  metadata: Record<string, unknown>
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: administratorId,
      actorType: 'ADMIN',
      correlationId: application.correlationId,
      eventType,
      metadata,
      newStatus: application.status,
      occurredAt: now.toISOString(),
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
    req,
  })
}

export async function scheduleInterviewPreparation({
  administratorId,
  candidateInstructions,
  candidateProcessId,
  deliveryMode,
  endsAt,
  expectedVersion,
  expectedAppointmentId,
  internalNotes,
  locationDetails,
  now,
  payload,
  purpose = 'JOB_INTERVIEW',
  startsAt,
  timeZone,
}: {
  administratorId: number
  candidateInstructions?: string
  candidateProcessId: number
  deliveryMode: InterviewPreparationMode
  endsAt?: Date
  expectedVersion?: number
  expectedAppointmentId?: number
  internalNotes?: string
  locationDetails: string
  now: Date
  payload: Payload
  purpose?: InterviewPreparationPurpose
  startsAt: Date
  timeZone: string
}) {
  try {
    validateScheduleWindow({ endsAt, now, startsAt })
    validateTimeZone(timeZone)
  } catch (error) {
    throw new InterviewPreparationError(error instanceof Error ? error.message : 'Termin nije ispravan.', 400)
  }
  const location = locationDetails.trim()
  if (location.length < 3) throw new InterviewPreparationError('Unesite lokaciju ili link za sastanak.', 400)

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Interview preparation scheduling requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new InterviewPreparationError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== processStepForPurpose(purpose)) {
      throw new InterviewPreparationError('Priprema je dostupna samo u odgovarajućem aktivnom koraku procesa.', 403)
    }
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const appointments = await processAppointments(payload, process.id, purpose, req)
    const active = appointments.find((appointment) => appointment.status === 'SCHEDULED')
    let appointment
    if (!active && (expectedVersion !== undefined || expectedAppointmentId !== undefined)) {
      throw new InterviewPreparationError('Termin je u međuvremenu zaključen. Osvežite stranicu.', 409)
    }
    let previousSchedule: Record<string, unknown> | undefined
    let eventAction: 'RESCHEDULED' | 'SCHEDULED'
    if (active) {
      if (expectedVersion !== active.version || expectedAppointmentId !== active.id) {
        throw new InterviewPreparationError('Termin je u međuvremenu izmenjen. Osvežite stranicu.', 409)
      }
      previousSchedule = {
        deliveryMode: active.deliveryMode,
        endsAt: active.endsAt ?? undefined,
        startsAt: active.startsAt,
        timeZone: active.timeZone,
      }
      appointment = await payload.update({
        collection: 'interview-preparation-appointments',
        data: {
          candidateInstructions: candidateInstructions?.trim() || null,
          deliveryMode,
          endsAt: endsAt?.toISOString() ?? null,
          internalNotes: internalNotes?.trim() || null,
          locationDetails: location,
          scheduledAt: now.toISOString(),
          scheduledBy: administratorId,
          startsAt: startsAt.toISOString(),
          timeZone,
          version: active.version + 1,
        },
        id: active.id,
        overrideAccess: true,
        req,
      })
      eventAction = 'RESCHEDULED'
    } else {
      appointment = await payload.create({
        collection: 'interview-preparation-appointments',
        data: {
          applicant: relationId(process.applicant),
          purpose,
          attemptNumber: (appointments[0]?.attemptNumber ?? 0) + 1,
          candidateAccount: relationId(process.candidateAccount),
          candidateInstructions: candidateInstructions?.trim() || undefined,
          candidateProcess: process.id,
          deliveryMode,
          endsAt: endsAt?.toISOString(),
          internalNotes: internalNotes?.trim() || undefined,
          locationDetails: location,
          preApplication: application.id,
          programCode: process.programCode,
          scheduledAt: now.toISOString(),
          scheduledBy: administratorId,
          startsAt: startsAt.toISOString(),
          status: 'SCHEDULED',
          timeZone,
          version: 1,
        },
        overrideAccess: true,
        req,
      })
      eventAction = 'SCHEDULED'
    }
    // Embassy preparation is independent of the official embassy appointment;
    // preserve its next action and reminder schedule.
    if (purpose !== 'EMBASSY') {
      const nextAction = purpose === 'ORIENTATION'
        ? {
            nextActionDescription: 'Pojavite se na orijentacionom sastanku i pratite objavljene instrukcije za pripremu putovanja.',
            nextActionTitle: 'Prisustvujte orijentacionom sastanku',
          }
        : {
            nextActionDescription: 'Pripremite se prema objavljenim instrukcijama i pojavite se na zakazanom terminu.',
            nextActionTitle: 'Prisustvujte pripremi za razgovor za posao',
          }
      await payload.update({
        collection: 'candidate-processes',
        data: { ...nextAction, nextActionDueAt: startsAt.toISOString() },
        id: process.id,
        overrideAccess: true,
        req,
      })
    }
    await createAudit({
      administratorId,
      application,
      eventType: auditEventForPurpose(purpose, eventAction),
      metadata: {
        purpose,
        appointmentId: appointment.id,
        attemptNumber: appointment.attemptNumber,
        candidateProcessId: process.id,
        deliveryMode,
        endsAt: endsAt?.toISOString(),
        previousSchedule,
        startsAt: startsAt.toISOString(),
        timeZone,
      },
      now,
      payload,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return adminAppointmentView(appointment)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function recordInterviewPreparationOutcome({
  administratorId,
  appointmentId,
  expectedVersion,
  internalNotes,
  now,
  outcome,
  payload,
  candidateProcessId: expectedProcessId,
  purpose = 'JOB_INTERVIEW',
}: {
  administratorId: number
  appointmentId: number
  expectedVersion: number
  internalNotes?: string
  now: Date
  outcome: InterviewPreparationOutcome
  payload: Payload
  candidateProcessId?: number
  purpose?: InterviewPreparationPurpose
}) {
  const initial = await payload.findByID({ collection: 'interview-preparation-appointments', depth: 0, id: appointmentId, overrideAccess: true }).catch(() => undefined)
  if (!initial) throw new InterviewPreparationError('Termin nije pronađen.', 404)
  const candidateProcessId = relationId(initial.candidateProcess)
  if ((expectedProcessId !== undefined && expectedProcessId !== candidateProcessId) || (initial.purpose ?? 'JOB_INTERVIEW') !== purpose) {
    throw new InterviewPreparationError('Termin nije pronađen u ovoj evidenciji.', 404)
  }
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Interview preparation outcome requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const appointment = await payload.findByID({ collection: 'interview-preparation-appointments', depth: 0, id: appointmentId, overrideAccess: true, req }).catch(() => undefined)
    if (!appointment) throw new InterviewPreparationError('Termin nije pronađen.', 404)
    if (appointment.version !== expectedVersion) throw new InterviewPreparationError('Termin je u međuvremenu izmenjen. Osvežite stranicu.', 409)
    try {
      assertOutcomeAllowed({ now, outcome, startsAt: new Date(appointment.startsAt), status: appointment.status })
    } catch (error) {
      throw new InterviewPreparationError(error instanceof Error ? error.message : 'Ishod nije dozvoljen.', 409)
    }
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== processStepForPurpose(purpose)) {
      throw new InterviewPreparationError('Ishod pripreme može se evidentirati samo u odgovarajućem aktivnom koraku procesa.', 403)
    }
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({
      collection: 'interview-preparation-appointments',
      data: {
        internalNotes: internalNotes?.trim() || appointment.internalNotes || null,
        outcomeRecordedAt: now.toISOString(),
        outcomeRecordedBy: administratorId,
        status: outcome,
        version: appointment.version + 1,
      },
      id: appointment.id,
      overrideAccess: true,
      req,
    })
    const interviewNextAction = outcome === 'COMPLETED'
      ? {
          nextActionDescription: 'Priprema je završena. Agencija će objaviti naredne informacije o izboru posla i razgovoru sa poslodavcem.',
          nextActionTitle: 'Sačekajte informacije o poslu',
        }
      : outcome === 'NO_SHOW'
        ? {
            nextActionDescription: 'Niste prisustvovali terminu. Kontaktirajte agenciju radi dogovora o novoj pripremi.',
            nextActionTitle: 'Dogovorite novi termin pripreme',
          }
        : {
            nextActionDescription: 'Termin je otkazan. Agencija će objaviti novi termin kada bude dogovoren.',
            nextActionTitle: 'Sačekajte novi termin pripreme',
          }
    const orientationNextAction = outcome === 'COMPLETED'
      ? {
          nextActionDescription: 'Orijentacija je završena. Pratite završne informacije agencije i pripremite se za putovanje.',
          nextActionTitle: 'Pripremite se za putovanje',
        }
      : outcome === 'NO_SHOW'
        ? {
            nextActionDescription: 'Niste prisustvovali orijentaciji. Kontaktirajte agenciju radi dogovora o novom terminu.',
            nextActionTitle: 'Dogovorite novi termin orijentacije',
          }
        : {
            nextActionDescription: 'Orijentacioni sastanak je otkazan. Agencija će objaviti novi termin kada bude dogovoren.',
            nextActionTitle: 'Sačekajte novi termin orijentacije',
          }
    if (purpose !== 'EMBASSY') await payload.update({
      collection: 'candidate-processes',
      data: { ...(purpose === 'ORIENTATION' ? orientationNextAction : interviewNextAction), nextActionDueAt: null },
      id: process.id,
      overrideAccess: true,
      req,
    })
    await createAudit({
      administratorId,
      application,
      eventType: auditEventForPurpose(purpose, outcome),
      metadata: {
        purpose,
        appointmentId: appointment.id,
        attemptNumber: appointment.attemptNumber,
        candidateProcessId: process.id,
        outcome,
      },
      now,
      payload,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return adminAppointmentView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
