import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { CandidateJobOption, PreApplication } from '../../payload-types.ts'
import {
  EMPLOYMENT_OFFER_ACCEPTANCE_STATEMENT_VERSION,
  employmentOfferAcceptanceStatement,
  employmentOfferSnapshot,
  sha256,
  validateEmploymentOfferTerms,
  type EmploymentOfferTerms,
} from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class EmploymentOfferError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'EmploymentOfferError'
  }
}

async function lockCandidateProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute: (query: unknown) => Promise<unknown> }
  if (!transaction) throw new Error('Candidate process transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

async function lockJobOpening(payload: Payload, transactionID: number | string, jobOpeningId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute: (query: unknown) => Promise<unknown> }
  if (!transaction) throw new Error('Job opening transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "job_openings" WHERE "id" = ${jobOpeningId} FOR UPDATE`)
}

async function processOffers(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'employment-offers', depth: 0, limit: 100, overrideAccess: true, req, sort: '-offerVersion', where: { candidateProcess: { equals: candidateProcessId } } })).docs
}

function candidateOfferView(offer: Awaited<ReturnType<typeof processOffers>>[number]) {
  return { candidateInstructions: offer.candidateInstructions, currency: offer.currency, employerName: offer.employerName, endDate: offer.endDate, expectedWeeklyHours: offer.expectedWeeklyHours, hourlyWageCents: offer.hourlyWageCents, housingCostCents: offer.housingCostCents ?? undefined, housingDescription: offer.housingDescription ?? undefined, housingProvided: offer.housingProvided, id: offer.id, jobTitle: offer.jobTitle, notificationStatus: offer.notificationStatus, offerVersion: offer.offerVersion, publishedAt: offer.publishedAt, responseDueAt: offer.responseDueAt ?? undefined, snapshotChecksum: offer.snapshotChecksum, startDate: offer.startDate, status: offer.status, workCity: offer.workCity, workState: offer.workState }
}

function adminOfferView(offer: Awaited<ReturnType<typeof processOffers>>[number]) {
  return { ...candidateOfferView(offer), internalNotes: offer.internalNotes ?? undefined, statusVersion: offer.statusVersion, withdrawalReason: offer.withdrawalReason ?? undefined, withdrawnAt: offer.withdrawnAt ?? undefined }
}

async function createAudit({ actorId, actorType, application, eventType, metadata, now, payload, req }: { actorId?: number; actorType: 'ADMIN' | 'PUBLIC_APPLICANT' | 'SYSTEM'; application: PreApplication; eventType: 'EMPLOYMENT_OFFER_ACCEPTED' | 'EMPLOYMENT_OFFER_PUBLISHED' | 'EMPLOYMENT_OFFER_WITHDRAWN'; metadata: Record<string, unknown>; now: Date; payload: Payload; req: PayloadRequest }) {
  await payload.create({ collection: 'audit-events', data: { actor: actorType === 'ADMIN' ? actorId : undefined, actorType, correlationId: application.correlationId, eventType, metadata, newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion }, overrideAccess: true, req })
}

