import type { Payload, PayloadRequest } from 'payload'

import type { PreApplication, User } from '../../payload-types.ts'
import { readPlatformEnvironment } from '../../config/environment.ts'
import { candidateActivationUrl } from '../candidate-accounts/activationToken.ts'
import { findCandidateAccountForApplication, issueCandidateActivation } from '../candidate-accounts/issueCandidateActivation.ts'
import type { ProcessingCommand } from './processingSchema.ts'
import {
  assertActionAllowed,
  assertConsultationOutcomeAllowed,
  assertDecisionAllowed,
  assertExpectedVersion,
  assertProfileReadinessAllowed,
  deriveContactStatus,
  nextStatus,
  statusAfterConsultationOutcome,
  type PreApplicationStatus,
  WorkflowRuleError,
} from './workflow.ts'

export class ProcessingCommandError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'UNEXPECTED_ERROR',
    message: string,
  ) {
    super(message)
    this.name = 'ProcessingCommandError'
  }
}

type AdminActor = Pick<User, 'id'>

function idOf(value: number | PreApplication | User): number {
  return typeof value === 'number' ? value : value.id
}

async function findApplication(
  payload: Payload,
  id: number,
  req?: { transactionID: number | string },
) {
  const result = await payload.find({
    collection: 'pre-applications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { id: { equals: id } },
  })

  return result.docs[0]
}

