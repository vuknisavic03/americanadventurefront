import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { renderCertifiedTranslationPdf } from './pdfRenderer.ts'

describe('document-translations PDF renderer', () => {
  it('renders certified PDF for student status certificate with SHA-256 checksum', async () => {
    const result = await renderCertifiedTranslationPdf({
      candidateName: 'Nikola Petrović',
      documentTitle: 'Potvrda o statusu studenta (Certificate of University Enrollment)',
      documentType: 'STUDENT_STATUS_CERTIFICATE',
      reviewedAt: new Date('2026-10-09T10:00:00Z'),
      reviewedByName: 'Milica Administrator',
      translatedFields: {
        academicCreditsEspb: '120',
        academicYearEn: '2026/2027',
        certificationStatementEn:
          'This is a certified English translation and official structured verification of the original applicant documentation, verified by American Adventure agency for U.S. Sponsor and Embassy visa processing.',
        enrollmentStatusEn: 'Full-time regular student (Budget-funded)',
        facultyNameEn: 'Faculty of Organizational Sciences',
        issuedCityEn: 'Belgrade, Republic of Serbia',
        issuedDate: '2026-10-01',
        programCode: 'SWT',
        studentFullName: 'Nikola Petrović',
        studentIndexNumber: '2022/0456',
        studyProgramEn: 'Information Systems and Technologies',
        studyYearEn: '3rd Year of Undergraduate Studies',
        universityNameEn: 'University of Belgrade',
      },
      translationId: 42,
    })

    expect(result.buffer).toBeInstanceOf(Uint8Array)
    expect(result.buffer.length).toBeGreaterThan(1000)
    expect(Buffer.from(result.buffer).subarray(0, 4).toString()).toBe('%PDF')

    // Verify SHA-256 checksum format and consistency
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/u)
    const expectedChecksum = createHash('sha256').update(result.buffer).digest('hex')
    expect(result.checksum).toBe(expectedChecksum)
  })

  it('renders certified PDF for guarantor statement', async () => {
    const result = await renderCertifiedTranslationPdf({
      candidateName: 'Nikola Petrović',
      documentTitle: 'Izjava jemca / finansijska podrška (Financial Guarantor Declaration)',
      documentType: 'GUARANTOR_STATEMENT',
      reviewedAt: new Date('2026-10-09T10:00:00Z'),
      reviewedByName: 'Milica Administrator',
      translatedFields: {
        certificationStatementEn:
          'This is a certified English translation and official verification of the financial guarantor declaration.',
        employmentStatusEn: 'Permanently Employed',
        guarantorAddress: 'Kralja Milana 15, Belgrade',
        guarantorFullName: 'Marko Petrović',
        guarantorIdNumber: '987654321',
        monthlyIncomeEur: 'approx. 1000 EUR (117,200 RSD)',
        relationshipToCandidateEn: 'Father',
        statementNotesEn:
          'The guarantor formally commits to providing full financial support and backing for the candidate.',
      },
      translationId: 43,
    })

    expect(result.buffer).toBeInstanceOf(Uint8Array)
    expect(result.buffer.length).toBeGreaterThan(1000)
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/u)
  })

  it('renders certified PDF for general document', async () => {
    const result = await renderCertifiedTranslationPdf({
      candidateName: 'Nikola Petrović',
      documentTitle: 'Prevedeni dokument kandidata (Certified English Translation)',
      documentType: 'GENERAL_DOCUMENT',
      reviewedAt: new Date('2026-10-09T10:00:00Z'),
      reviewedByName: 'Milica Administrator',
      translatedFields: {
        certificationStatementEn: 'Certified translation statement.',
        translatedTextEn: 'Applicant has demonstrated English proficiency level B2.',
      },
      translationId: 44,
    })

    expect(result.buffer).toBeInstanceOf(Uint8Array)
    expect(result.buffer.length).toBeGreaterThan(1000)
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/u)
  })

  it('renders deterministically with identical checksums across invocations', async () => {
    const fixedDate = new Date('2026-10-09T10:00:00.000Z')
    const input = {
      candidateName: 'Nikola Petrović',
      documentTitle: 'Potvrda o statusu studenta',
      documentType: 'STUDENT_STATUS_CERTIFICATE' as const,
      reviewedAt: fixedDate,
      reviewedByName: 'Milica Administrator',
      translatedFields: {
        facultyNameEn: 'Faculty of Organizational Sciences',
        universityNameEn: 'University of Belgrade',
      },
      translationId: 42,
    }

    const first = await renderCertifiedTranslationPdf(input)
    const second = await renderCertifiedTranslationPdf(input)
    expect(first.checksum).toBe(second.checksum)
    expect(first.buffer).toEqual(second.buffer)
  })
})
