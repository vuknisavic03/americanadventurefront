export const guarantorRelationshipKeys = [
  'PARENT',
  'SIBLING',
  'SPOUSE',
  'RELATIVE',
  'OTHER',
] as const

export type GuarantorRelationship = (typeof guarantorRelationshipKeys)[number]

export const guarantorEmploymentStatusKeys = [
  'EMPLOYED',
  'RETIRED',
  'SELF_EMPLOYED',
] as const

export type GuarantorEmploymentStatus = (typeof guarantorEmploymentStatusKeys)[number]

export const guarantorStatusKeys = [
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
] as const

export type GuarantorStatus = (typeof guarantorStatusKeys)[number]

export type GuarantorSubmissionInput = {
  email: string
  employerName: string
  employmentStatus: GuarantorEmploymentStatus
  fullName: string
  idCardIssuer: string
  idCardNumber: string
  jobTitle: string
  jmbg: string
  monthlyIncomeRsd: number
  phone: string
  promissoryNotesCount?: number
  relationship: GuarantorRelationship
  residentialAddress: string
}

export type SanitizedGuarantorInput = {
  email: string
  employerName: string
  employmentStatus: GuarantorEmploymentStatus
  fullName: string
  idCardIssuer: string
  idCardNumber: string
  jobTitle: string
  jmbg: string
  monthlyIncomeRsd: number
  phone: string
  promissoryNotesCount: number
  relationship: GuarantorRelationship
  residentialAddress: string
}

export type GuarantorValidationError = {
  message: string
  path: string
}

export type GuarantorValidationResult =
  | { errors: GuarantorValidationError[]; valid: false }
  | { data: SanitizedGuarantorInput; valid: true }

export type GuarantorContractParty = {
  address: string
  fullName: string
  idCardIssuer?: string
  idCardNumber?: string
  jmbg?: string
  phone?: string
}

export type GuarantorContractTerms = {
  agency: {
    address: string
    director: string
    mb: string
    name: string
    pib: string
  }
  candidate: GuarantorContractParty
  contractDate: Date
  contractNumber: string
  finance: {
    currency: 'USD'
    deferredAmountCents: number
    depositCents: number
    promissoryNotesCount: number
    totalPriceCents: number
  }
  guarantor: GuarantorContractParty & {
    employerName: string
    employmentStatusLabel: string
    monthlyIncomeRsd: number
    relationshipLabel: string
  }
}
