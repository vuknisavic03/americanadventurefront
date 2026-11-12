import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  generateInvoiceForPayment,
  getKirBook,
  getPaymentSlipForCandidate,
} from './service.ts'

describe('invoices service', () => {
  it('generates an official invoice and KIR entry for a recorded payment', async () => {
    const payment = {
      amountCents: 35000,
      candidateAccount: 10,
      currency: 'USD',
      entryType: 'PAYMENT',
      id: 20,
      note: 'I rata programa',
      preApplication: 30,
      receivedAt: '2026-10-09T10:00:00.000Z',
    }

    const preApp = {
      applicant: {
        firstName: 'Petar',
        lastName: 'Petrović',
        residentialAddress: 'Knez Mihailova 1, Beograd',
      },
      correlationId: 'corr-123',
      id: 30,
      status: 'READY_FOR_PROFILE',
      workflowVersion: 1,
    }

    const process = { id: 40 }
    const createdInvoice = {
      id: 50,
      invoiceNumber: 'FAKT-2026-0001',
      pdfSha256: 'mock-sha-256',
    }

    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-invoices') return createdInvoice
        if (collection === 'audit-events') return { id: 99 }
        throw new Error(`Unexpected create collection: ${collection}`)
      }),
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-invoices') return { docs: [] }
        if (collection === 'candidate-processes') return { docs: [process] }
        if (collection === 'candidate-sensitive-profiles') return { docs: [{ passportNumber: 'P12345678' }] }
        return { docs: [] }
      }),
      findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'candidate-payments' && id === 20) return payment
        if (collection === 'pre-applications' && id === 30) return preApp
        throw new Error(`Unexpected findByID collection: ${collection}`)
      }),
    } as unknown as Payload

    const result = await generateInvoiceForPayment({
      administratorId: 1,
      candidatePaymentId: 20,
      exchangeRateDate: '2026-10-09T10:00:00.000Z',
      exchangeRateScaled: 108_500_000,
      now: new Date('2026-10-09T12:00:00.000Z'),
      payload,
    })

    expect(result.created).toBe(true)
    expect(result.invoice.invoiceNumber).toBe('FAKT-2026-0001')
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-invoices',
        data: expect.objectContaining({
          buyerName: 'Petar Petrović',
          candidateAccount: 10,
          candidatePayment: 20,
          invoiceNumber: 'FAKT-2026-0001',
          originalAmountCents: 35000,
          originalCurrency: 'USD',
          settlementAmountRsdCents: 3797500,
        }),
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          eventType: 'INVOICE_GENERATED',
        }),
      }),
    )
  })

  it('returns existing invoice idempotently if one was already issued', async () => {
    const existing = {
      id: 50,
      invoiceNumber: 'FAKT-2026-0001',
      pdfSha256: 'existing-hash-123',
    }

    const payload = {
      find: vi.fn(async () => ({ docs: [existing] })),
    } as unknown as Payload

    const result = await generateInvoiceForPayment({
      administratorId: 1,
      candidatePaymentId: 20,
      payload,
    })

    expect(result.created).toBe(false)
    expect(result.invoice).toEqual(existing)
    expect(result.pdfChecksum).toBe('existing-hash-123')
  })

  it('retrieves KIR book entries mapped from invoices', async () => {
    const invoices = [
      {
        accountingDate: '2026-10-09T12:00:00Z',
        amountInWords: 'trideset sedam hiljada...',
        buyerAddress: 'Beograd',
        buyerName: 'Marko Marković',
        buyerTaxId: '1234567890123',
        candidateAccount: 1,
        candidatePayment: 1,
        candidateProcess: 1,
        exchangeRateDate: '2026-10-09T10:00:00Z',
        exchangeRateScaled: 108_500_000,
        invoiceNumber: 'FAKT-2026-0001',
        issueDate: '2026-10-09T12:00:00Z',
        note: 'I rata',
        originalAmountCents: 35000,
        originalCurrency: 'USD',
        preApplication: 1,
        sequenceNumber: 1,
        settlementAmountRsdCents: 3797500,
        year: 2026,
      },
    ]

    const payload = {
      find: vi.fn(async () => ({ docs: invoices })),
    } as unknown as Payload

    const kir = await getKirBook({ payload, year: 2026 })
    expect(kir).toHaveLength(1)
    expect(kir[0].sequenceNumber).toBe(1)
    expect(kir[0].invoiceNumber).toBe('FAKT-2026-0001')
    expect(kir[0].buyerName).toBe('Marko Marković')
    expect(kir[0].buyerIdentificationNumber).toBe('1234567890123')
  })

  it('generates a payment slip PDF for candidate portal', async () => {
    const candidateAccount = {
      applicant: {
        firstName: 'Nikola',
        lastName: 'Tesla',
        residentialAddress: 'Bulevar Kralja Aleksandra 73',
      },
      fullName: 'Nikola Tesla',
      id: 10,
    }
    const plan = {
      obligations: [
        { amountCents: 35000, key: 'INITIAL', label: 'I rata' },
      ],
    }

    const payload = {
      findByID: vi.fn(async () => candidateAccount),
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-payment-plans') return { docs: [plan] }
        return { docs: [] }
      }),
    } as unknown as Payload

    const res = await getPaymentSlipForCandidate({
      candidateAccountId: 10,
      obligationKey: 'INITIAL',
      payload,
    })

    expect(res.slip.candidateName).toBe('Nikola Tesla')
    expect(res.slip.paymentCode).toBe('289')
    expect(res.bytes).toBeInstanceOf(Uint8Array)
    expect(res.checksum).toMatch(/^[a-f0-9]{64}$/)
  })
})
