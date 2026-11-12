import { describe, expect, it } from 'vitest'

import { processingCommandSchema } from './processingSchema.ts'

describe('processing command schema', () => {
  it('accepts a complete phone contact record', () => {
    expect(
      processingCommandSchema.safeParse({
        action: 'RECORD_CONTACT',
        attemptedAt: '2026-08-27T10:30:00.000Z',
        expectedVersion: 2,
        nextContactAt: '2026-08-28T12:00:00.000Z',
        note: 'Kandidat je zamolio da ga pozovemo sutra.',
        outcome: 'CALLBACK_REQUESTED',
      }).success,
    ).toBe(true)
  })

  it('rejects unknown fields and an empty rejection reason', () => {
    expect(
      processingCommandSchema.safeParse({
        action: 'START_REVIEW',
        expectedVersion: 1,
        status: 'QUALIFIED',
      }).success,
    ).toBe(false)
    expect(
      processingCommandSchema.safeParse({
        action: 'MARK_REJECTED',
        expectedVersion: 3,
        rejectionReason: '   ',
      }).success,
    ).toBe(false)
  })

  it('validates consultation scheduling and outcome commands', () => {
    expect(
      processingCommandSchema.safeParse({
        action: 'SCHEDULE_CONSULTATION',
        endsAt: '2026-09-01T11:00:00.000Z',
        expectedVersion: 6,
        startsAt: '2026-09-01T10:00:00.000Z',
        timeZone: 'Europe/Belgrade',
      }).success,
    ).toBe(true)
    expect(
      processingCommandSchema.safeParse({
        action: 'SCHEDULE_CONSULTATION',
        endsAt: '2026-09-01T09:00:00.000Z',
        expectedVersion: 6,
        startsAt: '2026-09-01T10:00:00.000Z',
        timeZone: 'Europe/Belgrade',
      }).success,
    ).toBe(false)
    expect(
      processingCommandSchema.safeParse({
        action: 'RECORD_CONSULTATION_OUTCOME',
        expectedVersion: 7,
        notes: 'Kandidat je upoznat sa narednim koracima.',
        outcome: 'ATTENDED',
      }).success,
    ).toBe(true)
  })
})

