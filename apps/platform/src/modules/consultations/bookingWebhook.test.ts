import { describe, expect, it } from 'vitest'

import {
  consultationBookingEventSchema,
  signConsultationWebhook,
  verifyConsultationWebhookSignature,
} from './bookingWebhook.ts'

describe('consultation booking webhook contract', () => {
  const bookedEvent = {
    action: 'BOOKED',
    correlationId: '13a60d40-8101-48c6-a308-94c3a055fc46',
    endsAt: '2026-09-01T11:00:00.000Z',
    eventId: 'evt_123',
    provider: 'generic-booking',
    startsAt: '2026-09-01T10:00:00.000Z',
    timeZone: 'Europe/Belgrade',
  }

  it('accepts a complete provider-neutral booking event', () => {
    expect(consultationBookingEventSchema.safeParse(bookedEvent).success).toBe(true)
  })

  it('requires schedule data for a booking and rejects reversed times', () => {
    expect(
      consultationBookingEventSchema.safeParse({
        action: 'BOOKED',
        correlationId: bookedEvent.correlationId,
        eventId: bookedEvent.eventId,
        provider: bookedEvent.provider,
      }).success,
    ).toBe(false)
    expect(
      consultationBookingEventSchema.safeParse({
        ...bookedEvent,
        timeZone: 'Belgrade-ish',
      }).success,
    ).toBe(false)
    expect(
      consultationBookingEventSchema.safeParse({
        ...bookedEvent,
        endsAt: '2026-09-01T09:00:00.000Z',
      }).success,
    ).toBe(false)
  })

  it('accepts a cancellation without schedule fields', () => {
    expect(
      consultationBookingEventSchema.safeParse({
        action: 'CANCELLED',
        correlationId: bookedEvent.correlationId,
        eventId: bookedEvent.eventId,
        provider: bookedEvent.provider,
      }).success,
    ).toBe(true)
  })

  it('verifies the exact request body with a timing-safe HMAC comparison', () => {
    const rawBody = JSON.stringify(bookedEvent)
    const signature = signConsultationWebhook(rawBody, 'separate-booking-secret')

    expect(
      verifyConsultationWebhookSignature(rawBody, `sha256=${signature}`, 'separate-booking-secret'),
    ).toBe(true)
    expect(
      verifyConsultationWebhookSignature(`${rawBody} `, signature, 'separate-booking-secret'),
    ).toBe(false)
    expect(verifyConsultationWebhookSignature(rawBody, 'not-hex', 'separate-booking-secret')).toBe(
      false,
    )
  })
})

