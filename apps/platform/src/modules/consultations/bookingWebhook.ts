import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

import { isValidTimeZone } from './validation.ts'

export const consultationBookingEventSchema = z
  .object({
    action: z.enum(['BOOKED', 'CANCELLED']),
    correlationId: z.uuid(),
    endsAt: z.iso.datetime({ offset: true }).optional(),
    eventId: z.string().trim().min(1).max(200),
    provider: z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/),
    startsAt: z.iso.datetime({ offset: true }).optional(),
    timeZone: z.string().trim().min(1).max(100).refine(isValidTimeZone).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === 'BOOKED' && (!value.startsAt || !value.timeZone)) {
      context.addIssue({
        code: 'custom',
        message: 'Početak i vremenska zona su obavezni za rezervaciju.',
      })
    }

    if (
      value.startsAt &&
      value.endsAt &&
      new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Vreme završetka mora biti posle vremena početka.',
        path: ['endsAt'],
      })
    }
  })

export type ConsultationBookingEvent = z.infer<typeof consultationBookingEventSchema>

export function signConsultationWebhook(rawBody: string, secret: string) {
  return createHmac('sha256', secret).update(rawBody).digest('hex')
}

export function verifyConsultationWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  const normalized = signature?.replace(/^sha256=/, '').toLowerCase()
  if (!normalized || !/^[a-f0-9]{64}$/.test(normalized)) return false

  const expected = Buffer.from(signConsultationWebhook(rawBody, secret), 'hex')
  const received = Buffer.from(normalized, 'hex')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

