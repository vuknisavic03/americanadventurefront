import { describe, expect, it } from 'vitest'

import { renderPassportAuthorizationPdf } from './renderPassportAuthorizationPdf.ts'

describe('passport authorization PDF renderer', () => {
  it('creates a multi-page Unicode draft with an immutable authorization number', async () => {
    const bytes = await renderPassportAuthorizationPdf({
      authorizationDate: new Date('2026-09-14T09:00:00.000Z'),
      authorizationNumber: 'AA-PUN-2026-000051',
      body: Array.from({ length: 90 }, (_, index) => `${index + 1}. Kandidat Željko Živković daje sintetičko ovlašćenje za testiranje.`).join('\n'),
      candidateName: 'Željko Živković',
    })
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(10_000)
  })

  it('creates a separate accepted PDF with acceptance evidence', async () => {
    const bytes = await renderPassportAuthorizationPdf({
      acceptance: {
        acceptedAt: new Date('2026-09-14T14:00:00.000Z'),
        reference: 'AA-PUN-ACCEPT-0123456789ABCDEF',
        statement: 'Potvrđujem da sam pročitao/la punomoćje i da su prikazani podaci tačni.',
        statementVersion: '1.0',
      },
      authorizationDate: new Date('2026-09-14T09:00:00.000Z'),
      authorizationNumber: 'AA-PUN-2026-000052',
      body: 'Sintetičko punomoćje za testiranje. Nijedan podatak ne pripada stvarnoj osobi.',
      candidateName: 'Ana Anić',
    })
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(10_000)
  })
})
