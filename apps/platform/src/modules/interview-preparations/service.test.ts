import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  InterviewPreparationError,
  recordInterviewPreparationOutcome,
  scheduleInterviewPreparation,
} from './service.ts'

const application = {
  correlationId: 'synthetic-ref-41',
  id: 41,
  status: 'READY_FOR_PROFILE',
  workflowVersion: 4,
}
const process = {
  applicant: 31,
  candidateAccount: 21,
  currentStep: 'JOB_PLACEMENT',
  id: 61,
  preApplication: 41,
  processStatus: 'ACTIVE',
  programCode: 'SWT',
}

function transaction() {
  return {
    beginTransaction: vi.fn().mockResolvedValue('transaction-1'),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    sessions: { 'transaction-1': { db: { execute: vi.fn() } } },
  }
}

describe('interview preparation service', () => {
  it('schedules an appointment, updates the candidate action, and writes an audit event atomically', async () => {
    const appointment = {
      attemptNumber: 1,
      candidateInstructions: 'Ponesite sintetički CV.',
      deliveryMode: 'ONLINE',
      id: 71,
      locationDetails: 'https://example.invalid/synthetic-meeting',
      startsAt: '2026-09-09T10:00:00.000Z',
      status: 'SCHEDULED',
      timeZone: 'Europe/Belgrade',
      version: 1,
    }
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) =>
        collection === 'interview-preparation-appointments' ? appointment : { id: 81 }),
      db: transaction(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        throw new Error('Unexpected collection: ' + collection)
      }),
      update: vi.fn().mockResolvedValue({ id: process.id }),
    } as unknown as Payload

    await expect(scheduleInterviewPreparation({
      administratorId: 3,
      candidateInstructions: appointment.candidateInstructions,
      candidateProcessId: process.id,
      deliveryMode: 'ONLINE',
      locationDetails: appointment.locationDetails,
      now: new Date('2026-09-08T10:00:00.000Z'),
      payload,
      startsAt: new Date(appointment.startsAt),
      timeZone: appointment.timeZone,
    })).resolves.toMatchObject({ id: appointment.id, status: 'SCHEDULED' })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ nextActionDueAt: appointment.startsAt }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'INTERVIEW_PREPARATION_SCHEDULED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('does not let a stale appointment outcome overwrite a later workflow step', async () => {
    const appointment = {
      attemptNumber: 1,
      candidateProcess: process.id,
      deliveryMode: 'IN_PERSON',
      id: 71,
      locationDetails: 'Sintetička sala',
      startsAt: '2026-09-08T09:00:00.000Z',
      status: 'SCHEDULED',
      timeZone: 'Europe/Belgrade',
      version: 1,
    }
    const payload = {
      create: vi.fn(),
      db: transaction(),
      findByID: vi.fn()
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce({ ...process, currentStep: 'VISA' }),
      update: vi.fn(),
    } as unknown as Payload

    const error = await recordInterviewPreparationOutcome({
      administratorId: 3,
      appointmentId: appointment.id,
      expectedVersion: 1,
      now: new Date('2026-09-08T10:00:00.000Z'),
      outcome: 'COMPLETED',
      payload,
    }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(InterviewPreparationError)
    expect(error).toMatchObject({ status: 403 })

    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('transaction-1')
  })
})
