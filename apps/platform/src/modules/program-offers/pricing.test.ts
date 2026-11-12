import { describe, expect, it } from 'vitest'

import { buildPaymentSelectionSnapshot, validateProgramOfferTerms } from './pricing.ts'

const validTerms = {
  basePriceCents: 300_000,
  installments: {
    enabled: true,
    items: [
      { amountCents: 100_000, dueAt: '2026-09-15T00:00:00.000Z', label: 'Prva rata' },
      { amountCents: 100_000, dueAt: '2026-10-15T00:00:00.000Z', label: 'Druga rata' },
      { amountCents: 100_000, dueAt: '2026-11-15T00:00:00.000Z', label: 'Treća rata' },
    ],
  },
  oneTime: { discountCents: 30_000, discountLabel: 'Aktivni popust', enabled: true },
  payWhenYouEarn: {
    deferredAmountCents: 250_000,
    depositCents: 50_000,
    description: 'Preostali iznos plaća se prema posebnoj PKZ dinamici.',
    enabled: true,
  },
}

describe('program offer pricing', () => {
  it('builds immutable monetary snapshots without decimal arithmetic', () => {
    expect(buildPaymentSelectionSnapshot(validTerms, 'ONE_TIME')).toMatchObject({
      discountCents: 30_000,
      totalCents: 270_000,
    })
    expect(buildPaymentSelectionSnapshot(validTerms, 'INSTALLMENTS')).toMatchObject({
      discountCents: 0,
      installmentSchedule: validTerms.installments.items,
      totalCents: 300_000,
    })
    expect(buildPaymentSelectionSnapshot(validTerms, 'PAY_WHEN_YOU_EARN')).toMatchObject({
      payWhenYouEarn: { deferredAmountCents: 250_000, depositCents: 50_000 },
      totalCents: 300_000,
    })
  })

  it('correctly applies commercial discounts and scales installment schedule', () => {
    const discounts = [
      { amountCents: 5_000, label: 'Grupni popust' },
      { amountCents: 10_000, label: 'Returnee popust' },
    ]
    // 300_000 base - 15_000 discounts = 285_000 effective total
    const installmentSnapshot = buildPaymentSelectionSnapshot(validTerms, 'INSTALLMENTS', discounts)
    expect(installmentSnapshot.discountCents).toBe(15_000)
    expect(installmentSnapshot.totalCents).toBe(285_000)
    expect(installmentSnapshot.installmentSchedule).toHaveLength(3)
    const installmentSum = installmentSnapshot.installmentSchedule.reduce(
      (sum, item) => sum + (item.amountCents ?? 0),
      0,
    )
    expect(installmentSum).toBe(285_000)

    // ONE_TIME: 30_000 offer discount + 15_000 commercial = 45_000 total discount
    const oneTimeSnapshot = buildPaymentSelectionSnapshot(validTerms, 'ONE_TIME', discounts)
    expect(oneTimeSnapshot.discountCents).toBe(45_000)
    expect(oneTimeSnapshot.totalCents).toBe(255_000)
  })

  it('rejects installment schedules whose count or sum does not match the offer', () => {
    const errors = validateProgramOfferTerms({
      basePriceCents: 300_000,
      installments: {
        enabled: true,
        items: [
          { amountCents: 90_000, dueAt: '2026-09-15T00:00:00.000Z', label: 'Prva' },
          { amountCents: 90_000, dueAt: '2026-10-15T00:00:00.000Z', label: 'Druga' },
        ],
      },
    })

    expect(errors.map((error) => error.message)).toEqual(expect.arrayContaining([
      expect.stringContaining('najmanje tri rate'),
      expect.stringContaining('Zbir svih rata'),
    ]))
  })

  it('requires PKZ deposit and deferred amounts to equal the base price', () => {
    const errors = validateProgramOfferTerms({
      basePriceCents: 300_000,
      payWhenYouEarn: {
        deferredAmountCents: 200_000,
        depositCents: 50_000,
        description: 'Poseban model',
        enabled: true,
      },
    })

    expect(errors).toContainEqual(expect.objectContaining({ path: 'payWhenYouEarn' }))
  })
})
