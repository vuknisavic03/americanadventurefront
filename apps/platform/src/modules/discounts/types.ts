export const discountTypeKeys = [
  'GROUP',
  'BRAND_AMBASSADOR',
  'FAMILY',
  'RETURNEE',
  'LIFEGUARD',
  'CUSTOM',
] as const

export type DiscountType = (typeof discountTypeKeys)[number]

export const discountStatusKeys = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'APPLIED',
] as const

export type DiscountStatus = (typeof discountStatusKeys)[number]

export const kinshipTypeKeys = [
  'SIBLING',
  'TWIN',
  'PARENT_CHILD',
  'SPOUSE',
  'OTHER',
] as const

export type KinshipType = (typeof kinshipTypeKeys)[number]

export const lifeguardCertifyingBodyKeys = [
  'RED_CROSS',
  'ELLIS',
  'YMCA',
  'STARGUARD',
  'OTHER',
] as const

export type LifeguardCertifyingBody = (typeof lifeguardCertifyingBodyKeys)[number]

export interface AppliedDiscountItem {
  amountCents: number
  candidateDiscountId?: number
  discountType: DiscountType
  label: string
}

export interface CandidateDiscountRecord {
  adminNotes?: string | null
  amountCents: number
  applicantId?: number
  candidateAccountId: number
  candidateProcessId: number
  createdAt?: string
  discountType: DiscountType
  id: number
  label: string
  preApplicationId: number
  status: DiscountStatus
  // FR-031: Group discount
  groupCode?: string | null
  groupId?: number | null
  groupMemberRole?: 'LEADER' | 'MEMBER' | null
  groupName?: string | null
  // FR-032: Brand Ambassador discount
  ambassadorCode?: string | null
  ambassadorId?: number | null
  ambassadorName?: string | null
  // FR-033: Family discount
  kinshipNotes?: string | null
  kinshipType?: KinshipType | null
  relativeCandidateAccountId?: number | null
  relativeFullName?: string | null
  // FR-034: Returnee & Lifeguard discount
  lifeguardCertificateNumber?: string | null
  lifeguardCertifyingBody?: LifeguardCertifyingBody | null
  lifeguardValidUntil?: string | null
  returneePreviousEmployer?: string | null
  returneePreviousSponsor?: string | null
  returneePreviousYear?: number | null
  // Verification
  verificationNote?: string | null
  verifiedAt?: string | null
  verifiedById?: number | null
}

export interface BrandAmbassadorRecord {
  createdAt?: string
  defaultDiscountCents: number
  email: string
  fullName: string
  id: number
  notes?: string | null
  phone?: string | null
  referralCode: string
  rewardPerReferralCents: number
  season: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface DiscountGroupRecord {
  createdAt?: string
  discountPerMemberCents: number
  groupCode: string
  id: number
  minMembers: number
  name: string
  notes?: string | null
  status: 'ACTIVE' | 'CLOSED'
}

export interface GroupMembersSummary {
  discountPerMemberCents: number
  groupCode: string
  groupId: number
  groupName: string
  members: {
    amountCents: number
    candidateAccountId: number
    candidateName: string
    candidateProcessId: number
    discountId: number
    role: 'LEADER' | 'MEMBER'
    status: DiscountStatus
  }[]
  minMembers: number
  status: 'ACTIVE' | 'CLOSED'
  totalMembers: number
}

export interface AmbassadorReferralsSummary {
  ambassadorCode: string
  ambassadorId: number
  ambassadorName: string
  defaultDiscountCents: number
  email: string
  referrals: {
    amountCents: number
    candidateAccountId: number
    candidateName: string
    candidateProcessId: number
    discountId: number
    status: DiscountStatus
  }[]
  rewardPerReferralCents: number
  status: 'ACTIVE' | 'INACTIVE'
  totalReferrals: number
}
