import { z } from 'zod'

export const communicationChannelEnum = z.enum(['EMAIL', 'SMS', 'IN_APP'])

export const sendSingleCommunicationSchema = z
  .object({
    actionRequiredDueAt: z.string().optional(),
    actionRequiredTitle: z.string().max(255).optional(),
    candidateProcessId: z.number().int().positive(),
    channel: communicationChannelEnum,
    customBody: z.string().min(1).max(5000).optional(),
    customSubject: z.string().max(255).optional(),
    templateKey: z.string().optional(),
    templateParams: z.record(z.string(), z.string()).optional(),
  })
  .refine(
    (data) => Boolean(data.templateKey || data.customBody),
    {
      message: 'Morate odabrati šablon ili uneti sopstveni tekst poruke.',
      path: ['customBody'],
    },
  )
  .refine(
    (data) => {
      if (data.channel === 'EMAIL' && !data.templateKey) {
        return Boolean(data.customSubject && data.customSubject.trim().length > 0)
      }
      return true
    },
    {
      message: 'Naslov email poruke je obavezan kada se ne koristi šablon.',
      path: ['customSubject'],
    },
  )

export type SendSingleCommunicationInput = z.infer<typeof sendSingleCommunicationSchema>

export const cohortFiltersSchema = z.object({
  currentStep: z.string().optional(),
  hasJobOffer: z.boolean().optional(),
  processStatus: z.string().optional(),
  programCode: z.string().optional(),
  withoutJobOffer: z.boolean().optional(),
})

export const sendBatchCommunicationSchema = z
  .object({
    actionRequiredDueAt: z.string().optional(),
    actionRequiredTitle: z.string().max(255).optional(),
    candidateProcessIds: z.array(z.number().int().positive()).optional(),
    channel: communicationChannelEnum,
    customBody: z.string().min(1).max(5000).optional(),
    customSubject: z.string().max(255).optional(),
    filters: cohortFiltersSchema.optional(),
    templateKey: z.string().optional(),
    templateParams: z.record(z.string(), z.string()).optional(),
  })
  .refine(
    (data) => Boolean(data.templateKey || data.customBody),
    {
      message: 'Morate odabrati šablon ili uneti sopstveni tekst poruke.',
      path: ['customBody'],
    },
  )
  .refine(
    (data) => {
      const hasIds = Array.isArray(data.candidateProcessIds) && data.candidateProcessIds.length > 0
      const hasFilters = Boolean(
        data.filters &&
          (data.filters.currentStep ||
            data.filters.programCode ||
            data.filters.processStatus ||
            data.filters.withoutJobOffer !== undefined ||
            data.filters.hasJobOffer !== undefined),
      )
      return hasIds || hasFilters
    },
    {
      message: 'Morate specificirati listu kandidata ili filtere kohorte.',
      path: ['candidateProcessIds'],
    },
  )
  .refine(
    (data) => {
      if (data.channel === 'EMAIL' && !data.templateKey) {
        return Boolean(data.customSubject && data.customSubject.trim().length > 0)
      }
      return true
    },
    {
      message: 'Naslov email poruke je obavezan kada se ne koristi šablon.',
      path: ['customSubject'],
    },
  )

export type SendBatchCommunicationInput = z.infer<typeof sendBatchCommunicationSchema>

export const communicationLogsQuerySchema = z.object({
  candidateProcessId: z.coerce.number().int().positive().optional(),
  channel: communicationChannelEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
  search: z.string().optional(),
  status: z.enum(['DELIVERED', 'FAILED', 'PENDING']).optional(),
})

export type CommunicationLogsQuery = z.infer<typeof communicationLogsQuerySchema>

export const candidateNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  page: z.coerce.number().int().positive().default(1),
  unreadOnly: z
    .preprocess((v) => {
      if (v === 'true' || v === true) return true
      if (v === 'false' || v === false) return false
      return undefined
    }, z.boolean().optional()),
})

export type CandidateNotificationsQuery = z.infer<typeof candidateNotificationsQuerySchema>

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()).optional(),
})

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>
