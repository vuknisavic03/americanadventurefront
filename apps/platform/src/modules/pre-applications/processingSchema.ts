import { z } from 'zod'

import { isValidTimeZone } from '../consultations/validation.ts'
import { consultationOutcomes, contactOutcomes } from './workflow.ts'

const expectedVersion = z.number().int().positive()

export const processingCommandSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('START_REVIEW'),
      expectedVersion,
    })
    .strict(),
  z
    .object({
      action: z.literal('RECORD_CONTACT'),
      attemptedAt: z.iso.datetime({ offset: true }),
      expectedVersion,
      nextContactAt: z.iso.datetime({ offset: true }).optional(),
      note: z.string().trim().max(2_000).optional(),
      outcome: z.enum(contactOutcomes),
    })
    .strict(),
  z
    .object({
      action: z.literal('MARK_QUALIFIED'),
      decisionNote: z.string().trim().max(2_000).optional(),
      expectedVersion,
    })
    .strict(),
  z
    .object({
      action: z.literal('MARK_REJECTED'),
      expectedVersion,
      rejectionReason: z.string().trim().min(1).max(2_000),
    })
    .strict(),
  z
    .object({
      action: z.literal('SCHEDULE_CONSULTATION'),
      endsAt: z.iso.datetime({ offset: true }).optional(),
      expectedVersion,
      startsAt: z.iso.datetime({ offset: true }),
      timeZone: z.string().trim().min(1).max(100).refine(isValidTimeZone),
    })
    .strict()
    .refine(
      (value) =>
        !value.endsAt ||
        new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
      {
      message: 'Vreme završetka mora biti posle vremena početka.',
      path: ['endsAt'],
      },
    ),
  z
    .object({
      action: z.literal('RECORD_CONSULTATION_OUTCOME'),
      expectedVersion,
      notes: z.string().trim().min(1).max(4_000),
      outcome: z.enum(consultationOutcomes),
    })
    .strict(),
  z
    .object({
      action: z.literal('MARK_READY_FOR_PROFILE'),
      approvalNote: z.string().trim().max(2_000).optional(),
      expectedVersion,
    })
    .strict(),
  z
    .object({
      action: z.literal('ISSUE_PROFILE_ACTIVATION'),
      expectedVersion,
    })
    .strict(),
])

export type ProcessingCommand = z.infer<typeof processingCommandSchema>

