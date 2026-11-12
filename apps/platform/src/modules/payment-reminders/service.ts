import { createHash, randomUUID } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

import { readPlatformEnvironment, type PlatformEnvironment } from '../../config/environment.ts'
import { createCandidateEmailProvider } from '../candidate-communications/emailProvider.ts'
import {
  createCandidateSmsProvider,
  normalizeSmsRecipient,
} from '../embassy-appointments/smsProvider.ts'
import {
  buildPaymentReminderContext,
  DEFAULT_PAYMENT_REMINDER_RULES,
  determineActiveObligation,
  evaluateObligations,
  generatePaymentReminderIdempotencyKey,
  renderPaymentReminderEmail,
  renderPaymentReminderInApp,
  renderPaymentReminderSms,
} from './rules.ts'
import type {
  CandidateReminderProfile,
  PaymentReminderChannel,
  PaymentReminderRules,
  PaymentReminderTrigger,
  ReminderDispatchResult,
  SendPaymentReminderInput,
} from './types.ts'

function relationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return Number((value as { id: unknown }).id)
  }
  return undefined
}

export class PaymentReminderError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message)
    this.name = 'PaymentReminderError'
  }
}

interface ResolvedCandidateTarget {
  candidateAccountId: number
  candidateName: string
  correlationId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  preApplicationId: number
  programCode: string
}

async function resolveCandidateTarget(
  payload: Payload,
  candidateProcessId: number,
): Promise<ResolvedCandidateTarget> {
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 1,
    id: candidateProcessId,
    overrideAccess: true,
  })

  if (!process) {
    throw new PaymentReminderError('Kandidatski proces nije pronađen.', 404)
  }

  const candidateAccountId = relationId(process.candidateAccount)
  if (!candidateAccountId) {
    throw new PaymentReminderError('Korisnički nalog kandidata nije povezan.', 404)
  }

  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 1,
    id: candidateAccountId,
    overrideAccess: true,
  })

  if (!account) {
    throw new PaymentReminderError('Nalog kandidata nije pronađen.', 404)
  }

  let firstName = 'Kandidat'
  let lastName = ''
  let phone = ''
  let correlationId: string = randomUUID()
  const preApplicationId = relationId(process.preApplication) || 0

  if (preApplicationId) {
    const preApp = await payload
      .findByID({
        collection: 'pre-applications',
        depth: 0,
        id: preApplicationId,
        overrideAccess: true,
      })
      .catch(() => null)
    if (preApp?.correlationId) {
      correlationId = preApp.correlationId
    }
  }

  if (account.applicant) {
    const applicant =
      typeof account.applicant === 'object' && account.applicant !== null
        ? (account.applicant as {
            firstName?: string
            lastName?: string
            phone?: string
            phoneNormalized?: string
          })
        : await payload
            .findByID({
              collection: 'applicants',
              depth: 0,
              id: Number(account.applicant),
              overrideAccess: true,
            })
            .catch(() => null)

    if (applicant) {
      if (applicant.firstName) firstName = applicant.firstName.trim()
      if (applicant.lastName) lastName = applicant.lastName.trim()
      phone = applicant.phoneNormalized || applicant.phone || ''
    }
  }

  const candidateName = account.fullName?.trim() || `${firstName} ${lastName}`.trim() || 'Kandidat'

  return {
    candidateAccountId: account.id,
    candidateName,
    correlationId,
    email: account.email || '',
    firstName,
    lastName,
    phone,
    preApplicationId,
    programCode: process.programCode || 'SWT',
  }
}

/**
 * Lists candidates with payment plan obligations, evaluated according to current reference date
 * and configured reminder rules.
 */
