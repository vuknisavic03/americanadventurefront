import type { Payload, PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import type { PreApplication } from '../../payload-types.ts'
import { issueCandidateActivation } from './issueCandidateActivation.ts'

const application = {
  applicant: 7,
  correlationId: 'application-reference',
  id: 12,
  programCode: 'SWT',
  submission: { email: 'Candidate@Example.com', firstName: 'Petar', lastName: 'Petrović' },
} as PreApplication

describe('administrator-issued candidate activation', () => {
  it('creates a pending account and queues its activation message transactionally', async () => {
    const payload = {
      create: vi
        .fn()
        .mockResolvedValueOnce({ applicant: 7, id: 21 })
        .mockResolvedValueOnce({ id: 25 })
        .mockResolvedValueOnce({ id: 31 }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
      jobs: { queue: vi.fn().mockResolvedValue({ id: 41 }) },
    } as unknown as Payload
    const req = { transactionID: 5 } as PayloadRequest

    const account = await issueCandidateActivation({
      actor: { id: 3 },
      application,
      now: new Date('2026-08-29T12:00:00.000Z'),
      payload,
      req,
    })

    expect(account.id).toBe(21)
    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'candidate-accounts',
      data: expect.objectContaining({
        accountStatus: 'PENDING_ACTIVATION',
        email: 'candidate@example.com',
        preApplication: 12,
      }),
      disableVerificationEmail: true,
      req,
    }))
    expect(payload.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({
        candidateAccount: 21,
        currentStep: 'PROFILE_SETUP',
        preApplication: 12,
      }),
      req,
    }))
    expect(payload.create).toHaveBeenNthCalledWith(3, expect.objectContaining({
      collection: 'outbox-events',
      data: expect.objectContaining({ eventType: 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED' }),
      req,
    }))
    expect(payload.jobs.queue).toHaveBeenCalledWith(expect.objectContaining({ req }))
  })

  it('does not issue another invitation for an active account', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ _verified: true, accountStatus: 'ACTIVE' }] }),
    } as unknown as Payload

    await expect(issueCandidateActivation({
      actor: { id: 3 },
      application,
      now: new Date(),
      payload,
      req: {} as PayloadRequest,
    })).rejects.toThrow('CANDIDATE_ACCOUNT_ALREADY_ACTIVE')
  })
})
