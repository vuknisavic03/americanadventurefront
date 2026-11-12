import { describe, expect, it } from 'vitest'

import { renderFlightTicketPaymentPdf } from './renderPdf.ts'

describe('flight ticket payment PDF', () => {
  it('creates a valid PDF containing the frozen payment document', async () => {
    const bytes = await renderFlightTicketPaymentPdf({
      airlineName: 'Air Serbia', bankAccount: '160-0000000000000-00', beneficiaryAddress: 'Beograd', beneficiaryName: 'American Adventure',
      candidateAddress: 'Novi Sad', candidateInstructions: 'Uplatu izvršite do roka.', candidateName: 'Test Kandidat', dueAt: new Date('2026-10-01T12:00:00Z'),
      exchangeRateDate: new Date('2026-09-24T12:00:00Z'), exchangeRateScaled: 117_152_300, exchangeRateSource: 'Srednji kurs NBS', includeAdvanceInvoice: false,
      issuedAt: new Date('2026-09-24T12:00:00Z'), orderNumber: 'AA-AIR-2026-000001-V1', originalAmountMinor: 85_000, originalCurrency: 'EUR',
      outboundDepartureAt: new Date('2026-10-15T10:00:00Z'), outboundRoute: 'BEG-JFK', paymentPurpose: 'Avionska karta', paymentReference: '2026-1',
      returnDepartureAt: new Date('2027-02-15T10:00:00Z'), returnRoute: 'JFK-BEG', settlementAmountMinor: 9_957_946,
    })
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe('%PDF')
    expect(bytes.length).toBeGreaterThan(10_000)
  })
})
