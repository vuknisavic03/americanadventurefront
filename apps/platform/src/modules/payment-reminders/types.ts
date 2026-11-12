export type PaymentReminderTrigger = 'PRE_DUE' | 'ON_DUE' | 'OVERDUE'

export type PaymentReminderChannel = 'EMAIL' | 'SMS' | 'IN_APP'

export interface PaymentReminderRules {
  /**
   * Broj dana pre dospeća za slanje blagovremenog podsetnika (podrazumevano: 5 dana).
   */
  preDueDays: number
  /**
   * Da li se šalje podsetnik na sam dan dospeća (podrazumevano: true).
   */
  enableOnDue: boolean
  /**
   * Minimalan broj dana kašnjenja za slanje opomene (podrazumevano: 1 dan).
   */
  overdueGraceDays: number
  /**
   * Podržani kanali komunikacije.
   */
  channels: PaymentReminderChannel[]
  /**
   * Relevantan kurs NBS RSD za prikaz protivvrednosti na uplatnici i podsetniku.
   */
  exchangeRateRsd: number
}

export interface ObligationEvaluation {
  key: string
  label: string
  amountCents: number
  amountUsd: number
  amountRsd: number
  dueAt: string | null
  kind: 'INITIAL' | 'INSTALLMENT' | 'DEFERRED'
  allocatedPaidCents: number
  unpaidCents: number
  isFullyPaid: boolean
  trigger: PaymentReminderTrigger | null
  daysUntilDue: number | null
  daysOverdue: number | null
  isEligibleForReminder: boolean
}

export interface CandidateReminderProfile {
  candidateProcessId: number
  candidateAccountId: number
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  programCode: string
  paymentPlanId: number
  totalCents: number
  paidCents: number
  remainingCents: number
  selectedMethod: string
  activeObligation: ObligationEvaluation | null
  allObligations: ObligationEvaluation[]
  lastReminderSentAt: string | null
  lastReminderTrigger: PaymentReminderTrigger | null
}

export interface SendPaymentReminderInput {
  candidateProcessId: number
  obligationKey: string
  trigger?: PaymentReminderTrigger
  channel?: PaymentReminderChannel | 'ALL'
  customNote?: string
  force?: boolean
}

export interface ReminderDispatchResult {
  candidateProcessId: number
  obligationKey: string
  channel: PaymentReminderChannel
  status: 'DELIVERED' | 'SKIPPED' | 'FAILED'
  reason?: string
  communicationLogId?: number
  providerMessageId?: string
}

export interface PaymentReminderContext {
  candidateAccountId: number
  candidateName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  programCode: string
  obligationLabel: string
  obligationKey: string
  amountCents: number
  amountUsd: number
  amountRsd: number
  dueAtDateFormatted: string
  trigger: PaymentReminderTrigger
  daysUntilDue: number | null
  daysOverdue: number | null
  portalUrl: string
  paymentSlipUrl: string
  recipientAccount: string
  recipientName: string
  paymentModel: string
  paymentReference: string
  customNote?: string
}
