import { z } from 'zod'

export const documentTranslationTypeEnum = z.enum([
  'STUDENT_STATUS_CERTIFICATE',
  'GUARANTOR_STATEMENT',
  'GENERAL_DOCUMENT',
])

export const translationStatusEnum = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
])

export const requestTranslationSchema = z.object({
  candidateProcessId: z.number().int().positive(),
  customSourceData: z.record(z.string(), z.unknown()).optional(),
  documentType: documentTranslationTypeEnum.default('STUDENT_STATUS_CERTIFICATE'),
  title: z.string().min(1).max(255).optional(),
})

export type RequestTranslationInput = z.infer<typeof requestTranslationSchema>

export const updateTranslationDraftSchema = z.object({
  adminNotes: z.string().max(2000).optional(),
  translatedData: z.record(z.string(), z.unknown()),
})

export type UpdateTranslationDraftInput = z.infer<typeof updateTranslationDraftSchema>

export const reviewTranslationSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    adminNotes: z.string().max(2000).optional(),
    correctedData: z.record(z.string(), z.unknown()).optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'REJECT') {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0)
      }
      return true
    },
    {
      message: 'Razlog odbijanja je obavezan kada se prevod odbija.',
      path: ['rejectionReason'],
    },
  )

export type ReviewTranslationInput = z.infer<typeof reviewTranslationSchema>

export const translationQuerySchema = z.object({
  candidateProcessId: z.coerce.number().int().positive().optional(),
  documentType: documentTranslationTypeEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
  status: translationStatusEnum.optional(),
})

export type TranslationQuery = z.infer<typeof translationQuerySchema>
