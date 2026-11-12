import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { CandidateProfileUpdateError, updateCandidateProfile } from './updateCandidateProfile.ts'

describe('candidate profile update', () => {
  it('updates only the allowed identity fields and records an audit event transactionally', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 44 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(9),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn().mockResolvedValue({
        docs: [{ currentStep: 'PROFILE_SETUP', id: 31, processStatus: 'ACTIVE' }],
      }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          _verified: true,
          accountStatus: 'ACTIVE',
          applicant: 7,
          id: 21,
          preApplication: 12,
        })
        .mockResolvedValueOnce({
          correlationId: 'application-reference',
          id: 12,
          status: 'READY_FOR_PROFILE',
          workflowVersion: 8,
        })
        .mockResolvedValueOnce({
          phone: '+381 60 000 000',
          residentialAddress: 'Stara adresa 1',
        }),
      update: vi.fn().mockResolvedValue({ id: 7 }),
    } as unknown as Payload

    await updateCandidateProfile({
      accountId: 21,
      data: {
        citizenship: 'Republika Srbija',
        phone: '+381 64 123 456',
        residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
      },
      now: new Date('2026-08-29T16:00:00.000Z'),
      payload,
    })

    expect(payload.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'applicants',
      data: {
        phone: '+381 64 123 456',
        phoneNormalized: '+38164123456',
        residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
      },
    }))
    expect(payload.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'candidate-accounts',
      data: { citizenship: 'Republika Srbija' },
    }))
    expect(payload.update).toHaveBeenNthCalledWith(3, expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'CONTRACT_AND_PAYMENT_PLAN' }),
      id: 31,
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'CANDIDATE_PROFILE_UPDATED' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({
        eventType: 'CANDIDATE_PROCESS_UPDATED',
        metadata: expect.objectContaining({ reason: 'PROFILE_CONFIRMED' }),
      }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(9)
  })

  it('advances a valid unchanged profile while avoiding redundant identity writes', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 45 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(10),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn().mockResolvedValue({
        docs: [{ currentStep: 'PROFILE_SETUP', id: 32, processStatus: 'ACTIVE' }],
      }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          _verified: true,
          accountStatus: 'ACTIVE',
          applicant: 7,
          citizenship: 'Republika Srbija',
          id: 21,
          preApplication: 12,
        })
        .mockResolvedValueOnce({
          correlationId: 'application-reference',
          id: 12,
          status: 'READY_FOR_PROFILE',
          workflowVersion: 8,
        })
        .mockResolvedValueOnce({
          phone: '+381 64 123 456',
          residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
        }),
      update: vi.fn().mockResolvedValue({ id: 32 }),
    } as unknown as Payload

    const result = await updateCandidateProfile({
      accountId: 21,
      data: {
        citizenship: 'Republika Srbija',
        phone: '+381 64 123 456',
        residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
      },
      now: new Date('2026-09-16T10:30:00.000Z'),
      payload,
    })

    expect(result).toEqual({ advanced: true, changedFields: [] })
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'CONTRACT_AND_PAYMENT_PLAN' }),
    }))
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ eventType: 'CANDIDATE_PROCESS_UPDATED' }),
    }))
  })

  it('does not move a process that has already advanced', async () => {
    const payload = {
      create: vi.fn(),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(11),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn().mockResolvedValue({
        docs: [{ currentStep: 'INITIAL_PAYMENT', id: 33, processStatus: 'ACTIVE' }],
      }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          _verified: true,
          accountStatus: 'ACTIVE',
          applicant: 7,
          citizenship: 'Republika Srbija',
          id: 21,
          preApplication: 12,
        })
        .mockResolvedValueOnce({
          correlationId: 'application-reference',
          id: 12,
          status: 'READY_FOR_PROFILE',
          workflowVersion: 8,
        })
        .mockResolvedValueOnce({
          phone: '+381 64 123 456',
          residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
        }),
      update: vi.fn(),
    } as unknown as Payload

    const result = await updateCandidateProfile({
      accountId: 21,
      data: {
        citizenship: 'Republika Srbija',
        phone: '+381 64 123 456',
        residentialAddress: 'Bulevar oslobođenja 10, Novi Sad',
      },
      now: new Date('2026-09-16T10:30:00.000Z'),
      payload,
    })

    expect(result).toEqual({ advanced: false, changedFields: [] })
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects a pending account before starting a transaction', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({ _verified: false, accountStatus: 'PENDING_ACTIVATION' }),
    } as unknown as Payload

    await expect(updateCandidateProfile({
      accountId: 21,
      data: { citizenship: 'Srbija', phone: '+38164123456', residentialAddress: 'Adresa 1' },
      now: new Date(),
      payload,
    })).rejects.toBeInstanceOf(CandidateProfileUpdateError)
  })
})
