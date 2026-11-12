import type { Payload, PayloadRequest, TaskConfig } from 'payload'

import type { CandidateAccount, CandidateJobShortlist, EmploymentOffer, FlightTicketOffer, FlightTicketRequest, MessageDelivery, OutboxEvent, PreApplication } from '../../payload-types.ts'
import { readPlatformEnvironment } from '../../config/environment.ts'
import { candidateActivationUrl } from '../candidate-accounts/activationToken.ts'
import {
  CandidateEmailProviderError,
  createCandidateEmailProvider,
} from './emailProvider.ts'
import {
  type CommunicationCategory,
  renderCandidateMessage,
} from './templates.ts'

type TaskInputOutput = {
  input: { eventId: number }
  output: { deliveryId?: number; status: 'DELIVERED' | 'SKIPPED' }
}

type SupportedEventType =
  | 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED'
  | 'CONSULTATION_INVITATION_REQUESTED'
  | 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED'
  | 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED'
  | 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED'
  | 'JOB_SHORTLIST_NOTIFICATION_REQUESTED'
  | 'MATERIAL_DELIVERY_REQUESTED'

const communicationQueue = 'candidate-communications'

function eventCategory(eventType: SupportedEventType): Exclude<CommunicationCategory, 'EMBASSY_APPOINTMENT_REMINDER'> {
  if (eventType === 'MATERIAL_DELIVERY_REQUESTED') return 'MATERIAL_BUNDLE'
  if (eventType === 'CONSULTATION_INVITATION_REQUESTED') return 'CONSULTATION_INVITATION'
  if (eventType === 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED') return 'EMPLOYMENT_OFFER'
  if (eventType === 'JOB_SHORTLIST_NOTIFICATION_REQUESTED') return 'JOB_SHORTLIST'
  if (eventType === 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED') return 'FLIGHT_TICKET_REQUEST'
  if (eventType === 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED') return 'FLIGHT_TICKET_OFFER'
  return 'ACCOUNT_ACTIVATION'
}

function expectedStatuses(eventType: SupportedEventType) {
  if (['CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED', 'JOB_SHORTLIST_NOTIFICATION_REQUESTED'].includes(eventType)) return undefined
  return eventType === 'MATERIAL_DELIVERY_REQUESTED'
    ? { from: 'QUALIFIED' as const, to: 'MATERIALS_SENT' as const }
    : { from: 'MATERIALS_SENT' as const, to: 'CONSULTATION_INVITED' as const }
}

function isAlreadyAdvanced(application: PreApplication, eventType: SupportedEventType) {
  if (['CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED', 'JOB_SHORTLIST_NOTIFICATION_REQUESTED'].includes(eventType)) return true
  if (eventType === 'MATERIAL_DELIVERY_REQUESTED') {
    return ['MATERIALS_SENT', 'CONSULTATION_INVITED'].includes(application.status)
  }
  return application.status === 'CONSULTATION_INVITED'
}

async function getActivationAccount(payload: Payload, event: OutboxEvent) {
  const eventPayload = event.payload
  if (!eventPayload || typeof eventPayload !== 'object' || Array.isArray(eventPayload)) {
    throw new Error('Aktivacioni događaj nema ispravne podatke.')
  }
  const accountId = Number(eventPayload.candidateAccountId)
  const activationVersion = Number(eventPayload.activationVersion)
  if (!Number.isSafeInteger(accountId) || !Number.isSafeInteger(activationVersion)) {
    throw new Error('Aktivacioni događaj nema ispravan nalog ili verziju.')
  }

  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: accountId,
    overrideAccess: true,
  })
  if (
    account.accountStatus !== 'PENDING_ACTIVATION' ||
    account.activationVersion !== activationVersion ||
    !account.activationExpiresAt ||
    !account.activationNonce
  ) {
    throw new Error('Aktivacioni događaj više nije važeći.')
  }
  return account
}

function eventPayload(event: OutboxEvent) {
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) throw new Error('Outbox događaj nema ispravne podatke.')
  return event.payload
}

