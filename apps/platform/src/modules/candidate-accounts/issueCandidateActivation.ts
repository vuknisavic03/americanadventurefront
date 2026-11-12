import { randomBytes } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

import type { CandidateAccount, PreApplication, User } from '../../payload-types.ts'
import { ensureCandidateProcess } from '../candidate-processes/ensureCandidateProcess.ts'

export const CANDIDATE_ACTIVATION_LIFETIME_MS = 48 * 60 * 60 * 1_000

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

export async function findCandidateAccountForApplication(
  payload: Payload,
  preApplicationId: number,
  req?: PayloadRequest,
) {
  const result = await payload.find({
    collection: 'candidate-accounts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { preApplication: { equals: preApplicationId } },
  })
  return result.docs[0]
}

export async function issueCandidateActivation({
  actor,
  application,
  now,
  payload,
  req,
}: {
  actor: Pick<User, 'id'>
  application: PreApplication
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  const existing = await findCandidateAccountForApplication(payload, application.id, req)
  if (existing?.accountStatus === 'ACTIVE' || existing?._verified) {
    throw new Error('CANDIDATE_ACCOUNT_ALREADY_ACTIVE')
  }
  if (existing?.accountStatus === 'SUSPENDED') {
    throw new Error('CANDIDATE_ACCOUNT_SUSPENDED')
  }

  const activationVersion = (existing?.activationVersion ?? 0) + 1
  const activationIssuedAt = now.toISOString()
  const activationExpiresAt = new Date(now.getTime() + CANDIDATE_ACTIVATION_LIFETIME_MS).toISOString()
  const activationNonce = randomBytes(24).toString('base64url')
  let account: CandidateAccount

  if (existing) {
    account = await payload.update({
      collection: 'candidate-accounts',
      data: {
        accountStatus: 'PENDING_ACTIVATION',
        activationExpiresAt,
        activationIssuedAt,
        activationIssuedBy: actor.id,
        activationNonce,
        activationVersion,
        _verified: false,
      },
      id: existing.id,
      overrideAccess: true,
      req,
    })
  } else {
    const applicantId = relationId(application.applicant)
    account = await payload.create({
      collection: 'candidate-accounts',
      data: {
        accountStatus: 'PENDING_ACTIVATION',
        activationExpiresAt,
        activationIssuedAt,
        activationIssuedBy: actor.id,
        activationNonce,
        activationVersion,
        applicant: applicantId,
        email: application.submission.email.trim().toLowerCase(),
        fullName: `${application.submission.firstName} ${application.submission.lastName}`.trim(),
        password: randomBytes(48).toString('base64url'),
        preApplication: application.id,
        programCode: application.programCode,
        _verified: false,
      },
      disableVerificationEmail: true,
      overrideAccess: true,
      req,
    })
  }

  await ensureCandidateProcess({ account, application, now, payload, req })

  const event = await payload.create({
    collection: 'outbox-events',
    data: {
      aggregateId: String(application.id),
      aggregateType: 'PRE_APPLICATION',
      attemptCount: 0,
      availableAt: activationIssuedAt,
      eventKey: `pre-application:${application.id}:candidate-activation:${activationVersion}`,
      eventType: 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
      occurredAt: activationIssuedAt,
      payload: {
        activationVersion,
        candidateAccountId: account.id,
        correlationId: application.correlationId,
        preApplicationId: application.id,
      },
      status: 'PENDING',
    },
    overrideAccess: true,
    req,
  })

  await payload.jobs.queue({
    input: { eventId: event.id },
    queue: 'candidate-communications',
    req,
    task: 'sendCandidateCommunication',
  })

  return account
}
