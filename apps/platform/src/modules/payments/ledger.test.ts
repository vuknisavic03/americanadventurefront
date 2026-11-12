import { describe, expect, it } from 'vitest'

import { allocatePayments, buildPaymentPlanSnapshot, derivePaymentPlanState } from './ledger.ts'

const acceptedAt = '2026-09-01T10:00:00.000Z'

describe('candidate payment ledger', () => {
  it('creates a single initial obligation for one-time payment', () => {
    expect(buildPaymentPlanSnapshot({
      currency: 'USD',
      selectedMethod: 'ONE_TIME',
      totalCents: 125_000,
    }, acceptedAt)).toEqual({
      currency: 'USD',
      firstPaymentRequiredCents: 125_000,
      obligations: [{ amountCents: 125_000, dueAt: acceptedAt, key: 'one-time', kind: 'INITIAL', label: 'Jednokratna uplata' }],
      selectedMethod: 'ONE_TIME',
      totalCents: 125_000,
    })
  })

  it('uses the first installment as the amount required to unlock the application', () => {
    const plan = buildPaymentPlanSnapshot({
      currency: 'USD',
      installmentSchedule: [
        { amountCents: 30_000, dueAt: '2026-09-05T00:00:00.000Z', label: 'Prva rata' },
        { amountCents: 70_000, dueAt: '2026-10-05T00:00:00.000Z', label: 'Druga rata' },
      ],
      selectedMethod: 'INSTALLMENTS',
      totalCents: 100_000,
    }, acceptedAt)
    expect(plan.firstPaymentRequiredCents).toBe(30_000)
    expect(plan.obligations.map((item) => item.kind)).toEqual(['INITIAL', 'INSTALLMENT'])
  })

  it('does not require a first payment when the PKZ deposit is zero', () => {
    const plan = buildPaymentPlanSnapshot({
      currency: 'USD',
      payWhenYouEarnSnapshot: { deferredAmountCents: 100_000, depositCents: 0 },
      selectedMethod: 'PAY_WHEN_YOU_EARN',
      totalCents: 100_000,
    }, acceptedAt)
    expect(plan.firstPaymentRequiredCents).toBe(0)
    expect(derivePaymentPlanState({ firstPaymentRequiredCents: 0, paidCents: 0, totalCents: 100_000 }).firstPaymentStatus).toBe('NOT_REQUIRED')
  })

  it('rejects a schedule whose obligations do not equal the accepted total', () => {
    expect(() => buildPaymentPlanSnapshot({
      currency: 'USD',
      installmentSchedule: [{ amountCents: 90_000, dueAt: '2026-09-05T00:00:00.000Z', label: 'Prva rata' }],
      selectedMethod: 'INSTALLMENTS',
      totalCents: 100_000,
    }, acceptedAt)).toThrow('Zbir sačuvanih rata')
  })

  it('confirms the first payment only when its full required amount is covered', () => {
    expect(derivePaymentPlanState({ firstPaymentRequiredCents: 30_000, paidCents: 29_999, totalCents: 100_000 }).firstPaymentStatus).toBe('PENDING')
    expect(derivePaymentPlanState({ firstPaymentRequiredCents: 30_000, paidCents: 30_000, totalCents: 100_000 }).firstPaymentStatus).toBe('CONFIRMED')
  })

  it('allocates recorded money to obligations in order without mutating the schedule', () => {
    const obligations = buildPaymentPlanSnapshot({
      currency: 'USD',
      installmentSchedule: [
        { amountCents: 30_000, dueAt: '2026-09-05T00:00:00.000Z', label: 'Prva rata' },
        { amountCents: 70_000, dueAt: '2026-10-05T00:00:00.000Z', label: 'Druga rata' },
      ],
      selectedMethod: 'INSTALLMENTS',
      totalCents: 100_000,
    }, acceptedAt).obligations
    const allocated = allocatePayments(obligations, 45_000)
    expect(allocated.map(({ allocatedCents, remainingCents, status }) => ({ allocatedCents, remainingCents, status }))).toEqual([
      { allocatedCents: 30_000, remainingCents: 0, status: 'PAID' },
      { allocatedCents: 15_000, remainingCents: 55_000, status: 'PARTIAL' },
    ])
    expect(obligations[0]).not.toHaveProperty('allocatedCents')
  })
})