export async function listCandidatesForPaymentReminders({
  asOfDate = new Date(),
  limit = 50,
  page = 1,
  payload,
  rules = DEFAULT_PAYMENT_REMINDER_RULES,
  search,
  triggerFilter,
}: {
  asOfDate?: Date
  limit?: number
  page?: number
  payload: Payload
  rules?: Partial<PaymentReminderRules>
  search?: string
  triggerFilter?: 'ALL' | 'DUE_TODAY' | 'OVERDUE' | 'PRE_DUE'
}): Promise<{
  items: CandidateReminderProfile[]
  stats: {
    dueTodayCount: number
    eligibleCount: number
    overdueCount: number
    preDueCount: number
    totalActivePlans: number
  }
  total: number
}> {
  // Find active payment plans
  const plansResult = await payload.find({
    collection: 'candidate-payment-plans',
    depth: 0,
    limit: 500, // Process active plans
    overrideAccess: true,
    where: {
      status: { equals: 'ACTIVE' },
    },
  })

  let overdueCount = 0
  let dueTodayCount = 0
  let preDueCount = 0
  let eligibleCount = 0

  const allProfiles: CandidateReminderProfile[] = []

  for (const plan of plansResult.docs) {
    if (plan.remainingCents <= 0) continue

    const processId = relationId(plan.candidateProcess)
    const accountId = relationId(plan.candidateAccount)
    if (!processId || !accountId) continue

    let target: ResolvedCandidateTarget
    try {
      target = await resolveCandidateTarget(payload, processId)
    } catch {
      continue
    }

    const obligationsRaw = Array.isArray(plan.obligations)
      ? (plan.obligations as Array<{
          amountCents: number
          dueAt: string | null
          key: string
          kind?: 'DEFERRED' | 'INITIAL' | 'INSTALLMENT'
          label?: string
        }>)
      : []

    const allObligations = evaluateObligations({
      asOfDate,
      obligations: obligationsRaw,
      paidCents: plan.paidCents,
      rules,
    })

    const activeObligation = determineActiveObligation(allObligations)

    if (activeObligation?.isEligibleForReminder) {
      eligibleCount++
      if (activeObligation.trigger === 'OVERDUE') overdueCount++
      else if (activeObligation.trigger === 'ON_DUE') dueTodayCount++
      else if (activeObligation.trigger === 'PRE_DUE') preDueCount++
    }

    // Query last payment reminder sent to this candidate
    let lastReminderSentAt: string | null = null
    let lastReminderTrigger: PaymentReminderTrigger | null = null

    try {
      const recentLogs = await payload.find({
        collection: 'communication-logs',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        sort: '-sentAt',
        where: {
          and: [
            { candidateProcess: { equals: processId } },
            {
              or: [
                { templateKey: { equals: 'EMAIL_PAYMENT_REMINDER' } },
                { templateKey: { equals: 'SMS_PAYMENT_DUE' } },
                { templateKey: { equals: 'IN_APP_PAYMENT_REMINDER' } },
              ],
            },
          ],
        },
      })

      if (recentLogs.docs.length > 0) {
        const doc = recentLogs.docs[0]
        lastReminderSentAt = doc.sentAt
        const meta = doc.metadata as { trigger?: PaymentReminderTrigger } | null
        if (meta && meta.trigger) {
          lastReminderTrigger = meta.trigger
        }
      }
    } catch {
      // Non-fatal if query fails
    }

    allProfiles.push({
      activeObligation,
      allObligations,
      candidateAccountId: target.candidateAccountId,
      candidateProcessId: processId,
      email: target.email,
      firstName: target.firstName,
      fullName: target.candidateName,
      lastName: target.lastName,
      lastReminderSentAt,
      lastReminderTrigger,
      paidCents: plan.paidCents,
      paymentPlanId: plan.id,
      phone: target.phone,
      programCode: target.programCode,
      remainingCents: plan.remainingCents,
      selectedMethod: plan.selectedMethod,
      totalCents: plan.totalCents,
    })
  }

  // Apply filters
  let filtered = allProfiles

  if (triggerFilter && triggerFilter !== 'ALL') {
    if (triggerFilter === 'OVERDUE') {
      filtered = filtered.filter((p) => p.activeObligation?.trigger === 'OVERDUE')
    } else if (triggerFilter === 'DUE_TODAY') {
      filtered = filtered.filter((p) => p.activeObligation?.trigger === 'ON_DUE')
    } else if (triggerFilter === 'PRE_DUE') {
      filtered = filtered.filter((p) => p.activeObligation?.trigger === 'PRE_DUE')
    }
  }

  if (search && search.trim().length > 0) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.programCode.toLowerCase().includes(q) ||
        p.activeObligation?.label.toLowerCase().includes(q),
    )
  }

  const total = filtered.length
  const startIndex = (page - 1) * limit
  const items = filtered.slice(startIndex, startIndex + limit)

  return {
    items,
    stats: {
      dueTodayCount,
      eligibleCount,
      overdueCount,
      preDueCount,
      totalActivePlans: allProfiles.length,
    },
    total,
  }
}

