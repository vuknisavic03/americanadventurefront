import { describe, expect, it } from 'vitest'

import {
  canDownloadTranslationPdf,
  DocumentTranslationError,
  getDocumentTypeDefaultTitle,
  validateTranslationReview,
} from './rules.ts'

describe('document-translations rules & BR-010 validation', () => {
  it('throws or validates BR-010: requires administrator identification for approval', () => {
    // Missing adminId
    const withoutAdmin = validateTranslationReview('PENDING_REVIEW', {
      action: 'APPROVE',
      adminId: 0,
    })
    expect(withoutAdmin.valid).toBe(false)
    expect(withoutAdmin.error).toContain('BR-010')

    // Negative adminId
    const negativeAdmin = validateTranslationReview('PENDING_REVIEW', {
      action: 'APPROVE',
      adminId: -5,
    })
    expect(negativeAdmin.valid).toBe(false)
    expect(negativeAdmin.error).toContain('BR-010')

    // Valid adminId
    const withAdmin = validateTranslationReview('PENDING_REVIEW', {
      action: 'APPROVE',
      adminId: 10,
    })
    expect(withAdmin.valid).toBe(true)
    expect(withAdmin.error).toBeUndefined()
  })

  it('rejects modification of already approved documents', () => {
    const alreadyApproved = validateTranslationReview('APPROVED', {
      action: 'APPROVE',
      adminId: 10,
    })
    expect(alreadyApproved.valid).toBe(false)
    expect(alreadyApproved.error).toContain('već odobren')
  })

  it('requires rejection reason when action is REJECT', () => {
    const missingReason = validateTranslationReview('PENDING_REVIEW', {
      action: 'REJECT',
      adminId: 10,
      rejectionReason: '   ',
    })
    expect(missingReason.valid).toBe(false)
    expect(missingReason.error).toContain('Razlog odbijanja')

    const withReason = validateTranslationReview('PENDING_REVIEW', {
      action: 'REJECT',
      adminId: 10,
      rejectionReason: 'Nečitak pečat na fakultetskoj potvrdi.',
    })
    expect(withReason.valid).toBe(true)
  })

  it('verifies canDownloadTranslationPdf eligibility', () => {
    expect(canDownloadTranslationPdf({ status: 'PENDING_REVIEW' })).toBe(false)
    expect(canDownloadTranslationPdf({ pdfChecksum: null, status: 'APPROVED' })).toBe(false)
    expect(
      canDownloadTranslationPdf({
        pdfChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'APPROVED',
      }),
    ).toBe(true)
  })

  it('returns default document titles', () => {
    expect(getDocumentTypeDefaultTitle('STUDENT_STATUS_CERTIFICATE')).toContain('Potvrda o statusu studenta')
    expect(getDocumentTypeDefaultTitle('GUARANTOR_STATEMENT')).toContain('Izjava jemca')
    expect(getDocumentTypeDefaultTitle('GENERAL_DOCUMENT')).toContain('Prevedeni dokument kandidata')
  })

  it('instantiates DocumentTranslationError with status code and name', () => {
    const err = new DocumentTranslationError('Nije pronađeno', 404)
    expect(err.name).toBe('DocumentTranslationError')
    expect(err.message).toBe('Nije pronađeno')
    expect(err.status).toBe(404)
  })
})