export async function employmentOffersForAdmin({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new EmploymentOfferError('Proces kandidata nije pronađen.', 404)
  return { currentStep: process.currentStep, offers: (await processOffers(payload, process.id)).map(adminOfferView), processStatus: process.processStatus }
}

export async function employmentOffersForCandidate({ accountId, candidateProcessId, payload }: { accountId: number; candidateProcessId: number; payload: Payload }) {
  const offers = (await processOffers(payload, candidateProcessId)).filter((offer) => relationId(offer.candidateAccount) === accountId)
  const acceptances = (await payload.find({ collection: 'employment-offer-acceptances', depth: 0, limit: 100, overrideAccess: true, where: { candidateAccount: { equals: accountId } } })).docs
  return { acceptances: acceptances.map((acceptance) => ({ acceptedAt: acceptance.acceptedAt, employmentOfferId: relationId(acceptance.employmentOffer), id: acceptance.id, reference: acceptance.acceptanceReference })), offers: offers.map(candidateOfferView) }
}

function termsFromOption(option: CandidateJobOption, responseDueAt?: string): EmploymentOfferTerms {
  return { candidateInstructions: option.candidateInstructions, employerName: option.employerName, endDate: option.endDate, expectedWeeklyHours: option.expectedWeeklyHours, hourlyWageCents: option.hourlyWageCents, housingCostCents: option.housingCostCents ?? undefined, housingDescription: option.housingDescription ?? undefined, housingProvided: option.housingProvided, jobTitle: option.jobTitle, responseDueAt, startDate: option.startDate, workCity: option.workCity, workState: option.workState }
}

export async function confirmCandidateJobOption({ administratorId, candidateJobOptionId, candidateProcessId, expectedStatusVersion, now, payload, responseDueAt }: { administratorId: number; candidateJobOptionId: number; candidateProcessId: number; expectedStatusVersion: number; now: Date; payload: Payload; responseDueAt?: string }) {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Employment confirmation requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new EmploymentOfferError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'JOB_PLACEMENT') throw new EmploymentOfferError('Posao se može potvrditi samo u aktivnom koraku „Posao i intervju“.', 403)
    const option = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: candidateJobOptionId, overrideAccess: true, req }).catch(() => undefined)
    if (!option || relationId(option.candidateProcess) !== process.id) throw new EmploymentOfferError('Opcija posla nije pronađena.', 404)
    if (option.status !== 'INTERESTED' || option.statusVersion !== expectedStatusVersion) throw new EmploymentOfferError('Kandidat mora prvo označiti ovu opciju kao posao koji ga interesuje.', 409)
    const offers = await processOffers(payload, process.id, req)
    if (offers.some((offer) => offer.status === 'PUBLISHED')) throw new EmploymentOfferError('Kandidat već ima potvrđenu ponudu koja čeka prihvatanje.', 409)
    if (offers.some((offer) => offer.status === 'ACCEPTED')) throw new EmploymentOfferError('Kandidat već ima prihvaćenu radnu ponudu.', 409)
    const terms = termsFromOption(option, responseDueAt)
    try { validateEmploymentOfferTerms(terms, now) } catch (error) { throw new EmploymentOfferError(error instanceof Error ? error.message : 'Uslovi ponude nisu ispravni.', 400) }
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const offerVersion = (offers[0]?.offerVersion ?? 0) + 1
    const snapshotChecksum = sha256(employmentOfferSnapshot(terms, offerVersion))
    const offer = await payload.create({ collection: 'employment-offers', data: { applicant: relationId(process.applicant), candidateAccount: relationId(process.candidateAccount), candidateInstructions: terms.candidateInstructions, candidateJobOption: option.id, candidateProcess: process.id, currency: 'USD', employerName: terms.employerName, endDate: terms.endDate, expectedWeeklyHours: terms.expectedWeeklyHours, hourlyWageCents: terms.hourlyWageCents, housingCostCents: terms.housingCostCents, housingDescription: terms.housingDescription, housingProvided: terms.housingProvided, jobTitle: terms.jobTitle, notificationStatus: 'PENDING', offerVersion, preApplication: application.id, programCode: process.programCode, publishedAt: now.toISOString(), publishedBy: administratorId, responseDueAt: terms.responseDueAt, snapshotChecksum, startDate: terms.startDate, status: 'PUBLISHED', statusVersion: 1, workCity: terms.workCity, workState: terms.workState }, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-job-options', data: { status: 'EMPLOYER_CONFIRMED', statusVersion: option.statusVersion + 1 }, id: option.id, overrideAccess: true, req })
    const outbox = await payload.create({ collection: 'outbox-events', data: { aggregateId: String(application.id), aggregateType: 'PRE_APPLICATION', attemptCount: 0, availableAt: now.toISOString(), eventKey: `employment-offer:${offer.id}:notification:v${offerVersion}`, eventType: 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED', occurredAt: now.toISOString(), payload: { candidateAccountId: relationId(process.candidateAccount), employmentOfferId: offer.id }, status: 'PENDING' }, overrideAccess: true, req })
    await payload.jobs.queue({ input: { eventId: outbox.id }, queue: 'candidate-communications', req, task: 'sendCandidateCommunication' })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Poslodavac je potvrdio izabrani posao. Pregledajte zvaničnu ponudu i elektronski je prihvatite.', nextActionDueAt: terms.responseDueAt ?? null, nextActionTitle: 'Prihvatite potvrđenu radnu ponudu' }, id: process.id, overrideAccess: true, req })
    await createAudit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'EMPLOYMENT_OFFER_PUBLISHED', metadata: { candidateJobOptionId: option.id, candidateProcessId: process.id, employmentOfferId: offer.id, offerVersion, snapshotChecksum }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return adminOfferView(offer)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function withdrawEmploymentOffer({ administratorId, candidateProcessId, employmentOfferId, expectedStatusVersion, now, payload, reason }: { administratorId: number; candidateProcessId: number; employmentOfferId: number; expectedStatusVersion: number; now: Date; payload: Payload; reason: string }) {
  const normalizedReason = reason.trim()
  if (normalizedReason.length < 5 || normalizedReason.length > 1_000) throw new EmploymentOfferError('Razlog povlačenja mora imati između 5 i 1000 znakova.', 400)
  const initial = await payload.findByID({ collection: 'employment-offers', depth: 0, id: employmentOfferId, overrideAccess: true }).catch(() => undefined)
  if (!initial) throw new EmploymentOfferError('Radna ponuda nije pronađena.', 404)
  const processId = relationId(initial.candidateProcess)
  if (processId !== candidateProcessId) throw new EmploymentOfferError('Radna ponuda ne pripada izabranom procesu.', 404)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Employment offer withdrawal requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, processId)
    const offer = await payload.findByID({ collection: 'employment-offers', depth: 0, id: employmentOfferId, overrideAccess: true, req })
    if (offer.status !== 'PUBLISHED' || offer.statusVersion !== expectedStatusVersion) throw new EmploymentOfferError('Ponuda je u međuvremenu izmenjena ili više nije aktivna.', 409)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'JOB_PLACEMENT') throw new EmploymentOfferError('Ponuda se više ne može povući u trenutnom koraku procesa.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'employment-offers', data: { status: 'WITHDRAWN', statusVersion: offer.statusVersion + 1, withdrawalReason: normalizedReason, withdrawnAt: now.toISOString(), withdrawnBy: administratorId }, id: offer.id, overrideAccess: true, req })
    if (offer.candidateJobOption) {
      const option = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: relationId(offer.candidateJobOption), overrideAccess: true, req })
      if (option.status === 'EMPLOYER_CONFIRMED') await payload.update({ collection: 'candidate-job-options', data: { status: 'INTERESTED', statusVersion: option.statusVersion + 1 }, id: option.id, overrideAccess: true, req })
    }
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Potvrđena ponuda je povučena. Možete ponovo razmotriti dostupne opcije dok agencija ne potvrdi novi posao.', nextActionDueAt: null, nextActionTitle: 'Pregledajte opcije poslova' }, id: process.id, overrideAccess: true, req })
    await createAudit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'EMPLOYMENT_OFFER_WITHDRAWN', metadata: { candidateProcessId: process.id, employmentOfferId: offer.id, offerVersion: offer.offerVersion, reason: normalizedReason }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return adminOfferView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

async function existingAcceptance(payload: Payload, employmentOfferId: number) {
  return (await payload.find({ collection: 'employment-offer-acceptances', depth: 0, limit: 1, overrideAccess: true, where: { employmentOffer: { equals: employmentOfferId } } })).docs[0]
}

export async function acceptEmploymentOffer({ accountId, employmentOfferId, expectedSnapshotChecksum, now, payload }: { accountId: number; employmentOfferId: number; expectedSnapshotChecksum: string; now: Date; payload: Payload }) {
  const initial = await payload.findByID({ collection: 'employment-offers', depth: 0, id: employmentOfferId, overrideAccess: true }).catch(() => undefined)
  if (!initial || relationId(initial.candidateAccount) !== accountId) throw new EmploymentOfferError('Radna ponuda nije pronađena.', 404)
  if (initial.snapshotChecksum !== expectedSnapshotChecksum) throw new EmploymentOfferError('Prikazana verzija ponude više nije važeća.', 409)
  const existing = await existingAcceptance(payload, initial.id)
  if (existing) return { acceptance: existing, created: false }
  if (initial.status !== 'PUBLISHED') throw new EmploymentOfferError('Radna ponuda više nije dostupna za prihvatanje.', 409)
  if (initial.responseDueAt && now > new Date(initial.responseDueAt)) throw new EmploymentOfferError('Rok za prihvatanje ponude je istekao. Kontaktirajte agenciju.', 409)
  const processId = relationId(initial.candidateProcess)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Employment offer acceptance requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, processId)
    const offer = await payload.findByID({ collection: 'employment-offers', depth: 0, id: initial.id, overrideAccess: true, req })
    if (offer.status !== 'PUBLISHED' || offer.snapshotChecksum !== expectedSnapshotChecksum) throw new EmploymentOfferError('Radna ponuda je u međuvremenu promenjena.', 409)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'JOB_PLACEMENT') throw new EmploymentOfferError('Proces više nije u koraku za prihvatanje radne ponude.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const selectedOptionId = offer.candidateJobOption ? relationId(offer.candidateJobOption) : undefined
    let jobOpeningId: number | undefined
    let remainingPositions: number | undefined
    if (selectedOptionId) {
      const selectedOption = await payload.findByID({ collection: 'candidate-job-options', depth: 0, id: selectedOptionId, overrideAccess: true, req })
      jobOpeningId = relationId(selectedOption.jobOpening)
      await lockJobOpening(payload, transactionID, jobOpeningId)
      const opening = await payload.findByID({ collection: 'job-openings', depth: 0, id: jobOpeningId, overrideAccess: true, req })
      if (opening.availablePositions !== undefined && opening.availablePositions !== null) {
        if (opening.availablePositions <= 0) throw new EmploymentOfferError('Za ovu poziciju više nema raspoloživih mesta. Kontaktirajte agenciju radi izbora druge opcije.', 409)
        remainingPositions = opening.availablePositions - 1
        await payload.update({ collection: 'job-openings', data: { availablePositions: remainingPositions, status: remainingPositions === 0 ? 'CLOSED' : opening.status }, id: opening.id, overrideAccess: true, req })
      }
    }
    const statementText = employmentOfferAcceptanceStatement(offer.offerVersion, offer.employerName, offer.jobTitle)
    const statementChecksum = sha256(statementText)
    const acceptedAt = now.toISOString()
    const acceptanceReference = `AA-JO-${sha256(`offer:${offer.id}:account:${accountId}:snapshot:${offer.snapshotChecksum}`).slice(0, 16).toUpperCase()}`
    const evidenceChecksum = sha256(JSON.stringify({ acceptanceReference, acceptedAt, accountId, employmentOfferId: offer.id, offerSnapshotChecksum: offer.snapshotChecksum, statementChecksum, statementVersion: EMPLOYMENT_OFFER_ACCEPTANCE_STATEMENT_VERSION }))
    const acceptance = await payload.create({ collection: 'employment-offer-acceptances', data: { acceptanceReference, acceptedAt, candidateAccount: accountId, candidateProcess: process.id, employmentOffer: offer.id, evidenceChecksum, offerSnapshotChecksum: offer.snapshotChecksum, preApplication: application.id, statementChecksum, statementText, statementVersion: EMPLOYMENT_OFFER_ACCEPTANCE_STATEMENT_VERSION }, overrideAccess: true, req })
    await payload.update({ collection: 'employment-offers', data: { status: 'ACCEPTED', statusVersion: offer.statusVersion + 1 }, id: offer.id, overrideAccess: true, req })
    const options = (await payload.find({ collection: 'candidate-job-options', depth: 0, limit: 500, overrideAccess: true, req, where: { candidateProcess: { equals: process.id } } })).docs
    for (const option of options) {
      if (selectedOptionId === option.id) await payload.update({ collection: 'candidate-job-options', data: { status: 'SELECTED', statusVersion: option.statusVersion + 1 }, id: option.id, overrideAccess: true, req })
      else if (['AVAILABLE', 'INTERESTED', 'NOT_INTERESTED'].includes(option.status)) await payload.update({ collection: 'candidate-job-options', data: { status: 'NOT_SELECTED', statusVersion: option.statusVersion + 1 }, id: option.id, overrideAccess: true, req })
    }
    const shortlists = (await payload.find({ collection: 'candidate-job-shortlists', depth: 0, limit: 100, overrideAccess: true, req, where: { and: [{ candidateProcess: { equals: process.id } }, { status: { equals: 'OPEN' } }] } })).docs
    for (const shortlist of shortlists) await payload.update({ collection: 'candidate-job-shortlists', data: { status: 'COMPLETED' }, id: shortlist.id, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { currentStep: 'VISA', currentStepStartedAt: acceptedAt, nextActionDescription: 'Radna ponuda je prihvaćena. Agencija će objaviti nalog za uplatu i dokumentaciju potrebnu za viziranje.', nextActionDueAt: null, nextActionTitle: 'Sačekajte uputstvo za proces viziranja' }, id: process.id, overrideAccess: true, req })
    await createAudit({ actorType: 'PUBLIC_APPLICANT', application, eventType: 'EMPLOYMENT_OFFER_ACCEPTED', metadata: { acceptanceId: acceptance.id, acceptanceReference, actorAccountId: accountId, candidateJobOptionId: selectedOptionId, employmentOfferId: offer.id, evidenceChecksum, jobOpeningId, offerVersion: offer.offerVersion, remainingPositions, snapshotChecksum: offer.snapshotChecksum, statementVersion: EMPLOYMENT_OFFER_ACCEPTANCE_STATEMENT_VERSION }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return { acceptance, created: true }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const concurrent = await existingAcceptance(payload, employmentOfferId)
    if (concurrent) return { acceptance: concurrent, created: false }
    throw error
  }
}
