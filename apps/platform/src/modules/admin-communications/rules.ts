import { normalizeSmsRecipient } from '../embassy-appointments/smsProvider.ts'
import type { AdminCandidateOverviewItem } from '../admin-candidates/rules.ts'
import type { CommunicationChannel } from './templates.ts'

export interface CandidateCohortFilter {
  candidateProcessIds?: number[]
  currentStep?: string
  programCode?: string
  withoutJobOffer?: boolean
  hasJobOffer?: boolean
  processStatus?: string
  search?: string
}

export function normalizePhone(value: string): string {
  return normalizeSmsRecipient(value)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export interface RecipientValidationResult {
  valid: boolean
  recipient: string
  normalizedRecipient?: string
  error?: string
}

export function validateRecipientForChannel(
  channel: CommunicationChannel,
  candidate: { email?: string; phone?: string; accountId?: number; fullName: string },
): RecipientValidationResult {
  if (channel === 'EMAIL') {
    if (!candidate.email || !isValidEmail(candidate.email)) {
      return {
        error: `Kandidat ${candidate.fullName} nema ispravnu email adresu.`,
        recipient: candidate.email || '',
        valid: false,
      }
    }
    return {
      normalizedRecipient: candidate.email.trim().toLowerCase(),
      recipient: candidate.email.trim().toLowerCase(),
      valid: true,
    }
  }

  if (channel === 'SMS') {
    if (!candidate.phone) {
      return {
        error: `Kandidat ${candidate.fullName} nema unet broj telefona.`,
        recipient: '',
        valid: false,
      }
    }
    try {
      const normalized = normalizePhone(candidate.phone)
      return {
        normalizedRecipient: normalized,
        recipient: normalized,
        valid: true,
      }
    } catch {
      return {
        error: `Broj telefona (${candidate.phone}) kandidata ${candidate.fullName} nije u validnom formatu.`,
        recipient: candidate.phone,
        valid: false,
      }
    }
  }

  if (channel === 'IN_APP') {
    if (!candidate.accountId) {
      return {
        error: `Kandidat ${candidate.fullName} nema kreiran nalog na portalu.`,
        recipient: '',
        valid: false,
      }
    }
    return {
      normalizedRecipient: String(candidate.accountId),
      recipient: candidate.fullName,
      valid: true,
    }
  }

  return {
    error: 'Nepoznat komunikacioni kanal.',
    recipient: '',
    valid: false,
  }
}

export function matchesCohortFilter(
  candidate: AdminCandidateOverviewItem,
  filter: CandidateCohortFilter,
): boolean {
  if (filter.candidateProcessIds && filter.candidateProcessIds.length > 0) {
    if (!filter.candidateProcessIds.includes(candidate.id)) {
      return false
    }
  }

  if (filter.programCode && candidate.programCode !== filter.programCode) {
    return false
  }

  if (filter.currentStep && candidate.currentStep !== filter.currentStep) {
    return false
  }

  if (filter.processStatus && candidate.processStatus !== filter.processStatus) {
    return false
  }

  if (filter.withoutJobOffer === true && candidate.hasJobOffer) {
    return false
  }

  if (filter.hasJobOffer === true && !candidate.hasJobOffer) {
    return false
  }

  return true
}

export function validateActionRequired(data: {
  actionRequiredTitle?: string
  actionRequiredDueAt?: string
}): { valid: boolean; error?: string } {
  if (data.actionRequiredTitle && !data.actionRequiredTitle.trim()) {
    return { error: 'Naziv zahtevane akcije ne sme biti prazan.', valid: false }
  }

  if (data.actionRequiredDueAt) {
    const dueTime = Date.parse(data.actionRequiredDueAt)
    if (Number.isNaN(dueTime)) {
      return { error: 'Rok za akciju nije u ispravnom formatu datuma.', valid: false }
    }
  }

  return { valid: true }
}
