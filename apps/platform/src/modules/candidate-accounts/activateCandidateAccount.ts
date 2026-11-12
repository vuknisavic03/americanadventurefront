import { randomBytes } from 'node:crypto'
import type { Payload } from 'payload'

import { readPlatformEnvironment } from '../../config/environment.ts'
import { readCandidateActivationToken } from './activationToken.ts'

export class CandidateActivationError extends Error {
  constructor() {
    super('Aktivacioni link nije ispravan ili je istekao.')
    this.name = 'CandidateActivationError'
  }
}

export async function activateCandidateAccount({
  citizenship,
  now,
  password,
  payload,
  token,
}: {
  citizenship: string
  now: Date
  password: string
  payload: Payload
  token: string
}) {
  const environment = readPlatformEnvironment()
  const tokenData = readCandidateActivationToken(token, environment.payloadSecret)
  if (!tokenData || tokenData.expiresAt <= now.getTime()) throw new CandidateActivationError()

  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: tokenData.accountId,
    overrideAccess: true,
  }).catch(() => undefined)

  if (
    !account ||
    account.accountStatus !== 'PENDING_ACTIVATION' ||
    account.activationVersion !== tokenData.version ||
    account.activationNonce !== tokenData.nonce ||
    !account.activationExpiresAt ||
    new Date(account.activationExpiresAt).getTime() !== tokenData.expiresAt ||
    new Date(account.activationExpiresAt).getTime() <= now.getTime()
  ) {
    throw new CandidateActivationError()
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Candidate activation requires a database transaction.')
  const transactionRequest = { transactionID }
  const activatedAt = now.toISOString()

  try {
    const updated = await payload.update({
      collection: 'candidate-accounts',
      data: {
        accountStatus: 'ACTIVE',
        activationExpiresAt: null,
        activationNonce: randomBytes(24).toString('base64url'),
        activationVersion: tokenData.version + 1,
        citizenship: citizenship.trim(),
        password,
        verifiedAt: activatedAt,
        _verified: true,
      },
      id: account.id,
      overrideAccess: true,
      req: transactionRequest,
    })

    const applicationId = typeof account.preApplication === 'object'
      ? account.preApplication.id
      : account.preApplication
    const application = await payload.findByID({
      collection: 'pre-applications',
      depth: 0,
      id: applicationId,
      overrideAccess: true,
      req: transactionRequest,
    })

    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT',
        correlationId: application.correlationId,
        eventType: 'CANDIDATE_ACCOUNT_ACTIVATED',
        metadata: { candidateAccountId: account.id },
        newStatus: application.status,
        occurredAt: activatedAt,
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req: transactionRequest,
    })

    await payload.db.commitTransaction(transactionID)
    return updated
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

