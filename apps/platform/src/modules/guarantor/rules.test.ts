import { describe, expect, it } from 'vitest'

import {
  formatGuarantorEmployment,
  formatGuarantorRelationship,
  maskJmbg,
  validateGuarantorInput,
  validateGuarantorJmbg,
} from './rules.ts'
import type { GuarantorSubmissionInput } from './types.ts'

describe('Guarantor rules', () => {
  const referenceDate = new Date('2026-10-12T12:00:00Z')

  describe('validateGuarantorJmbg', () => {
    it('validates a correct adult JMBG', () => {
      // 15.05.1975.
      const result = validateGuarantorJmbg('1505975710120', referenceDate)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.normalized).toBe('1505975710120')
        expect(result.dateOfBirth).toBe('1975-05-15')
        expect(result.age).toBe(51)
      }
    })

    it('validates another correct adult JMBG with spaces', () => {
      // 01.01.1980.
      const result = validateGuarantorJmbg('0101980 800017', referenceDate)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.normalized).toBe('0101980800017')
        expect(result.dateOfBirth).toBe('1980-01-01')
        expect(result.age).toBe(46)
      }
    })

    it('rejects JMBG with invalid length', () => {
      const result = validateGuarantorJmbg('123456789012', referenceDate)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.message).toContain('13 cifara')
      }
    })

    it('rejects JMBG with invalid checksum', () => {
      // 1505975710120 has checksum 0, change to 9
      const result = validateGuarantorJmbg('1505975710129', referenceDate)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.message).toContain('Kontrolna cifra')
      }
    })

    it('rejects JMBG with non-existent calendar date', () => {
      // 31.02.1980 -> month 02 does not have 31 days
      // Let's craft: 310298080001
      // weighted: 7*(3+8) + 6*(1+0) + 5*(0+0) + 4*(2+0) + 3*(9+0) + 2*(8+1)
      // = 77 + 6 + 0 + 8 + 27 + 18 = 136
      // 136 % 11 = 4 -> 11 - 4 = 7
      const result = validateGuarantorJmbg('3102980800017', referenceDate)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.message).toContain('validan kalendarski datum')
      }
    })

    it('rejects guarantor outside 30-65 years old range', () => {
      // Born 01.01.2015. (11 years old in 2026) -> under 30
      const youngResult = validateGuarantorJmbg('0101015800012', referenceDate)
      expect(youngResult.valid).toBe(false)
      if (!youngResult.valid) {
        expect(youngResult.message).toContain('između 30 i 65 godina')
      }

      // Born 01.01.1950. (76 years old in 2026) -> over 65
      // weighted: 7*(0+0) + 6*(1+8) + 5*(0+0) + 4*(1+0) + 3*(9+0) + 2*(5+0)
      // = 0 + 54 + 0 + 4 + 27 + 10 = 95
      // 95 % 11 = 7 -> 11 - 7 = 4
      const oldResult = validateGuarantorJmbg('0101950800004', referenceDate)
      expect(oldResult.valid).toBe(false)
      if (!oldResult.valid) {
        expect(oldResult.message).toContain('između 30 i 65 godina')
      }
    })
  })

  describe('format helpers and mask', () => {
    it('masks JMBG correctly', () => {
      expect(maskJmbg('1505975710120')).toBe('1505975******')
      expect(maskJmbg('short')).toBe('short')
    })

    it('formats relationships and employment statuses in Serbian', () => {
      expect(formatGuarantorRelationship('PARENT')).toBe('Roditelj')
      expect(formatGuarantorRelationship('SIBLING')).toBe('Brat / Sestra')
      expect(formatGuarantorEmployment('EMPLOYED')).toContain('Zaposlen')
      expect(formatGuarantorEmployment('RETIRED')).toBe('Penzioner')
    })
  })

  describe('validateGuarantorInput', () => {
    const validPayload: GuarantorSubmissionInput = {
      email: 'marko.petrovic@example.com',
      employerName: 'Telekom Srbija a.d.',
      employmentStatus: 'EMPLOYED',
      fullName: 'Marko Petrović',
      idCardIssuer: 'PU Beograd, PS Stari Grad',
      idCardNumber: '012345678',
      jobTitle: 'Inženjer telekomunikacija',
      jmbg: '1505975710120',
      monthlyIncomeRsd: 120_000,
      phone: '+381641234567',
      promissoryNotesCount: 2,
      relationship: 'PARENT',
      residentialAddress: 'Kneza Miloša 14, 11000 Beograd',
    }

    it('validates a complete, sound guarantor input', () => {
      const result = validateGuarantorInput(validPayload, referenceDate)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.fullName).toBe('Marko Petrović')
        expect(result.data.jmbg).toBe('1505975710120')
        expect(result.data.promissoryNotesCount).toBe(2)
        expect(result.data.monthlyIncomeRsd).toBe(120_000)
      }
    })

    it('collects errors for incomplete and invalid fields', () => {
      const result = validateGuarantorInput(
        {
          ...validPayload,
          employerName: '',
          fullName: 'Petar',
          idCardNumber: '??',
          jmbg: 'wrong',
          monthlyIncomeRsd: -100,
          phone: '',
          promissoryNotesCount: 1, // less than 2
        },
        referenceDate,
      )

      expect(result.valid).toBe(false)
      if (!result.valid) {
        const paths = result.errors.map((e) => e.path)
        expect(paths).toContain('fullName')
        expect(paths).toContain('jmbg')
        expect(paths).toContain('idCardNumber')
        expect(paths).toContain('phone')
        expect(paths).toContain('employerName')
        expect(paths).toContain('monthlyIncomeRsd')
        expect(paths).toContain('promissoryNotesCount')
      }
    })
  })
})
