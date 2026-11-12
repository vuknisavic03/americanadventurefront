import { describe, expect, it } from 'vitest'
import {
  calculateSettlementRsdCents,
  formatInvoiceNumber,
  invoiceToKirEntry,
  prepareCandidateInvoice,
} from './rules.ts'

describe('Invoices and KIR rules', () => {
  it('formats invoice numbers with year and 4-digit sequence padding', () => {
    expect(formatInvoiceNumber(2026, 1)).toBe('FAKT-2026-0001')
    expect(formatInvoiceNumber(2026, 42)).toBe('FAKT-2026-0042')
    expect(formatInvoiceNumber(2026, 1234)).toBe('FAKT-2026-1234')
  })

  it('calculates settlement RSD cents using NBS 6-decimal scaled rate', () => {
    // $350.00 USD at 108.500000 RSD/USD (108_500_000 scaled)
    const amountCents = 35000 // $350.00
    const scaledRate = 108_500_000
    const rsdCents = calculateSettlementRsdCents(amountCents, 'USD', scaledRate)
    // 35000 * 108.5 = 3,797,500 RSD cents = 37,975.00 RSD
    expect(rsdCents).toBe(3_797_500)
  })

  it('prepares candidate invoice with variables: name, number, digits, words', () => {
    const invoice = prepareCandidateInvoice({
      buyerAddress: 'Bulevar Kralja Aleksandra 73, Beograd',
      buyerIdentificationNumber: '0101999710011',
      buyerName: 'Jovan Jovanović',
      candidateAccountId: 10,
      candidatePaymentId: 20,
      candidateProcessId: 30,
      exchangeRateDate: '2026-10-09T10:00:00Z',
      exchangeRateScaled: 108_500_000,
      issueDate: '2026-10-09T12:00:00Z',
      note: 'Prva rata programa Work and Travel',
      originalAmountCents: 35000,
      originalCurrency: 'USD',
      preApplicationId: 5,
      sequenceNumber: 1,
      year: 2026,
    })

    expect(invoice.buyerName).toBe('Jovan Jovanović')
    expect(invoice.invoiceNumber).toBe('FAKT-2026-0001')
    expect(invoice.settlementAmountRsdFormatted).toBe('37.975,00 RSD')
    expect(invoice.amountInWords).toContain('trideset sedam hiljada')
    expect(invoice.amountInWords).toContain('dinara')
  })

  it('transforms invoice to official KIR book entry matching Section 17 template', () => {
    const invoice = prepareCandidateInvoice({
      buyerAddress: 'Novi Sad',
      buyerIdentificationNumber: '1234567890123',
      buyerName: 'Ana Anić',
      candidateAccountId: 11,
      candidatePaymentId: 21,
      candidateProcessId: 31,
      exchangeRateDate: '2026-10-09T10:00:00Z',
      exchangeRateScaled: 108_500_000,
      issueDate: '2026-10-09T12:00:00Z',
      note: 'Druga rata',
      originalAmountCents: 20000,
      originalCurrency: 'USD',
      preApplicationId: 6,
      sequenceNumber: 2,
      year: 2026,
    })

    const kir = invoiceToKirEntry(invoice)
    expect(kir.sequenceNumber).toBe(2)
    expect(kir.invoiceNumber).toBe('FAKT-2026-0002')
    expect(kir.buyerName).toBe('Ana Anić')
    expect(kir.buyerIdentificationNumber).toBe('1234567890123')
    expect(kir.note).toBe('Druga rata')
  })
})
