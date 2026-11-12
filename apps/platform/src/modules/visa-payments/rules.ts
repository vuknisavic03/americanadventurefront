import { createHash } from 'node:crypto'

export type VisaPaymentCurrency = 'RSD' | 'USD'

export type VisaPaymentOrderTerms = {
  amountMinor: number
  bankAccount: string
  beneficiaryAddress?: string
  beneficiaryName: string
  candidateInstructions: string
  currency: VisaPaymentCurrency
  dueAt: string
  paymentModel?: string
  paymentPurpose: string
  paymentReference: string
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function bounded(value: string, minimum: number, maximum: number, label: string) {
  const length = value.trim().length
  if (length < minimum || length > maximum) throw new Error(`${label} nema dozvoljenu dužinu.`)
}

export function normalizeVisaPaymentOrderTerms(terms: VisaPaymentOrderTerms): VisaPaymentOrderTerms {
  return {
    amountMinor: terms.amountMinor,
    bankAccount: terms.bankAccount.trim(),
    beneficiaryAddress: terms.beneficiaryAddress?.trim() || undefined,
    beneficiaryName: terms.beneficiaryName.trim(),
    candidateInstructions: terms.candidateInstructions.trim(),
    currency: terms.currency,
    dueAt: new Date(terms.dueAt).toISOString(),
    paymentModel: terms.paymentModel?.trim() || undefined,
    paymentPurpose: terms.paymentPurpose.trim(),
    paymentReference: terms.paymentReference.trim(),
  }
}

export function validateVisaPaymentOrderTerms(terms: VisaPaymentOrderTerms, now: Date) {
  if (!Number.isSafeInteger(terms.amountMinor) || terms.amountMinor < 1 || terms.amountMinor > 100_000_000_00) {
    throw new Error('Iznos viznog naloga nije ispravan.')
  }
  if (!['RSD', 'USD'].includes(terms.currency)) throw new Error('Valuta viznog naloga nije podržana.')
  bounded(terms.beneficiaryName, 2, 200, 'Naziv primaoca')
  bounded(terms.bankAccount, 5, 100, 'Račun primaoca')
  bounded(terms.paymentPurpose, 5, 500, 'Svrha uplate')
  bounded(terms.paymentReference, 2, 100, 'Poziv na broj')
  bounded(terms.candidateInstructions, 2, 2_000, 'Uputstvo kandidatu')
  if (terms.beneficiaryAddress && terms.beneficiaryAddress.trim().length > 300) {
    throw new Error('Adresa primaoca ne može biti duža od 300 znakova.')
  }
  if (terms.paymentModel && terms.paymentModel.trim().length > 20) {
    throw new Error('Model plaćanja ne može biti duži od 20 znakova.')
  }
  const dueAt = new Date(terms.dueAt)
  if (Number.isNaN(dueAt.getTime()) || dueAt <= now) throw new Error('Rok za uplatu mora biti u budućnosti.')
  const latestAllowed = new Date(now)
  latestAllowed.setUTCFullYear(latestAllowed.getUTCFullYear() + 2)
  if (dueAt > latestAllowed) throw new Error('Rok za uplatu ne može biti udaljen više od dve godine.')
}

export function visaPaymentOrderSnapshot(terms: VisaPaymentOrderTerms, orderNumber: string, orderVersion: number) {
  const normalized = normalizeVisaPaymentOrderTerms(terms)
  return JSON.stringify({
    ...normalized,
    beneficiaryAddress: normalized.beneficiaryAddress ?? null,
    orderNumber,
    orderVersion,
    paymentModel: normalized.paymentModel ?? null,
  })
}

export function visaPaymentOrderNumber(applicationId: number, orderVersion: number, issuedAt: Date) {
  const year = issuedAt.getUTCFullYear()
  return `AA-VISA-${year}-${String(applicationId).padStart(6, '0')}-V${orderVersion}`
}