/**
 * Dispatches a payment reminder (Email, SMS, and/or In-App) for a specific candidate obligation.
 */
function getEffectiveEnvironment(env?: PlatformEnvironment): PlatformEnvironment {
  if (env) return env
  try {
    return readPlatformEnvironment()
  } catch {
    return {
      candidateCommunication: {
        consultationBookingUrl: 'https://calendly.com/consultations',
        officialPhone: '+381111234567',
        privacyPolicyUrl: 'https://workandtravel.rs/politika-privatnosti',
        provider: 'capture',
        replyTo: 'prijava@workandtravel.rs',
      },
      candidateSms: {
        provider: 'capture',
        sender: 'AA',
      },
      serverUrl: 'https://workandtravel.rs',
    } as unknown as PlatformEnvironment
  }
}

/**
 * Dispatches a payment reminder (Email, SMS, and/or In-App) for a specific candidate obligation.
 */
export async function sendPaymentReminder({
  administratorId,
  asOfDate = new Date(),
  environment: customEnvironment,
  input,
  payload,
  req,
}: {
  administratorId?: number
  asOfDate?: Date
  environment?: PlatformEnvironment
  input: SendPaymentReminderInput
  payload: Payload
  req?: PayloadRequest
}): Promise<ReminderDispatchResult[]> {
  const env = getEffectiveEnvironment(customEnvironment)
  const target = await resolveCandidateTarget(payload, input.candidateProcessId)

  // Fetch plan
  const planDoc = (
    await payload.find({
      collection: 'candidate-payment-plans',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateProcess: { equals: input.candidateProcessId } },
    })
  ).docs[0]

  if (!planDoc) {
    throw new PaymentReminderError('Plan plaćanja za kandidata nije pronađen.', 404)
  }

  const obligationsRaw = Array.isArray(planDoc.obligations)
    ? (planDoc.obligations as Array<{
        amountCents: number
        dueAt: string | null
        key: string
        kind?: 'DEFERRED' | 'INITIAL' | 'INSTALLMENT'
        label?: string
      }>)
    : []

  const evaluatedObligations = evaluateObligations({
    asOfDate,
    obligations: obligationsRaw,
    paidCents: planDoc.paidCents,
  })

  const targetObligation = evaluatedObligations.find((o) => o.key === input.obligationKey)
  if (!targetObligation) {
    throw new PaymentReminderError(`Rata sa oznakom "${input.obligationKey}" nije pronađena.`, 404)
  }

  if (targetObligation.isFullyPaid) {
    throw new PaymentReminderError(`Rata "${targetObligation.label}" je već u celosti izmirena.`, 400)
  }

  const trigger: PaymentReminderTrigger =
    input.trigger || targetObligation.trigger || 'PRE_DUE'

  const reminderContext = buildPaymentReminderContext({
    candidateAccountId: target.candidateAccountId,
    candidateName: target.candidateName,
    customNote: input.customNote,
    email: target.email,
    obligation: targetObligation,
    phone: target.phone,
    portalBaseUrl: env.serverUrl,
    programCode: target.programCode,
  })

  const targetChannels: PaymentReminderChannel[] =
    input.channel && input.channel !== 'ALL'
      ? [input.channel]
      : ['EMAIL', 'SMS', 'IN_APP']

  const dateCycleKey = targetObligation.dueAt
    ? targetObligation.dueAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const emailContent = renderPaymentReminderEmail(reminderContext)
  const smsContent = renderPaymentReminderSms(reminderContext)
  const inAppContent = renderPaymentReminderInApp(reminderContext)

  const results: ReminderDispatchResult[] = []

  for (const channel of targetChannels) {
    const idempotencyKey = generatePaymentReminderIdempotencyKey(
      target.candidateAccountId,
      targetObligation.key,
      trigger,
      `${dateCycleKey}:${channel.toLowerCase()}`,
    )

    // Check existing delivery unless forced
    if (!input.force) {
      const existing = await payload.find({
        collection: 'communication-logs',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: {
          and: [
            { idempotencyKey: { equals: idempotencyKey } },
            { status: { equals: 'DELIVERED' } },
          ],
        },
      })

      if (existing.docs.length > 0) {
        results.push({
          candidateProcessId: input.candidateProcessId,
          channel,
          obligationKey: targetObligation.key,
          reason: 'ALREADY_DELIVERED',
          status: 'SKIPPED',
        })
        continue
      }
    }

    let status: 'DELIVERED' | 'FAILED' = 'DELIVERED'
    let provider = 'internal'
    let providerMessageId: string | undefined
    let errorMessage: string | undefined
    let subject: string | undefined
    let body = ''
    let recipientContact = ''
    let templateKey = 'IN_APP_PAYMENT_REMINDER'

    if (channel === 'EMAIL') {
      templateKey = 'EMAIL_PAYMENT_REMINDER'
      subject = emailContent.subject
      body = emailContent.text
      recipientContact = target.email

      if (!recipientContact) {
        status = 'FAILED'
        errorMessage = 'Kandidat nema definisanu email adresu.'
      } else {
        try {
          const emailProvider = createCandidateEmailProvider(env.candidateCommunication)
          provider = emailProvider.name
          const contentHash = createHash('sha256')
            .update(`${subject}\n${body}\n${emailContent.html}`)
            .digest('hex')

          const emailRes = await emailProvider.send({
            idempotencyKey,
            message: {
              category: 'ACCOUNT_ACTIVATION',
              contentHash,
              html: emailContent.html,
              subject,
              templateKey,
              templateVersion: '1.0',
              text: body,
            },
            recipientEmail: recipientContact,
          })
          providerMessageId = emailRes.messageId
        } catch (err) {
          status = 'FAILED'
          errorMessage = err instanceof Error ? err.message : 'Greška pri slanju emaila.'
        }
      }
    } else if (channel === 'SMS') {
      templateKey = 'SMS_PAYMENT_DUE'
      body = smsContent
      recipientContact = target.phone

      if (!recipientContact) {
        status = 'FAILED'
        errorMessage = 'Kandidat nema definisan broj telefona.'
      } else {
        try {
          const smsProvider = createCandidateSmsProvider(env.candidateSms)
          provider = smsProvider.name
          const normalizedPhone = normalizeSmsRecipient(recipientContact)
          const smsRes = await smsProvider.send({
            idempotencyKey,
            recipientPhone: normalizedPhone,
            text: body,
          })
          providerMessageId = smsRes.messageId
        } catch (err) {
          status = 'FAILED'
          errorMessage = err instanceof Error ? err.message : 'Greška pri slanju SMS-a.'
        }
      }
    } else if (channel === 'IN_APP') {
      templateKey = 'IN_APP_PAYMENT_REMINDER'
      subject = inAppContent.title
      body = inAppContent.body
      recipientContact = target.email || String(target.candidateAccountId)
      provider = 'in-app'
      providerMessageId = `in-app:${randomUUID()}`
    }

    // Evidentiranje u CommunicationLogs
    let logDocId: number | undefined
    try {
      const createdLog = await payload.create({
        collection: 'communication-logs',
        data: {
          actionRequiredDueAt: targetObligation.dueAt || undefined,
          actionRequiredTitle: inAppContent.title,
          body,
          candidateAccount: target.candidateAccountId,
          candidateProcess: input.candidateProcessId,
          channel,
          errorMessage,
          idempotencyKey,
          isRead: false,
          metadata: {
            amountCents: targetObligation.unpaidCents,
            amountRsd: targetObligation.amountRsd,
            amountUsd: targetObligation.amountUsd,
            customNote: input.customNote,
            daysOverdue: targetObligation.daysOverdue,
            daysUntilDue: targetObligation.daysUntilDue,
            obligationKey: targetObligation.key,
            obligationLabel: targetObligation.label,
            trigger,
          },
          provider,
          providerMessageId,
          recipient: recipientContact,
          recipientName: target.candidateName,
          sentAt: new Date().toISOString(),
          sentBy: administratorId,
          status,
          subject,
          templateKey,
        },
        overrideAccess: true,
        req,
      })
      logDocId = createdLog.id
    } catch (logErr) {
      console.error('Failed to create communication log for payment reminder:', logErr)
    }

    // Revizijski zapis u audit-events
    if (status === 'DELIVERED') {
      try {
        await payload.create({
          collection: 'audit-events',
          data: {
            actor: administratorId,
            actorType: administratorId ? 'ADMIN' : 'SYSTEM',
            correlationId: target.correlationId,
            eventType: 'PAYMENT_REMINDER_SENT',
            metadata: {
              amountCents: targetObligation.unpaidCents,
              candidateProcessId: input.candidateProcessId,
              channel,
              obligationKey: targetObligation.key,
              providerMessageId,
              trigger,
            },
            occurredAt: new Date().toISOString(),
            preApplication: target.preApplicationId || undefined,
          },
          overrideAccess: true,
          req,
        })
      } catch (auditErr) {
        console.error('Failed to create audit event for payment reminder:', auditErr)
      }
    }

    results.push({
      candidateProcessId: input.candidateProcessId,
      channel,
      communicationLogId: logDocId,
      obligationKey: targetObligation.key,
      providerMessageId,
      reason: errorMessage,
      status,
    })
  }

  return results
}

