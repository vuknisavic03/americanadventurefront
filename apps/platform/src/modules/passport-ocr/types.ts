export type PassportSex = 'M' | 'F' | 'X'

export type PassportOcrExtractedData = {
  documentCode: string | null
  documentNumber: string | null
  issuingState: string | null
  nationality: string | null
  firstName: string | null
  lastName: string | null
  birthDate: string | null // YYYY-MM-DD
  expirationDate: string | null // YYYY-MM-DD
  sex: PassportSex | null
  personalNumber: string | null // JMBG if Serbian passport
  mrzFormat: string | null
  mrzValid: boolean
  rawMrzLines: string[]
  visualFields?: {
    passportNumber?: string
    birthDate?: string
    expirationDate?: string
    fullName?: string
    jmbg?: string
  }
}

export type PassportOcrMatchResult = {
  overallMatch: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'NOT_EVALUATED'
  nameMatch: boolean | null
  birthDateMatch: boolean | null
  jmbgMatch: boolean | null
  isExpired: boolean
  expiresWithinSeason: boolean // e.g., expires within 6 months of SWT return (Nov 1 of current year)
  notes: string[]
}

export type PassportOcrResult = {
  success: boolean
  status: 'COMPLETED' | 'FAILED' | 'NO_MRZ_DETECTED'
  confidence: number // 0 - 100
  extracted?: PassportOcrExtractedData
  match?: PassportOcrMatchResult
  rawText?: string
  error?: string
}

export type CandidateMatchContext = {
  firstName?: string
  lastName?: string
  dateOfBirth?: string // ISO date or YYYY-MM-DD
  jmbg?: string // 13 digits
  seasonYear?: number // Default: current year (e.g. 2027)
}
