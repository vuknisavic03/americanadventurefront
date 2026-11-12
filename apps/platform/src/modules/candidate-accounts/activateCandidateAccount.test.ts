import type { Payload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { activateCandidateAccount, CandidateActivationError } from './activateCandidateAccount.ts'
import { createCandidateActivationToken } from './activationToken.ts'

const secret = 'test-secret-that-is-long-enough-for-signing'
const now = new Date('2026-08-29T12:00:00.000Z')
const tokenData = {
  accountId: 21,
  expiresAt: now.getTime() + 60_000,
  nonce: 'secure-activation-nonce',
  version: 2,
}

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://unused')
  vi.stubEnv('PAYLOAD_SECRET', secret)
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3000')
})

afterEach(() => vi.unstubAllEnvs())

function payloadMock() {
  return {
    create: vi.fn().mockResolvedValue({ id: 99 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(7),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    findByID: vi
      .fn()
      .mockResolvedValueOnce({
        _verified: false,
        accountStatus: 'PENDING_ACTIVATION',
        activationExpiresAt: new Date(tokenData.expiresAt).toISOString(),
        activationNonce: tokenData.nonce,
        activationVersion: tokenData.version,
        id: tokenData.accountId,
        preApplication: 12,
      })
      .mockResolvedValueOnce({
        correlationId: 'reference',
        id: 12,
        status: 'READY_FOR_PROFILE',
        workflowVersion: 9,
      }),
    update: vi.fn().mockResolvedValue({ id: tokenData.accountId }),
  } as unknown as Payload
}

describe('candidate account activation', () => {
  it('activates a pending account and consumes the invitation in one transaction', async () => {
    const payload = payloadMock()
    const token = createCandidateActivationToken(tokenData, secret)

    await activateCandidateAccount({
      citizenship: 'Republika Srbija',
      now,
      password: 'sigurna lozinka 2026',
      payload,
      token,
    })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accountStatus: 'ACTIVE', _verified: true }),
      id: tokenData.accountId,
      req: { transactionID: 7 },
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'CANDIDATE_ACCOUNT_ACTIVATED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(7)
  })

  it('rejects an expired token before reading the database', async () => {
    const payload = payloadMock()
    const token = createCandidateActivationToken({ ...tokenData, expiresAt: now.getTime() - 1 }, secret)

    await expect(activateCandidateAccount({
      citizenship: 'Republika Srbija',
      now,
      password: 'sigurna lozinka 2026',
      payload,
      token,
    })).rejects.toBeInstanceOf(CandidateActivationError)
    expect(payload.findByID).not.toHaveBeenCalled()
  })
})

