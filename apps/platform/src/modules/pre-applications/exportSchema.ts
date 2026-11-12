import { z } from 'zod'

export const preApplicationExportQuerySchema = z.object({
  campaignCode: z.string().trim().optional(),
  consultationStatus: z.string().trim().optional(),
  contactStatus: z.string().trim().optional(),
  currentStudyYear: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  fields: z.string().trim().optional(),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? Math.min(num, 10_000) : 10_000
    }),
  page: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? num : 1
    }),
  programCode: z.string().trim().optional(),
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  studyCity: z.string().trim().optional(),
  studyInterruptionStatus: z.string().trim().optional(),
})

export type PreApplicationExportQueryInput = z.infer<typeof preApplicationExportQuerySchema>
