import { describe, expect, it } from 'vitest'
import { prepareCandidateInvoice } from './rules.ts'
import { renderInvoicePdf } from './renderInvoicePdf.ts'
import { preparePaymentSlip } from './paymentSlips.ts'
import { renderPaymentSlipPdf } from './renderPaymentSlipPdf.ts'

describe('PDF Rendering', () => {
  it('renders official invoice PDF with SHA-256 checksum and variables', async () => {
    const invoice = prepareCandidateInvoice({
      buyerAddress: 'Knez Mihailova 1, Beograd',
      buyerIdentificationNumber: '1234567890123',
      buyerName: 'Marko Marković',
      candidateAccountId: 1,
      candidatePaymentId: 2,
      candidateProcessId: 3,
      exchangeRateDate: '2026-10-09T10:00:00Z',
      exchangeRateScaled: 108_500_000,
      issueDate: '2026-10-09T12:00:00Z',
      note: 'I rata programa',
      originalAmountCents: 35000,
      originalCurrency: 'USD',
      preApplicationId: 4,
      sequenceNumber: 1,
      year: 2026,
    })

    const { bytes, checksum } = await renderInvoicePdf(invoice)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
    expect(checksum).toMatch(/^[a-f0-9]{64}$/)

    // PDF magic bytes %PDF
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('renders payment slip PDF with SHA-256 checksum', async () => {
    const slip = preparePaymentSlip({
      candidateAddress: 'Terazije 5, Beograd',
      candidateName: 'Jelena Jelić',
      currency: 'RSD',
      obligationKey: 'INITIAL',
      obligationLabel: 'I rata programa',
      paymentAmountRsd: 37975,
    }, 5)

    const { bytes, checksum } = await renderPaymentSlipPdf(slip)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
    expect(checksum).toMatch(/^[a-f0-9]{64}$/)

    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })
})
