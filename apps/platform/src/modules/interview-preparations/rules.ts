export type InterviewPreparationPurpose = 'JOB_INTERVIEW' | 'EMBASSY' | 'ORIENTATION'

export type InterviewPreparationStatus = 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'SCHEDULED'
export type InterviewPreparationMode = 'IN_PERSON' | 'ONLINE'
export type InterviewPreparationOutcome = Exclude<InterviewPreparationStatus, 'SCHEDULED'>

export function validateTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('sr-Latn-RS', { timeZone }).format()
    return timeZone
  } catch {
    throw new Error('Vremenska zona nije ispravna.')
  }
}

export function validateScheduleWindow({
  endsAt,
  now,
  startsAt,
}: {
  endsAt?: Date
  now: Date
  startsAt: Date
}) {
  if (!Number.isFinite(startsAt.getTime())) throw new Error('Početak termina nije ispravan.')
  if (startsAt.getTime() <= now.getTime()) throw new Error('Termin mora biti u budućnosti.')
  if (endsAt) {
    if (!Number.isFinite(endsAt.getTime())) throw new Error('Kraj termina nije ispravan.')
    const duration = endsAt.getTime() - startsAt.getTime()
    if (duration <= 0) throw new Error('Kraj termina mora biti posle početka.')
    if (duration > 4 * 60 * 60_000) throw new Error('Termin ne može trajati duže od četiri sata.')
  }
}

export function assertOutcomeAllowed({
  now,
  startsAt,
  status,
  outcome,
}: {
  now: Date
  startsAt: Date
  status: InterviewPreparationStatus
  outcome: InterviewPreparationOutcome
}) {
  if (status !== 'SCHEDULED') throw new Error('Termin je već zaključen.')
  if (outcome !== 'CANCELLED' && now.getTime() < startsAt.getTime()) {
    throw new Error('Prisustvo se može evidentirati tek kada termin počne.')
  }
}
