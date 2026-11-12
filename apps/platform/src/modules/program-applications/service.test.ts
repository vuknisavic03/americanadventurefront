import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { applicationSchemaChecksum, type ProgramApplicationSchemaSnapshot } from './schema.ts'
import { mutateCandidateProgramApplication } from './service.ts'

const snapshot: ProgramApplicationSchemaSnapshot = {
  fields: [
    { fieldType: 'TEXT', key: 'motivation', label: 'Motivacija', maxLength: 500, required: true },
    { fieldType: 'DATE', key: 'departureDate', label: 'Datum polaska', required: true },
  ],
  instructions: 'Popunite sva polja.',
  name: 'Work & Travel aplikacija',
  programCode: 'SWT',
  version: 1,
}
const account = { _verified: true, accountStatus: 'ACTIVE', id: 21 }
const process = { candidateAccount: 21, currentStep: 'PROGRAM_APPLICATION', id: 31, preApplication: 41, processStatus: 'ACTIVE', programCode: 'SWT' }
const preApplication = { correlationId: 'AA-TEST-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 8 }
const application = {
  answers: {},
  candidateAccount: 21,
  candidateProcess: 31,
  completionPercent: 0,
  id: 51,
  lastSavedAt: '2026-09-02T10:00:00.000Z',
  preApplication: 41,
  programCode: 'SWT',
  revision: 1,
  schemaChecksum: applicationSchemaChecksum(snapshot),
  schemaSnapshot: snapshot,
  status: 'DRAFT',
  template: 61,
  templateName: snapshot.name,
  templateVersion: snapshot.version,
}

function payloadMock() {
  const payload = {
    create: vi.fn().mockResolvedValue({ id: 91 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue('transaction-application'),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    },
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'candidate-processes') return { docs: [process] }
      if (collection === 'candidate-program-applications') return { docs: [application] }
      throw new Error(`Unexpected collection: ${collection}`)
    }),
    findByID: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'candidate-accounts') return account
      if (collection === 'candidate-program-applications') return application
      if (collection === 'pre-applications') return preApplication
      throw new Error(`Unexpected collection: ${collection}`)
    }),
    update: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) =>
      collection === 'candidate-program-applications' ? { ...application, ...data } : process,
    ),
  } as unknown as Payload
  return payload
}

describe('candidate program application service', () => {
  it('saves a valid draft atomically and records an audit event', async () => {
    const payload = payloadMock()
    const result = await mutateCandidateProgramApplication({
      accountId: 21,
      answers: { motivation: 'Želim međunarodno iskustvo.' },
      expectedRevision: 1,
      mode: 'SAVE_DRAFT',
      now: new Date('2026-09-02T12:00:00.000Z'),
      payload,
    })

    expect(result).toEqual(expect.objectContaining({ completionPercent: 50, revision: 2, status: 'DRAFT' }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-program-applications',
      data: expect.objectContaining({ answers: { motivation: 'Želim međunarodno iskustvo.' }, completionPercent: 50, revision: 2 }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'PROGRAM_APPLICATION_DRAFT_SAVED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-application')
  })

  it('submits a complete application and advances the process to documents', async () => {
    const payload = payloadMock()
    await expect(mutateCandidateProgramApplication({
      accountId: 21,
      answers: { departureDate: '2027-06-10', motivation: 'Želim međunarodno iskustvo.' },
      expectedRevision: 1,
      mode: 'SUBMIT',
      now: new Date('2026-09-02T12:00:00.000Z'),
      payload,
    })).resolves.toEqual(expect.objectContaining({ completionPercent: 100, status: 'SUBMITTED' }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'DOCUMENTS' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'PROGRAM_APPLICATION_SUBMITTED' }),
    }))
  })

  it('rejects stale revisions and incomplete final submissions', async () => {
    const stalePayload = payloadMock()
    await expect(mutateCandidateProgramApplication({
      accountId: 21,
      answers: {},
      expectedRevision: 2,
      mode: 'SAVE_DRAFT',
      now: new Date('2026-09-02T12:00:00.000Z'),
      payload: stalePayload,
    })).rejects.toMatchObject({ name: 'CandidateProgramApplicationError', status: 409 })

    const incompletePayload = payloadMock()
    await expect(mutateCandidateProgramApplication({
      accountId: 21,
      answers: { motivation: 'Motivacija' },
      expectedRevision: 1,
      mode: 'SUBMIT',
      now: new Date('2026-09-02T12:00:00.000Z'),
      payload: incompletePayload,
    })).rejects.toMatchObject({
      fieldErrors: { departureDate: 'Ovo polje je obavezno.' },
      status: 400,
    })
  })
})
