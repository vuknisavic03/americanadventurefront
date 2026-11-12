export const preApplicationStatuses = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'QUALIFIED',
  'MATERIALS_SENT',
  'CONSULTATION_INVITED',
  'CONSULTATION_SCHEDULED',
  'CONSULTATION_COMPLETED',
  'READY_FOR_PROFILE',
  'REJECTED',
] as const

export type PreApplicationStatus = (typeof preApplicationStatuses)[number]

export const contactOutcomes = [
  'NO_ANSWER',
  'REACHED',
  'CALLBACK_REQUESTED',
  'INVALID_CONTACT',
] as const

export type ContactOutcome = (typeof contactOutcomes)[number]

export const contactStatuses = [
  'NOT_ATTEMPTED',
  'ATTEMPTED',
  'REACHED',
  'FOLLOW_UP_REQUIRED',
] as const

export type ContactStatus = (typeof contactStatuses)[number]

export const consultationOutcomes = ['ATTENDED', 'NO_SHOW', 'CANCELLED'] as const

export type ConsultationOutcome = (typeof consultationOutcomes)[number]

export const processingActions = [
  'START_REVIEW',
  'RECORD_CONTACT',
  'MARK_QUALIFIED',
  'MARK_REJECTED',
  'SCHEDULE_CONSULTATION',
  'RECORD_CONSULTATION_OUTCOME',
  'MARK_READY_FOR_PROFILE',
  'ISSUE_PROFILE_ACTIVATION',
] as const

export type ProcessingAction = (typeof processingActions)[number]

export class WorkflowRuleError extends Error {
  constructor(
    public readonly code:
      | 'CONTACT_REQUIRED'
      | 'CONSULTATION_HAS_NOT_STARTED'
      | 'CONSULTATION_NOT_ATTENDED'
      | 'CANDIDATE_ACCOUNT_ALREADY_ACTIVE'
      | 'CANDIDATE_ACCOUNT_SUSPENDED'
      | 'INVALID_TRANSITION'
      | 'REJECTION_REASON_REQUIRED'
      | 'VERSION_CONFLICT',
    message: string,
  ) {
    super(message)
    this.name = 'WorkflowRuleError'
  }
}

export function assertExpectedVersion(currentVersion: number, expectedVersion: number) {
  if (currentVersion !== expectedVersion) {
    throw new WorkflowRuleError(
      'VERSION_CONFLICT',
      'Prijavu je u međuvremenu izmenio drugi administrator. Osvežite stranicu i pokušajte ponovo.',
    )
  }
}

export function assertActionAllowed(status: PreApplicationStatus, action: ProcessingAction) {
  const allowed =
    (status === 'SUBMITTED' && action === 'START_REVIEW') ||
    (status === 'UNDER_REVIEW' &&
      ['RECORD_CONTACT', 'MARK_QUALIFIED', 'MARK_REJECTED'].includes(action)) ||
    (['CONSULTATION_INVITED', 'CONSULTATION_SCHEDULED'].includes(status) &&
      action === 'SCHEDULE_CONSULTATION') ||
    (status === 'CONSULTATION_SCHEDULED' && action === 'RECORD_CONSULTATION_OUTCOME') ||
    (status === 'CONSULTATION_COMPLETED' && action === 'MARK_READY_FOR_PROFILE') ||
    (status === 'READY_FOR_PROFILE' && action === 'ISSUE_PROFILE_ACTIVATION')

  if (!allowed) {
    throw new WorkflowRuleError(
      'INVALID_TRANSITION',
      'Ova akcija nije dozvoljena u trenutnom statusu prijave.',
    )
  }
}

export function assertConsultationOutcomeAllowed({
  consultationStartsAt,
  now,
  outcome,
}: {
  consultationStartsAt?: string | null
  now: Date
  outcome: ConsultationOutcome
}) {
  if (
    outcome !== 'CANCELLED' &&
    (!consultationStartsAt || new Date(consultationStartsAt).getTime() > now.getTime())
  ) {
    throw new WorkflowRuleError(
      'CONSULTATION_HAS_NOT_STARTED',
      'Prisustvo se može evidentirati tek nakon početka zakazanih konsultacija.',
    )
  }
}

export function assertProfileReadinessAllowed(consultationStatus?: string | null) {
  if (consultationStatus !== 'ATTENDED') {
    throw new WorkflowRuleError(
      'CONSULTATION_NOT_ATTENDED',
      'Kandidat ne može biti spreman za profil dok prisustvo konsultacijama nije potvrđeno.',
    )
  }
}

export function assertDecisionAllowed({
  action,
  contactAttemptCount,
  rejectionReason,
}: {
  action: 'MARK_QUALIFIED' | 'MARK_REJECTED'
  contactAttemptCount: number
  rejectionReason?: string
}) {
  if (contactAttemptCount < 1) {
    throw new WorkflowRuleError(
      'CONTACT_REQUIRED',
      'Pre odluke mora biti evidentiran najmanje jedan pokušaj telefonskog kontakta.',
    )
  }

  if (action === 'MARK_REJECTED' && !rejectionReason?.trim()) {
    throw new WorkflowRuleError(
      'REJECTION_REASON_REQUIRED',
      'Razlog odbijanja je obavezan.',
    )
  }
}

export function deriveContactStatus(outcome: ContactOutcome): ContactStatus {
  switch (outcome) {
    case 'REACHED':
      return 'REACHED'
    case 'CALLBACK_REQUESTED':
    case 'INVALID_CONTACT':
      return 'FOLLOW_UP_REQUIRED'
    case 'NO_ANSWER':
      return 'ATTEMPTED'
  }
}

export function nextStatus(action: ProcessingAction): PreApplicationStatus | undefined {
  switch (action) {
    case 'START_REVIEW':
      return 'UNDER_REVIEW'
    case 'MARK_QUALIFIED':
      return 'QUALIFIED'
    case 'MARK_REJECTED':
      return 'REJECTED'
    case 'SCHEDULE_CONSULTATION':
      return 'CONSULTATION_SCHEDULED'
    case 'MARK_READY_FOR_PROFILE':
      return 'READY_FOR_PROFILE'
    case 'ISSUE_PROFILE_ACTIVATION':
    case 'RECORD_CONSULTATION_OUTCOME':
    case 'RECORD_CONTACT':
      return undefined
  }
}

export function statusAfterConsultationOutcome(
  outcome: ConsultationOutcome,
): PreApplicationStatus {
  return outcome === 'ATTENDED' ? 'CONSULTATION_COMPLETED' : 'CONSULTATION_INVITED'
}

