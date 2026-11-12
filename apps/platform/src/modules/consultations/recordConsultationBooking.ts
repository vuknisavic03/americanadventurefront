import type { Payload } from 'payload'

import type { PreApplication } from '../../payload-types.ts'
import type { ConsultationBookingEvent } from './bookingWebhook.ts'

export class ConsultationBookingError extends Error {
  constructor(
    public readonly code: 'EVENT_CONFLICT' | 'INVALID_TRANSITION' | 'NOT_FOUND' | 'VERSION_CONFLICT',
    message: string,
  ) {
    super(message)
    this.name = 'ConsultationBookingError'
  }
}

function providerEventKey(event: ConsultationBookingEvent) {
  return `${event.provider}:${event.eventId}`
}

function isDuplicate(application: PreApplication, event: ConsultationBookingEvent) {
  if (application.consultationProviderEventKey !== providerEventKey(event)) return false

  if (event.action === 'CANCELLED') {
    return application.consultationStatus === 'CANCELLED'
  }

  return (
    application.consultationStatus === 'SCHEDULED' &&
    application.consultationStartsAt === event.startsAt &&
    (application.consultationEndsAt ?? undefined) === event.endsAt &&
    application.consultationTimeZone === event.timeZone
  )
}

async function findApplication(payload: Payload, correlationId: string) {
  const result = await payload.find({
    collection: 'pre-applications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { correlationId: { equals: correlationId } },
  })
  return result.docs[0]
}

export async function recordConsultationBooking({
  event,
  now,
  payload,
}: {
  event: ConsultationBookingEvent
  now: Date
  payload: Payload
}) {
  const application = await findApplication(payload, event.correlationId)
  if (!application) {
    throw new ConsultationBookingError('NOT_FOUND', 'Prijava nije pronađena.')
  }

  if (isDuplicate(application, event)) {
    return { applicationId: application.id, recorded: false as const }
  }

  const key = providerEventKey(event)
  const keyOwner = await payload.find({
    collection: 'pre-applications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { consultationProviderEventKey: { equals: key } },
  })
  if (keyOwner.docs[0] && keyOwner.docs[0].id !== application.id) {
    throw new ConsultationBookingError(
      'EVENT_CONFLICT',
      'Događaj zakazivanja je već povezan sa drugom prijavom.',
    )
  }

  const isBooking = event.action === 'BOOKED'
  const allowed = isBooking
    ? ['CONSULTATION_INVITED', 'CONSULTATION_SCHEDULED'].includes(application.status)
    : application.status === 'CONSULTATION_SCHEDULED' &&
      application.consultationProviderEventKey === key

  if (!allowed) {
    throw new ConsultationBookingError(
      'INVALID_TRANSITION',
      'Trenutni status prijave ne dozvoljava ovu promenu konsultacija.',
    )
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Nije moguće započeti transakciju konsultacija.')
  const req = { transactionID }
  const recordedAt = now.toISOString()
  const nextVersion = application.workflowVersion + 1
  const wasScheduled = application.status === 'CONSULTATION_SCHEDULED'

  try {
    const updateResult = await payload.update({
      collection: 'pre-applications',
      data: isBooking
        ? {
            consultationEndsAt: event.endsAt ?? null,
            consultationNotes: null,
            consultationOutcomeRecordedAt: null,
            consultationOutcomeRecordedBy: null,
            consultationProvider: event.provider,
            consultationProviderEventKey: key,
            consultationScheduledAt: recordedAt,
            consultationScheduledBy: null,
            consultationStartsAt: event.startsAt,
            consultationStatus: 'SCHEDULED',
            consultationTimeZone: event.timeZone,
            status: 'CONSULTATION_SCHEDULED',
            workflowVersion: nextVersion,
          }
        : {
            consultationOutcomeRecordedAt: recordedAt,
            consultationOutcomeRecordedBy: null,
            consultationStatus: 'CANCELLED',
            status: 'CONSULTATION_INVITED',
            workflowVersion: nextVersion,
          },
      depth: 0,
      overrideAccess: true,
      req,
      where: {
        and: [
          { id: { equals: application.id } },
          { workflowVersion: { equals: application.workflowVersion } },
        ],
      },
    })

    if (!updateResult.docs[0]) {
      throw new ConsultationBookingError(
        'VERSION_CONFLICT',
        'Prijava je u međuvremenu izmenjena. Događaj treba ponoviti.',
      )
    }

    const newStatus = isBooking ? 'CONSULTATION_SCHEDULED' : 'CONSULTATION_INVITED'
    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'SYSTEM',
        correlationId: application.correlationId,
        eventType: isBooking
          ? wasScheduled
            ? 'CONSULTATION_RESCHEDULED'
            : 'CONSULTATION_SCHEDULED'
          : 'CONSULTATION_CANCELLED',
        metadata: {
          externalEventId: event.eventId,
          provider: event.provider,
          source: 'WEBHOOK',
        },
        newStatus,
        occurredAt: recordedAt,
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: nextVersion,
      },
      overrideAccess: true,
      req,
    })

    await payload.db.commitTransaction(transactionID)
    return { applicationId: application.id, recorded: true as const }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