/**
 * Bulk dispatch payment reminders to candidates.
 */
export async function batchSendPaymentReminders({
  administratorId,
  asOfDate = new Date(),
  candidateProcessIds,
  channel,
  force = false,
  payload,
  req,
  triggerFilter,
}: {
  administratorId?: number
  asOfDate?: Date
  candidateProcessIds?: number[]
  channel?: PaymentReminderChannel | 'ALL'
  force?: boolean
  payload: Payload
  req?: PayloadRequest
  triggerFilter?: 'ALL' | 'DUE_TODAY' | 'OVERDUE' | 'PRE_DUE'
}): Promise<{
  dispatched: number
  failed: number
  results: ReminderDispatchResult[]
  skipped: number
  totalProcessed: number
}> {
  const { items } = await listCandidatesForPaymentReminders({
    asOfDate,
    limit: 1000,
    payload,
    triggerFilter,
  })

  let targets = items
  if (candidateProcessIds && candidateProcessIds.length > 0) {
    const idSet = new Set(candidateProcessIds)
    targets = targets.filter((t) => idSet.has(t.candidateProcessId))
  }

  let dispatched = 0
  let skipped = 0
  let failed = 0
  const allResults: ReminderDispatchResult[] = []

  for (const candidate of targets) {
    if (!candidate.activeObligation) continue

    try {
      const dispatchResults = await sendPaymentReminder({
        administratorId,
        asOfDate,
        input: {
          candidateProcessId: candidate.candidateProcessId,
          channel,
          force,
          obligationKey: candidate.activeObligation.key,
          trigger: candidate.activeObligation.trigger || undefined,
        },
        payload,
        req,
      })

      for (const res of dispatchResults) {
        allResults.push(res)
        if (res.status === 'DELIVERED') dispatched++
        else if (res.status === 'SKIPPED') skipped++
        else if (res.status === 'FAILED') failed++
      }
    } catch {
      failed++
    }
  }

  return {
    dispatched,
    failed,
    results: allResults,
    skipped,
    totalProcessed: targets.length,
  }
}

