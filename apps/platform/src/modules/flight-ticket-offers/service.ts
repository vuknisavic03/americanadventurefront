import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { PreApplication } from '../../payload-types.ts'
import {
  FLIGHT_TICKET_RESPONSE_STATEMENT_VERSION,
  flightTicketOfferSnapshot,
  flightTicketResponseStatement,
  normalizeFlightTicketOffer,
  sha256,
  type FlightTicketOfferInput,
} from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class FlightTicketOfferError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'FlightTicketOfferError'
  }
}

async function lockCandidateProcess(payload: Payload, transactionID: number | string, processId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute(query: unknown): Promise<unknown> }
  if (!transaction) throw new Error('Flight ticket offer transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${processId} FOR UPDATE`)
}

async function offersForProcess(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'flight-ticket-offers',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
    sort: '-offerVersion',
    where: { candidateProcess: { equals: candidateProcessId } },
  })).docs
}

async function requestForProcess(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'flight-ticket-requests',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateProcess: { equals: candidateProcessId } },
  })).docs[0]
}

async function responsesForProcess(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'flight-ticket-offer-responses',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
    sort: '-respondedAt',
    where: { candidateProcess: { equals: candidateProcessId } },
  })).docs
}

function optionView(option: Awaited<ReturnType<typeof offersForProcess>>[number]['options'][number]) {
  return {
    airlineName: option.airlineName,
    baggageDescription: option.baggageDescription,
    currency: option.currency,
    fareConditions: option.fareConditions ?? undefined,
    optionCode: option.optionCode,
    outboundArrivalAt: option.outboundArrivalAt,
    outboundDepartureAt: option.outboundDepartureAt,
    outboundRoute: option.outboundRoute,
    returnArrivalAt: option.returnArrivalAt,
    returnDepartureAt: option.returnDepartureAt,
    returnRoute: option.returnRoute,
    totalPriceMinor: option.totalPriceMinor,
  }
}

function candidateOfferView(offer: Awaited<ReturnType<typeof offersForProcess>>[number]) {
  return {
    candidateInstructions: offer.candidateInstructions,
    id: offer.id,
    notificationDeliveredAt: offer.notificationDeliveredAt ?? undefined,
    notificationStatus: offer.notificationStatus,
    offerVersion: offer.offerVersion,
    options: offer.options.map(optionView),
    publishedAt: offer.publishedAt,
    requestVersion: offer.requestVersion,
    respondedAt: offer.respondedAt ?? undefined,
    responseDueAt: offer.responseDueAt ?? undefined,
    snapshotChecksum: offer.snapshotChecksum,
    status: offer.status,
  }
}

function adminOfferView(offer: Awaited<ReturnType<typeof offersForProcess>>[number]) {
  return {
    ...candidateOfferView(offer),
    internalNotes: offer.internalNotes ?? undefined,
    statusVersion: offer.statusVersion,
    withdrawalReason: offer.withdrawalReason ?? undefined,
    withdrawnAt: offer.withdrawnAt ?? undefined,
  }
}

function responseView(response: Awaited<ReturnType<typeof responsesForProcess>>[number]) {
  return {
    action: response.action,
    flightTicketOfferId: relationId(response.flightTicketOffer),
    id: response.id,
    rejectionReason: response.rejectionReason ?? undefined,
    respondedAt: response.respondedAt,
    responseReference: response.responseReference,
    selectedOptionCode: response.selectedOptionCode ?? undefined,
  }
}