async function recordRejectedAction({
  actor,
  application,
  command,
  error,
  now,
  payload,
}: {
  actor: AdminActor
  application?: PreApplication
  command: ProcessingCommand
  error: WorkflowRuleError
  now: Date
  payload: Payload
}) {
  if (!application) return

  try {
    await payload.create({
      collection: 'audit-events',
      data: {
        actor: actor.id,
        actorType: 'ADMIN',
        correlationId: application.correlationId,
        eventType: 'ADMIN_ACTION_REJECTED',
        metadata: {
          action: command.action,
          currentVersion: application.workflowVersion,
          errorCode: error.code,
          expectedVersion: command.expectedVersion,
        },
        occurredAt: now.toISOString(),
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
    })
  } catch (auditError) {
    payload.logger.error({
      err: auditError,
      msg: 'Failed to record rejected pre-application processing action.',
    })
  }
}

export async function processPreApplication({
  actor,
  applicationId,
  command,
  now,
  payload,
  req,
}: {
  actor: AdminActor
  applicationId: number
  command: ProcessingCommand
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) {
    throw new ProcessingCommandError(
      'UNEXPECTED_ERROR',
      'Administrativna obrada trenutno nije dostupna. Pokušajte ponovo.',
    )
  }

  const transactionRequest = { ...req, transactionID }
  let application: PreApplication | undefined

  try {
    application = await findApplication(payload, applicationId, transactionRequest)
    if (!application) {
      throw new ProcessingCommandError('NOT_FOUND', 'Prijava nije pronađena.')
    }

    assertExpectedVersion(application.workflowVersion, command.expectedVersion)
    assertActionAllowed(application.status as PreApplicationStatus, command.action)

    if (command.action === 'MARK_QUALIFIED' || command.action === 'MARK_REJECTED') {
      assertDecisionAllowed({
        action: command.action,
        contactAttemptCount: application.contactAttemptCount,
        rejectionReason:
          command.action === 'MARK_REJECTED' ? command.rejectionReason : undefined,
      })
    }

    if (command.action === 'RECORD_CONSULTATION_OUTCOME') {
      assertConsultationOutcomeAllowed({
        consultationStartsAt: application.consultationStartsAt,
        now,
        outcome: command.outcome,
      })
    }

    if (command.action === 'MARK_READY_FOR_PROFILE') {
      assertProfileReadinessAllowed(application.consultationStatus)
    }

    const recordedAt = now.toISOString()
    const newStatus =
      command.action === 'RECORD_CONSULTATION_OUTCOME'
        ? statusAfterConsultationOutcome(command.outcome)
        : (nextStatus(command.action) ?? (application.status as PreApplicationStatus))
    const nextVersion = application.workflowVersion + 1
    const updateData: Record<string, unknown> = {
      status: newStatus,
      workflowVersion: nextVersion,
    }

    if (command.action === 'START_REVIEW') {
      updateData.reviewStartedAt = recordedAt
      updateData.reviewStartedBy = actor.id
    }

    if (command.action === 'RECORD_CONTACT') {
      await payload.create({
        collection: 'contact-attempts',
        data: {
          actor: actor.id,
          attemptedAt: command.attemptedAt,
          channel: 'PHONE',
          correlationId: application.correlationId,
          nextContactAt: command.nextContactAt,
          note: command.note,
          outcome: command.outcome,
          preApplication: application.id,
        },
        overrideAccess: true,
        req: transactionRequest,
      })

      updateData.contactAttemptCount = application.contactAttemptCount + 1
      updateData.contactStatus = deriveContactStatus(command.outcome)
      updateData.latestContactAt = command.attemptedAt
      updateData.latestContactOutcome = command.outcome
      updateData.nextContactAt = command.nextContactAt ?? null
    }

    if (command.action === 'MARK_QUALIFIED' || command.action === 'MARK_REJECTED') {
      updateData.decidedAt = recordedAt
      updateData.decidedBy = actor.id
      updateData.decisionNote =
        command.action === 'MARK_QUALIFIED' ? command.decisionNote : command.rejectionReason
    }

    if (command.action === 'SCHEDULE_CONSULTATION') {
      updateData.consultationEndsAt = command.endsAt ?? null
      updateData.consultationNotes = null
      updateData.consultationOutcomeRecordedAt = null
      updateData.consultationOutcomeRecordedBy = null
      updateData.consultationProvider = 'manual'
      updateData.consultationProviderEventKey = `manual:${application.id}`
      updateData.consultationScheduledAt = recordedAt
      updateData.consultationScheduledBy = actor.id
      updateData.consultationStartsAt = command.startsAt
      updateData.consultationStatus = 'SCHEDULED'
      updateData.consultationTimeZone = command.timeZone
    }

    if (command.action === 'RECORD_CONSULTATION_OUTCOME') {
      updateData.consultationNotes = command.notes
      updateData.consultationOutcomeRecordedAt = recordedAt
      updateData.consultationOutcomeRecordedBy = actor.id
      updateData.consultationStatus = command.outcome
    }

    if (command.action === 'MARK_READY_FOR_PROFILE') {
      updateData.profileReadinessApprovedAt = recordedAt
      updateData.profileReadinessApprovedBy = actor.id
      updateData.profileReadinessNote = command.approvalNote ?? null
    }

    const updateResult = await payload.update({
      collection: 'pre-applications',
      data: updateData,
      depth: 0,
      overrideAccess: true,
      req: transactionRequest,
      where: {
        and: [
          { id: { equals: application.id } },
          { workflowVersion: { equals: command.expectedVersion } },
        ],
      },
    })

    const updatedApplication = updateResult.docs[0]
    if (!updatedApplication) {
      throw new WorkflowRuleError(
        'VERSION_CONFLICT',
        'Prijavu je u međuvremenu izmenio drugi administrator. Osvežite stranicu i pokušajte ponovo.',
      )
    }

    const eventType = {
      MARK_QUALIFIED: 'APPLICANT_QUALIFIED',
      MARK_REJECTED: 'APPLICANT_REJECTED',
      MARK_READY_FOR_PROFILE: 'PROFILE_READINESS_APPROVED',
      RECORD_CONTACT: 'CONTACT_ATTEMPT_RECORDED',
      RECORD_CONSULTATION_OUTCOME:
        command.action === 'RECORD_CONSULTATION_OUTCOME' && command.outcome === 'ATTENDED'
          ? 'CONSULTATION_COMPLETED'
          : command.action === 'RECORD_CONSULTATION_OUTCOME' && command.outcome === 'NO_SHOW'
            ? 'CONSULTATION_NO_SHOW'
            : 'CONSULTATION_CANCELLED',
      SCHEDULE_CONSULTATION:
        application.status === 'CONSULTATION_SCHEDULED'
          ? 'CONSULTATION_RESCHEDULED'
          : 'CONSULTATION_SCHEDULED',
      START_REVIEW: 'REVIEW_STARTED',
      ISSUE_PROFILE_ACTIVATION: 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
    }[command.action] as
      | 'APPLICANT_QUALIFIED'
      | 'APPLICANT_REJECTED'
      | 'CONSULTATION_CANCELLED'
      | 'CONSULTATION_COMPLETED'
      | 'CONSULTATION_NO_SHOW'
      | 'CONSULTATION_RESCHEDULED'
      | 'CONSULTATION_SCHEDULED'
      | 'CONTACT_ATTEMPT_RECORDED'
      | 'PROFILE_READINESS_APPROVED'
      | 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED'
      | 'REVIEW_STARTED'

    await payload.create({
      collection: 'audit-events',
      data: {
        actor: actor.id,
        actorType: 'ADMIN',
        correlationId: application.correlationId,
        eventType,
        metadata: {
          action: command.action,
          ...(command.action === 'RECORD_CONTACT' ? { outcome: command.outcome } : {}),
          ...(command.action === 'RECORD_CONSULTATION_OUTCOME'
            ? { outcome: command.outcome }
            : {}),
        },
        newStatus,
        occurredAt: recordedAt,
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: nextVersion,
      },
      overrideAccess: true,
      req: transactionRequest,
    })

    if (command.action === 'ISSUE_PROFILE_ACTIVATION') {
      try {
        await issueCandidateActivation({ actor, application: updatedApplication, now, payload, req: transactionRequest })
      } catch (error) {
        if (error instanceof Error && error.message === 'CANDIDATE_ACCOUNT_ALREADY_ACTIVE') {
          throw new WorkflowRuleError('CANDIDATE_ACCOUNT_ALREADY_ACTIVE', 'Kandidatski nalog je već aktivan.')
        }
        if (error instanceof Error && error.message === 'CANDIDATE_ACCOUNT_SUSPENDED') {
          throw new WorkflowRuleError('CANDIDATE_ACCOUNT_SUSPENDED', 'Suspendovan nalog se ne može ponovo aktivirati bez posebne administrativne odluke.')
        }
        throw error
      }
    }

    if (command.action === 'MARK_QUALIFIED') {
      const deliveryEvent = await payload.create({
        collection: 'outbox-events',
        data: {
          aggregateId: String(application.id),
          aggregateType: 'PRE_APPLICATION',
          attemptCount: 0,
          availableAt: recordedAt,
          eventKey: `pre-application:${application.id}:material-delivery:${nextVersion}`,
          eventType: 'MATERIAL_DELIVERY_REQUESTED',
          occurredAt: recordedAt,
          payload: {
            campaignCode: application.campaignCode,
            correlationId: application.correlationId,
            preApplicationId: application.id,
            programCode: application.programCode,
          },
          status: 'PENDING',
        },
        overrideAccess: true,
        req: transactionRequest,
      })

      await payload.jobs.queue({
        input: { eventId: deliveryEvent.id },
        queue: 'candidate-communications',
        req: transactionRequest,
        task: 'sendCandidateCommunication',
      })
    }

    await payload.db.commitTransaction(transactionID)
    return updatedApplication
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)

    if (error instanceof WorkflowRuleError) {
      const auditApplication =
        error.code === 'VERSION_CONFLICT'
          ? await findApplication(payload, applicationId)
          : application
      await recordRejectedAction({ actor, application: auditApplication, command, error, now, payload })
    }

    throw error
  }
}

