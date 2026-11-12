export const EMBASSY_TIME_ZONE = 'Europe/Belgrade'
export const EMBASSY_REMINDER_DAYS = 3

export class EmbassyAppointmentValidationError extends Error {}

type LocalDateTime = { date: string; time: string }

function parts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new EmbassyAppointmentValidationError('Datum termina nije ispravan.')
  return { day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) }
}

function timeParts(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new EmbassyAppointmentValidationError('Vreme termina nije ispravno.')
  const hour = Number(match[1]); const minute = Number(match[2])
  if (hour > 23 || minute > 59) throw new EmbassyAppointmentValidationError('Vreme termina nije ispravno.')
  return { hour, minute }
}

function formattedParts(value: Date) {
  const values = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit', hour: '2-digit', hourCycle: 'h23', minute: '2-digit', month: '2-digit',
    timeZone: EMBASSY_TIME_ZONE, year: 'numeric',
  }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(values.find((entry) => entry.type === type)?.value)
  return { day: get('day'), hour: get('hour'), minute: get('minute'), month: get('month'), year: get('year') }
}

export function embassyLocalDateTimeToUtc({ date, time }: LocalDateTime) {
  const localDate = parts(date); const localTime = timeParts(time)
  const wallClock = Date.UTC(localDate.year, localDate.month - 1, localDate.day, localTime.hour, localTime.minute)
  const first = formattedParts(new Date(wallClock))
  const represented = Date.UTC(first.year, first.month - 1, first.day, first.hour, first.minute)
  const result = new Date(wallClock - (represented - wallClock))
  const verified = formattedParts(result)
  if (verified.year !== localDate.year || verified.month !== localDate.month || verified.day !== localDate.day || verified.hour !== localTime.hour || verified.minute !== localTime.minute) {
    throw new EmbassyAppointmentValidationError('Datum ili vreme termina ne postoji u vremenskoj zoni ambasade.')
  }
  return result
}

export function embassyReminderAt({ date, time }: LocalDateTime) {
  const local = parts(date)
  const reminderDate = new Date(Date.UTC(local.year, local.month - 1, local.day - EMBASSY_REMINDER_DAYS))
  const dateThreeDaysEarlier = `${reminderDate.getUTCFullYear()}-${String(reminderDate.getUTCMonth() + 1).padStart(2, '0')}-${String(reminderDate.getUTCDate()).padStart(2, '0')}`
  return embassyLocalDateTimeToUtc({ date: dateThreeDaysEarlier, time })
}

export function validateEmbassyAppointment(input: LocalDateTime, now: Date) {
  const appointmentAt = embassyLocalDateTimeToUtc(input)
  if (appointmentAt.getTime() <= now.getTime() + 15 * 60_000) throw new EmbassyAppointmentValidationError('Termin mora biti najmanje 15 minuta u budućnosti.')
  if (appointmentAt.getTime() > now.getTime() + 2 * 365 * 24 * 60 * 60_000) throw new EmbassyAppointmentValidationError('Termin ne može biti udaljen više od dve godine.')
  return { appointmentAt, reminderAt: embassyReminderAt(input) }
}

export function formatEmbassyAppointment(value: Date) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeStyle: 'short', timeZone: EMBASSY_TIME_ZONE }).format(value)
}
