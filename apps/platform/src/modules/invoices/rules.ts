import { amountInWordsSerbian } from './numberToWordsSerbian.ts'

export const EXCHANGE_RATE_SCALE = 1_000_000

export type InvoiceCurrency = 'EUR' | 'RSD' | 'USD'

export type CandidateInvoiceInput = {
  accountingDate?: string
  buyerAddress: string
  buyerIdentificationNumber?: string
  buyerName: string
  candidateAccountId: number
  candidatePaymentId: number
  candidateProcessId: number
  exchangeRateDate: string
  exchangeRateScaled: number
  exchangeRateSource?: string
  issueDate: string
  note?: string
  originalAmountCents: number
  originalCurrency: InvoiceCurrency
  preApplicationId: number
  sequenceNumber: number
  year: number
}

export type CandidateInvoiceData = {
  accountingDate: string
  amountInWords: string
  buyerAddress: string
  buyerIdentificationNumber: string
  buyerName: string
  candidateAccountId: number
  candidatePaymentId: number
  candidateProcessId: number
  exchangeRateDate: string
  exchangeRateFormatted: string
  exchangeRateScaled: number
  exchangeRateSource: string
  invoiceNumber: string
  issueDate: string
  note: string
  originalAmountCents: number
  originalAmountFormatted: string
  originalCurrency: InvoiceCurrency
  preApplicationId: number
  sequenceNumber: number
  settlementAmountRsdCents: number
  settlementAmountRsdFormatted: string
  year: number
}

export function formatInvoiceNumber(year: number, sequenceNumber: number): string {
  return `FAKT-${year}-${sequenceNumber.toString().padStart(4, '0')}`
}

export function scaledRateToString(value: number): string {
  return (value / EXCHANGE_RATE_SCALE).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

export function calculateSettlementRsdCents(
  originalAmountCents: number,
  currency: InvoiceCurrency,
  exchangeRateScaled: number,
): number {
  if (!Number.isSafeInteger(originalAmountCents) || originalAmountCents <= 0) {
    throw new Error('Iznos uplate mora biti pozitivan broj.')
  }
  if (currency === 'RSD') {
    return originalAmountCents
  }
  if (!Number.isSafeInteger(exchangeRateScaled) || exchangeRateScaled <= 0) {
    throw new Error('Kurs NBS nije ispravan.')
  }
  const amountRsd = Math.round((originalAmountCents * exchangeRateScaled) / EXCHANGE_RATE_SCALE)
  if (!Number.isSafeInteger(amountRsd) || amountRsd <= 0) {
    throw new Error('Obračunati iznos u dinarima nije ispravan.')
  }
  return amountRsd
}

export function prepareCandidateInvoice(input: CandidateInvoiceInput): CandidateInvoiceData {
  const year = input.year || new Date(input.issueDate).getFullYear()
  const sequenceNumber = input.sequenceNumber
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error('Redni broj fakture mora biti pozitivan ceo broj.')
  }
  const invoiceNumber = formatInvoiceNumber(year, sequenceNumber)

  const settlementAmountRsdCents = calculateSettlementRsdCents(
    input.originalAmountCents,
    input.originalCurrency,
    input.exchangeRateScaled,
  )

  const dinars = Math.floor(settlementAmountRsdCents / 100)
  const paras = settlementAmountRsdCents % 100
  const amountInWords = amountInWordsSerbian(dinars, paras)

  const originalAmountFormatted = new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(input.originalAmountCents / 100)

  const settlementAmountRsdFormatted = new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(settlementAmountRsdCents / 100)

  const exchangeRateSource = input.exchangeRateSource?.trim() || 'Zvanični srednji kurs NBS'
  const exchangeRateFormatted = input.originalCurrency === 'RSD'
    ? '1.000000'
    : scaledRateToString(input.exchangeRateScaled)

  return {
    accountingDate: input.accountingDate || input.issueDate,
    amountInWords,
    buyerAddress: input.buyerAddress.trim(),
    buyerIdentificationNumber: input.buyerIdentificationNumber?.trim() || 'Nije uneto',
    buyerName: input.buyerName.trim(),
    candidateAccountId: input.candidateAccountId,
    candidatePaymentId: input.candidatePaymentId,
    candidateProcessId: input.candidateProcessId,
    exchangeRateDate: input.exchangeRateDate,
    exchangeRateFormatted,
    exchangeRateScaled: input.exchangeRateScaled,
    exchangeRateSource,
    invoiceNumber,
    issueDate: input.issueDate,
    note: input.note?.trim() || `Uplata po ugovoru za program Work and Travel`,
    originalAmountCents: input.originalAmountCents,
    originalAmountFormatted: `${originalAmountFormatted} ${input.originalCurrency}`,
    originalCurrency: input.originalCurrency,
    preApplicationId: input.preApplicationId,
    sequenceNumber,
    settlementAmountRsdCents,
    settlementAmountRsdFormatted: `${settlementAmountRsdFormatted} RSD`,
    year,
  }
}

export type KirEntry = {
  accountingDate: string
  buyerIdentificationNumber: string
  buyerName: string
  invoiceAmountRsdFormatted: string
  invoiceAmountRsdMinor: number
  invoiceDate: string
  invoiceNumber: string
  note: string
  sequenceNumber: number
}

export function invoiceToKirEntry(invoice: CandidateInvoiceData): KirEntry {
  return {
    accountingDate: new Intl.DateTimeFormat('sr-Latn-RS', {
      dateStyle: 'medium',
      timeZone: 'Europe/Belgrade',
    }).format(new Date(invoice.accountingDate)),
    buyerIdentificationNumber: invoice.buyerIdentificationNumber,
    buyerName: invoice.buyerName,
    invoiceAmountRsdFormatted: invoice.settlementAmountRsdFormatted,
    invoiceAmountRsdMinor: invoice.settlementAmountRsdCents,
    invoiceDate: new Intl.DateTimeFormat('sr-Latn-RS', {
      dateStyle: 'medium',
      timeZone: 'Europe/Belgrade',
    }).format(new Date(invoice.issueDate)),
    invoiceNumber: invoice.invoiceNumber,
    note: invoice.note,
    sequenceNumber: invoice.sequenceNumber,
  }
}
