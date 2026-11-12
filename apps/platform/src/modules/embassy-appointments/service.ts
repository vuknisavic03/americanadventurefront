import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { EMBASSY_TIME_ZONE, EmbassyAppointmentValidationError, validateEmbassyAppointment } from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class EmbassyAppointmentError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) {
    super(message); this.name = 'EmbassyAppointmentError'
  }
}

async function candidateContext(payload: Payload, accountId: number, req?: PayloadRequest) {
  const account = await payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true, req }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) throw new EmbassyAppointmentError('Sesija je istekla. Prijavite se ponovo.', 401)
  const process = (await payload.find({ collection: 'candidate-processes', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateAccount: { equals: account.id } } })).docs[0]
  if (!process) throw new EmbassyAppointmentError('Proces kandidata nije pronađen.', 404)
  return { account, process }
}

async function appointmentForProcess(payload: Payload, processId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'embassy-appointments', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateProcess: { equals: processId } } })).docs[0]
}

async function lockProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute(query: unknown): Promise<unknown> }
  if (!transaction) throw new Error('Embassy appointment transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

function appointmentView(appointment: NonNullable<Awaited<ReturnType<typeof appointmentForProcess>>>) {
  return {
    appointmentAt: appointment.appointmentAt, appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime, cancelledAt: appointment.cancelledAt ?? undefined,
    id: appointment.id, reminderAt: appointment.reminderAt, status: appointment.status,
    timeZone: appointment.timeZone, version: appointment.version,
  }
}

export async function embassyAppointmentForCandidate(payload: Payload, accountId: number) {
  const { process } = await candidateContext(payload, accountId)
  const [appointment, authorization] = await Promise.all([
    appointmentForProcess(payload, process.id),
    payload.find({ collection: 'passport-collection-authorizations', depth: 0, limit: 1, overrideAccess: true, where: { candidateAccount: { equals: accountId } } }).then((result) => result.docs[0]),
  ])
  const activeVisaStep = process.processStatus === 'ACTIVE' && process.currentStep === 'VISA'
  const authorizationAccepted = authorization?.status === 'ACCEPTED'
  return {
    appointment: appointment ? appointmentView(appointment) : undefined,
    available: activeVisaStep && authorizationAccepted,
    blocker: !activeVisaStep ? 'Unos termina biće dostupan kada proces stigne do aktivnog koraka „Viza“.' : !authorizationAccepted ? 'Najpre pregledajte i elektronski prihvatite punomoćje za preuzimanje pasoša.' : undefined,
  }
}

export async function embassyAppointmentForAdmin(payload: Payload, processId: number) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new EmbassyAppointmentError('Proces kandidata nije pronađen.', 404)
  const appointment = await appointmentForProcess(payload, process.id)
  const deliveries = appointment ? (await payload.find({
    collection: 'embassy-reminder-deliveries', depth: 0, limit: 100, overrideAccess: true,
    sort: '-createdAt', where: { embassyAppointment: { equals: appointment.id } },
  })).docs.map((entry) => ({ appointmentVersion: entry.appointmentVersion, channel: entry.channel, deliveredAt: entry.deliveredAt ?? undefined, id: entry.id, lastErrorCode: entry.lastErrorCode ?? undefined, provider: entry.provider, status: entry.status })) : []
  return { appointment: appointment ? appointmentView(appointment) : undefined, deliveries }
}

async function assertPrerequisites(payload: Payload, process: Awaited<ReturnType<typeof candidateContext>>['process'], accountId: number, req: PayloadRequest) {
  if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') throw new EmbassyAppointmentError('Termin je moguće evidentirati samo tokom aktivnog koraka „Viza“.', 403)
  const authorization = (await payload.find({ collection: 'passport-collection-authorizations', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateAccount: { equals: accountId } } })).docs[0]
  if (!authorization || authorization.status !== 'ACCEPTED') throw new EmbassyAppointmentError('Najpre elektronski prihvatite punomoćje za preuzimanje pasoša.', 403)
}

async function audit(payload: Payload, req: PayloadRequest, applicationId: number, eventType: 'EMBASSY_APPOINTMENT_CANCELLED' | 'EMBASSY_APPOINTMENT_RESCHEDULED' | 'EMBASSY_APPOINTMENT_SCHEDULED', metadata: Record<string, unknown>, now: Date) {
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: applicationId, overrideAccess: true, req })
  await payload.create({ collection: 'audit-events', data: {
    actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId, eventType, metadata,
    newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
    previousStatus: application.status, workflowVersion: application.workflowVersion,
  }, overrideAccess: true, req })
}