async function getEmploymentOfferRecipient(payload: Payload, event: OutboxEvent) {
  const data = eventPayload(event)
  const employmentOfferId = Number(data.employmentOfferId)
  const candidateAccountId = Number(data.candidateAccountId)
  if (!Number.isSafeInteger(employmentOfferId) || !Number.isSafeInteger(candidateAccountId)) throw new Error('Događaj radne ponude nema ispravne identifikatore.')
  const [employmentOffer, account] = await Promise.all([
    payload.findByID({ collection: 'employment-offers', depth: 0, id: employmentOfferId, overrideAccess: true }),
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: candidateAccountId, overrideAccess: true }),
  ])
  if (employmentOffer.status !== 'PUBLISHED' || (typeof employmentOffer.candidateAccount === 'number' ? employmentOffer.candidateAccount : employmentOffer.candidateAccount.id) !== account.id) {
    throw new Error('Radna ponuda više nije važeća za obaveštenje.')
  }
  return { account, employmentOffer }
}

async function getJobShortlistRecipient(payload: Payload, event: OutboxEvent) {
  const data = eventPayload(event)
  const shortlistId = Number(data.candidateJobShortlistId)
  const candidateAccountId = Number(data.candidateAccountId)
  if (!Number.isSafeInteger(shortlistId) || !Number.isSafeInteger(candidateAccountId)) throw new Error('Događaj liste poslova nema ispravne identifikatore.')
  const [jobShortlist, account] = await Promise.all([
    payload.findByID({ collection: 'candidate-job-shortlists', depth: 0, id: shortlistId, overrideAccess: true }),
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: candidateAccountId, overrideAccess: true }),
  ])
  if ((typeof jobShortlist.candidateAccount === 'number' ? jobShortlist.candidateAccount : jobShortlist.candidateAccount.id) !== account.id) throw new Error('Lista poslova ne pripada kandidatskom nalogu.')
  return { account, jobShortlist }
}

async function getFlightTicketRequestRecipient(payload: Payload, event: OutboxEvent) {
  const data = eventPayload(event)
  const requestId = Number(data.flightTicketRequestId)
  const candidateAccountId = Number(data.candidateAccountId)
  const requestVersion = Number(data.requestVersion)
  if (![requestId, candidateAccountId, requestVersion].every(Number.isSafeInteger)) throw new Error('Događaj zahteva za avionsku kartu nema ispravne identifikatore.')
  const [flightRequest, account] = await Promise.all([
    payload.findByID({ collection: 'flight-ticket-requests', depth: 0, id: requestId, overrideAccess: true }),
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: candidateAccountId, overrideAccess: true }),
  ])
  if ((typeof flightRequest.candidateAccount === 'number' ? flightRequest.candidateAccount : flightRequest.candidateAccount.id) !== account.id || flightRequest.version < requestVersion) throw new Error('Zahtev za avionsku kartu nije važeći za obaveštenje.')
  return { account, flightRequest, requestVersion }
}

async function getFlightTicketOfferRecipient(payload: Payload, event: OutboxEvent) {
  const data = eventPayload(event)
  const offerId = Number(data.flightTicketOfferId)
  const candidateAccountId = Number(data.candidateAccountId)
  const offerVersion = Number(data.offerVersion)
  if (![offerId, candidateAccountId, offerVersion].every(Number.isSafeInteger)) throw new Error('Događaj ponude avionske karte nema ispravne identifikatore.')
  const [flightOffer, account] = await Promise.all([
    payload.findByID({ collection: 'flight-ticket-offers', depth: 0, id: offerId, overrideAccess: true }),
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: candidateAccountId, overrideAccess: true }),
  ])
  if ((typeof flightOffer.candidateAccount === 'number' ? flightOffer.candidateAccount : flightOffer.candidateAccount.id) !== account.id) throw new Error('Ponuda avionske karte ne pripada kandidatskom nalogu.')
  return { account, flightOffer, offerVersion }
}

