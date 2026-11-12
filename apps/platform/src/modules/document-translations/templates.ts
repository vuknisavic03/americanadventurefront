export type DocumentTranslationType =
  | 'STUDENT_STATUS_CERTIFICATE'
  | 'GUARANTOR_STATEMENT'
  | 'GENERAL_DOCUMENT'

// Akademski rečnik za univerzitete
export const UNIVERSITY_DICTIONARY: Record<string, string> = {
  'Univerzitet u Beogradu': 'University of Belgrade',
  'Univerzitet u Novom Sadu': 'University of Novi Sad',
  'Univerzitet u Nišu': 'University of Niš',
  'Univerzitet u Kragujevcu': 'University of Kragujevac',
  'Univerzitet Singidunum': 'Singidunum University',
  'Univerzitet Union': 'Union University',
  'Univerzitet Educons': 'Educons University',
  'Univerzitet Privredna akademija': 'University Business Academy in Novi Sad',
  'Univerzitet Metropolitan': 'Belgrade Metropolitan University',
}

// Akademski rečnik za fakultete
export const FACULTY_DICTIONARY: Record<string, string> = {
  'Fakultet organizacionih nauka': 'Faculty of Organizational Sciences',
  'FON': 'Faculty of Organizational Sciences',
  'Ekonomski fakultet': 'Faculty of Economics and Business',
  'Pravni fakultet': 'Faculty of Law',
  'Filozofski fakultet': 'Faculty of Philosophy',
  'Filološki fakultet': 'Faculty of Philology',
  'Elektrotehnički fakultet': 'School of Electrical Engineering',
  'ETF': 'School of Electrical Engineering',
  'Fakultet tehničkih nauka': 'Faculty of Technical Sciences',
  'FTN': 'Faculty of Technical Sciences',
  'Prirodno-matematički fakultet': 'Faculty of Sciences',
  'PMF': 'Faculty of Sciences',
  'Fakultet političkih nauka': 'Faculty of Political Sciences',
  'FPN': 'Faculty of Political Sciences',
  'Fakultet sporta i fizičkog vaspitanja': 'Faculty of Sport and Physical Education',
  'Medicinski fakultet': 'Faculty of Medicine',
  'Stomatološki fakultet': 'Faculty of Dental Medicine',
  'Farmaceutski fakultet': 'Faculty of Pharmacy',
  'Građevinski fakultet': 'Faculty of Civil Engineering',
  'Mašinski fakultet': 'Faculty of Mechanical Engineering',
  'Tehnološko-metalurški fakultet': 'Faculty of Technology and Metallurgy',
  'TMF': 'Faculty of Technology and Metallurgy',
  'Poljoprivredni fakultet': 'Faculty of Agriculture',
  'Fakultet bezbednosti': 'Faculty of Security Studies',
  'FASPER': 'Faculty of Special Education and Rehabilitation',
  'Saobraćajni fakultet': 'Faculty of Transport and Traffic Engineering',
  'Arhitektonski fakultet': 'Faculty of Architecture',
  'Rudarsko-geološki fakultet': 'Faculty of Mining and Geology',
}

// Rečnik za gradove studiranja
export const CITY_DICTIONARY: Record<string, string> = {
  'Beograd': 'Belgrade',
  'Novi Sad': 'Novi Sad',
  'Niš': 'Niš',
  'Kragujevac': 'Kragujevac',
  'Subotica': 'Subotica',
  'Čačak': 'Čačak',
  'Kraljevo': 'Kraljevo',
}

// Rečnik za statuse upisa i godine studija
export const STUDY_YEAR_DICTIONARY: Record<string, string> = {
  '1': '1st Year (Freshman)',
  '2': '2nd Year (Sophomore)',
  '3': '3rd Year (Junior)',
  '4': '4th Year (Senior)',
  'I godina': '1st Year (Freshman)',
  'II godina': '2nd Year (Sophomore)',
  'III godina': '3rd Year (Junior)',
  'IV godina': '4th Year (Senior)',
  'Apsolvent': 'Final Year / Graduation Status',
  'Master': 'Master Academic Studies',
}

export const ENROLLMENT_STATUS_DICTIONARY: Record<string, string> = {
  'Budžet': 'Full-time / State-funded student',
  'Redovan': 'Full-time enrolled student',
  'Redovan student': 'Full-time enrolled student',
  'Samofinansiranje': 'Full-time / Self-funded student',
}

export function translateUniversity(name: string): string {
  const trimmed = name.trim()
  return UNIVERSITY_DICTIONARY[trimmed] || trimmed
}

export function translateFaculty(name: string): string {
  const trimmed = name.trim()
  return FACULTY_DICTIONARY[trimmed] || trimmed
}

export function translateCity(city: string): string {
  const trimmed = city.trim()
  return CITY_DICTIONARY[trimmed] || trimmed
}

export function translateStudyYear(year: string): string {
  const trimmed = year.trim()
  return STUDY_YEAR_DICTIONARY[trimmed] || `${trimmed}. Year`
}

export function translateEnrollmentStatus(status: string): string {
  const trimmed = status.trim()
  return ENROLLMENT_STATUS_DICTIONARY[trimmed] || 'Regularly enrolled student'
}

export interface StudentStatusSourceData {
  academicCreditsEspb?: number | string
  academicYear?: string
  dateOfBirth?: string
  enrollmentStatus?: string
  facultyName: string
  issuedCity?: string
  issuedDate?: string
  programCode?: string
  studentFullName: string
  studentIndexNumber?: string
  studyProgram?: string
  studyYear: string
  universityName?: string
}

export interface StudentStatusTranslatedData {
  academicCreditsEspb?: string
  academicYearEn: string
  certificationStatementEn: string
  dateOfBirth?: string
  enrollmentStatusEn: string
  facultyNameEn: string
  issuedCityEn: string
  issuedDate: string
  programCode: string
  studentFullName: string
  studentIndexNumber?: string
  studyProgramEn: string
  studyYearEn: string
  universityNameEn: string
}

export interface GuarantorSourceData {
  candidateFullName: string
  employmentStatus?: string
  guarantorAddress?: string
  guarantorFullName: string
  guarantorIdNumber?: string
  monthlyIncomeRsd?: number | string
  relationshipToCandidate: string
  statementNotes?: string
}

export interface GuarantorTranslatedData {
  candidateFullName: string
  certificationStatementEn: string
  employmentStatusEn: string
  guarantorAddress?: string
  guarantorFullName: string
  guarantorIdNumber?: string
  monthlyIncomeEur?: string
  relationshipToCandidateEn: string
  statementNotesEn?: string
}

export interface GeneralDocumentSourceData {
  documentTitle: string
  originalText: string
  personalDetails?: string
}

export interface GeneralDocumentTranslatedData {
  certificationStatementEn: string
  documentTitleEn: string
  personalDetailsEn?: string
  translatedTextEn: string
}

export const CERTIFICATION_STATEMENTS = {
  GUARANTOR_STATEMENT:
    'This is a certified English translation and official verification of the Financial Guarantor Declaration, produced by American Adventure agency for U.S. Sponsor and Embassy visa requirements.',
  STUDENT_STATUS_CERTIFICATE:
    'This is an official certified English translation and structured verification of the original student enrollment certificate issued by the accredited higher education institution in the Republic of Serbia, verified by American Adventure agency for U.S. Sponsor and Embassy visa processing.',
  GENERAL_DOCUMENT:
    'This document is a certified English translation of the applicant-submitted documentation, translated and verified by American Adventure agency.',
}
