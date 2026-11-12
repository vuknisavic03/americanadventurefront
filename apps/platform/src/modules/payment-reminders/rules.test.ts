import { describe, expect, it } from 'vitest'

import {
  buildPaymentReminderContext,
  determineActiveObligation,
  evaluateObligations,
  formatDateSr,
  formatRsdAmount,
  generatePaymentReminderIdempotencyKey,
  renderPaymentReminderEmail,
  renderPaymentReminderInApp,
  renderPaymentReminderSms,
} from './rules.ts'

describe('Payment reminder rules & evaluation (FR-039)', () => {
  const asOf = new Date('2026-04-10T12:00:00.000Z')

  const sampleObligations = [
    {
      amountCents: 35000,
      dueAt: '2026-03-01T00:00:00.000Z',
      key: 'INITIAL',
      kind: 'INITIAL' as const,
      label: 'I rata programa',
    },
    {
      amountCents: 70000,
      dueAt: '2026-04-14T00:00:00.000Z', // 4 days after asOf -> PRE_DUE (<= 5 days)
      key: 'INSTALLMENT_2',
      kind: 'INSTALLMENT' as const,
      label: 'II rata programa',
    },
    {
      amountCents: 80000,
      dueAt: '2026-05-15T00:00:00.000Z', // 35 days after asOf -> not yet due
      key: 'INSTALLMENT_3',
      kind: 'INSTALLMENT' as const,
      label: 'III rata programa',
    },
  ]

  it('correctly allocates full payment and marks obligations as not eligible for reminders', () => {
    const result = evaluateObligations({
      asOfDate: asOf,
      obligations: sampleObligations,
      paidCents: 185000, // Total 1850 USD paid
    })

    expect(result).toHaveLength(3)
    expect(result.every((o) => o.isFullyPaid)).toBe(true)
    expect(result.every((o) => !o.isEligibleForReminder)).toBe(true)
    expect(result.every((o) => o.trigger === null)).toBe(true)
  })

  it('allocates partial payments sequentially to earlier obligations', () => {
    // 350 USD paid -> covers I rata completely, leaving II and III unpaid
    const result = evaluateObligations({
      asOfDate: asOf,
      obligations: sampleObligations,
      paidCents: 35000,
    })

    expect(result[0].isFullyPaid).toBe(true)
    expect(result[0].allocatedPaidCents).toBe(35000)
    expect(result[0].unpaidCents).toBe(0)
    expect(result[0].isEligibleForReminder).toBe(false)

    // II rata is due in 4 days (2026-04-14 vs 2026-04-10) -> PRE_DUE
    expect(result[1].isFullyPaid).toBe(false)
    expect(result[1].allocatedPaidCents).toBe(0)
    expect(result[1].unpaidCents).toBe(70000)
    expect(result[1].amountUsd).toBe(700)
    expect(result[1].amountRsd).toBe(75950) // 700 * 108.5
    expect(result[1].trigger).toBe('PRE_DUE')
    expect(result[1].daysUntilDue).toBe(4)
    expect(result[1].isEligibleForReminder).toBe(true)

    // III rata is due in 35 days -> not yet eligible
    expect(result[2].isFullyPaid).toBe(false)
    expect(result[2].trigger).toBe(null)
    expect(result[2].daysUntilDue).toBe(35)
    expect(result[2].isEligibleForReminder).toBe(false)
  })

  it('identifies ON_DUE obligation when reference date matches due date', () => {
    const dueTodayDate = new Date('2026-04-14T08:00:00.000Z')
    const result = evaluateObligations({
      asOfDate: dueTodayDate,
      obligations: sampleObligations,
      paidCents: 35000,
    })

    expect(result[1].trigger).toBe('ON_DUE')
    expect(result[1].daysUntilDue).toBe(0)
    expect(result[1].isEligibleForReminder).toBe(true)
  })

  it('identifies OVERDUE obligation when due date has passed and payment is missing', () => {
    const afterDueDate = new Date('2026-04-18T10:00:00.000Z') // 4 days overdue
    const result = evaluateObligations({
      asOfDate: afterDueDate,
      obligations: sampleObligations,
      paidCents: 35000,
    })

    expect(result[1].trigger).toBe('OVERDUE')
    expect(result[1].daysOverdue).toBe(4)
    expect(result[1].isEligibleForReminder).toBe(true)
  })

  it('prioritizes OVERDUE obligation over upcoming obligations', () => {
    const mixedObligations = [
      {
        amountCents: 50000,
        dueAt: '2026-04-05T00:00:00.000Z', // Overdue relative to 2026-04-10
        key: 'OB_1',
        label: 'Rata 1',
      },
      {
        amountCents: 50000,
        dueAt: '2026-04-12T00:00:00.000Z', // Upcoming in 2 days
        key: 'OB_2',
        label: 'Rata 2',
      },
    ]

    const evaluated = evaluateObligations({
      asOfDate: asOf,
      obligations: mixedObligations,
      paidCents: 0,
    })

    const active = determineActiveObligation(evaluated)
    expect(active).not.toBeNull()
    expect(active?.key).toBe('OB_1')
    expect(active?.trigger).toBe('OVERDUE')
  })

  it('generates consistent and idempotent deduplication keys', () => {
    const key1 = generatePaymentReminderIdempotencyKey(42, 'INSTALLMENT_2', 'PRE_DUE', '2026-04-10')
    const key2 = generatePaymentReminderIdempotencyKey(42, 'INSTALLMENT_2', 'PRE_DUE', '2026-04-10')
    const diffKey = generatePaymentReminderIdempotencyKey(42, 'INSTALLMENT_2', 'ON_DUE', '2026-04-14')

    expect(key1).toBe('pay-rem:42:INSTALLMENT_2:PRE_DUE:2026-04-10')
    expect(key1).toBe(key2)
    expect(key1).not.toBe(diffKey)
  })

  it('formats Serbian dates and RSD amounts properly', () => {
    expect(formatDateSr('2026-04-14T00:00:00.000Z')).toBe('14.04.2026.')
    expect(formatDateSr(null)).toBe('Nije definisan')
    expect(formatRsdAmount(75950)).toContain('75')
  })

  it('renders rich email, SMS, and in-app reminder messages with payment slip links', () => {
    const evaluated = evaluateObligations({
      asOfDate: asOf,
      obligations: sampleObligations,
      paidCents: 35000,
    })

    const context = buildPaymentReminderContext({
      candidateAccountId: 101,
      candidateName: 'Marko Jovanović',
      email: 'marko@example.test',
      obligation: evaluated[1], // II rata
      phone: '+381641234567',
      portalBaseUrl: 'https://workandtravel.rs',
    })

    const email = renderPaymentReminderEmail(context)
    expect(email.subject).toContain('Podsetnik za dospeće rate: II rata programa')
    expect(email.text).toContain('Marko')
    expect(email.text).toContain('700.00 USD')
    expect(email.text).toContain('75.950')
    expect(email.text).toContain('Preuzmite pripremljenu uplatnicu')
    expect(email.text).toContain('/api/candidate/payment-slips/INSTALLMENT_2')
    expect(email.html).toContain('Model i poziv na broj')
    expect(email.html).toContain('NBS IPS QR')

    const sms = renderPaymentReminderSms(context)
    expect(sms).toContain('American Adventure')
    expect(sms).toContain('II rata programa')
    expect(sms).toContain('700 USD')
    expect(sms).toContain('14.04.2026.')
    expect(sms).toContain('https://workandtravel.rs/moj-nalog#uplate')

    const inApp = renderPaymentReminderInApp(context)
    expect(inApp.title).toContain('Podsetnik za uplatu: II rata programa')
    expect(inApp.body).toContain('700.00 USD')
  })

  it('renders urgent notice and warning styling for OVERDUE obligations', () => {
    const afterDueDate = new Date('2026-04-20T10:00:00.000Z')
    const evaluated = evaluateObligations({
      asOfDate: afterDueDate,
      obligations: sampleObligations,
      paidCents: 35000,
    })

    const context = buildPaymentReminderContext({
      candidateAccountId: 101,
      candidateName: 'Petar Petrović',
      email: 'petar@example.test',
      obligation: evaluated[1],
      phone: '+381651234567',
    })

    const email = renderPaymentReminderEmail(context)
    expect(email.subject).toContain('OPOMENA: Kašnjenje uplate rate')
    expect(email.text).toContain('rok za uplatu rate "II rata programa" istekao')
    expect(email.html).toContain('#b91c1c') // Urgent red color

    const sms = renderPaymentReminderSms(context)
    expect(sms).toContain('OPOMENA')
    expect(sms).toContain('dospela 14.04.2026.')
  })
})
