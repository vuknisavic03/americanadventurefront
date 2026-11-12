'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import './InterviewPreparationManagementPanel.scss'

type Appointment = {
  attemptNumber: number
  candidateInstructions?: string
  deliveryMode: 'IN_PERSON' | 'ONLINE'
  endsAt?: string
  id: number
  internalNotes?: string
  locationDetails: string
  outcomeRecordedAt?: string
  startsAt: string
  status: 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'SCHEDULED'
  timeZone: string
  version: number
}

type State = {
  appointments: Appointment[]
  currentStep: string
  processStatus: string
}

const statusLabels = {
  CANCELLED: 'Otkazan',
  COMPLETED: 'Održan — kandidat prisustvovao',
  NO_SHOW: 'Kandidat se nije pojavio',
  SCHEDULED: 'Zakazan',
} as const

function localDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

type MeetingPurpose = 'JOB_INTERVIEW' | 'EMBASSY' | 'ORIENTATION'

export function InterviewPreparationManagementPanel({ purpose = 'JOB_INTERVIEW' }: { purpose?: MeetingPurpose }) {
  const embassy = purpose === 'EMBASSY'
  const orientation = purpose === 'ORIENTATION'
  const heading = orientation
    ? 'Orijentacioni sastanak pred putovanje'
    : embassy
      ? 'Priprema za razgovor u ambasadi'
      : 'Priprema za razgovor za posao'
  const { id } = useDocumentInfo()
  const [candidateInstructions, setCandidateInstructions] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [endsAt, setEndsAt] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [locationDetails, setLocationDetails] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [state, setState] = useState<State>()
  const [timeZone, setTimeZone] = useState('Europe/Belgrade')

  useEffect(() => {
    if (!id) return
    let ignore = false
    fetch(`/api/admin/interview-preparations/${id}?purpose=${purpose}`)
      .then(async (response) => ({ response, result: await response.json() as State & { message?: string } }))
      .then(({ response, result }) => {
        if (ignore) return
        if (!response.ok) { setMessage(result.message ?? 'Evidencija nije dostupna.'); return }
        setState(result)
        const activeAppointment = result.appointments.find((appointment) => appointment.status === 'SCHEDULED')
        if (activeAppointment) {
          setCandidateInstructions(activeAppointment.candidateInstructions ?? '')
          setDeliveryMode(activeAppointment.deliveryMode)
          setEndsAt(localDateTime(activeAppointment.endsAt))
          setInternalNotes(activeAppointment.internalNotes ?? '')
          setLocationDetails(activeAppointment.locationDetails)
          setStartsAt(localDateTime(activeAppointment.startsAt))
          setTimeZone(activeAppointment.timeZone)
        }
      })
      .catch(() => { if (!ignore) setMessage('Veza sa serverom nije uspela.') })
    return () => { ignore = true }
  }, [id, purpose])
  const active = state?.appointments.find((appointment) => appointment.status === 'SCHEDULED')
  const requiredStep = orientation ? 'TRAVEL_PREPARATION' : embassy ? 'VISA' : 'JOB_PLACEMENT'
  const requiredStepLabel = orientation ? 'Priprema putovanja' : embassy ? 'Viza' : 'Posao i intervju'
  const available = state?.processStatus === 'ACTIVE' && state.currentStep === requiredStep

  async function submit(body: Record<string, unknown>) {
    if (!id) return
    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/interview-preparations/${id}?purpose=${purpose}`, {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) window.setTimeout(() => window.location.reload(), 600)
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  function schedule() {
    if (!startsAt || !locationDetails.trim()) { setMessage('Unesite početak i lokaciju ili link termina.'); return }
    const start = new Date(startsAt)
    const end = endsAt ? new Date(endsAt) : undefined
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) { setMessage('Datum termina nije ispravan.'); return }
    void submit({
      action: 'SCHEDULE',
      candidateInstructions: candidateInstructions.trim() || undefined,
      deliveryMode,
      endsAt: end?.toISOString(),
      expectedVersion: active?.version,
      expectedAppointmentId: active?.id,
      internalNotes: internalNotes.trim() || undefined,
      locationDetails: locationDetails.trim(),
      startsAt: start.toISOString(),
      timeZone,
    })
  }

  function outcome(action: 'CANCELLED' | 'COMPLETED' | 'NO_SHOW') {
    if (!active) return
    void submit({ action, appointmentId: active.id, expectedVersion: active.version, internalNotes: internalNotes.trim() || undefined })
  }

  if (!id) return null
  return (
    <section aria-label={heading} className="interview-preparation-admin">
      <h3>{heading}</h3>
      <p>{orientation
        ? 'Termin, način održavanja i instrukcije vidljivi su kandidatu. Zakazivanje i evidencija prisustva upisuju se u revizijski trag.'
        : embassy
          ? 'Termin i prisustvo su vidljivi kandidatu. Ovo nije zvaničan termin u ambasadi i ne menja njegov datum ni podsetnike.'
          : 'Zakazivanje i svaki ishod menjaju sledeću akciju kandidata i upisuju se u revizijski trag.'}</p>
      {message ? <div className="interview-preparation-admin__message" role="status">{message}</div> : null}
      {!state ? <p>Učitavanje evidencije…</p> : !available ? (
        <p className="interview-preparation-admin__notice">Dostupno je tek kada aktivan proces stigne do koraka „{requiredStepLabel}“.</p>
      ) : (
        <>
          <p>Datum i vreme unosite u vremenskoj zoni ovog uređaja: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Zona termina određuje prikaz kandidatu.</p>
          <div className="interview-preparation-admin__form">
            <label><span>Početak</span><input onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" value={startsAt} /></label>
            <label><span>Kraj (opciono)</span><input onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" value={endsAt} /></label>
            <label><span>Vremenska zona</span><input maxLength={100} onChange={(event) => setTimeZone(event.target.value)} value={timeZone} /></label>
            <label><span>Način održavanja</span><select onChange={(event) => setDeliveryMode(event.target.value as 'IN_PERSON' | 'ONLINE')} value={deliveryMode}><option value="IN_PERSON">U prostorijama agencije</option><option value="ONLINE">Onlajn</option></select></label>
            <label className="interview-preparation-admin__wide"><span>Lokacija ili link</span><textarea maxLength={500} onChange={(event) => setLocationDetails(event.target.value)} rows={2} value={locationDetails} /></label>
            <label className="interview-preparation-admin__wide"><span>Instrukcije koje vidi kandidat</span><textarea maxLength={1_000} onChange={(event) => setCandidateInstructions(event.target.value)} rows={3} value={candidateInstructions} /></label>
            <label className="interview-preparation-admin__wide"><span>Interna napomena — kandidat je ne vidi</span><textarea maxLength={2_000} onChange={(event) => setInternalNotes(event.target.value)} rows={3} value={internalNotes} /></label>
          </div>
          <div className="interview-preparation-admin__actions">
            <button className="btn btn--style-primary" disabled={pending} onClick={schedule} type="button">{active ? 'Promeni termin' : 'Zakaži termin'}</button>
            {active ? <button className="btn btn--style-secondary" disabled={pending} onClick={() => outcome('COMPLETED')} type="button">Evidentiraj prisustvo</button> : null}
            {active ? <button className="btn btn--style-secondary" disabled={pending} onClick={() => outcome('NO_SHOW')} type="button">Evidentiraj izostanak</button> : null}
            {active ? <button className="btn btn--style-secondary" disabled={pending} onClick={() => outcome('CANCELLED')} type="button">Otkaži termin</button> : null}
          </div>
        </>
      )}
      {state?.appointments.length ? (
        <div className="interview-preparation-admin__history">
          <h4>Istorija termina</h4>
          {state.appointments.map((appointment) => (
            <article key={appointment.id}>
              <strong>Termin {appointment.attemptNumber}: {statusLabels[appointment.status]}</strong>
              <span>{new Date(appointment.startsAt).toLocaleString('sr-Latn-RS')}</span>
              <span>{appointment.deliveryMode === 'ONLINE' ? 'Onlajn' : 'U prostorijama agencije'} · {appointment.locationDetails}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function EmbassyPreparationManagementPanel() {
  return <InterviewPreparationManagementPanel purpose="EMBASSY" />
}

export function OrientationMeetingManagementPanel() {
  return <InterviewPreparationManagementPanel purpose="ORIENTATION" />
}
