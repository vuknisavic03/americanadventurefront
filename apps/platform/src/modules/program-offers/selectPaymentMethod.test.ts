import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { selectPaymentMethod } from './selectPaymentMethod.ts'

function offer(overrides: Record<string, unknown> = {}) {
  return {
    basePriceCents: 300_000,
    candidateAccount: 21,
    candidateProcess: 31,
    commercialVersion: 1,
    id: 41,
    installments: { enabled: false, items: [] },
    oneTime: { discountCents: 30_000, discountLabel: 'Popust', enabled: true },
    payWhenYouEarn: { enabled: false },
    preApplication: 12,
    publishedAt: '2026-08-29T15:00:00.000Z',
    status: 'PUBLISHED',
    validUntil: '2026-09-10T00:00:00.000Z',
    ...overrides,
  }
}

describe('candidate payment selection', () => {
  it('stores a snapshot, locks the offer, advances the process and audits in one transaction', async () => {
    const payload = {
      create: vi.fn()
        .mockResolvedValueOnce({ id: 51, offer: 41, selectedMethod: 'ONE_TIME' })
        .mockResolvedValueOnce({ id: 61 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(9),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn()
        .mockResolvedValueOnce({ _verified: true, accountStatus: 'ACTIVE', id: 21 })
        .mockResolvedValueOnce(offer())
        .mockResolvedValueOnce({ currentStep: 'PROFILE_SETUP', id: 31 })
        .mockResolvedValueOnce({ correlationId: 'ref-12', id: 12, status: 'READY_FOR_PROFILE', workflowVersion: 8 }),
      update: vi.fn().mockResolvedValue({ id: 41 }),
    } as unknown as Payload

    await selectPaymentMethod({
      accountId: 21,
      method: 'ONE_TIME',
      now: new Date('2026-08-30T10:00:00.000Z'),
      offerId: 41,
      payload,
    })

    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'program-offer-selections',
      data: expect.objectContaining({ discountCents: 30_000, totalCents: 270_000 }),
    }))
    expect(payload.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'program-offers',
      context: { acceptProgramOffer: true },
      data: expect.objectContaining({ status: 'ACCEPTED' }),
    }))
    expect(payload.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'CONTRACT_AND_PAYMENT_PLAN' }),
    }))
    expect(payload.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'PAYMENT_METHOD_SELECTED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(9)
  })

  it('is idempotent when the same selection is submitted again', async () => {
    const existing = { candidateProcess: 31, id: 51, offer: 41, selectedMethod: 'ONE_TIME' }
    const payload = {
      create: vi.fn(),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(10),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn().mockResolvedValue({ docs: [existing] }),
      findByID: vi.fn()
        .mockResolvedValueOnce({ _verified: true, accountStatus: 'ACTIVE', id: 21 })
        .mockResolvedValueOnce(offer({ status: 'ACCEPTED' })),
      update: vi.fn(),
    } as unknown as Payload

    await expect(selectPaymentMethod({
      accountId: 21,
      method: 'ONE_TIME',
      now: new Date('2026-08-30T10:00:00.000Z'),
      offerId: 41,
      payload,
    })).resolves.toEqual(existing)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(10)
  })

  it('incorporates applicable commercial discounts and applies them upon selection', async () => {
    const verifiedDiscount = {
      amountCents: 10_000,
      candidateProcess: 31,
      discountType: 'RETURNEE',
      id: 99,
      label: 'Returnee popust',
      preApplication: 12,
      status: 'VERIFIED',
    }
    const payload = {
      create: vi.fn()
        .mockResolvedValueOnce({ id: 52, offer: 41, selectedMethod: 'ONE_TIME' })
        .mockResolvedValueOnce({ id: 62 })
        .mockResolvedValueOnce({ id: 72 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(11),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      find: vi.fn()
        .mockResolvedValueOnce({ docs: [] }) // findExistingSelection
        .mockResolvedValueOnce({ docs: [verifiedDiscount] }) // getApplicableDiscountsForProcess
        .mockResolvedValueOnce({ docs: [verifiedDiscount] }), // applyDiscountsForProcess
      findByID: vi.fn()
        .mockResolvedValueOnce({ _verified: true, accountStatus: 'ACTIVE', id: 21 })
        .mockResolvedValueOnce(offer())
        .mockResolvedValueOnce({ currentStep: 'PROFILE_SETUP', id: 31 })
        .mockResolvedValueOnce({ correlationId: 'ref-12', id: 12, status: 'READY_FOR_PROFILE', workflowVersion: 8 })
        .mockResolvedValueOnce({ correlationId: 'ref-12', id: 12, status: 'READY_FOR_PROFILE', workflowVersion: 8 }),
      update: vi.fn().mockResolvedValue({ id: 41 }),
    } as unknown as Payload

    await selectPaymentMethod({
      accountId: 21,
      method: 'ONE_TIME',
      now: new Date('2026-08-30T10:00:00.000Z'),
      offerId: 41,
      payload,
    })

    // Offer base price 300_000, oneTime discount 30_000 + 10_000 commercial = 40_000 total discount, 260_000 totalCents
    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'program-offer-selections',
      data: expect.objectContaining({ discountCents: 40_000, totalCents: 260_000 }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-discounts',
      data: expect.objectContaining({ status: 'APPLIED' }),
      id: 99,
    }))
  })
})
