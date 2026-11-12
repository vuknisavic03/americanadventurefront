import type { PaymentMethod } from '../program-offers/pricing.ts'

export type PaymentObligation = {
  amountCents: number
  dueAt: null | string
  key: string
  kind: 'DEFERRED' | 'INITIAL' | 'INSTALLMENT'
  label: string
}

export type PaymentSelectionForPlan = {
  currency: string
  installmentSchedule?: null | unknown
  payWhenYouEarnSnapshot?: null | unknown
  selectedMethod: string
  totalCents: number
}

export type PaymentPlanSnapshot = {
  currency: 'USD'
  firstPaymentRequiredCents: number
  obligations: PaymentObligation[]
  selectedMethod: PaymentMethod
  totalCents: number
}

function cents(value: unknown, label: string, allowZero = false) {
  if (!Number.isSafeInteger(value) || (value as number) < (allowZero ? 0 : 1)) {
    throw new Error(`${label} mora biti ispravan ceo broj centi.`)
  }
  return value as number
}

function dateOrNull(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} nema ispravan datum dospeća.`)
  }
  return new Date(value).toISOString()
}

function object(value: unknown, label: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} nije ispravan.`)
  return value as Record<string, unknown>
}

export function buildPaymentPlanSnapshot(
  selection: PaymentSelectionForPlan,
  acceptedAt: string,
): PaymentPlanSnapshot {
  const totalCents = cents(selection.totalCents, 'Ukupan iznos', true)
  if (selection.currency !== 'USD') throw new Error('Valuta izabranog plana nije podržana.')
  const acceptedDueAt = dateOrNull(acceptedAt, 'Datum prihvatanja')

  if (selection.selectedMethod === 'ONE_TIME') {
    return {
      currency: 'USD',
      firstPaymentRequiredCents: totalCents,
      obligations: [{ amountCents: totalCents, dueAt: acceptedDueAt, key: 'one-time', kind: 'INITIAL', label: 'Jednokratna uplata' }],
      selectedMethod: 'ONE_TIME',
      totalCents,
    }
  }

  if (selection.selectedMethod === 'INSTALLMENTS') {
    if (!Array.isArray(selection.installmentSchedule) || selection.installmentSchedule.length === 0) {
      throw new Error('Sačuvani raspored rata nije ispravan.')
    }
    const obligations = selection.installmentSchedule.map((item, index): PaymentObligation => {
      const term = object(item, `Rata ${index + 1}`)
      const label = typeof term.label === 'string' && term.label.trim() ? term.label.trim() : `Rata ${index + 1}`
      return {
        amountCents: cents(term.amountCents, `Iznos rate ${index + 1}`),
        dueAt: dateOrNull(term.dueAt, `Rata ${index + 1}`),
        key: `installment-${index + 1}`,
        kind: index === 0 ? 'INITIAL' : 'INSTALLMENT',
        label,
      }
    })
    if (obligations.reduce((sum, item) => sum + item.amountCents, 0) !== totalCents) {
      throw new Error('Zbir sačuvanih rata nije jednak ukupnom iznosu ugovora.')
    }
    return {
      currency: 'USD',
      firstPaymentRequiredCents: obligations[0]?.amountCents ?? 0,
      obligations,
      selectedMethod: 'INSTALLMENTS',
      totalCents,
    }
  }

  if (selection.selectedMethod === 'PAY_WHEN_YOU_EARN') {
    const terms = object(selection.payWhenYouEarnSnapshot, 'Sačuvani PKZ uslovi')
    const depositCents = cents(terms.depositCents, 'Početni PKZ iznos', true)
    const deferredAmountCents = cents(terms.deferredAmountCents, 'Odloženi PKZ iznos', true)
    if (depositCents + deferredAmountCents !== totalCents) {
      throw new Error('Sačuvani PKZ iznosi nisu jednaki ukupnom iznosu ugovora.')
    }
    return {
      currency: 'USD',
      firstPaymentRequiredCents: depositCents,
      obligations: [
        { amountCents: depositCents, dueAt: acceptedDueAt, key: 'pkz-deposit', kind: 'INITIAL', label: 'Početna PKZ uplata' },
        { amountCents: deferredAmountCents, dueAt: null, key: 'pkz-deferred', kind: 'DEFERRED', label: 'Odloženi PKZ iznos' },
      ],
      selectedMethod: 'PAY_WHEN_YOU_EARN',
      totalCents,
    }
  }

  throw new Error('Izabrani način plaćanja nije podržan.')
}

export function derivePaymentPlanState({
  firstPaymentRequiredCents,
  paidCents,
  totalCents,
}: {
  firstPaymentRequiredCents: number
  paidCents: number
  totalCents: number
}) {
  cents(totalCents, 'Ukupan iznos', true)
  cents(firstPaymentRequiredCents, 'Prva uplata', true)
  cents(paidCents, 'Plaćeni iznos', true)
  if (firstPaymentRequiredCents > totalCents || paidCents > totalCents) {
    throw new Error('Finansijski saldo nije ispravan.')
  }
  return {
    firstPaymentStatus: firstPaymentRequiredCents === 0
      ? 'NOT_REQUIRED' as const
      : paidCents >= firstPaymentRequiredCents
        ? 'CONFIRMED' as const
        : 'PENDING' as const,
    remainingCents: totalCents - paidCents,
    status: paidCents === totalCents ? 'PAID' as const : 'ACTIVE' as const,
  }
}

export function allocatePayments(obligations: PaymentObligation[], paidCents: number) {
  let unallocated = paidCents
  return obligations.map((obligation) => {
    const allocatedCents = Math.min(obligation.amountCents, Math.max(0, unallocated))
    unallocated -= allocatedCents
    return {
      ...obligation,
      allocatedCents,
      remainingCents: obligation.amountCents - allocatedCents,
      status: allocatedCents === obligation.amountCents ? 'PAID' as const : allocatedCents > 0 ? 'PARTIAL' as const : 'PENDING' as const,
    }
  })
}
