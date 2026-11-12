import {
  CERTIFICATION_STATEMENTS,
  translateCity,
  translateEnrollmentStatus,
  translateFaculty,
  translateStudyYear,
  translateUniversity,
  type DocumentTranslationType,
  type GeneralDocumentSourceData,
  type GeneralDocumentTranslatedData,
  type GuarantorSourceData,
  type GuarantorTranslatedData,
  type StudentStatusSourceData,
  type StudentStatusTranslatedData,
} from './templates.ts'

const RELATIONSHIP_DICTIONARY: Record<string, string> = {
  'Brat': 'Brother',
  'Majka': 'Mother',
  'Otac': 'Father',
  'Roditelj': 'Parent',
  'Sestra': 'Sister',
  'Staratelj': 'Legal Guardian',
  'Suprug': 'Spouse / Husband',
  'Supruga': 'Spouse / Wife',
}

const EMPLOYMENT_DICTIONARY: Record<string, string> = {
  'Nezaposlen': 'Unemployed',
  'Penzioner': 'Retired',
  'Privatnik': 'Self-employed / Business Owner',
  'Stalno zaposlen': 'Permanently Employed',
  'Zaposlen': 'Employed',
}

export function translateRelationship(rel: string): string {
  const trimmed = rel.trim()
  return RELATIONSHIP_DICTIONARY[trimmed] || trimmed
}

export function translateEmployment(emp: string): string {
  const trimmed = emp.trim()
  return EMPLOYMENT_DICTIONARY[trimmed] || trimmed
}

export async function translateStudentStatusCertificate(
  source: StudentStatusSourceData,
): Promise<StudentStatusTranslatedData> {
  const facultyEn = translateFaculty(source.facultyName)
  const universityEn = source.universityName
    ? translateUniversity(source.universityName)
    : 'Accredited University in Serbia'
  const cityEn = source.issuedCity ? translateCity(source.issuedCity) : 'Belgrade'
  const yearEn = translateStudyYear(source.studyYear)
  const statusEn = source.enrollmentStatus
    ? translateEnrollmentStatus(source.enrollmentStatus)
    : 'Full-time regularly enrolled student'

  const currentYear = new Date().getFullYear()
  const academicYearEn = source.academicYear || `${currentYear}/${currentYear + 1}`

  return {
    academicCreditsEspb: source.academicCreditsEspb ? String(source.academicCreditsEspb) : undefined,
    academicYearEn,
    certificationStatementEn: CERTIFICATION_STATEMENTS.STUDENT_STATUS_CERTIFICATE,
    dateOfBirth: source.dateOfBirth,
    enrollmentStatusEn: statusEn,
    facultyNameEn: facultyEn,
    issuedCityEn: cityEn,
    issuedDate: source.issuedDate || new Date().toISOString().split('T')[0]!,
    programCode: source.programCode || 'SWT',
    studentFullName: source.studentFullName,
    studentIndexNumber: source.studentIndexNumber,
    studyProgramEn: source.studyProgram || `${facultyEn} Degree Curriculum`,
    studyYearEn: yearEn,
    universityNameEn: universityEn,
  }
}

export async function translateGuarantorStatement(
  source: GuarantorSourceData,
): Promise<GuarantorTranslatedData> {
  const relEn = translateRelationship(source.relationshipToCandidate)
  const empEn = source.employmentStatus ? translateEmployment(source.employmentStatus) : 'Employed'

  let monthlyEur: string | undefined = undefined
  if (source.monthlyIncomeRsd) {
    const rsd = Number(source.monthlyIncomeRsd)
    if (!Number.isNaN(rsd) && rsd > 0) {
      const eur = Math.round(rsd / 117.2)
      monthlyEur = `approx. ${eur} EUR (${rsd.toLocaleString('sr-RS')} RSD)`
    }
  }

  const statementNotesEn = source.statementNotes
    ? `The guarantor formally commits to providing full financial support and backing for the candidate during the cultural exchange program.`
    : undefined

  return {
    candidateFullName: source.candidateFullName,
    certificationStatementEn: CERTIFICATION_STATEMENTS.GUARANTOR_STATEMENT,
    employmentStatusEn: empEn,
    guarantorAddress: source.guarantorAddress,
    guarantorFullName: source.guarantorFullName,
    guarantorIdNumber: source.guarantorIdNumber,
    monthlyIncomeEur: monthlyEur,
    relationshipToCandidateEn: relEn,
    statementNotesEn,
  }
}

export async function translateGeneralDocument(
  source: GeneralDocumentSourceData,
): Promise<GeneralDocumentTranslatedData> {
  return {
    certificationStatementEn: CERTIFICATION_STATEMENTS.GENERAL_DOCUMENT,
    documentTitleEn: `Certified English Translation: ${source.documentTitle}`,
    personalDetailsEn: source.personalDetails,
    translatedTextEn: source.originalText,
  }
}

export async function translateDocument(
  type: DocumentTranslationType,
  sourceData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (type === 'STUDENT_STATUS_CERTIFICATE') {
    return translateStudentStatusCertificate(sourceData as unknown as StudentStatusSourceData) as unknown as Record<string, unknown>
  }
  if (type === 'GUARANTOR_STATEMENT') {
    return translateGuarantorStatement(sourceData as unknown as GuarantorSourceData) as unknown as Record<string, unknown>
  }
  return translateGeneralDocument(sourceData as unknown as GeneralDocumentSourceData) as unknown as Record<string, unknown>
}