async function completeSupersededEvent(payload: Payload, event: OutboxEvent) {
  await payload.update({
    collection: 'outbox-events',
    data: {
      attemptCount: event.attemptCount + 1,
      completedAt: new Date().toISOString(),
      lastErrorCode: null,
      status: 'COMPLETED',
    },
    id: event.id,
    overrideAccess: true,
  })
}

async function findDelivery(payload: Payload, idempotencyKey: string) {
  const result = await payload.find({
    collection: 'message-deliveries',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { idempotencyKey: { equals: idempotencyKey } },
  })

  return result.docs[0]
}

async function getApplication(payload: Payload, event: OutboxEvent) {
  const applicationId = Number(event.aggregateId)
  if (!Number.isSafeInteger(applicationId)) {
    throw new Error('Outbox događaj nema ispravan identifikator prijave.')
  }

  return payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: applicationId,
    overrideAccess: true,
  })
}

async function createOrPrepareDelivery({
  application,
  event,
  payload,
  activationAccount,
  employmentOffer,
  jobShortlist,
  flightRequest,
  flightOffer,
  notificationAccount,
}: {
  application: PreApplication
  event: OutboxEvent
  payload: Payload
  activationAccount?: CandidateAccount
  employmentOffer?: EmploymentOffer
  jobShortlist?: CandidateJobShortlist
  flightRequest?: FlightTicketRequest
  flightOffer?: FlightTicketOffer
  notificationAccount?: CandidateAccount
}) {
  const environment = readPlatformEnvironment()
  const category = eventCategory(event.eventType as SupportedEventType)
  const activationUrl = activationAccount
    ? candidateActivationUrl({
        accountId: activationAccount.id,
        expiresAt: new Date(activationAccount.activationExpiresAt!).getTime(),
        nonce: activationAccount.activationNonce!,
        secret: environment.payloadSecret,
        serverUrl: environment.serverUrl,
        version: activationAccount.activationVersion,
      })
    : undefined
  const message = renderCandidateMessage(category, {
    activationUrl,
    campaignName: application.campaignCode,
    consultationBookingUrl: environment.candidateCommunication.consultationBookingUrl,
    firstName: application.submission.firstName,
    employerName: employmentOffer?.employerName,
    employmentOfferUrl: employmentOffer ? `${environment.serverUrl}/moj-nalog#employment-offer` : undefined,
    jobTitle: employmentOffer?.jobTitle,
    jobOptionCount: jobShortlist?.optionCount,
    jobOptionsUrl: jobShortlist ? `${environment.serverUrl}/moj-nalog#job-options` : undefined,
    candidateFullName: flightRequest ? notificationAccount?.fullName : undefined,
    flightRequestAdminUrl: flightRequest ? `${environment.serverUrl}/admin/collections/candidate-processes/${typeof flightRequest.candidateProcess === 'number' ? flightRequest.candidateProcess : flightRequest.candidateProcess.id}` : undefined,
    flightRequestVersion: flightRequest?.version,
    flightOfferOptionCount: flightOffer?.options.length,
    flightOfferVersion: flightOffer?.offerVersion,
    candidatePortalUrl: flightOffer ? `${environment.serverUrl}/moj-nalog#flight-ticket-offer` : undefined,
    officialContactEmail: environment.candidateCommunication.replyTo,
    officialPhone: environment.candidateCommunication.officialPhone,
    privacyPolicyUrl: environment.candidateCommunication.privacyPolicyUrl,
    programName: 'Work and Travel USA',
  })
  const existing = await findDelivery(payload, event.eventKey)
  const attemptedAt = new Date().toISOString()

  if (existing) {
    if (existing.status !== 'DELIVERED') {
      return {
        delivery: await payload.update({
          collection: 'message-deliveries',
          data: {
            attemptCount: existing.attemptCount + 1,
            lastAttemptAt: attemptedAt,
            lastErrorCode: null,
            nextRetryAt: null,
            status: 'PROCESSING',
          },
          id: existing.id,
          overrideAccess: true,
        }),
        environment,
        message,
      }
    }

    return { delivery: existing, environment, message }
  }

  return {
    delivery: await payload.create({
      collection: 'message-deliveries',
      data: {
        attemptCount: 1,
        category,
        contentHash: message.contentHash,
        idempotencyKey: event.eventKey,
        lastAttemptAt: attemptedAt,
        preApplication: application.id,
        provider: environment.candidateCommunication.provider,
        recipientEmail: flightRequest ? environment.operations.flightRequestNotificationEmail : notificationAccount?.email ?? activationAccount?.email ?? application.submission.email,
        status: 'PROCESSING',
        subject: message.subject,
        templateKey: message.templateKey,
        templateVersion: message.templateVersion,
      },
      overrideAccess: true,
    }),
    environment,
    message,
  }
}

