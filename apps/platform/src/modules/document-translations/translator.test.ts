import { describe, expect, it } from 'vitest'

import {
  translateDocument,
  translateEmployment,
  translateGeneralDocument,
  translateGuarantorStatement,
  translateRelationship,
  translateStudentStatusCertificate,
} from './translator.ts'

describe('document-translations translator engine', () => {
  it('translates relationships and employment statuses', () => {
    expect(translateRelationship('Otac')).toBe('Father')
    expect(translateRelationship('Majka')).toBe('Mother')
    expect(translateRelationship('Brat')).toBe('Brother')
    expect(translateRelationship('Ostalo')).toBe('Ostalo')

    expect(translateEmployment('Stalno zaposlen')).toBe('Permanently Employed')
    expect(translateEmployment('Penzioner')).toBe('Retired')
    expect(translateEmployment('Privatnik')).toBe('Self-employed / Business Owner')
  })

  it('translates student status certificate into structured official fields', async () => {
    const result = await translateStudentStatusCertificate({
      academicCreditsEspb: 120,
      academicYear: '2026/2027',
      dateOfBirth: '2003-05-15',
      enrollmentStatus: 'Redovan student',
      facultyName: 'Fakultet organizacionih nauka',
      issuedCity: 'Beograd',
      issuedDate: '2026-10-01',
      programCode: 'SWT',
      studentFullName: 'Nikola Petrović',
      studentIndexNumber: '2022/0456',
      studyYear: '3',
      universityName: 'Univerzitet u Beogradu',
    })

    expect(result.studentFullName).toBe('Nikola Petrović')
    expect(result.universityNameEn).toBe('University of Belgrade')
    expect(result.facultyNameEn).toBe('Faculty of Organizational Sciences')
    expect(result.studyYearEn).toBe('3rd Year (Junior)')
    expect(result.enrollmentStatusEn).toBe('Full-time enrolled student')
    expect(result.academicCreditsEspb).toBe('120')
    expect(result.certificationStatementEn).toContain('certified English translation')
  })

  it('translates guarantor statement with RSD to EUR conversion', async () => {
    const result = await translateGuarantorStatement({
      candidateFullName: 'Nikola Petrović',
      employmentStatus: 'Stalno zaposlen',
      guarantorAddress: 'Kralja Milana 15, Beograd',
      guarantorFullName: 'Marko Petrović',
      guarantorIdNumber: '987654321',
      monthlyIncomeRsd: 117200,
      relationshipToCandidate: 'Otac',
      statementNotes: 'Finansijska podrška za učešće u programu.',
    })

    expect(result.candidateFullName).toBe('Nikola Petrović')
    expect(result.guarantorFullName).toBe('Marko Petrović')
    expect(result.relationshipToCandidateEn).toBe('Father')
    expect(result.employmentStatusEn).toBe('Permanently Employed')
    expect(result.monthlyIncomeEur).toContain('1000 EUR')
    expect(result.statementNotesEn).toContain('commits to providing full financial support')
    expect(result.certificationStatementEn).toContain('Guarantor')
  })

  it('translates general document and dispatches via translateDocument', async () => {
    const general = await translateGeneralDocument({
      documentTitle: 'Potvrda o volontiranju',
      originalText: 'Potvrđujemo da je kandidat volontirao 100 sati.',
      personalDetails: 'Nikola Petrović',
    })

    expect(general.documentTitleEn).toContain('Potvrda o volontiranju')
    expect(general.translatedTextEn).toContain('volontirao 100 sati')

    const dispatched = await translateDocument('GENERAL_DOCUMENT', {
      documentTitle: 'Potvrda o volontiranju',
      originalText: 'Potvrđujemo da je kandidat volontirao 100 sati.',
      personalDetails: 'Nikola Petrović',
    })

    expect(dispatched.documentTitleEn).toContain('Potvrda o volontiranju')
  })
})