/**
 * Automated cron/job runner evaluating active plans and dispatching due reminders.
 */
export async function runAutomatedPaymentRemindersJob({
  asOfDate = new Date(),
  dryRun = false,
  payload,
  req,
  rules,
}: {
  asOfDate?: Date
  dryRun?: boolean
  payload: Payload
  req?: PayloadRequest
  rules?: Partial<PaymentReminderRules>
}): Promise<{
  dispatched: number
  eligible: number
  failed: number
  results: ReminderDispatchResult[]
  skipped: number
  totalEvaluated: number
}> {
  const { items } = await listCandidatesForPaymentReminders({
    asOfDate,
    limit: 2000,
    payload,
    rules,
  })

  // Candidates who have an active obligation eligible for a reminder
  const eligibleCandidates = items.filter((item) => item.activeObligation?.isEligibleForReminder)

  if (dryRun) {
    return {
      dispatched: 0,
      eligible: eligibleCandidates.length,
      failed: 0,
      results: [],
      skipped: 0,
      totalEvaluated: items.length,
    }
  }

  const batchRes = await batchSendPaymentReminders({
    asOfDate,
    candidateProcessIds: eligibleCandidates.map((c) => c.candidateProcessId),
    force: false,
    payload,
    req,
  })

  return {
    dispatched: batchRes.dispatched,
    eligible: eligibleCandidates.length,
    failed: batchRes.failed,
    results: batchRes.results,
    skipped: batchRes.skipped,
    totalEvaluated: items.length,
  }
}
