import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { recordCandidatePayment, reverseCandidatePayment } from './service.ts'

const application = { correlationId: 'ref-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 4 }
const plan = {
  candidateAccount: 21,
  candidateProcess: 61,
  currency: 'USD',
  firstPaymentConfirmedAt: null,
  firstPaymentRequiredCents: 30_000,
  firstPaymentStatus: 'PENDING',
  id: 71,
  paidCents: 0,
  preApplication: 41,
  remainingCents: 100_000,
  totalCents: 100_000,
}

describe('candidate payment service', () => {
  it('records a payment, confirms the first obligation, and unlocks the application atomically', async () => {
    const payment = { amountCents: 30_000, id: 81, paymentReference: 'AA-PAY-TEST' }
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-payments' ? payment : { id: 91 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue('transaction-1'),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
      },
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-payment-plans') return plan
        if (collection === 'pre-applications') return application
        if (collection === 'candidate-processes') return { currentStep: 'INITIAL_PAYMENT', id: 61 }
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: 71 }),
    } as unknown as Payload

    const result = await recordCandidatePayment({
      administratorId: 3,
      amountCents: 30_000,
      idempotencyKey: 'e891ec02-96a6-4c2b-8640-266f08d92813',
      now: new Date('2026-09-02T10:00:00.000Z'),
      paymentPlanId: 71,
      payload,
      receivedAt: new Date('2026-09-02T09:00:00.000Z'),
    })

    expect(result).toEqual({ created: true, payment })
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-payment-plans',
      data: expect.objectContaining({ firstPaymentStatus: 'CONFIRMED', paidCents: 30_000, remainingCents: 70_000 }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'PROGRAM_APPLICATION' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'INITIAL_PAYMENT_CONFIRMED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('returns an existing entry for a repeated idempotency key without opening a transaction', async () => {
    const existing = { id: 81, paymentReference: 'AA-PAY-EXISTING' }
    const payload = {
      db: { beginTransaction: vi.fn() },
      find: vi.fn().mockResolvedValue({ docs: [existing] }),
    } as unknown as Payload

    await expect(recordCandidatePayment({
      administratorId: 3,
      amountCents: 30_000,
      idempotencyKey: 'e891ec02-96a6-4c2b-8640-266f08d92813',
      now: new Date('2026-09-02T10:00:00.000Z'),
      paymentPlanId: 71,
      payload,
      receivedAt: new Date('2026-09-02T09:00:00.000Z'),
    })).resolves.toEqual({ created: false, payment: existing })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it('reverses through a separate ledger entry and returns the candidate to the payment step', async () => {
    const confirmedPlan = { ...plan, firstPaymentConfirmedAt: '2026-09-02T09:00:00.000Z', firstPaymentStatus: 'CONFIRMED', paidCents: 30_000, remainingCents: 70_000 }
    const original = { amountCents: 30_000, entryType: 'PAYMENT', id: 81, paymentPlan: 71 }
    const reversal = { id: 82, paymentReference: 'AA-REV-TEST' }
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => collection === 'candidate-payments' ? reversal : { id: 91 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue('transaction-2'),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
      },
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-payments') return original
        if (collection === 'candidate-payment-plans') return confirmedPlan
        if (collection === 'pre-applications') return application
        if (collection === 'candidate-processes') return { currentStep: 'PROGRAM_APPLICATION', id: 61 }
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: 71 }),
    } as unknown as Payload

    await expect(reverseCandidatePayment({
      administratorId: 3,
      idempotencyKey: '13b731c0-a3bb-4ab9-9040-0ecddbb459b0',
      now: new Date('2026-09-03T10:00:00.000Z'),
      paymentId: 81,
      payload,
      reason: 'Pogrešno knjižen izvod banke.',
    })).resolves.toEqual({ created: true, reversal })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-payments',
      data: expect.objectContaining({ entryType: 'REVERSAL', reversesPayment: 81 }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-payment-plans',
      data: expect.objectContaining({ firstPaymentStatus: 'PENDING', paidCents: 0 }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'INITIAL_PAYMENT' }),
    }))
  })
})
