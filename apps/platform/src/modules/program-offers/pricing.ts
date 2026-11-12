import {
  adjustInstallmentsForDiscount,
  calculateTotalDiscounts,
  validateDiscountsAgainstBasePrice,
} from '../discounts/rules.ts'

export const paymentMethodKeys = ['ONE_TIME', 'INSTALLMENTS', 'PAY_WHEN_YOU_EARN'] as const

export type PaymentMethod = (typeof paymentMethodKeys)[number]

export type InstallmentTerm = {
  amountCents?: null | number
  dueAt?: null | string
  label?: null | string
}

export type ProgramOfferTerms = {
  basePriceCents?: null | number
  installments?: null | {
    enabled?: null | boolean
    items?: null | InstallmentTerm[]
  }
  oneTime?: null | {
    discountCents?: null | number
    discountLabel?: null | string
    enabled?: null | boolean
  }
  payWhenYouEarn?: null | {
    deferredAmountCents?: null | number
    depositCents?: null | number
    description?: null | string
    enabled?: null | boolean
  }
}

export type ProgramOfferValidationError = {
  message: string
  path: string
}

export type PaymentSelectionSnapshot = {
  basePriceCents: number
  currency: 'USD'
  discountCents: number
  installmentSchedule: InstallmentTerm[]
  method: PaymentMethod
  payWhenYouEarn: null | {
    deferredAmountCents: number
    depositCents: number
    description: string
  }
  totalCents: number
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0
}

export function validateProgramOfferTerms(terms: ProgramOfferTerms) {
  const errors: ProgramOfferValidationError[] = []
  const basePriceCents = terms.basePriceCents

  if (!isPositiveInteger(basePriceCents)) {
    errors.push({ message: 'Osnovna cena mora biti pozitivan ceo broj centi.', path: 'basePriceCents' })
  }

  const oneTimeEnabled = terms.oneTime?.enabled === true
  const installmentsEnabled = terms.installments?.enabled === true
  const payWhenYouEarnEnabled = terms.payWhenYouEarn?.enabled === true
  if (!oneTimeEnabled && !installmentsEnabled && !payWhenYouEarnEnabled) {
    errors.push({ message: 'Ponuda mora imati najmanje jedan dostupan način plaćanja.', path: 'status' })
  }

  if (oneTimeEnabled) {
    const discount = terms.oneTime?.discountCents ?? 0
    if (!isNonNegativeInteger(discount)) {
      errors.push({ message: 'Popust mora biti ceo broj centi.', path: 'oneTime.discountCents' })
    } else if (isPositiveInteger(basePriceCents) && discount > basePriceCents) {
      errors.push({ message: 'Popust ne može biti veći od osnovne cene.', path: 'oneTime.discountCents' })
    }
  }

  if (installmentsEnabled) {
    const items = terms.installments?.items ?? []
    if (items.length < 3) {
      errors.push({ message: 'Plaćanje na rate mora sadržati najmanje tri rate.', path: 'installments.items' })
    }

    let total = 0
    let previousDueAt = Number.NEGATIVE_INFINITY
    items.forEach((item, index) => {
      if (!item.label?.trim()) {
        errors.push({ message: 'Svaka rata mora imati naziv.', path: `installments.items.${index}.label` })
      }
      if (!isPositiveInteger(item.amountCents)) {
        errors.push({ message: 'Iznos rate mora biti pozitivan ceo broj centi.', path: `installments.items.${index}.amountCents` })
      } else {
        total += item.amountCents
      }
      const dueAt = item.dueAt ? Date.parse(item.dueAt) : Number.NaN
      if (!Number.isFinite(dueAt)) {
        errors.push({ message: 'Svaka rata mora imati ispravan datum dospeća.', path: `installments.items.${index}.dueAt` })
      } else if (dueAt <= previousDueAt) {
        errors.push({ message: 'Datumi dospeća rata moraju biti poređani hronološki.', path: `installments.items.${index}.dueAt` })
      }
      previousDueAt = dueAt
    })

    if (isPositiveInteger(basePriceCents) && total !== basePriceCents) {
      errors.push({ message: 'Zbir svih rata mora biti jednak osnovnoj ceni.', path: 'installments.items' })
    }
  }

  if (payWhenYouEarnEnabled) {
    const deposit = terms.payWhenYouEarn?.depositCents
    const deferred = terms.payWhenYouEarn?.deferredAmountCents
    if (!isNonNegativeInteger(deposit)) {
      errors.push({ message: 'Početni iznos mora biti ceo broj centi.', path: 'payWhenYouEarn.depositCents' })
    }
    if (!isNonNegativeInteger(deferred)) {
      errors.push({ message: 'Odloženi iznos mora biti ceo broj centi.', path: 'payWhenYouEarn.deferredAmountCents' })
    }
    if (
      isPositiveInteger(basePriceCents) &&
      isNonNegativeInteger(deposit) &&
      isNonNegativeInteger(deferred) &&
      deposit + deferred !== basePriceCents
    ) {
      errors.push({ message: 'Početni i odloženi iznos zajedno moraju biti jednaki osnovnoj ceni.', path: 'payWhenYouEarn' })
    }
    if (!terms.payWhenYouEarn?.description?.trim()) {
      errors.push({ message: 'Dodajte kratko objašnjenje PKZ modela.', path: 'payWhenYouEarn.description' })
    }
  }

  return errors
}

