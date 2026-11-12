import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { scheduleInterviewPreparation } from './service.ts'

function fixture({ failAudit = false, active = true } = {}) {
  const db = {
    beginTransaction: vi.fn().mockResolvedValue('tx'), commitTransaction: vi.fn(), rollbackTransaction: vi.fn(),
    sessions: { tx: { db: { execute: vi.fn() } } },
  }
  const payload = {
    db,
    findByID: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-processes'
      ? { id: 1, applicant: 2, candidateAccount: 3, preApplication: 4, programCode: 'SWT', currentStep: 'VISA', processStatus: active ? 'ACTIVE' : 'PAUSED' }
      : { id: 4, correlationId: 'test-only', status: 'READY_FOR_PROFILE', workflowVersion: 1 }),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection === 'audit-events' && failAudit) throw new Error('synthetic audit failure')
      return { ...data, id: 10 }
    }),
    update: vi.fn(),
  }
  const input = {
    administratorId: 9, candidateProcessId: 1, deliveryMode: 'ONLINE' as const,
    locationDetails: 'https://example.invalid/test', now: new Date('2026-09-16T10:00:00Z'),
    startsAt: new Date('2026-09-17T10:00:00Z'), timeZone: 'Europe/Belgrade',
    payload: payload as unknown as Payload, purpose: 'EMBASSY' as const,
  }
  return { db, input, payload }
}

describe('embassy preparation transaction', () => {
  it('scopes storage by purpose and does not overwrite the official embassy next action', async () => {
    const { db, input, payload } = fixture()
    await scheduleInterviewPreparation(input)
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: { and: [{ candidateProcess: { equals: 1 } }, { purpose: { equals: 'EMBASSY' } }] } }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'interview-preparation-appointments', data: expect.objectContaining({ purpose: 'EMBASSY', attemptNumber: 1 }), req: { transactionID: 'tx' } }))
    expect(payload.update).not.toHaveBeenCalled()
    expect(db.commitTransaction).toHaveBeenCalledWith('tx')
  })

  it('rolls back appointment creation if its audit cannot be persisted', async () => {
    const { db, input } = fixture({ failAudit: true })
    await expect(scheduleInterviewPreparation(input)).rejects.toThrow('synthetic audit failure')
    expect(db.rollbackTransaction).toHaveBeenCalledWith('tx')
    expect(db.commitTransaction).not.toHaveBeenCalled()
  })

  it('rejects preparation on an inactive process without writes', async () => {
    const { db, input, payload } = fixture({ active: false })
    await expect(scheduleInterviewPreparation(input)).rejects.toMatchObject({ status: 403 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(db.rollbackTransaction).toHaveBeenCalledWith('tx')
  })
})