async function recordFailure({
  application,
  delivery,
  errorCode,
  event,
  payload,
}: {
  application: PreApplication
  delivery: MessageDelivery
  errorCode: string
  event: OutboxEvent
  payload: Payload
}) {
  const failedAt = new Date()
  const nextRetryAt = new Date(failedAt.getTime() + 5 * 60 * 1000)
  const offerId = event.eventType === 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED'
    ? Number(eventPayload(event).employmentOfferId)
    : undefined
  const shortlistId = event.eventType === 'JOB_SHORTLIST_NOTIFICATION_REQUESTED'
    ? Number(eventPayload(event).candidateJobShortlistId)
    : undefined
  const flightRequestId = event.eventType === 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED'
    ? Number(eventPayload(event).flightTicketRequestId)
    : undefined
  const flightOfferId = event.eventType === 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED'
    ? Number(eventPayload(event).flightTicketOfferId)
    : undefined

  const updates: Promise<unknown>[] = [
    payload.update({
      collection: 'message-deliveries',
      data: {
        lastErrorCode: errorCode,
        nextRetryAt: nextRetryAt.toISOString(),
        status: 'FAILED',
      },
      id: delivery.id,
      overrideAccess: true,
    }),
    payload.update({
      collection: 'outbox-events',
      data: {
        availableAt: nextRetryAt.toISOString(),
        lastErrorCode: errorCode,
        status: 'FAILED',
      },
      id: event.id,
      overrideAccess: true,
    }),
    payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'SYSTEM',
        correlationId: application.correlationId,
        eventType: 'CANDIDATE_MESSAGE_FAILED',
        metadata: { category: delivery.category, errorCode },
        newStatus: application.status,
        occurredAt: failedAt.toISOString(),
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
    }),
  ]
  if (Number.isSafeInteger(offerId)) updates.push(payload.update({ collection: 'employment-offers', data: { notificationStatus: 'FAILED' }, id: offerId!, overrideAccess: true }))
  if (Number.isSafeInteger(shortlistId)) updates.push(payload.update({ collection: 'candidate-job-shortlists', data: { notificationStatus: 'FAILED' }, id: shortlistId!, overrideAccess: true }))
  if (Number.isSafeInteger(flightRequestId)) updates.push(payload.update({ collection: 'flight-ticket-requests', data: { notificationStatus: 'FAILED' }, id: flightRequestId!, overrideAccess: true }))
  if (Number.isSafeInteger(flightOfferId)) updates.push(payload.update({ collection: 'flight-ticket-offers', data: { notificationStatus: 'FAILED' }, id: flightOfferId!, overrideAccess: true }))
  await Promise.all(updates)
}

