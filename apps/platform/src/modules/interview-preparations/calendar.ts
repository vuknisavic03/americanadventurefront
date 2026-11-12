import type { InterviewPreparationPurpose } from './rules.ts'

/** A downloadable snapshot, not a subscribed calendar or an external reservation. */
export function preparationCalendar(appointment: {
  id: number; startsAt: string; endsAt?: string; locationDetails: string; candidateInstructions?: string
}, now: Date, purpose: Extract<InterviewPreparationPurpose, 'EMBASSY' | 'ORIENTATION'> = 'EMBASSY') {
  const orientation = purpose === 'ORIENTATION'
  const eventSlug = orientation ? 'travel-orientation' : 'embassy-preparation'
  const summary = orientation ? 'Orijentacioni sastanak pred putovanje' : 'Priprema za razgovor u ambasadi'
  const description = orientation
    ? 'Orijentacioni sastanak sa agencijom pred putovanje.\n'
    : 'Priprema sa agencijom; ovo nije zvaničan termin u ambasadi.\n'
  const timestamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
  const fold = (line: string) => {
    let result = ''; let width = 0
    for (const char of line) {
      const bytes = Buffer.byteLength(char)
      if (width + bytes > 75) { result += '\r\n '; width = 1 }
      result += char; width += bytes
    }
    return result
  }
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//American Adventure//${orientation ? 'Travel orientation' : 'Embassy preparation'}//SR`,
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${eventSlug}-${appointment.id}@american-adventure`,
    `DTSTAMP:${timestamp(now.toISOString())}`, `DTSTART:${timestamp(appointment.startsAt)}`,
    ...(appointment.endsAt ? [`DTEND:${timestamp(appointment.endsAt)}`] : []),
    `SUMMARY:${summary}`, `LOCATION:${escape(appointment.locationDetails)}`,
    `DESCRIPTION:${escape(description + (appointment.candidateInstructions ?? ''))}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(fold).join('\r\n')
}