async function queueReminders(payload: Payload, req: PayloadRequest, appointmentId: number, version: number, reminderAt: Date, now: Date) {
  const waitUntil = reminderAt.getTime() > now.getTime() ? reminderAt : now
  for (const channel of ['EMAIL', 'SMS'] as const) {
    await payload.jobs.queue({ input: { appointmentId, appointmentVersion: version, channel }, queue: 'candidate-communications', req, task: 'sendEmbassyAppointmentReminder', waitUntil })
  }
}

export async function saveEmbassyAppointment({ accountId, appointmentDate, appointmentTime, expectedVersion, now, payload }: {
  accountId: number; appointmentDate: string; appointmentTime: string; expectedVersion?: number; now: Date; payload: Payload
}) {
  let schedule
  try { schedule = validateEmbassyAppointment({ date: appointmentDate, time: appointmentTime }, now) }
  catch (error) { throw new EmbassyAppointmentError(error instanceof EmbassyAppointmentValidationError ? error.message : 'Termin nije ispravan.', 400) }
  const initial = await candidateContext(payload, accountId)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Embassy appointment update requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, initial.process.id)
    const { process } = await candidateContext(payload, accountId, req)
    await assertPrerequisites(payload, process, accountId, req)
    const current = await appointmentForProcess(payload, process.id, req)
    if (current && current.version !== expectedVersion) throw new EmbassyAppointmentError('Termin je u međuvremenu izmenjen. Osvežite stranicu.', 409)
    if (!current && expectedVersion !== undefined) throw new EmbassyAppointmentError('Termin je u međuvremenu izmenjen. Osvežite stranicu.', 409)
    const version = (current?.version ?? 0) + 1
    const applicationId = relationId(process.preApplication)
    const data = {
      appointmentAt: schedule.appointmentAt.toISOString(), appointmentDate, appointmentTime,
      cancelledAt: null, reminderAt: schedule.reminderAt.toISOString(), scheduledAt: now.toISOString(),
      status: 'SCHEDULED' as const, timeZone: EMBASSY_TIME_ZONE, version,
    }
    const appointment = current
      ? await payload.update({ collection: 'embassy-appointments', data, id: current.id, overrideAccess: true, req })
      : await payload.create({ collection: 'embassy-appointments', data: {
          ...data, applicant: relationId(process.applicant), candidateAccount: accountId,
          candidateProcess: process.id, preApplication: applicationId, programCode: process.programCode,
        }, overrideAccess: true, req })
    await audit(payload, req, applicationId, current ? 'EMBASSY_APPOINTMENT_RESCHEDULED' : 'EMBASSY_APPOINTMENT_SCHEDULED', {
      appointmentId: appointment.id, current: { appointmentAt: appointment.appointmentAt, reminderAt: appointment.reminderAt },
      previous: current ? { appointmentAt: current.appointmentAt, status: current.status, version: current.version } : undefined,
      version,
    }, now)
    await payload.update({ collection: 'candidate-processes', data: {
      nextActionDescription: 'Proverite viznu dokumentaciju i pojavite se na zakazanom terminu u Ambasadi SAD.',
      nextActionDueAt: appointment.appointmentAt, nextActionTitle: 'Prisustvujte terminu u ambasadi',
    }, id: process.id, overrideAccess: true, req })
    await queueReminders(payload, req, appointment.id, version, schedule.reminderAt, now)
    await payload.db.commitTransaction(transactionID)
    return appointmentView(appointment)
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}

export async function cancelEmbassyAppointment({ accountId, expectedVersion, now, payload }: { accountId: number; expectedVersion: number; now: Date; payload: Payload }) {
  const initial = await candidateContext(payload, accountId)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Embassy appointment cancellation requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, initial.process.id)
    const { process } = await candidateContext(payload, accountId, req)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') throw new EmbassyAppointmentError('Termin je moguće otkazati samo tokom aktivnog koraka „Viza“.', 403)
    const current = await appointmentForProcess(payload, process.id, req)
    if (!current) throw new EmbassyAppointmentError('Termin nije pronađen.', 404)
    if (current.version !== expectedVersion) throw new EmbassyAppointmentError('Termin je u međuvremenu izmenjen. Osvežite stranicu.', 409)
    if (current.status === 'CANCELLED') { await payload.db.commitTransaction(transactionID); return appointmentView(current) }
    const appointment = await payload.update({ collection: 'embassy-appointments', data: { cancelledAt: now.toISOString(), status: 'CANCELLED', version: current.version + 1 }, id: current.id, overrideAccess: true, req })
    await audit(payload, req, relationId(process.preApplication), 'EMBASSY_APPOINTMENT_CANCELLED', { appointmentId: appointment.id, appointmentAt: current.appointmentAt, previousVersion: current.version, version: appointment.version }, now)
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Unesite novi termin čim ga dobijete od ambasade.', nextActionDueAt: null, nextActionTitle: 'Evidentirajte novi termin u ambasadi' }, id: process.id, overrideAccess: true, req })
    await payload.db.commitTransaction(transactionID)
    return appointmentView(appointment)
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}
