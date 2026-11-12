import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  cancelVisaPaymentOrder,
  issueVisaPaymentOrder,
  recordVisaPayment,
  VisaPaymentOrderError,
} from './service.ts'
import type { VisaPaymentOrderTerms } from './rules.ts'

const application = { correlationId: 'synthetic-ref-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 4 }
const process = { applicant: 31, candidateAccount: 21, currentStep: 'VISA', id: 61, preApplication: 41, processStatus: 'ACTIVE', programCode: 'SWT' }
const terms: VisaPaymentOrderTerms = {
  amountMinor: 18_500_00,
  bankAccount: '840-0000000000000-00',
  beneficiaryName: 'Sintetički primalac',
  candidateInstructions: 'Sačuvajte potvrdu o uplati.',
  currency: 'RSD',
  dueAt: '2026-09-20T21:59:59.000Z',
  paymentModel: '97',
  paymentPurpose: 'Troškovi viziranja za Work & Travel USA',
  paymentReference: 'SYNTHETIC-2026-001',
}
const order = {
  ...terms,
  applicant: 31,
  candidateAccount: 21,
  candidateProcess: 61,
  id: 71,
  idempotencyKey: '8cb431e5-b666-42b4-a8a9-6fb1fdfc7b98',
  issuedAt: '2026-09-09T13:53:50.362Z',
  issuedBy: 3,
  orderNumber: 'AA-VISA-2026-000041-V1',
  orderVersion: 1,
  preApplication: 41,
  programCode: 'SWT',
  snapshotChecksum: 'a'.repeat(64),
  status: 'ISSUED',
  statusVersion: 1,
}

function transaction() {
  return {
    beginTransaction: vi.fn().mockResolvedValue('transaction-1'),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    sessions: { 'transaction-1': { db: { execute: vi.fn() } } },
  }
}

describe('visa payment order service', () => {
  it('issues a candidate-bound order and updates the candidate action atomically', async () => {
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => collection === 'visa-payment-orders' ? { ...order, ...data } : { id: 81 }),
      db: transaction(),
      find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'employment-offers' ? [{ id: 91, status: 'ACCEPTED' }] : [] })),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: process.id }),
    } as unknown as Payload

    const result = await issueVisaPaymentOrder({
      administratorId: 3,
      candidateProcessId: process.id,
      idempotencyKey: order.idempotencyKey,
      now: new Date(order.issuedAt),
      payload,
      terms,
    })

    expect(result.created).toBe(true)
    expect(result.order).toMatchObject({ orderNumber: order.orderNumber, status: 'ISSUED' })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'visa-payment-orders',
      data: expect.objectContaining({ candidateAccount: process.candidateAccount, candidateProcess: process.id, orderNumber: order.orderNumber }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ nextActionTitle: 'Uplatite troškove viziranja' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'VISA_PAYMENT_ORDER_ISSUED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('returns the same order for a repeated issuance request without opening a transaction', async () => {
    const database = transaction()
    const payload = {
      db: database,
      find: vi.fn().mockResolvedValue({ docs: [order] }),
    } as unknown as Payload

    const result = await issueVisaPaymentOrder({
      administratorId: 3,
      candidateProcessId: process.id,
      idempotencyKey: order.idempotencyKey,
      now: new Date(order.issuedAt),
      payload,
      terms,
    })

    expect(result).toMatchObject({ created: false, order: { id: order.id, orderNumber: order.orderNumber } })
    expect(database.beginTransaction).not.toHaveBeenCalled()
  })

  it('rejects an idempotency key that belongs to a different candidate process', async () => {
    const database = transaction()
    const payload = {
      db: database,
      find: vi.fn().mockResolvedValue({ docs: [{ ...order, candidateProcess: 999 }] }),
    } as unknown as Payload

    const error = await issueVisaPaymentOrder({
      administratorId: 3,
      candidateProcessId: process.id,
      idempotencyKey: order.idempotencyKey,
      now: new Date(order.issuedAt),
      payload,
      terms,
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(VisaPaymentOrderError)
    expect(error).toMatchObject({ status: 409 })
    expect(database.beginTransaction).not.toHaveBeenCalled()
  })

  it('rejects issuance when employment has not been accepted', async () => {
    const payload = {
      create: vi.fn(),
      db: transaction(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockResolvedValue(process),
      update: vi.fn(),
    } as unknown as Payload

    const error = await issueVisaPaymentOrder({
      administratorId: 3,
      candidateProcessId: process.id,
      idempotencyKey: order.idempotencyKey,
      now: new Date(order.issuedAt),
      payload,
      terms,
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(VisaPaymentOrderError)
    expect(error).toMatchObject({ status: 403 })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('records a same-day payment without comparing the form date to the exact issue time', async () => {
    const paidAt = new Date('2026-09-09T12:00:00.000Z')
    const now = new Date('2026-09-09T16:00:00.000Z')
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 81 }),
      db: transaction(),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'visa-payment-orders') return order
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => collection === 'visa-payment-orders' ? { ...order, ...data } : { id: process.id }),
    } as unknown as Payload

    const result = await recordVisaPayment({
      administratorId: 3,
      candidateProcessId: process.id,
      expectedStatusVersion: 1,
      externalPaymentReference: 'SYNTHETIC-STATEMENT-1',
      now,
      orderId: order.id,
      paidAt,
      payload,
    })

    expect(result).toMatchObject({ changed: true, order: { status: 'PAID', statusVersion: 2 } })
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ nextActionTitle: 'Popunite vizni upitnik' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'VISA_PAYMENT_RECORDED' }),
    }))
  })

  it('cancels an unpaid order with a reason so a corrected version can be issued', async () => {
    const now = new Date('2026-09-10T10:00:00.000Z')
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 81 }),
      db: transaction(),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'visa-payment-orders') return order
        if (collection === 'candidate-processes') return process
        if (collection === 'pre-applications') return application
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => collection === 'visa-payment-orders' ? { ...order, ...data } : { id: process.id }),
    } as unknown as Payload

    const result = await cancelVisaPaymentOrder({ administratorId: 3, candidateProcessId: process.id, expectedStatusVersion: 1, now, orderId: order.id, payload, reason: 'Pogrešan račun primaoca.' })

    expect(result).toMatchObject({ cancellationReason: 'Pogrešan račun primaoca.', status: 'CANCELLED', statusVersion: 2 })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'VISA_PAYMENT_ORDER_CANCELLED' }),
    }))
  })
})