async function createAudit({ actorId, actorType, application, eventType, metadata, now, payload, req }: {
  actorId?: number
  actorType: 'ADMIN' | 'PUBLIC_APPLICANT'
  application: PreApplication
  eventType: 'FLIGHT_TICKET_OFFER_ACCEPTED' | 'FLIGHT_TICKET_OFFER_PUBLISHED' | 'FLIGHT_TICKET_OFFER_REJECTED' | 'FLIGHT_TICKET_OFFER_WITHDRAWN'
  metadata: Record<string, unknown>
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actorType === 'ADMIN' ? actorId : undefined,
      actorType,
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

export async function flightTicketOffersForAdmin({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new FlightTicketOfferError('Proces kandidata nije pronađen.', 404)
  const [request, offers, responses] = await Promise.all([
    requestForProcess(payload, process.id),
    offersForProcess(payload, process.id),
    responsesForProcess(payload, process.id),
  ])
  return {
    currentStep: process.currentStep,
    offers: offers.map(adminOfferView),
    processStatus: process.processStatus,
    request: request ? {
      departureDate: request.departureDate.slice(0, 10),
      returnDate: request.returnDate.slice(0, 10),
      returnDestination: request.returnDestination,
      usaDestination: request.usaDestination,
      version: request.version,
    } : undefined,
    responses: responses.map(responseView),
  }
}

export async function flightTicketOffersForCandidate({ accountId, payload }: { accountId: number; payload: Payload }) {
  const account = await payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) throw new FlightTicketOfferError('Sesija je istekla. Prijavite se ponovo.', 401)
  const process = (await payload.find({ collection: 'candidate-processes', depth: 0, limit: 1, overrideAccess: true, where: { candidateAccount: { equals: account.id } } })).docs[0]
  if (!process) throw new FlightTicketOfferError('Proces kandidata nije pronađen.', 404)
  const [offers, responses] = await Promise.all([offersForProcess(payload, process.id), responsesForProcess(payload, process.id)])
  return {
    available: process.processStatus === 'ACTIVE' && process.currentStep === 'TRAVEL_PREPARATION',
    offers: offers.filter((offer) => relationId(offer.candidateAccount) === account.id).map(candidateOfferView),
    responses: responses.filter((response) => relationId(response.candidateAccount) === account.id).map(responseView),
  }
}

export async function publishFlightTicketOffer({ administratorId, candidateProcessId, input, now, payload }: {
  administratorId: number
  candidateProcessId: number
  input: FlightTicketOfferInput
  now: Date
  payload: Payload
}) {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Flight ticket offer publication requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new FlightTicketOfferError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'TRAVEL_PREPARATION') throw new FlightTicketOfferError('Ponuda se može objaviti samo tokom aktivnog koraka „Putovanje i orijentacija“.', 403)
    const request = await requestForProcess(payload, process.id, req)
    if (!request) throw new FlightTicketOfferError('Kandidat prvo mora poslati zahtev za avionsku kartu.', 409)
    const offers = await offersForProcess(payload, process.id, req)
    if (offers.some((offer) => offer.status === 'PUBLISHED')) throw new FlightTicketOfferError('Kandidat već ima aktivnu ponudu koja čeka odgovor.', 409)
    if (offers.some((offer) => offer.status === 'ACCEPTED')) throw new FlightTicketOfferError('Kandidat već ima prihvaćenu opciju leta.', 409)
    const offerVersion = (offers[0]?.offerVersion ?? 0) + 1
    let normalized
    try { normalized = normalizeFlightTicketOffer(input, offerVersion, now) }
    catch (error) { throw new FlightTicketOfferError(error instanceof Error ? error.message : 'Podaci ponude nisu ispravni.', 400) }
    const snapshotChecksum = sha256(flightTicketOfferSnapshot(offerVersion, request.version, normalized))
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const offer = await payload.create({
      collection: 'flight-ticket-offers',
      data: {
        applicant: relationId(process.applicant),
        candidateAccount: relationId(process.candidateAccount),
        candidateInstructions: normalized.candidateInstructions,
        candidateProcess: process.id,
        flightTicketRequest: request.id,
        internalNotes: normalized.internalNotes,
        notificationStatus: 'PENDING',
        offerVersion,
        options: normalized.options,
        preApplication: application.id,
        programCode: process.programCode,
        publishedAt: now.toISOString(),
        publishedBy: administratorId,
        requestVersion: request.version,
        responseDueAt: normalized.responseDueAt,
        snapshotChecksum,
        status: 'PUBLISHED',
        statusVersion: 1,
      },
      overrideAccess: true,
      req,
    })
    const outbox = await payload.create({
      collection: 'outbox-events',
      data: {
        aggregateId: String(application.id),
        aggregateType: 'PRE_APPLICATION',
        attemptCount: 0,
        availableAt: now.toISOString(),
        eventKey: `flight-ticket-offer:${offer.id}:notification:v${offerVersion}`,
        eventType: 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED',
        occurredAt: now.toISOString(),
        payload: { candidateAccountId: relationId(process.candidateAccount), flightTicketOfferId: offer.id, offerVersion },
        status: 'PENDING',
      },
      overrideAccess: true,
      req,
    })
    await payload.jobs.queue({ input: { eventId: outbox.id }, queue: 'candidate-communications', req, task: 'sendCandidateCommunication' })
    await payload.update({
      collection: 'candidate-processes',
      data: {
        nextActionDescription: `Agencija je pripremila ${normalized.options.length} ${normalized.options.length === 1 ? 'opciju leta' : 'opcije leta'}. Uporedite detalje i prihvatite jednu opciju ili odbijte ponudu.`,
        nextActionDueAt: normalized.responseDueAt ?? null,
        nextActionTitle: 'Odgovorite na ponudu avionske karte',
      },
      id: process.id,
      overrideAccess: true,
      req,
    })
    await createAudit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'FLIGHT_TICKET_OFFER_PUBLISHED', metadata: { candidateProcessId: process.id, flightTicketOfferId: offer.id, offerVersion, optionCount: normalized.options.length, requestVersion: request.version, snapshotChecksum }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return adminOfferView(offer)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function withdrawFlightTicketOffer({ administratorId, candidateProcessId, expectedStatusVersion, flightTicketOfferId, now, payload, reason }: {
  administratorId: number
  candidateProcessId: number
  expectedStatusVersion: number
  flightTicketOfferId: number
  now: Date
  payload: Payload
  reason: string
}) {
  const normalizedReason = reason.trim()
  if (normalizedReason.length < 5 || normalizedReason.length > 1_000) throw new FlightTicketOfferError('Razlog povlačenja mora imati između 5 i 1000 znakova.', 400)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Flight ticket offer withdrawal requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new FlightTicketOfferError('Proces kandidata nije pronađen.', 404)
    const offer = await payload.findByID({ collection: 'flight-ticket-offers', depth: 0, id: flightTicketOfferId, overrideAccess: true, req }).catch(() => undefined)
    if (!offer || relationId(offer.candidateProcess) !== process.id) throw new FlightTicketOfferError('Ponuda avionske karte nije pronađena.', 404)
    if (offer.status !== 'PUBLISHED' || offer.statusVersion !== expectedStatusVersion) throw new FlightTicketOfferError('Ponuda je u međuvremenu izmenjena ili više nije aktivna.', 409)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'flight-ticket-offers', data: { notificationStatus: offer.notificationStatus === 'PENDING' ? 'SKIPPED' : offer.notificationStatus, status: 'WITHDRAWN', statusVersion: offer.statusVersion + 1, withdrawalReason: normalizedReason, withdrawnAt: now.toISOString(), withdrawnBy: administratorId }, id: offer.id, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Prethodna ponuda je povučena. Agencija priprema novu ponudu na osnovu vašeg zahteva.', nextActionDueAt: null, nextActionTitle: 'Sačekajte novu ponudu avionske karte' }, id: process.id, overrideAccess: true, req })
    await createAudit({ actorId: administratorId, actorType: 'ADMIN', application, eventType: 'FLIGHT_TICKET_OFFER_WITHDRAWN', metadata: { candidateProcessId: process.id, flightTicketOfferId: offer.id, offerVersion: offer.offerVersion, reason: normalizedReason }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return adminOfferView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function respondToFlightTicketOffer({ accountId, action, expectedSnapshotChecksum, flightTicketOfferId, now, payload, rejectionReason, selectedOptionCode }: {
  accountId: number
  action: 'ACCEPT' | 'REJECT'
  expectedSnapshotChecksum: string
  flightTicketOfferId: number
  now: Date
  payload: Payload
  rejectionReason?: string
  selectedOptionCode?: string
}) {
  const initial = await payload.findByID({ collection: 'flight-ticket-offers', depth: 0, id: flightTicketOfferId, overrideAccess: true }).catch(() => undefined)
  if (!initial || relationId(initial.candidateAccount) !== accountId) throw new FlightTicketOfferError('Ponuda avionske karte nije pronađena.', 404)
  if (initial.snapshotChecksum !== expectedSnapshotChecksum) throw new FlightTicketOfferError('Prikazana verzija ponude više nije važeća.', 409)
  const existing = (await payload.find({ collection: 'flight-ticket-offer-responses', depth: 0, limit: 1, overrideAccess: true, where: { flightTicketOffer: { equals: initial.id } } })).docs[0]
  if (existing) {
    if (existing.action === action && (action === 'REJECT' || existing.selectedOptionCode === selectedOptionCode)) return { created: false, response: existing }
    throw new FlightTicketOfferError('Na ovu ponudu je već poslat drugačiji odgovor.', 409)
  }
  if (initial.status !== 'PUBLISHED') throw new FlightTicketOfferError('Ponuda više nije dostupna za odgovor.', 409)
  if (initial.responseDueAt && now > new Date(initial.responseDueAt)) throw new FlightTicketOfferError('Rok za odgovor je istekao. Kontaktirajte agenciju.', 409)
  const selectedOption = action === 'ACCEPT' ? initial.options.find((option) => option.optionCode === selectedOptionCode) : undefined
  if (action === 'ACCEPT' && !selectedOption) throw new FlightTicketOfferError('Izaberite jednu od ponuđenih opcija leta.', 400)
  const normalizedReason = rejectionReason?.trim()
  if (action === 'REJECT' && normalizedReason && (normalizedReason.length < 3 || normalizedReason.length > 500)) throw new FlightTicketOfferError('Razlog odbijanja mora imati između 3 i 500 znakova.', 400)
  const processId = relationId(initial.candidateProcess)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Flight ticket offer response requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, processId)
    const offer = await payload.findByID({ collection: 'flight-ticket-offers', depth: 0, id: initial.id, overrideAccess: true, req })
    if (offer.status !== 'PUBLISHED' || offer.snapshotChecksum !== expectedSnapshotChecksum) throw new FlightTicketOfferError('Ponuda je u međuvremenu promenjena.', 409)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: processId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'TRAVEL_PREPARATION') throw new FlightTicketOfferError('Proces više nije u koraku za odgovor na ponudu.', 403)
    const currentRequest = await requestForProcess(payload, process.id, req)
    if (!currentRequest || currentRequest.version !== offer.requestVersion) throw new FlightTicketOfferError('Zahtev za putovanje je promenjen nakon objave ponude. Sačekajte novu ponudu.', 409)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const statementText = flightTicketResponseStatement(action, offer.offerVersion, selectedOptionCode)
    const statementChecksum = sha256(statementText)
    const respondedAt = now.toISOString()
    const responseReference = `AA-FL-${sha256(`offer:${offer.id}:account:${accountId}:action:${action}:option:${selectedOptionCode ?? ''}:snapshot:${offer.snapshotChecksum}`).slice(0, 16).toUpperCase()}`
    const evidenceChecksum = sha256(JSON.stringify({ action, offerSnapshotChecksum: offer.snapshotChecksum, rejectionReason: normalizedReason ?? null, respondedAt, responseReference, selectedOptionCode: selectedOptionCode ?? null, statementChecksum, statementVersion: FLIGHT_TICKET_RESPONSE_STATEMENT_VERSION }))
    const response = await payload.create({
      collection: 'flight-ticket-offer-responses',
      data: {
        action,
        candidateAccount: accountId,
        candidateProcess: process.id,
        evidenceChecksum,
        flightTicketOffer: offer.id,
        offerSnapshotChecksum: offer.snapshotChecksum,
        preApplication: application.id,
        rejectionReason: action === 'REJECT' ? normalizedReason : undefined,
        respondedAt,
        responseReference,
        selectedOptionCode: action === 'ACCEPT' ? selectedOptionCode : undefined,
        statementChecksum,
        statementText,
        statementVersion: FLIGHT_TICKET_RESPONSE_STATEMENT_VERSION,
      },
      overrideAccess: true,
      req,
    })
    await payload.update({ collection: 'flight-ticket-offers', data: { notificationStatus: offer.notificationStatus === 'PENDING' ? 'SKIPPED' : offer.notificationStatus, respondedAt, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED', statusVersion: offer.statusVersion + 1 }, id: offer.id, overrideAccess: true, req })
    await payload.update({
      collection: 'candidate-processes',
      data: action === 'ACCEPT'
        ? { nextActionDescription: 'Izabrana opcija je evidentirana. Agencija priprema nalog za uplatu avionske karte.', nextActionDueAt: null, nextActionTitle: 'Sačekajte nalog za uplatu avionske karte' }
        : { nextActionDescription: 'Ponuda je odbijena. Agencija će pregledati razlog i pripremiti novu ponudu.', nextActionDueAt: null, nextActionTitle: 'Sačekajte novu ponudu avionske karte' },
      id: process.id,
      overrideAccess: true,
      req,
    })
    await createAudit({ actorType: 'PUBLIC_APPLICANT', application, eventType: action === 'ACCEPT' ? 'FLIGHT_TICKET_OFFER_ACCEPTED' : 'FLIGHT_TICKET_OFFER_REJECTED', metadata: { candidateProcessId: process.id, flightTicketOfferId: offer.id, offerVersion: offer.offerVersion, responseReference, selectedOptionCode: action === 'ACCEPT' ? selectedOptionCode : undefined }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return { created: true, response }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
