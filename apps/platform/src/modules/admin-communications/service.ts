import { createHash, randomUUID } from 'node:crypto'
import type { Payload, Where } from 'payload'

import { readPlatformEnvironment, type PlatformEnvironment } from '../../config/environment.ts'
import { createCandidateEmailProvider } from '../candidate-communications/emailProvider.ts'
import { createCandidateSmsProvider } from '../embassy-appointments/smsProvider.ts'
import { listCandidatesOverview } from '../admin-candidates/service.ts'
import type { AdminCandidateOverviewItem } from '../admin-candidates/rules.ts'
import {
  calculateSmsSegments,
  getTemplate,
  listAvailableTemplates,
  renderEmailHtml,
  renderTemplateText,
  type CommunicationChannel,
} from './templates.ts'
import {
  matchesCohortFilter,
  validateActionRequired,
  validateRecipientForChannel,
  type CandidateCohortFilter,
} from './rules.ts'
import type {
  CandidateNotificationsQuery,
  CommunicationLogsQuery,
  SendBatchCommunicationInput,
  SendSingleCommunicationInput,
} from './schema.ts'

function extractRelationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return Number((value as { id: unknown }).id)
  }
  return undefined
}

export interface CandidateCommunicationTarget {
  candidateProcessId: number
  candidateAccountId?: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  programCode: string
}

export async function resolveCandidateTarget(
  payload: Payload,
  candidateProcessId: number,
): Promise<CandidateCommunicationTarget> {
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 2,
    id: candidateProcessId,
    overrideAccess: true,
  })

  if (!process) {
    throw new Error(`Kandidatski proces #${candidateProcessId} nije pronađen.`)
  }

  const accountId = extractRelationId(process.candidateAccount)
  const applicantObj =
    typeof process.applicant === 'object' && process.applicant !== null
      ? (process.applicant as { email?: string; firstName?: string; id?: number; lastName?: string; phone?: string })
      : null
  const preAppObj =
    typeof process.preApplication === 'object' && process.preApplication !== null
      ? (process.preApplication as { email?: string; firstName?: string; id?: number; lastName?: string; phone?: string })
      : null

  let firstName = applicantObj?.firstName || preAppObj?.firstName || ''
  let lastName = applicantObj?.lastName || preAppObj?.lastName || ''
  let email = applicantObj?.email || preAppObj?.email || ''
  let phone = applicantObj?.phone || preAppObj?.phone || ''

  if (!firstName && !email) {
    const applicantId = extractRelationId(process.applicant)
    if (applicantId) {
      const applicant = await payload.findByID({
        collection: 'applicants',
        depth: 0,
        id: applicantId,
        overrideAccess: true,
      })
      if (applicant) {
        firstName = applicant.firstName || ''
        lastName = applicant.lastName || ''
        email = applicant.email || ''
        phone = applicant.phone || ''
      }
    }
  }

  if (!firstName && !email) {
    const preAppId = extractRelationId(process.preApplication)
    if (preAppId) {
      const preApp = await payload.findByID({
        collection: 'pre-applications',
        depth: 1,
        id: preAppId,
        overrideAccess: true,
      })
      if (preApp) {
        const preAppApplicant =
          typeof preApp.applicant === 'object' && preApp.applicant !== null
            ? (preApp.applicant as { email?: string; firstName?: string; lastName?: string; phone?: string })
            : null
        if (preAppApplicant) {
          firstName = preAppApplicant.firstName || ''
          lastName = preAppApplicant.lastName || ''
          email = preAppApplicant.email || ''
          phone = preAppApplicant.phone || ''
        }
      }
    }
  }

  const fullName = `${firstName} ${lastName}`.trim() || `Kandidat #${candidateProcessId}`

  return {
    candidateAccountId: accountId,
    candidateProcessId,
    email: email.trim(),
    firstName: firstName.trim() || 'Kandidat',
    fullName,
    lastName: lastName.trim(),
    phone: phone.trim(),
    programCode: process.programCode || 'SWT',
  }
}

export interface SendSingleCommunicationResult {
  communicationLogId: number
  idempotencyKey: string
  provider: string
  providerMessageId?: string
  recipient: string
  status: 'DELIVERED' | 'FAILED'
  success: boolean
}

