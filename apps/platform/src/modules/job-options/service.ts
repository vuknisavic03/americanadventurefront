import { sql } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

import type { CandidateJobOption, JobOpening, PreApplication } from '../../payload-types.ts'
import { jobOptionChecksum, type JobOpeningSnapshot } from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class CandidateJobOptionError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'CandidateJobOptionError'
  }
}

async function lockProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute: (query: unknown) => Promise<unknown> }
  if (!transaction) throw new Error('Candidate process transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

function openingSnapshot(opening: JobOpening): JobOpeningSnapshot {
  return {
    candidateInstructions: opening.candidateInstructions,
    employerName: opening.employerName,
    endDate: opening.endDate,
    expectedWeeklyHours: opening.expectedWeeklyHours,
    hourlyWageCents: opening.hourlyWageCents,
    housingCostCents: opening.housingCostCents ?? undefined,
    housingDescription: opening.housingDescription ?? undefined,
    housingProvided: opening.housingProvided,
    jobCategory: opening.jobCategory,
    jobTitle: opening.jobTitle,
    openingCode: opening.openingCode,
    openingRevision: opening.revision,
    startDate: opening.startDate,
    workCity: opening.workCity,
    workState: opening.workState,
  }
}

function openingView(opening: JobOpening) {
  return { ...openingSnapshot(opening), availablePositions: opening.availablePositions ?? undefined, id: opening.id, status: opening.status }
}

export function jobOptionView(option: CandidateJobOption) {
  return {
    candidateInstructions: option.candidateInstructions,
    currency: option.currency,
    employerName: option.employerName,
    endDate: option.endDate,
    expectedWeeklyHours: option.expectedWeeklyHours,
    hourlyWageCents: option.hourlyWageCents,
    housingCostCents: option.housingCostCents ?? undefined,
    housingDescription: option.housingDescription ?? undefined,
    housingProvided: option.housingProvided,
    id: option.id,
    jobCategory: option.jobCategory,
    jobTitle: option.jobTitle,
    openingCode: option.openingCode,
    openingRevision: option.openingRevision,
    snapshotChecksum: option.snapshotChecksum,
    status: option.status,
    statusVersion: option.statusVersion,
    workCity: option.workCity,
    workState: option.workState,
    startDate: option.startDate,
  }
}

async function optionsForProcess(payload: Payload, processId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'candidate-job-options', depth: 0, limit: 500, overrideAccess: true, req, sort: '-assignedAt', where: { candidateProcess: { equals: processId } } })).docs
}

async function audit({ actorId, actorType, application, eventType, metadata, now, payload, req }: {
  actorId?: number
  actorType: 'ADMIN' | 'PUBLIC_APPLICANT'
  application: PreApplication
  eventType: 'JOB_OPTION_PREFERENCE_UPDATED' | 'JOB_OPTION_WITHDRAWN' | 'JOB_SHORTLIST_SENT'
  metadata: Record<string, unknown>
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  await payload.create({ collection: 'audit-events', data: { actor: actorType === 'ADMIN' ? actorId : undefined, actorType, correlationId: application.correlationId, eventType, metadata, newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion }, overrideAccess: true, req })
}

export async function jobOptionsForAdmin({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new CandidateJobOptionError('Proces kandidata nije pronađen.', 404)
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true })
  const [openings, options] = await Promise.all([
    payload.find({ collection: 'job-openings', depth: 0, limit: 500, overrideAccess: true, sort: 'employerName', where: { and: [{ campaignCode: { equals: application.campaignCode } }, { programCode: { equals: process.programCode } }, { status: { equals: 'OPEN' } }] } }),
    optionsForProcess(payload, process.id),
  ])
  const assignedOpeningIds = new Set(options.map((option) => relationId(option.jobOpening)))
  return {
    campaignCode: application.campaignCode,
    currentStep: process.currentStep,
    openings: openings.docs.filter((opening) => !assignedOpeningIds.has(opening.id) && (opening.availablePositions === undefined || opening.availablePositions === null || opening.availablePositions > 0)).map(openingView),
    options: options.map(jobOptionView),
    processStatus: process.processStatus,
  }
}

