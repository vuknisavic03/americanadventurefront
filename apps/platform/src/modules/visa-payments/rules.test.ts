import { describe, expect, it } from 'vitest'

import {
  normalizeVisaPaymentOrderTerms,
  sha256,
  validateVisaPaymentOrderTerms,
  visaPaymentOrderNumber,
  visaPaymentOrderSnapshot,
  type VisaPaymentOrderTerms,
} from './rules.ts'

const terms: VisaPaymentOrderTerms = {
  amountMinor: 18_500_00,
  bankAccount: '840-0000000000000-00',
  beneficiaryAddress: 'Sintetička adresa 1, Beograd',
  beneficiaryName: 'Sintetički primalac',
  candidateInstructions: 'Sačuvajte potvrdu o uplati.',
  currency: 'RSD',
  dueAt: '2026-09-20T21:59:59.000Z',
  paymentModel: '97',
  paymentPurpose: 'Troškovi viziranja za Work & Travel USA',
  paymentReference: 'SYNTHETIC-2026-001',
}

describe('visa payment order rules', () => {
  it('validates, normalizes, and deterministically fingerprints an issued order', () => {
    const now = new Date('2026-09-09T08:00:00.000Z')
    expect(() => validateVisaPaymentOrderTerms(terms, now)).not.toThrow()
    const normalized = normalizeVisaPaymentOrderTerms({ ...terms, beneficiaryName: `  ${terms.beneficiaryName}  ` })
    expect(normalized.beneficiaryName).toBe(terms.beneficiaryName)
    const number = visaPaymentOrderNumber(41, 1, now)
    expect(number).toBe('AA-VISA-2026-000041-V1')
    expect(sha256(visaPaymentOrderSnapshot(normalized, number, 1))).toHaveLength(64)
    expect(visaPaymentOrderSnapshot(normalized, number, 1)).toBe(visaPaymentOrderSnapshot({ ...normalized }, number, 1))
  })

  it('rejects invalid amounts, unsupported deadlines, and incomplete instructions', () => {
    const now = new Date('2026-09-09T08:00:00.000Z')
    expect(() => validateVisaPaymentOrderTerms({ ...terms, amountMinor: 0 }, now)).toThrow('Iznos')
    expect(() => validateVisaPaymentOrderTerms({ ...terms, dueAt: now.toISOString() }, now)).toThrow('budućnosti')
    expect(() => validateVisaPaymentOrderTerms({ ...terms, candidateInstructions: '' }, now)).toThrow('Uputstvo')
  })

  it('binds the fingerprint to financial terms and the version number', () => {
    const number = 'AA-VISA-2026-000041-V1'
    const first = sha256(visaPaymentOrderSnapshot(terms, number, 1))
    const changedAmount = sha256(visaPaymentOrderSnapshot({ ...terms, amountMinor: terms.amountMinor + 1 }, number, 1))
    const changedVersion = sha256(visaPaymentOrderSnapshot(terms, `${number.slice(0, -1)}2`, 2))
    expect(changedAmount).not.toBe(first)
    expect(changedVersion).not.toBe(first)
  })
})
