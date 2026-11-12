import { describe, expect, it } from 'vitest'
import { preparationCalendar } from './calendar.ts'

describe('embassy preparation calendar', () => {
  it('uses UTC and escapes and folds user text without allowing injected events', () => {
    const value = preparationCalendar({ id: 1, startsAt: '2026-10-01T12:00:00+02:00', endsAt: '2026-10-01T13:00:00+02:00', locationDetails: 'Sala, 2; sprat\\ulaz\nBEGIN:VEVENT', candidateInstructions: 'Č'.repeat(120) }, new Date('2026-09-16T12:00:00Z'))
    expect(value).toContain('DTSTART:20261001T100000Z\r\n')
    expect(value).toContain('DTEND:20261001T110000Z\r\n')
    expect(value).toContain('LOCATION:Sala\\, 2\\; sprat\\\\ulaz\\nBEGIN:VEVENT')
    expect(value.split('\r\n').filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1)
    expect(value.split('\r\n').every((line) => Buffer.byteLength(line) <= 75)).toBe(true)
    expect(value.replace(/\r\n /g, '')).toContain('Č'.repeat(120))
  })
})
