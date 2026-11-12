import { describe, expect, it } from 'vitest'

import { assertOutcomeAllowed, validateScheduleWindow, validateTimeZone } from './rules.ts'

describe('interview preparation rules', () => {
  const now = new Date('2026-09-08T10:00:00.000Z')

  it('accepts a future appointment with a recognized time zone', () => {
    expect(validateTimeZone('Europe/Belgrade')).toBe('Europe/Belgrade')
    expect(() => validateScheduleWindow({
      endsAt: new Date('2026-09-08T12:00:00.000Z'),
      now,
      startsAt: new Date('2026-09-08T11:00:00.000Z'),
    })).not.toThrow()
  })

  it('rejects past, reversed, and excessive appointment windows', () => {
    expect(() => validateScheduleWindow({ now, startsAt: new Date('2026-09-08T09:00:00.000Z') })).toThrow('budućnosti')
    expect(() => validateScheduleWindow({ endsAt: now, now, startsAt: new Date('2026-09-08T11:00:00.000Z') })).toThrow('posle početka')
    expect(() => validateScheduleWindow({ endsAt: new Date('2026-09-08T16:00:01.000Z'), now, startsAt: new Date('2026-09-08T11:00:00.000Z') })).toThrow('četiri sata')
  })

  it('rejects an unknown time zone', () => {
    expect(() => validateTimeZone('Europe/Unknown')).toThrow('nije ispravna')
  })

  it('allows cancellation before a term but records attendance only after it starts', () => {
    const startsAt = new Date('2026-09-08T11:00:00.000Z')
    expect(() => assertOutcomeAllowed({ now, outcome: 'CANCELLED', startsAt, status: 'SCHEDULED' })).not.toThrow()
    expect(() => assertOutcomeAllowed({ now, outcome: 'COMPLETED', startsAt, status: 'SCHEDULED' })).toThrow('tek kada termin počne')
    expect(() => assertOutcomeAllowed({ now: new Date('2026-09-08T11:00:00.000Z'), outcome: 'NO_SHOW', startsAt, status: 'SCHEDULED' })).not.toThrow()
  })
})
