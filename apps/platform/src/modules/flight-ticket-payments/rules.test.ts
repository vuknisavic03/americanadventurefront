import { describe, expect, it } from 'vitest'

import { EXCHANGE_RATE_SCALE, normalizeFlightTicketPaymentTerms, rateToScaled, settlementAmount, validateFlightTicketPaymentTerms } from './rules.ts'

const terms = {
  bankAccount: '160-0000000000000-00', beneficiaryAddress: 'Knez Mihailova 1, Beograd', beneficiaryName: 'American Adventure',
  candidateInstructions: 'Uplatite do roka.', dueAt: '2026-10-10T21:59:59.000Z', exchangeRateDate: '2026-09-24T10:00:00.000Z',
  exchangeRateScaled: 117_152_300, exchangeRateSource: 'Srednji kurs NBS', includeAdvanceInvoice: false,
  paymentPurpose: 'Avionska karta', paymentReference: '2026-0001',
}

describe('flight ticket payment rules', () => {
  it('calculates RSD minor units without floating point drift', () => {
    expect(rateToScaled('117,1523')).toBe(117_152_300)
    expect(settlementAmount(85_000, 'EUR', 117_152_300)).toBe(9_957_946)
  })

  it('uses rate 1 for an RSD offer', () => {
    const normalized = normalizeFlightTicketPaymentTerms({ ...terms, exchangeRateScaled: 3, exchangeRateSource: '' }, 'RSD')
    expect(normalized.exchangeRateScaled).toBe(EXCHANGE_RATE_SCALE)
    expect(settlementAmount(99_900, 'RSD', 3)).toBe(99_900)
  })

  it('requires issuer identity for an advance document', () => {
    expect(() => validateFlightTicketPaymentTerms({ ...terms, advanceInvoiceNumber: 'AV-1', includeAdvanceInvoice: true }, 'EUR', new Date('2026-09-24T12:00:00.000Z'))).toThrow('PIB')
  })
})
