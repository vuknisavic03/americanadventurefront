import { describe, expect, it } from 'vitest'

import { renderContractPdf } from './renderContractPdf.ts'

describe('contract PDF renderer', () => {
  it('creates a multi-page Unicode PDF with the immutable contract number', async () => {
    const bytes = await renderContractPdf({
      body: Array.from({ length: 90 }, (_, index) => `${index + 1}. Kandidat Željko Živković prihvata demonstracione uslove.`).join('\n'),
      candidateName: 'Željko Živković',
      contractDate: new Date('2026-09-01T09:00:00.000Z'),
      contractNumber: 'AA-SWT-2026-000001',
      paymentLabel: 'Jednokratno',
      programLabel: 'Work & Travel USA',
      totalLabel: '2.500,00 USD',
    })
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(10_000)
  })

  it('creates a separate accepted PDF with acceptance evidence', async () => {
    const bytes = await renderContractPdf({
      acceptance: {
        acceptedAt: new Date('2026-09-01T14:00:00.000Z'),
        reference: 'AA-ACCEPT-0123456789ABCDEF',
        statement: 'Potvrđujem da sam pročitao/la ugovor i da ga prihvatam.',
        statementVersion: '1.0',
      },
      body: 'Uslovi test ugovora.',
      candidateName: 'Ana Anić',
      contractDate: new Date('2026-09-01T09:00:00.000Z'),
      contractNumber: 'AA-SWT-2026-000051',
      paymentLabel: 'Jednokratno',
      programLabel: 'Work & Travel USA',
      totalLabel: '2.700,00 USD',
    })
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(10_000)
  })
})

