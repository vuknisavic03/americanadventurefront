import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { renderGuarantorContractPdf } from './renderGuarantorContractPdf.ts'
import type { GuarantorContractTerms } from './types.ts'

describe('renderGuarantorContractPdf', () => {
  const sampleTerms: GuarantorContractTerms = {
    agency: {
      address: 'Makedonska 22, 11000 Beograd',
      director: 'Aleksandar Popović',
      mb: '20123456',
      name: 'American Adventure d.o.o. Beograd',
      pib: '107654321',
    },
    candidate: {
      address: 'Bulevar kralja Aleksandra 73, 11000 Beograd',
      fullName: 'Jovan Jovanović',
      idCardNumber: '998877665',
      jmbg: '0101000******',
      phone: '+38164111222',
    },
    contractDate: new Date('2026-10-12T12:00:00Z'),
    contractNumber: 'AA-JEM-2026-000123',
    finance: {
      currency: 'USD',
      deferredAmountCents: 150_000,
      depositCents: 50_000,
      promissoryNotesCount: 2,
      totalPriceCents: 200_000,
    },
    guarantor: {
      address: 'Kneza Miloša 14, 11000 Beograd',
      employerName: 'Telekom Srbija a.d.',
      employmentStatusLabel: 'Zaposlen/a na neodređeno vreme',
      fullName: 'Marko Jovanović',
      idCardIssuer: 'PU Beograd, PS Stari Grad',
      idCardNumber: '012345678',
      jmbg: '1505975******',
      monthlyIncomeRsd: 125_000,
      phone: '+381641234567',
      relationshipLabel: 'Roditelj',
    },
  }

  it('renders a valid, parseable multi-party PDF document', async () => {
    const pdfBytes = await renderGuarantorContractPdf(sampleTerms)
    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(1_000)

    // Verify magic bytes %PDF-
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('utf8')
    expect(header).toBe('%PDF-')

    // Parse with pdf-lib to ensure integrity
    const parsed = await PDFDocument.load(pdfBytes)
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1)
    expect(parsed.getTitle()).toBe('Ugovor o jemstvu AA-JEM-2026-000123')
  })
})