export async function getPreApplicationProcessingState({
  applicationId,
  payload,
}: {
  applicationId: number
  payload: Payload
}) {
  const application = await findApplication(payload, applicationId)
  if (!application) {
    throw new ProcessingCommandError('NOT_FOUND', 'Prijava nije pronađena.')
  }

  const contactAttempts = await payload.find({
    collection: 'contact-attempts',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: '-attemptedAt',
    where: { preApplication: { equals: application.id } },
  })

  const deliveries = await payload.find({
    collection: 'message-deliveries',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
    where: { preApplication: { equals: application.id } },
  })

  const candidateAccount = await findCandidateAccountForApplication(payload, application.id)
  const environment = readPlatformEnvironment()
  const activationUrl =
    environment.candidateCommunication.provider === 'capture' &&
    candidateAccount?.accountStatus === 'PENDING_ACTIVATION' &&
    candidateAccount.activationExpiresAt &&
    candidateAccount.activationNonce
      ? candidateActivationUrl({
          accountId: candidateAccount.id,
          expiresAt: new Date(candidateAccount.activationExpiresAt).getTime(),
          nonce: candidateAccount.activationNonce,
          secret: environment.payloadSecret,
          serverUrl: environment.serverUrl,
          version: candidateAccount.activationVersion,
        })
      : undefined

  return {
    application: {
      contactAttemptCount: application.contactAttemptCount,
      contactStatus: application.contactStatus,
      consultationEndsAt: application.consultationEndsAt,
      consultationNotes: application.consultationNotes,
      consultationProvider: application.consultationProvider,
      consultationStartsAt: application.consultationStartsAt,
      consultationStatus: application.consultationStatus,
      consultationTimeZone: application.consultationTimeZone,
      correlationId: application.correlationId,
      latestContactAt: application.latestContactAt,
      latestContactOutcome: application.latestContactOutcome,
      nextContactAt: application.nextContactAt,
      profileReadinessApprovedAt: application.profileReadinessApprovedAt,
      profileReadinessNote: application.profileReadinessNote,
      status: application.status,
      workflowVersion: application.workflowVersion,
    },
    contactAttempts: contactAttempts.docs.map((attempt) => ({
      actor:
        typeof attempt.actor === 'object' && attempt.actor
          ? attempt.actor.displayName
          : `Administrator #${idOf(attempt.actor)}`,
      attemptedAt: attempt.attemptedAt,
      id: attempt.id,
      nextContactAt: attempt.nextContactAt,
      note: attempt.note,
      outcome: attempt.outcome,
    })),
    candidateAccount: candidateAccount
      ? {
          activationExpiresAt: candidateAccount.activationExpiresAt,
          activationIssuedAt: candidateAccount.activationIssuedAt,
          activationUrl,
          email: candidateAccount.email,
          id: candidateAccount.id,
          status: candidateAccount.accountStatus,
          verifiedAt: candidateAccount.verifiedAt,
        }
      : undefined,
    deliveries: deliveries.docs.map((delivery) => ({
      attemptCount: delivery.attemptCount,
      category: delivery.category,
      deliveredAt: delivery.deliveredAt,
      id: delivery.id,
      lastAttemptAt: delivery.lastAttemptAt,
      lastErrorCode: delivery.lastErrorCode,
      status: delivery.status,
      templateVersion: delivery.templateVersion,
    })),
  }
}