export async function sendCandidateCommunication({
  adminId,
  data,
  environment: customEnvironment,
  payload,
}: {
  adminId: number
  data: SendSingleCommunicationInput
  environment?: PlatformEnvironment
  payload: Payload
}): Promise<SendSingleCommunicationResult> {
  const target = await resolveCandidateTarget(payload, data.candidateProcessId)

  // Validacija primaoca za zadati kanal
  const validation = validateRecipientForChannel(data.channel, {
    accountId: target.candidateAccountId,
    email: target.email,
    fullName: target.fullName,
    phone: target.phone,
  })

  if (!validation.valid) {
    throw new Error(validation.error || 'Neispravni kontakt podaci primaoca.')
  }

  // Validacija zahtevane akcije
  const actionValidation = validateActionRequired({
    actionRequiredDueAt: data.actionRequiredDueAt,
    actionRequiredTitle: data.actionRequiredTitle,
  })
  if (!actionValidation.valid) {
    throw new Error(actionValidation.error)
  }

  const environment = customEnvironment || readPlatformEnvironment()
  const portalUrl = `${environment.serverUrl}/prijava`

  // Priprema promenljivih za šablon
  const templateVariables: Record<string, string | number | undefined | null> = {
    actionTitle: data.actionRequiredTitle || '',
    customNote: data.customBody || '',
    dueDate: data.actionRequiredDueAt
      ? new Date(data.actionRequiredDueAt).toLocaleDateString('sr-RS')
      : '',
    firstName: target.firstName,
    fullName: target.fullName,
    lastName: target.lastName,
    officialPhone: environment.candidateCommunication.officialPhone,
    portalUrl,
    programCode: target.programCode,
    ...(data.templateParams || {}),
  }

  let renderedSubject: string | undefined = undefined
  let renderedBody = ''

  if (data.templateKey) {
    const template = getTemplate(data.templateKey)
    if (!template) {
      throw new Error(`Šablon sa ključem "${data.templateKey}" ne postoji.`)
    }
    if (template.channel !== data.channel) {
      throw new Error(
        `Šablon "${data.templateKey}" pripada kanalu ${template.channel}, a zahtevan je kanal ${data.channel}.`,
      )
    }

    renderedSubject = template.defaultSubject
      ? renderTemplateText(template.defaultSubject, templateVariables)
      : data.customSubject
    renderedBody = renderTemplateText(data.customBody || template.defaultBody, templateVariables)
  } else {
    renderedSubject = data.customSubject
      ? renderTemplateText(data.customSubject, templateVariables)
      : undefined
    renderedBody = renderTemplateText(data.customBody || '', templateVariables)
  }

  const idempotencyKey = `admin-comm:${randomUUID()}`
  let provider = 'internal'
  let providerMessageId: string | undefined = undefined
  let status: 'DELIVERED' | 'FAILED' = 'DELIVERED'
  let errorMessage: string | undefined = undefined

  try {
    if (data.channel === 'EMAIL') {
      const emailProvider = createCandidateEmailProvider(environment.candidateCommunication)
      provider = emailProvider.name
      const html = renderEmailHtml(renderedBody)
      const contentHash = createHash('sha256')
        .update(`${renderedSubject}\n${renderedBody}\n${html}`)
        .digest('hex')

      const result = await emailProvider.send({
        idempotencyKey,
        message: {
          category: 'ACCOUNT_ACTIVATION',
          contentHash,
          html,
          subject: renderedSubject || 'American Adventure',
          templateKey: data.templateKey || 'CUSTOM_ADMIN_EMAIL',
          templateVersion: '1.0',
          text: renderedBody,
        },
        recipientEmail: validation.normalizedRecipient!,
      })
      providerMessageId = result.messageId
    } else if (data.channel === 'SMS') {
      const smsProvider = createCandidateSmsProvider(environment.candidateSms)
      provider = smsProvider.name
      const result = await smsProvider.send({
        idempotencyKey,
        recipientPhone: validation.normalizedRecipient!,
        text: renderedBody,
      })
      providerMessageId = result.messageId
    } else if (data.channel === 'IN_APP') {
      provider = 'in-app'
      providerMessageId = `in-app:${randomUUID()}`
    }
  } catch (error) {
    status = 'FAILED'
    errorMessage = error instanceof Error ? error.message : 'Greška pri isporuci poruke provajderu.'
  }

  // Kreiranje zapisa u CommunicationLogs
  const logDoc = await payload.create({
    collection: 'communication-logs',
    data: {
      actionRequiredDueAt: data.actionRequiredDueAt || undefined,
      actionRequiredTitle: data.actionRequiredTitle || undefined,
      body: renderedBody,
      candidateAccount: target.candidateAccountId || undefined,
      candidateProcess: target.candidateProcessId,
      channel: data.channel,
      errorMessage,
      idempotencyKey,
      isRead: false,
      metadata: {
        templateParams: data.templateParams,
        targetEmail: target.email,
        targetPhone: target.phone,
      },
      provider,
      providerMessageId,
      recipient: validation.normalizedRecipient || validation.recipient,
      recipientName: target.fullName,
      sentAt: new Date().toISOString(),
      sentBy: adminId,
      status,
      subject: renderedSubject,
      templateKey: data.templateKey || 'CUSTOM',
    },
    overrideAccess: true,
  })

  // Evidentiranje revizijskog događaja (Audit Event)
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: idempotencyKey,
      eventType: 'ADMIN_COMMUNICATION_SENT',
      metadata: {
        candidateProcessId: target.candidateProcessId,
        channel: data.channel,
        communicationLogId: logDoc.id,
        provider,
        providerMessageId,
        status,
        templateKey: data.templateKey || 'CUSTOM',
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  if (status === 'FAILED') {
    throw new Error(errorMessage || 'Slanje poruke nije uspelo.')
  }

  return {
    communicationLogId: logDoc.id,
    idempotencyKey,
    provider,
    providerMessageId,
    recipient: validation.normalizedRecipient || validation.recipient,
    status,
    success: true,
  }
}

export interface BatchDispatchItemResult {
  candidateProcessId: number
  error?: string
  fullName: string
  logId?: number
  recipient: string
  success: boolean
}

export interface SendBatchCommunicationResult {
  batchId: string
  channel: CommunicationChannel
  failed: number
  results: BatchDispatchItemResult[]
  succeeded: number
  total: number
}

export async function sendBatchCandidateCommunication({
  adminId,
  data,
  environment: customEnvironment,
  payload,
}: {
  adminId: number
  data: SendBatchCommunicationInput
  environment?: PlatformEnvironment
  payload: Payload
}): Promise<SendBatchCommunicationResult> {
  const batchId = randomUUID()

  // 1. Učitaj sve kandidate za kohortu
  const overviewResult = await listCandidatesOverview({
    filters: {},
    payload,
  })

  const cohortFilter: CandidateCohortFilter = {
    candidateProcessIds: data.candidateProcessIds,
    currentStep: data.filters?.currentStep,
    hasJobOffer: data.filters?.hasJobOffer,
    processStatus: data.filters?.processStatus,
    programCode: data.filters?.programCode,
    withoutJobOffer: data.filters?.withoutJobOffer,
  }

  const candidateList = overviewResult.candidates as AdminCandidateOverviewItem[]
  const eligibleCandidates = candidateList.filter((c) => matchesCohortFilter(c, cohortFilter))

  if (eligibleCandidates.length === 0) {
    throw new Error('Nijedan kandidat ne odgovara zadatim filterima kohorte.')
  }

  const results: BatchDispatchItemResult[] = []
  let succeeded = 0
  let failed = 0

  for (const candidate of eligibleCandidates) {
    try {
      const sendResult = await sendCandidateCommunication({
        adminId,
        data: {
          actionRequiredDueAt: data.actionRequiredDueAt,
          actionRequiredTitle: data.actionRequiredTitle,
          candidateProcessId: candidate.id,
          channel: data.channel,
          customBody: data.customBody,
          customSubject: data.customSubject,
          templateKey: data.templateKey,
          templateParams: data.templateParams,
        },
        environment: customEnvironment,
        payload,
      })

      results.push({
        candidateProcessId: candidate.id,
        fullName: candidate.fullName,
        logId: sendResult.communicationLogId,
        recipient: sendResult.recipient,
        success: true,
      })
      succeeded++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Greška pri slanju'
      results.push({
        candidateProcessId: candidate.id,
        error: errorMsg,
        fullName: candidate.fullName,
        recipient: candidate.email || candidate.phone || '',
        success: false,
      })
      failed++
    }
  }

  // Evidentiranje grupnog audit događaja
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: `batch:${batchId}`,
      eventType: 'ADMIN_BATCH_COMMUNICATION_SENT',
      metadata: {
        batchId,
        channel: data.channel,
        failedCount: failed,
        succeededCount: succeeded,
        templateKey: data.templateKey || 'CUSTOM',
        totalCandidates: eligibleCandidates.length,
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return {
    batchId,
    channel: data.channel,
    failed,
    results,
    succeeded,
    total: eligibleCandidates.length,
  }
}

export async function listCommunicationLogs({
  filters,
  payload,
}: {
  filters: CommunicationLogsQuery
  payload: Payload
}) {
  const whereConditions: Where[] = []

  if (filters.channel) {
    whereConditions.push({ channel: { equals: filters.channel } })
  }

  if (filters.status) {
    whereConditions.push({ status: { equals: filters.status } })
  }

  if (filters.candidateProcessId) {
    whereConditions.push({ candidateProcess: { equals: filters.candidateProcessId } })
  }

  if (filters.search) {
    whereConditions.push({
      or: [
        { recipient: { contains: filters.search } },
        { recipientName: { contains: filters.search } },
        { subject: { contains: filters.search } },
        { body: { contains: filters.search } },
      ],
    })
  }

  const where: Where = whereConditions.length > 0 ? { and: whereConditions } : {}

  const result = await payload.find({
    collection: 'communication-logs',
    depth: 1,
    limit: filters.limit,
    overrideAccess: true,
    page: filters.page,
    sort: '-sentAt',
    where,
  })

  return {
    docs: result.docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    limit: result.limit,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

export async function listCandidateNotifications({
  candidateAccountId,
  filters,
  payload,
}: {
  candidateAccountId: number
  filters: CandidateNotificationsQuery
  payload: Payload
}) {
  const whereConditions: Where[] = [
    { candidateAccount: { equals: candidateAccountId } },
    { channel: { equals: 'IN_APP' } },
  ]

  if (filters.unreadOnly) {
    whereConditions.push({ isRead: { equals: false } })
  }

  const result = await payload.find({
    collection: 'communication-logs',
    depth: 0,
    limit: filters.limit,
    overrideAccess: true,
    page: filters.page,
    sort: '-sentAt',
    where: { and: whereConditions },
  })

  // Broj nepročitanih notifikacija
  const unreadResult = await payload.find({
    collection: 'communication-logs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { candidateAccount: { equals: candidateAccountId } },
        { channel: { equals: 'IN_APP' } },
        { isRead: { equals: false } },
      ],
    },
  })

  return {
    items: result.docs.map((doc) => ({
      actionRequiredDueAt: doc.actionRequiredDueAt,
      actionRequiredTitle: doc.actionRequiredTitle,
      body: doc.body,
      createdAt: doc.createdAt,
      id: doc.id,
      isRead: doc.isRead ?? false,
      sentAt: doc.sentAt,
      subject: doc.subject,
      templateKey: doc.templateKey,
    })),
    pagination: {
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      limit: result.limit,
      page: result.page,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
    },
    unreadCount: unreadResult.totalDocs,
  }
}

export async function markCandidateNotificationsAsRead({
  candidateAccountId,
  notificationIds,
  payload,
}: {
  candidateAccountId: number
  notificationIds?: number[]
  payload: Payload
}) {
  const whereConditions: Where[] = [
    { candidateAccount: { equals: candidateAccountId } },
    { channel: { equals: 'IN_APP' } },
  ]

  if (notificationIds && notificationIds.length > 0) {
    whereConditions.push({ id: { in: notificationIds } })
  }

  const targetDocs = await payload.find({
    collection: 'communication-logs',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: { and: whereConditions },
  })

  const updatedIds: number[] = []

  for (const doc of targetDocs.docs) {
    if (!doc.isRead) {
      await payload.update({
        collection: 'communication-logs',
        data: { isRead: true },
        id: doc.id,
        overrideAccess: true,
      })
      updatedIds.push(doc.id)
    }
  }

  return {
    markedCount: updatedIds.length,
    markedIds: updatedIds,
    success: true,
  }
}

export function getCommunicationTemplatesCatalog(channel?: CommunicationChannel) {
  const templates = listAvailableTemplates(channel)
  return templates.map((tmpl) => {
    const smsMetrics = tmpl.channel === 'SMS' ? calculateSmsSegments(tmpl.defaultBody) : undefined
    return {
      ...tmpl,
      smsMetrics,
    }
  })
}
