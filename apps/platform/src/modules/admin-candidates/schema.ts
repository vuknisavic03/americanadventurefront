import { z } from 'zod'

export const adminCandidateQuerySchema = z.object({
  currentStep: z.string().trim().optional(),
  fields: z.string().trim().optional(),
  hasJobOffer: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === true || val === 'true')),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? Math.min(num, 200) : 50
    }),
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? num : 1
    }),
  passportNumber: z.string().trim().optional(),
  processStatus: z.string().trim().optional(),
  programCode: z.string().trim().optional(),
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  withoutJobOffer: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === true || val === 'true')),
})

export const adminUpdateCandidateSchema = z.object({
  adminNotes: z.string().max(2_000).optional(),
  citizenship: z.string().max(100).optional(),
  currentStep: z.string().trim().optional(),
  nextActionDescription: z.string().max(600).optional(),
  nextActionDueAt: z.string().nullable().optional(),
  nextActionTitle: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  processStatus: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED']).optional(),
  residentialAddress: z.string().max(200).optional(),
})

export const adminCandidateExportQuerySchema = adminCandidateQuerySchema.extend({
  format: z.enum(['STANDARD', 'EMBASSY']).optional().default('STANDARD'),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? Math.min(num, 10_000) : 10_000
    }),
})

export type AdminCandidateQueryInput = z.infer<typeof adminCandidateQuerySchema>
export type AdminCandidateExportQueryInput = z.infer<typeof adminCandidateExportQuerySchema>
export type AdminUpdateCandidateInput = z.infer<typeof adminUpdateCandidateSchema>