export async function jobOptionsForCandidate({ accountId, candidateProcessId, payload }: { accountId: number; candidateProcessId: number; payload: Payload }) {
  const options = (await optionsForProcess(payload, candidateProcessId)).filter((option) => relationId(option.candidateAccount) === accountId)
  return { options: options.map(jobOptionView) }
}

export async function sendCandidateJobShortlist({ administratorId, candidateProcessId, jobOpeningIds, now, payload }: { administratorId: number; candidateProcessId: number; jobOpeningIds: number[]; now: Date; payload: Payload }) {
  const uniqueIds = [...new Set(jobOpeningIds)]
  if (uniqueIds.length < 1 || uniqueIds.length > 20 || uniqueIds.some((id) => !Number.isSafeInteger(id) || id < 1)) throw new CandidateJobOptionError('Izaberite između 1 i 20 poslova.', 400)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Sending job options requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new CandidateJobOptionError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'JOB_PLACEMENT') throw new CandidateJobOptionError('Opcije poslova mogu se poslati samo u aktivnom koraku „Posao i intervju“.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const existing = await optionsForProcess(payload, process.id, req)
    if (existing.some((option) => uniqueIds.includes(relationId(option.jobOpening)))) throw new CandidateJobOptionError('Jedan ili više izabranih poslova već su poslati ovom kandidatu.', 409)
    const openings = await Promise.all(uniqueIds.map((id) => payload.findByID({ collection: 'job-openings', depth: 0, id, overrideAccess: true, req }).catch(() => undefined)))
    if (openings.some((opening) => !opening || opening.status !== 'OPEN' || opening.programCode !== process.programCode || opening.campaignCode !== application.campaignCode || opening.availablePositions === 0)) throw new CandidateJobOptionError('Jedan ili više poslova više nisu otvoreni za ovog kandidata i sezonu.', 409)
    const previousShortlists = (await payload.find({ collection: 'candidate-job-shortlists', depth: 0, limit: 1, overrideAccess: true, req, sort: '-shortlistVersion', where: { candidateProcess: { equals: process.id } } })).docs
    const shortlistVersion = (previousShortlists[0]?.shortlistVersion ?? 0) + 1
    const shortlistReference = `AA-JOBS-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
    const shortlist = await payload.create({ collection: 'candidate-job-shortlists', data: { applicant: relationId(process.applicant), candidateAccount: relationId(process.candidateAccount), candidateProcess: process.id, notificationStatus: 'PENDING', optionCount: openings.length, preApplication: application.id, programCode: process.programCode, sentAt: now.toISOString(), sentBy: administratorId, shortlistReference, shortlistVersion, status: 'OPEN' }, overrideAccess: true, req })
    const options = []
    for (const opening of openings) {
      if (!opening) continue
      const snapshot = openingSnapshot(opening)
      options.push(await payload.create({ collection: 'candidate-job-options', data: { ...snapshot, candidateAccount: relationId(process.candidateAccount), candidateProcess: process.id, currency: 'USD', jobOpening: opening.id, preApplication: application.id, shortlist: shortlist.id, snapshotChecksum: jobOptionChecksum(snapshot), status: 'AVAILABLE', statusVersion: 1, assignedAt: now.toISOString(), assignedBy: administratorId }, overrideAccess: true, req }))
    }
    const outbox = await payload.create({ collection: 'outbox-events', data: { aggregateId: String(application.id), aggregateType: 'PRE_APPLICATION', attemptCount: 0, availableAt: now.toISOString(), eventKey: `job-shortlist:${shortlist.id}:notification:v${shortlistVersion}`, eventType: 'JOB_SHORTLIST_NOTIFICATION_REQUESTED', occurredAt: now.toISOString(), payload: { candidateAccountId: relationId(process.candidateAccount), candidateJobShortlistId: shortlist.id }, status: 'PENDING' }, overrideAccess: true, req })
    await payload.jobs.queue({ input: { eventId: outbox.id }, queue: 'candidate-communications', req, task: 'sendCandidateCommunication' })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Uporedite poslove koje je agencija izdvojila i označite opcije koje vas interesuju.', nextActionDueAt: null, nextActionTitle: 'Pregledajte opcije poslova' }, id: process.id, overrideAccess: true, req })
    await audit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'JOB_SHORTLIST_SENT', metadata: { candidateProcessId: process.id, jobOpeningIds: uniqueIds, optionCount: options.length, shortlistId: shortlist.id, shortlistVersion }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return { options: options.map(jobOptionView), shortlistId: shortlist.id }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function updateCandidateJobPreference({ accountId, action, candidateJobOptionId, expectedStatusVersion, now, payload }: { accountId: number; action: 'INTERESTED' | 'NOT_INTERESTED' | 'RECONSIDER'; candidateJobOptionId: number; expectedStatusVersion: number; now: Date; payload: Payload }) {
  const initial = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: candidateJobOptionId, overrideAccess: true }).catch(() => undefined)
  if (!initial || relationId(initial.candidateAccount) !== accountId) throw new CandidateJobOptionError('Opcija posla nije pronađena.', 404)
  const processId = relationId(initial.candidateProcess)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Updating job preference requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, processId)
    const option = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: initial.id, overrideAccess: true, req })
    if (!['AVAILABLE', 'INTERESTED', 'NOT_INTERESTED'].includes(option.status) || option.statusVersion !== expectedStatusVersion) throw new CandidateJobOptionError('Opcija je u međuvremenu promenjena ili više nije dostupna.', 409)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'JOB_PLACEMENT') throw new CandidateJobOptionError('Izbor poslova više nije otvoren za ovaj proces.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const nextStatus = action === 'INTERESTED' ? 'INTERESTED' : action === 'NOT_INTERESTED' ? 'NOT_INTERESTED' : 'AVAILABLE'
    const updated = await payload.update({ collection: 'candidate-job-options', data: { candidatePreferenceUpdatedAt: now.toISOString(), status: nextStatus, statusVersion: option.statusVersion + 1 }, id: option.id, overrideAccess: true, req })
    await audit({ actorType: 'PUBLIC_APPLICANT', application, eventType: 'JOB_OPTION_PREFERENCE_UPDATED', metadata: { candidateJobOptionId: option.id, from: option.status, to: nextStatus }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return jobOptionView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function withdrawCandidateJobOption({ administratorId, candidateJobOptionId, candidateProcessId, expectedStatusVersion, now, payload, reason }: { administratorId: number; candidateJobOptionId: number; candidateProcessId: number; expectedStatusVersion: number; now: Date; payload: Payload; reason: string }) {
  const normalizedReason = reason.trim()
  if (normalizedReason.length < 5 || normalizedReason.length > 1_000) throw new CandidateJobOptionError('Razlog povlačenja mora imati između 5 i 1000 znakova.', 400)
  const initial = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: candidateJobOptionId, overrideAccess: true }).catch(() => undefined)
  if (!initial || relationId(initial.candidateProcess) !== candidateProcessId) throw new CandidateJobOptionError('Opcija posla nije pronađena.', 404)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Withdrawing job option requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, candidateProcessId)
    const option = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: initial.id, overrideAccess: true, req })
    if (!['AVAILABLE', 'INTERESTED', 'NOT_INTERESTED'].includes(option.status) || option.statusVersion !== expectedStatusVersion) throw new CandidateJobOptionError('Opcija je u međuvremenu promenjena ili više ne može da se povuče.', 409)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'candidate-job-options', data: { status: 'WITHDRAWN', statusVersion: option.statusVersion + 1, withdrawalReason: normalizedReason, withdrawnAt: now.toISOString(), withdrawnBy: administratorId }, id: option.id, overrideAccess: true, req })
    await audit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'JOB_OPTION_WITHDRAWN', metadata: { candidateJobOptionId: option.id, reason: normalizedReason }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return jobOptionView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
