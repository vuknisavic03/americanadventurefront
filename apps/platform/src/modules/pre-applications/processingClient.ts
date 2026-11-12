export type ApplicationState = {
  contactAttemptCount: number
  contactStatus: 'ATTEMPTED' | 'FOLLOW_UP_REQUIRED' | 'NOT_ATTEMPTED' | 'REACHED'
  consultationEndsAt?: string | null
  consultationNotes?: string | null
  consultationProvider?: string | null
  consultationStartsAt?: string | null
  consultationStatus: 'ATTENDED' | 'CANCELLED' | 'NOT_SCHEDULED' | 'NO_SHOW' | 'SCHEDULED'
  consultationTimeZone?: string | null
  correlationId: string
  latestContactAt?: string | null
  latestContactOutcome?: ContactOutcome | null
  nextContactAt?: string | null
  status:
    | 'CONSULTATION_INVITED'
    | 'CONSULTATION_SCHEDULED'
    | 'CONSULTATION_COMPLETED'
    | 'MATERIALS_SENT'
    | 'QUALIFIED'
    | 'REJECTED'
    | 'READY_FOR_PROFILE'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
  workflowVersion: number
  profileReadinessApprovedAt?: string | null
  profileReadinessNote?: string | null
}

export type ContactOutcome =
  | 'CALLBACK_REQUESTED'
  | 'INVALID_CONTACT'
  | 'NO_ANSWER'
  | 'REACHED'

export type ContactAttempt = {
  actor: string
  attemptedAt: string
  id: number
  nextContactAt?: string | null
  note?: string | null
  outcome: ContactOutcome
}

export type ProcessingState = {
  application: ApplicationState
  candidateAccount?: CandidateAccountState
  contactAttempts: ContactAttempt[]
  deliveries: MessageDeliveryState[]
}

export type CandidateAccountState = {
  activationExpiresAt?: string | null
  activationIssuedAt?: string | null
  activationUrl?: string
  email: string
  id: number
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED'
  verifiedAt?: string | null
}

export type MessageDeliveryState = {
  attemptCount: number
  category: 'ACCOUNT_ACTIVATION' | 'CONSULTATION_INVITATION' | 'MATERIAL_BUNDLE'
  deliveredAt?: string | null
  id: number
  lastAttemptAt?: string | null
  lastErrorCode?: string | null
  status: 'DELIVERED' | 'FAILED' | 'PENDING' | 'PROCESSING'
  templateVersion: string
}

export function buildProcessingEndpoint(apiRoute: string, id: number | string) {
  return `${apiRoute.replace(/\/$/, '')}/pre-applications/${encodeURIComponent(id)}/processing`
}

export function isProcessingState(value: unknown): value is ProcessingState {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ProcessingState>
  const application = candidate.application

  return Boolean(
    application &&
      typeof application === 'object' &&
      typeof application.workflowVersion === 'number' &&
      typeof application.status === 'string' &&
      typeof application.contactAttemptCount === 'number' &&
      typeof application.consultationStatus === 'string' &&
      Array.isArray(candidate.contactAttempts) &&
      Array.isArray(candidate.deliveries),
  )
}

