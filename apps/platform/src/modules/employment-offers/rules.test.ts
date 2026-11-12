import { describe, expect, it } from 'vitest'

import {
  employmentOfferAcceptanceStatement,
  employmentOfferSnapshot,
  sha256,
  validateEmploymentOfferTerms,
  type EmploymentOfferTerms,
} from './rules.ts'

const terms: EmploymentOfferTerms = {
  candidateInstructions: 'Pročitajte uslove.',
  employerName: 'Synthetic Employer LLC',
  endDate: '2027-09-01T00:00:00.000Z',
  expectedWeeklyHours: 32,
  hourlyWageCents: 1_650,
  housingCostCents: 12_500,
  housingDescription: 'Sintetički smeštaj.',
  housingProvided: true,
  jobTitle: 'Pool Attendant',
  responseDueAt: '2026-09-12T12:00:00.000Z',
  startDate: '2027-05-20T00:00:00.000Z',
  workCity: 'Ocean City',
  workState: 'Maryland',
}

describe('employment offer rules', () => {
  it('validates and deterministically fingerprints concrete terms', () => {
    expect(() => validateEmploymentOfferTerms(terms, new Date('2026-09-08T10:00:00.000Z'))).not.toThrow()
    expect(sha256(employmentOfferSnapshot(terms, 1))).toHaveLength(64)
    expect(employmentOfferSnapshot(terms, 1)).toBe(employmentOfferSnapshot({ ...terms }, 1))
  })

  it('rejects invalid dates, hours, and housing combinations', () => {
    expect(() => validateEmploymentOfferTerms({ ...terms, endDate: terms.startDate }, new Date())).toThrow('posle početka')
    expect(() => validateEmploymentOfferTerms({ ...terms, expectedWeeklyHours: 81 }, new Date())).toThrow('između 1 i 80')
    expect(() => validateEmploymentOfferTerms({ ...terms, housingProvided: false }, new Date())).toThrow('samo kada')
  })

  it('binds the acceptance statement to the visible offer', () => {
    expect(employmentOfferAcceptanceStatement(2, terms.employerName, terms.jobTitle)).toContain('verzije 2')
    expect(employmentOfferAcceptanceStatement(2, terms.employerName, terms.jobTitle)).toContain(terms.employerName)
  })
})
