import { describe, expect, it } from 'vitest'

import type { AdminCandidateOverviewItem } from '../admin-candidates/rules.ts'
import {
  isValidEmail,
  matchesCohortFilter,
  normalizePhone,
  validateActionRequired,
  validateRecipientForChannel,
} from './rules.ts'

describe('admin-communications rules', () => {
  describe('email validation', () => {
    it('validates proper email formats', () => {
      expect(isValidEmail('kandidat@example.com')).toBe(true)
      expect(isValidEmail('marko.markovic@sub.domain.rs')).toBe(true)
      expect(isValidEmail('neispravan-email')).toBe(false)
      expect(isValidEmail('kandidat@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('phone normalization', () => {
    it('normalizes local Serbian format to E.164', () => {
      expect(normalizePhone('064 123 4567')).toBe('+381641234567')
      expect(normalizePhone('063/987-654')).toBe('+38163987654')
      expect(normalizePhone('0038164111222')).toBe('+38164111222')
      expect(normalizePhone('+381641234567')).toBe('+381641234567')
    })
  })

  describe('validateRecipientForChannel', () => {
    const candidate = {
      accountId: 42,
      email: 'marko@example.com',
      fullName: 'Marko Marković',
      phone: '064 123 4567',
    }

    it('validates recipient for EMAIL', () => {
      const res = validateRecipientForChannel('EMAIL', candidate)
      expect(res.valid).toBe(true)
      expect(res.recipient).toBe('marko@example.com')

      const invalid = validateRecipientForChannel('EMAIL', { ...candidate, email: 'not-an-email' })
      expect(invalid.valid).toBe(false)
      expect(invalid.error).toContain('nema ispravnu email adresu')
    })

    it('validates recipient for SMS', () => {
      const res = validateRecipientForChannel('SMS', candidate)
      expect(res.valid).toBe(true)
      expect(res.normalizedRecipient).toBe('+381641234567')

      const missing = validateRecipientForChannel('SMS', { ...candidate, phone: '' })
      expect(missing.valid).toBe(false)
      expect(missing.error).toContain('nema unet broj telefona')

      const badPhone = validateRecipientForChannel('SMS', { ...candidate, phone: '123' })
      expect(badPhone.valid).toBe(false)
      expect(badPhone.error).toContain('nije u validnom formatu')
    })

    it('validates recipient for IN_APP', () => {
      const res = validateRecipientForChannel('IN_APP', candidate)
      expect(res.valid).toBe(true)
      expect(res.normalizedRecipient).toBe('42')

      const noAccount = validateRecipientForChannel('IN_APP', { ...candidate, accountId: undefined })
      expect(noAccount.valid).toBe(false)
      expect(noAccount.error).toContain('nema kreiran nalog')
    })
  })

  describe('matchesCohortFilter', () => {
    const sampleCandidate: AdminCandidateOverviewItem = {
      createdAt: '2026-01-01T00:00:00.000Z',
      currentStep: 'VISA_PROCESSING',
      currentStepLabel: 'Viza',
      email: 'ana@example.com',
      firstName: 'Ana',
      fullName: 'Ana Anić',
      hasJobOffer: true,
      id: 10,
      lastName: 'Anić',
      phone: '+38160123456',
      processStatus: 'ACTIVE',
      progressPercent: 60,
      programCode: 'SWT',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }

    it('matches candidate by explicit process ID', () => {
      expect(matchesCohortFilter(sampleCandidate, { candidateProcessIds: [10, 11] })).toBe(true)
      expect(matchesCohortFilter(sampleCandidate, { candidateProcessIds: [12, 13] })).toBe(false)
    })

    it('matches candidate by current step', () => {
      expect(matchesCohortFilter(sampleCandidate, { currentStep: 'VISA_PROCESSING' })).toBe(true)
      expect(matchesCohortFilter(sampleCandidate, { currentStep: 'JOB_OFFER' })).toBe(false)
    })

    it('matches candidate by job offer presence', () => {
      expect(matchesCohortFilter(sampleCandidate, { hasJobOffer: true })).toBe(true)
      expect(matchesCohortFilter(sampleCandidate, { withoutJobOffer: true })).toBe(false)
    })

    it('matches candidate by program code', () => {
      expect(matchesCohortFilter(sampleCandidate, { programCode: 'SWT' })).toBe(true)
      expect(matchesCohortFilter(sampleCandidate, { programCode: 'INTERNSHIP' })).toBe(false)
    })
  })

  describe('validateActionRequired', () => {
    it('accepts empty action fields', () => {
      expect(validateActionRequired({}).valid).toBe(true)
    })

    it('accepts valid title and iso date string', () => {
      const res = validateActionRequired({
        actionRequiredDueAt: '2026-11-01T12:00:00.000Z',
        actionRequiredTitle: 'Potpisivanje ugovora',
      })
      expect(res.valid).toBe(true)
    })

    it('rejects invalid date format', () => {
      const res = validateActionRequired({
        actionRequiredDueAt: 'invalid-date',
        actionRequiredTitle: 'Potpisivanje ugovora',
      })
      expect(res.valid).toBe(false)
      expect(res.error).toContain('nije u ispravnom formatu')
    })
  })
})
