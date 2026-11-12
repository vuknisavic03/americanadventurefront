import { describe, expect, it } from 'vitest'
import { embassyLocalDateTimeToUtc, embassyReminderAt, validateEmbassyAppointment } from './rules.ts'

describe('embassy appointment date rules', () => {
  it('converts Belgrade winter and summer time to UTC', () => {
    expect(embassyLocalDateTimeToUtc({ date: '2027-01-20', time: '10:30' }).toISOString()).toBe('2027-01-20T09:30:00.000Z')
    expect(embassyLocalDateTimeToUtc({ date: '2027-06-20', time: '10:30' }).toISOString()).toBe('2027-06-20T08:30:00.000Z')
  })

  it('uses the same local time three calendar days earlier across daylight saving changes', () => {
    expect(embassyReminderAt({ date: '2027-03-30', time: '10:00' }).toISOString()).toBe('2027-03-27T09:00:00.000Z')
  })

  it('rejects past and implausibly distant appointments', () => {
    expect(() => validateEmbassyAppointment({ date: '2026-01-01', time: '10:00' }, new Date('2026-09-15T10:00:00Z'))).toThrow('budućnosti')
    expect(() => validateEmbassyAppointment({ date: '2030-01-01', time: '10:00' }, new Date('2026-09-15T10:00:00Z'))).toThrow('dve godine')
  })
})
