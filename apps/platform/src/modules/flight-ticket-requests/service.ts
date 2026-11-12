import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { FlightTicketRequestValidationError, type FlightTicketRequestInput, validateFlightTicketRequest } from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class FlightTicketRequestError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) { super(message); this.name = 'FlightTicketRequestError' }
}

async function context(payload: Payload, accountId: number, req?: PayloadRequest) {
  const account = await payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true, req }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) throw new FlightTicketRequestError('Sesija je istekla. Prijavite se ponovo.', 401)
  const process = (await payload.find({ collection: 'candidate-processes', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateAccount: { equals: account.id } } })).docs[0]
  if (!process) throw new FlightTicketRequestError('Proces kandidata nije pronađen.', 404)
  return { account, process }
}

async function requestForProcess(payload: Payload, processId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'flight-ticket-requests', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateProcess: { equals: processId } } })).docs[0]
}

function view(request: NonNullable<Awaited<ReturnType<typeof requestForProcess>>>) {
  return { departureDate: request.departureDate.slice(0, 10), id: request.id, notificationDeliveredAt: request.notificationDeliveredAt ?? undefined, notificationStatus: request.notificationStatus, returnDate: request.returnDate.slice(0, 10), returnDestination: request.returnDestination, submittedAt: request.submittedAt, usaDestination: request.usaDestination, version: request.version }
}

export async function flightTicketRequestForCandidate(payload: Payload, accountId: number) {
  const { process } = await context(payload, accountId)
  const request = await requestForProcess(payload, process.id)
  const available = process.processStatus === 'ACTIVE' && process.currentStep === 'TRAVEL_PREPARATION'
  return { available, blocker: available ? undefined : 'Zahtev je moguće menjati samo tokom aktivnog koraka „Putovanje i orijentacija“.', request: request ? view(request) : undefined }
}

export async function flightTicketRequestForAdmin(payload: Payload, processId: number) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new FlightTicketRequestError('Proces kandidata nije pronađen.', 404)
  const request = await requestForProcess(payload, process.id)
  return { request: request ? view(request) : undefined }
}

async function lockProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute(query: unknown): Promise<unknown> }
  if (!transaction) throw new Error('Flight ticket request transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

export async function saveFlightTicketRequest({ accountId, expectedVersion, input, now, payload }: { accountId: number; expectedVersion?: number; input: FlightTicketRequestInput; now: Date; payload: Payload }) {
  let validated
  try { validated = validateFlightTicketRequest(input, now) }
  catch (error) { throw new FlightTicketRequestError(error instanceof FlightTicketRequestValidationError ? error.message : 'Podaci zahteva nisu ispravni.', 400) }
  const initial = await context(payload, accountId)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Flight ticket request update requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, initial.process.id)
    const { process } = await context(payload, accountId, req)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'TRAVEL_PREPARATION') throw new FlightTicketRequestError('Zahtev je moguće poslati samo tokom aktivnog koraka „Putovanje i orijentacija“.', 403)
    const current = await requestForProcess(payload, process.id, req)
    if (current?.version !== expectedVersion || (!current && expectedVersion !== undefined)) throw new FlightTicketRequestError('Zahtev je u međuvremenu izmenjen. Osvežite stranicu.', 409)
    const activeOffer = (await payload.find({ collection: 'flight-ticket-offers', depth: 0, limit: 1, overrideAccess: true, req, where: { and: [{ candidateProcess: { equals: process.id } }, { status: { in: ['PUBLISHED', 'ACCEPTED'] } }] } })).docs[0]
    if (activeOffer) throw new FlightTicketRequestError(activeOffer.status === 'ACCEPTED' ? 'Zahtev se više ne može menjati jer ste prihvatili opciju leta.' : 'Zahtev se ne može menjati dok aktivna ponuda čeka odgovor. Kontaktirajte agenciju ako su podaci promenjeni.', 409)
    const version = (current?.version ?? 0) + 1
    const applicationId = relationId(process.preApplication)
    const data = { ...validated, messageDelivery: null, notificationDeliveredAt: null, notificationStatus: 'PENDING' as const, submittedAt: now.toISOString(), version }
    const request = current
      ? await payload.update({ collection: 'flight-ticket-requests', data, id: current.id, overrideAccess: true, req })
      : await payload.create({ collection: 'flight-ticket-requests', data: { ...data, applicant: relationId(process.applicant), candidateAccount: accountId, candidateProcess: process.id, preApplication: applicationId, programCode: process.programCode }, overrideAccess: true, req })
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: applicationId, overrideAccess: true, req })
    await payload.create({ collection: 'audit-events', data: { actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId, eventType: current ? 'FLIGHT_TICKET_REQUEST_UPDATED' : 'FLIGHT_TICKET_REQUEST_SUBMITTED', metadata: { flightTicketRequestId: request.id, version }, newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion }, overrideAccess: true, req })
    const event = await payload.create({ collection: 'outbox-events', data: { aggregateId: String(application.id), aggregateType: 'PRE_APPLICATION', attemptCount: 0, availableAt: now.toISOString(), eventKey: `flight-ticket-request:${request.id}:notification:${version}`, eventType: 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED', occurredAt: now.toISOString(), payload: { candidateAccountId: accountId, flightTicketRequestId: request.id, requestVersion: version }, status: 'PENDING' }, overrideAccess: true, req })
    await payload.jobs.queue({ input: { eventId: event.id }, queue: 'candidate-communications', req, task: 'sendCandidateCommunication' })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Agencija je dobila zahtev i priprema opcije leta. Pratite portal za ponudu avionske karte.', nextActionDueAt: null, nextActionTitle: 'Sačekajte ponudu avionske karte' }, id: process.id, overrideAccess: true, req })
    await payload.db.commitTransaction(transactionID)
    return view(request)
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}
