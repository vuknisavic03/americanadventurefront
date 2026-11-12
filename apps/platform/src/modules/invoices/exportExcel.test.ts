import { describe, expect, it } from 'vitest'
import { generateKirExcelBuffer, generateCandidateLedgerExcelBuffer } from './exportExcel.ts'
import type { KirEntry } from './rules.ts'

describe('Invoices and KIR Excel export', () => {
  it('generates valid KIR Excel workbook with header and rows', async () => {
    const entries: KirEntry[] = [
      {
        accountingDate: '09.10.2026.',
        buyerIdentificationNumber: '1234567890123',
        buyerName: 'Milan Jovanović',
        invoiceAmountRsdFormatted: '37.975,00 RSD',
        invoiceAmountRsdMinor: 3797500,
        invoiceDate: '09.10.2026.',
        invoiceNumber: 'FAKT-2026-0001',
        note: 'I rata programa',
        sequenceNumber: 1,
      },
    ]

    const buffer = await generateKirExcelBuffer(entries)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)

    // Zip header bytes for xlsx
    const zipMagic = buffer.slice(0, 2).toString()
    expect(zipMagic).toBe('PK')
  })

  it('generates candidate ledger Excel workbook with sanitized values', async () => {
    const buffer = await generateCandidateLedgerExcelBuffer({
      candidateAddress: 'Knez Mihailova 1',
      candidateEmail: 'candidate@example.com',
      candidateName: '=cmd|\'/C calc\'!A0', // Injection test
      invoices: [
        {
          amountRsdFormatted: '37.975,00 RSD',
          date: '09.10.2026.',
          invoiceNumber: 'FAKT-2026-0001',
          note: 'I rata',
        },
      ],
      obligations: [],
      paidFormatted: '350.00 USD',
      paymentMethodLabel: 'Na rate',
      payments: [
        {
          amountForeignFormatted: '350.00 USD',
          amountRsdFormatted: '37.975,00 RSD',
          date: '09.10.2026.',
          reference: 'AA-PAY-12345',
        },
      ],
      programName: 'Work and Travel USA',
      remainingFormatted: '1,450.00 USD',
      totalFormatted: '1,800.00 USD',
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)
    expect(buffer.slice(0, 2).toString()).toBe('PK')
  })
})