export function buildPaymentSelectionSnapshot(
  terms: ProgramOfferTerms,
  method: PaymentMethod,
  appliedDiscounts: { amountCents: number; label?: string }[] = [],
): PaymentSelectionSnapshot {
  const validationErrors = validateProgramOfferTerms(terms)
  if (validationErrors.length > 0) throw new Error(validationErrors[0]?.message)

  const basePriceCents = terms.basePriceCents as number
  if (appliedDiscounts.length > 0) {
    const discountValidation = validateDiscountsAgainstBasePrice(basePriceCents, appliedDiscounts)
    if (!discountValidation.valid) {
      throw new Error(discountValidation.error ?? 'Popusti nisu ispravni za ovu osnovnu cenu.')
    }
  }
  const commercialDiscountCents = calculateTotalDiscounts(appliedDiscounts)

  if (method === 'ONE_TIME') {
    if (!terms.oneTime?.enabled) throw new Error('Jednokratno plaćanje nije dostupno u ovoj ponudi.')
    const oneTimeOfferDiscountCents = terms.oneTime.discountCents ?? 0
    const totalDiscountCents = oneTimeOfferDiscountCents + commercialDiscountCents
    return {
      basePriceCents,
      currency: 'USD',
      discountCents: totalDiscountCents,
      installmentSchedule: [],
      method,
      payWhenYouEarn: null,
      totalCents: Math.max(0, basePriceCents - totalDiscountCents),
    }
  }

  if (method === 'INSTALLMENTS') {
    if (!terms.installments?.enabled) throw new Error('Plaćanje na rate nije dostupno u ovoj ponudi.')
    const effectiveTotalCents = Math.max(0, basePriceCents - commercialDiscountCents)
    const rawItems = (terms.installments.items ?? []).map((item) => ({
      amountCents: item.amountCents as number,
      dueAt: item.dueAt as string,
      label: item.label as string,
    }))
    const installmentSchedule =
      commercialDiscountCents > 0
        ? adjustInstallmentsForDiscount(rawItems, effectiveTotalCents)
        : rawItems

    return {
      basePriceCents,
      currency: 'USD',
      discountCents: commercialDiscountCents,
      installmentSchedule,
      method,
      payWhenYouEarn: null,
      totalCents: effectiveTotalCents,
    }
  }

  if (!terms.payWhenYouEarn?.enabled) throw new Error('PKZ model nije dostupan u ovoj ponudi.')
  const effectiveTotalCents = Math.max(0, basePriceCents - commercialDiscountCents)
  const depositCents = Math.max(0, (terms.payWhenYouEarn.depositCents as number) - commercialDiscountCents)
  const deferredAmountCents = effectiveTotalCents - depositCents
  return {
    basePriceCents,
    currency: 'USD',
    discountCents: commercialDiscountCents,
    installmentSchedule: [],
    method,
    payWhenYouEarn: {
      deferredAmountCents,
      depositCents,
      description: terms.payWhenYouEarn.description as string,
    },
    totalCents: effectiveTotalCents,
  }
}