async function completeDelivery({
  application,
  delivery,
  event,
  payload,
  providerMessageId,
  req,
}: {
  application: PreApplication
  delivery: MessageDelivery
  event: OutboxEvent
  payload: Payload
  providerMessageId: string
  req: PayloadRequest
}) {
  const eventType = event.eventType as SupportedEventType
  const statuses = expectedStatuses(eventType)
  const completedAt = new Date().toISOString()
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Nije moguće započeti transakciju isporuke.')
  const transactionRequest = { ...req, transactionID }

  try {
    await payload.update({
      collection: 'message-deliveries',
      data: {
        deliveredAt: completedAt,
        lastErrorCode: null,
        nextRetryAt: null,
        providerMessageId,
        status: 'DELIVERED',
      },
      id: delivery.id,
      overrideAccess: true,
      req: transactionRequest,
    })

    const currentApplication = await payload.findByID({
      collection: 'pre-applications',
      depth: 0,
      id: application.id,
      overrideAccess: true,
      req: transactionRequest,
    })

    if (eventType === 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED') {
      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'SYSTEM',
          correlationId: currentApplication.correlationId,
          eventType: 'CANDIDATE_ACCOUNT_ACTIVATION_SENT',
          metadata: { deliveryId: delivery.id, providerMessageId },
          newStatus: currentApplication.status,
          occurredAt: completedAt,
          preApplication: currentApplication.id,
          previousStatus: currentApplication.status,
          workflowVersion: currentApplication.workflowVersion,
        },
        overrideAccess: true,
        req: transactionRequest,
      })
    } else if (eventType === 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED') {
      const offerId = Number(eventPayload(event).employmentOfferId)
      await payload.update({ collection: 'employment-offers', data: { messageDelivery: delivery.id, notificationDeliveredAt: completedAt, notificationStatus: 'DELIVERED' }, id: offerId, overrideAccess: true, req: transactionRequest })
      await payload.create({
        collection: 'audit-events',
        data: { actorType: 'SYSTEM', correlationId: currentApplication.correlationId, eventType: 'EMPLOYMENT_OFFER_NOTIFICATION_SENT', metadata: { deliveryId: delivery.id, employmentOfferId: offerId, providerMessageId }, newStatus: currentApplication.status, occurredAt: completedAt, preApplication: currentApplication.id, previousStatus: currentApplication.status, workflowVersion: currentApplication.workflowVersion },
        overrideAccess: true,
        req: transactionRequest,
      })
    } else if (eventType === 'JOB_SHORTLIST_NOTIFICATION_REQUESTED') {
      const shortlistId = Number(eventPayload(event).candidateJobShortlistId)
      await payload.update({ collection: 'candidate-job-shortlists', data: { messageDelivery: delivery.id, notificationDeliveredAt: completedAt, notificationStatus: 'DELIVERED' }, id: shortlistId, overrideAccess: true, req: transactionRequest })
      await payload.create({ collection: 'audit-events', data: { actorType: 'SYSTEM', correlationId: currentApplication.correlationId, eventType: 'JOB_SHORTLIST_NOTIFICATION_SENT', metadata: { deliveryId: delivery.id, shortlistId, providerMessageId }, newStatus: currentApplication.status, occurredAt: completedAt, preApplication: currentApplication.id, previousStatus: currentApplication.status, workflowVersion: currentApplication.workflowVersion }, overrideAccess: true, req: transactionRequest })
    } else if (eventType === 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED') {
      const flightRequestId = Number(eventPayload(event).flightTicketRequestId)
      const requestVersion = Number(eventPayload(event).requestVersion)
      await payload.update({ collection: 'flight-ticket-requests', data: { messageDelivery: delivery.id, notificationDeliveredAt: completedAt, notificationStatus: 'DELIVERED' }, id: flightRequestId, overrideAccess: true, req: transactionRequest })
      await payload.create({ collection: 'audit-events', data: { actorType: 'SYSTEM', correlationId: currentApplication.correlationId, eventType: 'FLIGHT_TICKET_REQUEST_NOTIFICATION_SENT', metadata: { deliveryId: delivery.id, flightTicketRequestId: flightRequestId, providerMessageId, requestVersion }, newStatus: currentApplication.status, occurredAt: completedAt, preApplication: currentApplication.id, previousStatus: currentApplication.status, workflowVersion: currentApplication.workflowVersion }, overrideAccess: true, req: transactionRequest })
    } else if (eventType === 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED') {
      const flightOfferId = Number(eventPayload(event).flightTicketOfferId)
      const offerVersion = Number(eventPayload(event).offerVersion)
      await payload.update({ collection: 'flight-ticket-offers', data: { messageDelivery: delivery.id, notificationDeliveredAt: completedAt, notificationStatus: 'DELIVERED' }, id: flightOfferId, overrideAccess: true, req: transactionRequest })
      await payload.create({ collection: 'audit-events', data: { actorType: 'SYSTEM', correlationId: currentApplication.correlationId, eventType: 'FLIGHT_TICKET_OFFER_NOTIFICATION_SENT', metadata: { deliveryId: delivery.id, flightTicketOfferId: flightOfferId, offerVersion, providerMessageId }, newStatus: currentApplication.status, occurredAt: completedAt, preApplication: currentApplication.id, previousStatus: currentApplication.status, workflowVersion: currentApplication.workflowVersion }, overrideAccess: true, req: transactionRequest })
    } else if (!isAlreadyAdvanced(currentApplication, eventType)) {
      if (!statuses) throw new Error('Statusi isporuke nisu definisani.')
      if (currentApplication.status !== statuses.from) {
        throw new Error('Status prijave ne dozvoljava završetak ove isporuke.')
      }

      const nextVersion = currentApplication.workflowVersion + 1
      await payload.update({
        collection: 'pre-applications',
        data: { status: statuses.to, workflowVersion: nextVersion },
        id: currentApplication.id,
        overrideAccess: true,
        req: transactionRequest,
      })

      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'SYSTEM',
          correlationId: currentApplication.correlationId,
          eventType:
            eventType === 'MATERIAL_DELIVERY_REQUESTED'
              ? 'MATERIALS_DELIVERED'
              : 'CONSULTATION_INVITATION_DELIVERED',
          metadata: { deliveryId: delivery.id, providerMessageId },
          newStatus: statuses.to,
          occurredAt: completedAt,
          preApplication: currentApplication.id,
          previousStatus: statuses.from,
          workflowVersion: nextVersion,
        },
        overrideAccess: true,
        req: transactionRequest,
      })

      if (eventType === 'MATERIAL_DELIVERY_REQUESTED') {
        const invitationEvent = await payload.create({
          collection: 'outbox-events',
          data: {
            aggregateId: String(currentApplication.id),
            aggregateType: 'PRE_APPLICATION',
            attemptCount: 0,
            availableAt: completedAt,
            eventKey: `pre-application:${currentApplication.id}:consultation-invitation:${nextVersion}`,
            eventType: 'CONSULTATION_INVITATION_REQUESTED',
            occurredAt: completedAt,
            payload: {
              correlationId: currentApplication.correlationId,
              preApplicationId: currentApplication.id,
              programCode: currentApplication.programCode,
            },
            status: 'PENDING',
          },
          overrideAccess: true,
          req: transactionRequest,
        })

        await payload.jobs.queue({
          input: { eventId: invitationEvent.id },
          queue: communicationQueue,
          req: transactionRequest,
          task: 'sendCandidateCommunication',
        })
      }
    }

    await payload.update({
      collection: 'outbox-events',
      data: {
        completedAt,
        lastErrorCode: null,
        status: 'COMPLETED',
      },
      id: event.id,
      overrideAccess: true,
      req: transactionRequest,
    })

    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export const sendCandidateCommunicationTask: TaskConfig<TaskInputOutput> = {
  inputSchema: [{ name: 'eventId', type: 'number', required: true }],
  label: 'Pošalji automatizovanu email poruku',
  outputSchema: [
    { name: 'deliveryId', type: 'number' },
    {
      name: 'status',
      type: 'select',
      options: [{ label: 'Isporučeno', value: 'DELIVERED' }, { label: 'Zastarelo i preskočeno', value: 'SKIPPED' }],
      required: true,
    },
  ],
  retries: { attempts: 3, backoff: { delay: 30_000, type: 'exponential' } },
  slug: 'sendCandidateCommunication',
  async handler({ input, req }) {
    const payload = req.payload
    const event = await payload.findByID({
      collection: 'outbox-events',
      depth: 0,
      id: input.eventId,
      overrideAccess: true,
    })

    if (
      !['CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED', 'CONSULTATION_INVITATION_REQUESTED', 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED', 'JOB_SHORTLIST_NOTIFICATION_REQUESTED', 'MATERIAL_DELIVERY_REQUESTED'].includes(
        event.eventType,
      )
    ) {
      throw new Error('Tip događaja nije podržan za komunikaciju sa kandidatom.')
    }

    const application = await getApplication(payload, event)
    const activationAccount = event.eventType === 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED'
      ? await getActivationAccount(payload, event)
      : undefined
    const employmentRecipient = event.eventType === 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED'
      ? await getEmploymentOfferRecipient(payload, event)
      : undefined
    const shortlistRecipient = event.eventType === 'JOB_SHORTLIST_NOTIFICATION_REQUESTED'
      ? await getJobShortlistRecipient(payload, event)
      : undefined
    const flightRecipient = event.eventType === 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED'
      ? await getFlightTicketRequestRecipient(payload, event)
      : undefined
    const flightOfferRecipient = event.eventType === 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED'
      ? await getFlightTicketOfferRecipient(payload, event)
      : undefined
    if (flightRecipient && flightRecipient.flightRequest.version !== flightRecipient.requestVersion) {
      await completeSupersededEvent(payload, event)
      return { output: { status: 'SKIPPED' } }
    }
    if (flightOfferRecipient && (flightOfferRecipient.flightOffer.status !== 'PUBLISHED' || flightOfferRecipient.flightOffer.offerVersion !== flightOfferRecipient.offerVersion)) {
      await completeSupersededEvent(payload, event)
      return { output: { status: 'SKIPPED' } }
    }
    const prepared = await createOrPrepareDelivery({
      activationAccount,
      application,
      employmentOffer: employmentRecipient?.employmentOffer,
      flightRequest: flightRecipient?.flightRequest,
      flightOffer: flightOfferRecipient?.flightOffer,
      event,
      jobShortlist: shortlistRecipient?.jobShortlist,
      notificationAccount: employmentRecipient?.account ?? shortlistRecipient?.account ?? flightRecipient?.account ?? flightOfferRecipient?.account,
      payload,
    })

    await payload.update({
      collection: 'outbox-events',
      data: {
        attemptCount: event.attemptCount + 1,
        lastErrorCode: null,
        status: 'PROCESSING',
      },
      id: event.id,
      overrideAccess: true,
    })

    try {
      const provider = createCandidateEmailProvider(prepared.environment.candidateCommunication)
      const providerResult =
        prepared.delivery.status === 'DELIVERED'
          ? { messageId: prepared.delivery.providerMessageId ?? event.eventKey }
          : await provider.send({
              idempotencyKey: event.eventKey,
              message: prepared.message,
              recipientEmail: flightRecipient ? prepared.environment.operations.flightRequestNotificationEmail : employmentRecipient?.account.email ?? shortlistRecipient?.account.email ?? flightOfferRecipient?.account.email ?? activationAccount?.email ?? application.submission.email,
            })

      await completeDelivery({
        application,
        delivery: prepared.delivery,
        event,
        payload,
        providerMessageId: providerResult.messageId,
        req,
      })

      return { output: { deliveryId: prepared.delivery.id, status: 'DELIVERED' } }
    } catch (error) {
      const errorCode =
        error instanceof CandidateEmailProviderError ? error.code : 'DELIVERY_FINALIZATION_FAILED'
      await recordFailure({
        application,
        delivery: prepared.delivery,
        errorCode,
        event,
        payload,
      })
      throw new Error('Slanje poruke kandidatu nije uspelo.')
    }
  },
}
