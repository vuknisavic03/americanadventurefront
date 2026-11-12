import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { acceptEmploymentOffer, confirmCandidateJobOption, EmploymentOfferError } from './service.ts'

const application = { campaignCode: 'SWT-2030', correlationId: 'synthetic-employment-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 8 }
const process = { applicant: 31, candidateAccount: 21, currentStep: 'JOB_PLACEMENT', id: 61, preApplication: 41, processStatus: 'ACTIVE', programCode: 'SWT' }
const option = {
  candidateAccount: process.candidateAccount,
  candidateInstructions: 'Pročitajte uslove i iskažite interesovanje.',
  candidateProcess: process.id,
  currency: 'USD',
  employerName: 'Synthetic Harbor LLC',
  endDate: '2030-09-01T12:00:00.000Z',
  expectedWeeklyHours: 32,
  hourlyWageCents: 1_650,
  housingCostCents: 14_000,
  housingDescription: 'Sintetički smeštaj za testiranje.',
  housingProvided: true,
  id: 51,
  jobOpening: 71,
  jobCategory: 'HOSPITALITY',
  jobTitle: 'Synthetic Guest Services Associate',
  openingCode: 'JOB-SYNTH001',
  openingRevision: 1,
  preApplication: application.id,
  shortlist: 50,
  snapshotChecksum: 'b'.repeat(64),
  startDate: '2030-06-01T12:00:00.000Z',
  status: 'INTERESTED',
  statusVersion: 2,
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

function publishedOffer() {
  return {
    candidateAccount: process.candidateAccount,
    candidateInstructions: option.candidateInstructions,
    candidateJobOption: option.id,
    candidateProcess: process.id,
    currency: 'USD',
    employerName: option.employerName,
    endDate: option.endDate,
    expectedWeeklyHours: option.expectedWeeklyHours,
    hourlyWageCents: option.hourlyWageCents,
    housingCostCents: option.housingCostCents,
    housingDescription: option.housingDescription,
    housingProvided: option.housingProvided,
    id: 71,
    jobTitle: option.jobTitle,
    notificationStatus: 'PENDING',
    offerVersion: 1,
    publishedAt: '2029-12-01T10:00:00.000Z',
    snapshotChecksum: 'a'.repeat(64),
    startDate: option.startDate,
    status: 'PUBLISHED',
    statusVersion: 1,
    workCity: option.workCity,
    workState: option.workState,
  }
}

describe('employment offer service', () => {
  it('turns an interested option into an immutable final offer atomically', async () => {
    const offer = publishedOffer()
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'employment-offers') return offer
        if (collection === 'outbox-events') return { id: 81 }
        return { id: 91 }
      }),
      db: transaction(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return process
        if (collection === 'candidate-job-options') return option
        if (collection === 'pre-applications') return application
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      jobs: { queue: vi.fn() },
      update: vi.fn().mockResolvedValue(process),
    } as unknown as Payload

    await expect(confirmCandidateJobOption({
      administratorId: 3,
      candidateJobOptionId: option.id,
      candidateProcessId: process.id,
      expectedStatusVersion: option.statusVersion,
      now: new Date('2029-12-01T10:00:00.000Z'),
      payload,
    })).resolves.toMatchObject({ employerName: option.employerName, offerVersion: 1, status: 'PUBLISHED' })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'employment-offers',
      data: expect.objectContaining({ candidateJobOption: option.id, employerName: option.employerName }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-job-options',
      data: expect.objectContaining({ status: 'EMPLOYER_CONFIRMED' }),
    }))
    expect(payload.jobs.queue).toHaveBeenCalledWith(expect.objectContaining({ task: 'sendCandidateCommunication' }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('does not confirm an option after the process has moved past job placement', async () => {
    const payload = {
      create: vi.fn(),
      db: transaction(),
      findByID: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-processes' ? { ...process, currentStep: 'VISA' } : option),
      jobs: { queue: vi.fn() },
      update: vi.fn(),
    } as unknown as Payload

    const error = await confirmCandidateJobOption({ administratorId: 3, candidateJobOptionId: option.id, candidateProcessId: process.id, expectedStatusVersion: option.statusVersion, now: new Date('2029-12-01T10:00:00.000Z'), payload }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(EmploymentOfferError)
    expect(error).toMatchObject({ status: 403 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('records acceptance evidence, selects one option, and advances the owning candidate to visa', async () => {
    const offer = publishedOffer()
    const acceptance = { acceptanceReference: 'AA-JO-SYNTHETIC000001', acceptedAt: '2030-01-10T10:00:00.000Z', employmentOffer: offer.id, id: 101 }
    const opening = { availablePositions: 3, id: option.jobOpening, status: 'OPEN' }
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => collection === 'employment-offer-acceptances' ? acceptance : { id: 102 }),
      db: transaction(),
      find: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-job-options' ? { docs: [option] } : { docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'employment-offers') return offer
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        if (collection === 'candidate-job-options') return option
        if (collection === 'job-openings') return opening
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
    } as unknown as Payload

    await expect(acceptEmploymentOffer({
      accountId: process.candidateAccount,
      employmentOfferId: offer.id,
      expectedSnapshotChecksum: offer.snapshotChecksum,
      now: new Date(acceptance.acceptedAt),
      payload,
    })).resolves.toMatchObject({ acceptance: { id: acceptance.id }, created: true })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'employment-offer-acceptances',
      data: expect.objectContaining({ offerSnapshotChecksum: offer.snapshotChecksum }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'job-openings',
      data: expect.objectContaining({ availablePositions: 2, status: 'OPEN' }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-job-options',
      data: expect.objectContaining({ status: 'SELECTED' }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'VISA' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('closes a catalog position when its final known place is accepted', async () => {
    const offer = publishedOffer()
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => collection === 'employment-offer-acceptances' ? { employmentOffer: offer.id, id: 101 } : { id: 102 }),
      db: transaction(),
      find: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-job-options' ? { docs: [option] } : { docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'employment-offers') return offer
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        if (collection === 'candidate-job-options') return option
        if (collection === 'job-openings') return { availablePositions: 1, id: option.jobOpening, status: 'OPEN' }
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
    } as unknown as Payload

    await acceptEmploymentOffer({ accountId: process.candidateAccount, employmentOfferId: offer.id, expectedSnapshotChecksum: offer.snapshotChecksum, now: new Date('2030-01-10T10:00:00.000Z'), payload })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'job-openings',
      data: expect.objectContaining({ availablePositions: 0, status: 'CLOSED' }),
    }))
  })

  it('does not consume capacity again when acceptance is repeated', async () => {
    const offer = publishedOffer()
    const existing = { employmentOffer: offer.id, id: 101 }
    const payload = {
      db: transaction(),
      find: vi.fn().mockResolvedValue({ docs: [existing] }),
      findByID: vi.fn().mockResolvedValue(offer),
      update: vi.fn(),
    } as unknown as Payload

    await expect(acceptEmploymentOffer({ accountId: process.candidateAccount, employmentOfferId: offer.id, expectedSnapshotChecksum: offer.snapshotChecksum, now: new Date('2030-01-10T10:00:00.000Z'), payload })).resolves.toEqual({ acceptance: existing, created: false })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rejects acceptance when the catalog position has no place left', async () => {
    const offer = publishedOffer()
    const payload = {
      create: vi.fn(),
      db: transaction(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'employment-offers') return offer
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        if (collection === 'candidate-job-options') return option
        if (collection === 'job-openings') return { availablePositions: 0, id: option.jobOpening, status: 'OPEN' }
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn(),
    } as unknown as Payload

    const error = await acceptEmploymentOffer({ accountId: process.candidateAccount, employmentOfferId: offer.id, expectedSnapshotChecksum: offer.snapshotChecksum, now: new Date('2030-01-10T10:00:00.000Z'), payload }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(EmploymentOfferError)
    expect(error).toMatchObject({ status: 409 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('conceals an offer from a different candidate account', async () => {
    const payload = {
      db: transaction(),
      findByID: vi.fn().mockResolvedValue(publishedOffer()),
    } as unknown as Payload
    const error = await acceptEmploymentOffer({ accountId: 999, employmentOfferId: 71, expectedSnapshotChecksum: 'a'.repeat(64), now: new Date('2030-01-10T10:00:00.000Z'), payload }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(EmploymentOfferError)
    expect(error).toMatchObject({ status: 404 })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })
})
