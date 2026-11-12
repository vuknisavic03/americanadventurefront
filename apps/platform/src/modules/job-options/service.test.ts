import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { sendCandidateJobShortlist, updateCandidateJobPreference } from './service.ts'

const application = { campaignCode: 'SWT-2030', correlationId: 'synthetic-jobs-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 9 }
const process = { applicant: 31, candidateAccount: 21, currentStep: 'JOB_PLACEMENT', id: 61, preApplication: 41, processStatus: 'ACTIVE', programCode: 'SWT' }
const opening = {
  availablePositions: 3,
  campaignCode: application.campaignCode,
  candidateInstructions: 'Uporedite uslove sa drugim opcijama.',
  employerName: 'Synthetic Harbor LLC',
  endDate: '2030-09-01T00:00:00.000Z',
  expectedWeeklyHours: 32,
  hourlyWageCents: 1_650,
  housingCostCents: 14_000,
  housingDescription: 'Sintetički smeštaj.',
  housingProvided: true,
  id: 71,
  jobCategory: 'HOSPITALITY',
  jobTitle: 'Guest Services Associate',
  openingCode: 'JOB-SYNTH001',
  programCode: 'SWT',
  revision: 1,
  startDate: '2030-06-01T00:00:00.000Z',
  status: 'OPEN',
  workCity: 'Ocean City',
  workState: 'Maryland',
}

function transaction() {
  return {
    beginTransaction: vi.fn().mockResolvedValue('transaction-1'),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    sessions: { 'transaction-1': { db: { execute: vi.fn() } } },
  }
}

describe('candidate job option service', () => {
  it('sends an immutable shortlist snapshot and queues one candidate notification', async () => {
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'candidate-job-shortlists') return { ...data, id: 81 }
        if (collection === 'candidate-job-options') return { ...data, id: 82 }
        if (collection === 'outbox-events') return { ...data, id: 83 }
        return { ...data, id: 84 }
      }),
      db: transaction(),
      find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'candidate-job-options' || collection === 'candidate-job-shortlists' ? [] : [] })),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        if (collection === 'job-openings') return opening
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      jobs: { queue: vi.fn() },
      update: vi.fn().mockResolvedValue(process),
    } as unknown as Payload

    await expect(sendCandidateJobShortlist({ administratorId: 3, candidateProcessId: process.id, jobOpeningIds: [opening.id], now: new Date('2029-12-01T10:00:00.000Z'), payload })).resolves.toMatchObject({ shortlistId: 81 })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-job-options',
      data: expect.objectContaining({ employerName: opening.employerName, jobOpening: opening.id, status: 'AVAILABLE' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'outbox-events',
      data: expect.objectContaining({ eventType: 'JOB_SHORTLIST_NOTIFICATION_REQUESTED' }),
    }))
    expect(payload.jobs.queue).toHaveBeenCalledTimes(1)
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('lets a candidate reverse an earlier not-interested choice', async () => {
    const option = {
      ...opening,
      candidateAccount: process.candidateAccount,
      candidateProcess: process.id,
      currency: 'USD',
      jobOpening: opening.id,
      openingRevision: opening.revision,
      preApplication: application.id,
      shortlist: 81,
      snapshotChecksum: 'a'.repeat(64),
      status: 'NOT_INTERESTED',
      statusVersion: 2,
    }
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 91 }),
      db: transaction(),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-job-options') return option
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ ...option, status: 'AVAILABLE', statusVersion: 3 }),
    } as unknown as Payload

    await expect(updateCandidateJobPreference({ accountId: process.candidateAccount, action: 'RECONSIDER', candidateJobOptionId: opening.id, expectedStatusVersion: 2, now: new Date('2029-12-02T10:00:00.000Z'), payload })).resolves.toMatchObject({ status: 'AVAILABLE', statusVersion: 3 })
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-job-options',
      data: expect.objectContaining({ status: 'AVAILABLE', statusVersion: 3 }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'JOB_OPTION_PREFERENCE_UPDATED' }),
    }))
  })
})
