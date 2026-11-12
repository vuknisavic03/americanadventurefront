import { describe, expect, it } from 'vitest'
import { renderResponsibilityStatementPdf } from './renderResponsibilityStatementPdf.ts'

describe('renderResponsibilityStatementPdf', () => {
  it('renders a 1-page PDF matching Izjava o odgovornosti with candidate name, jmbg and passport number', async () => {
    const pdfBytes = await renderResponsibilityStatementPdf({
      candidateName: 'Nikola Petrović',
      jmbg: '1203001710045',
      passportNumber: '012948123',
      contractNumber: 'AA-2026-1042',
      sourceInfo: 'Preporuka kolege sa fakulteta',
      isAccepted: true,
      acceptedAt: new Date('2026-11-01T12:00:00Z'),
    })

    expect(Buffer.from(pdfBytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdfBytes.length).toBeGreaterThan(5000)
  })
})
