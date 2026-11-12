import { createHash } from 'node:crypto'

export const EXCHANGE_RATE_SCALE = 1_000_000
export type TicketCurrency = 'EUR' | 'RSD' | 'USD'

export type FlightTicketPaymentTerms = {
  advanceInvoiceNumber?: string
  bankAccount: string
  beneficiaryAddress: string
  beneficiaryName: string
  beneficiaryRegistrationNumber?: string
  beneficiaryTaxId?: string
  candidateInstructions: string
  dueAt: string
  exchangeRateDate: string
  exchangeRateReference?: string
  exchangeRateScaled: number
  exchangeRateSource: string
  includeAdvanceInvoice: boolean
  paymentModel?: string
  paymentPurpose: string
  paymentReference: string
}

function text(value: string, minimum: number, maximum: number, label: string) {
  const normalized = value.trim()
  if (normalized.length < minimum || normalized.length > maximum) throw new Error(`${label} mora imati između ${minimum} i ${maximum} znakova.`)
  return normalized
}

export function sha256(value: string | Uint8Array) { return createHash('sha256').update(value).digest('hex') }

export function rateToScaled(value: string) {
  if (!/^\d+(?:[.,]\d{1,6})?$/.test(value.trim())) throw new Error('Kurs mora biti pozitivan broj sa najviše šest decimala.')
  const scaled = Math.round(Number(value.replace(',', '.')) * EXCHANGE_RATE_SCALE)
  if (!Number.isSafeInteger(scaled) || scaled < 1) throw new Error('Kurs nije ispravan.')
  return scaled
}

export function scaledRateToString(value: number) {
  return (value / EXCHANGE_RATE_SCALE).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

export function settlementAmount(originalAmountMinor: number, currency: TicketCurrency, exchangeRateScaled: number) {
  if (!Number.isSafeInteger(originalAmountMinor) || originalAmountMinor < 1) throw new Error('Cena iz ponude nije ispravna.')
  const rate = currency === 'RSD' ? EXCHANGE_RATE_SCALE : exchangeRateScaled
  if (!Number.isSafeInteger(rate) || rate < 1) throw new Error('Kurs nije ispravan.')
  const amount = Math.round((originalAmountMinor * rate) / EXCHANGE_RATE_SCALE)
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Obračunati iznos nije ispravan.')
  return amount
}

export function normalizeFlightTicketPaymentTerms(input: FlightTicketPaymentTerms, originalCurrency: TicketCurrency) {
  const includeAdvanceInvoice = Boolean(input.includeAdvanceInvoice)
  const exchangeRateScaled = originalCurrency === 'RSD' ? EXCHANGE_RATE_SCALE : input.exchangeRateScaled
  const exchangeRateSource = originalCurrency === 'RSD' ? 'Nije primenljivo - izvorna cena je u RSD' : text(input.exchangeRateSource, 2, 200, 'Izvor kursa')
  const exchangeRateReference = originalCurrency === 'RSD' ? undefined : input.exchangeRateReference?.trim() || undefined
  return {
    advanceInvoiceNumber: includeAdvanceInvoice ? text(input.advanceInvoiceNumber ?? '', 2, 100, 'Broj avansnog dokumenta') : undefined,
    bankAccount: text(input.bankAccount, 5, 100, 'Račun primaoca'),
    beneficiaryAddress: text(input.beneficiaryAddress, 3, 300, 'Adresa primaoca'),
    beneficiaryName: text(input.beneficiaryName, 2, 200, 'Primalac'),
    beneficiaryRegistrationNumber: input.beneficiaryRegistrationNumber?.trim() || undefined,
    beneficiaryTaxId: input.beneficiaryTaxId?.trim() || undefined,
    candidateInstructions: text(input.candidateInstructions, 2, 2_000, 'Uputstvo kandidatu'),
    dueAt: new Date(input.dueAt).toISOString(),
    exchangeRateDate: new Date(input.exchangeRateDate).toISOString(),
    exchangeRateReference,
    exchangeRateScaled,
    exchangeRateSource,
    includeAdvanceInvoice,
    paymentModel: input.paymentModel?.trim() || undefined,
    paymentPurpose: text(input.paymentPurpose, 2, 500, 'Svrha uplate'),
    paymentReference: text(input.paymentReference, 2, 100, 'Poziv na broj'),
  }
}

export function validateFlightTicketPaymentTerms(input: FlightTicketPaymentTerms, originalCurrency: TicketCurrency, now: Date) {
  if (!Number.isFinite(new Date(input.dueAt).getTime()) || new Date(input.dueAt) <= now) throw new Error('Rok za uplatu mora biti u budućnosti.')
  if (!Number.isFinite(new Date(input.exchangeRateDate).getTime()) || new Date(input.exchangeRateDate) > now) throw new Error('Datum kursa nije ispravan.')
  if (originalCurrency !== 'RSD' && (!Number.isSafeInteger(input.exchangeRateScaled) || input.exchangeRateScaled < 1)) throw new Error('Unesite važeći kurs NBS.')
  if (input.includeAdvanceInvoice && (!input.beneficiaryTaxId?.trim() || !input.beneficiaryRegistrationNumber?.trim())) throw new Error('Za avansni dokument unesite PIB i matični broj izdavaoca.')
  normalizeFlightTicketPaymentTerms(input, originalCurrency)
}

export function flightTicketPaymentOrderNumber(candidateProcessId: number, version: number, now: Date) {
  return `AA-AIR-${now.getUTCFullYear()}-${String(candidateProcessId).padStart(6, '0')}-V${version}`
}

export function flightTicketPaymentSnapshot(value: Record<string, unknown>) {
  return JSON.stringify(value)
}
