'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import {
  buildProcessingEndpoint,
  isProcessingState,
  type ApplicationState,
  type ContactOutcome,
  type ProcessingState,
} from '../../modules/pre-applications/processingClient.ts'
import './PreApplicationProcessingPanel.scss'

type ApiError = { message?: string }

const statusLabels: Record<ApplicationState['status'], string> = {
  CONSULTATION_COMPLETED: 'Konsultacije završene',
  CONSULTATION_INVITED: 'Poziv za konsultacije poslat',
  CONSULTATION_SCHEDULED: 'Konsultacije zakazane',
  MATERIALS_SENT: 'Materijali poslati',
  QUALIFIED: 'Kvalifikovan kandidat',
  REJECTED: 'Odbijen kandidat',
  READY_FOR_PROFILE: 'Spreman za kreiranje profila',
  SUBMITTED: 'Pristigla prijava',
  UNDER_REVIEW: 'U administrativnoj obradi',
}

const consultationStatusLabels: Record<ApplicationState['consultationStatus'], string> = {
  ATTENDED: 'Prisustvo potvrđeno',
  CANCELLED: 'Termin je otkazan',
  NOT_SCHEDULED: 'Termin nije zakazan',
  NO_SHOW: 'Kandidat se nije pojavio',
  SCHEDULED: 'Termin je zakazan',
}

const deliveryCategoryLabels = {
  ACCOUNT_ACTIVATION: 'Aktivacija kandidatskog naloga',
  CONSULTATION_INVITATION: 'Poziv za konsultacije',
  MATERIAL_BUNDLE: 'Paket informacija',
} as const

const deliveryStatusLabels = {
  DELIVERED: 'Isporučeno provajderu',
  FAILED: 'Slanje nije uspelo',
  PENDING: 'Na čekanju',
  PROCESSING: 'Slanje u toku',
} as const

const contactStatusLabels: Record<ApplicationState['contactStatus'], string> = {
  ATTEMPTED: 'Kontakt je pokušan',
  FOLLOW_UP_REQUIRED: 'Potreban je ponovni kontakt',
  NOT_ATTEMPTED: 'Kontakt nije pokušan',
  REACHED: 'Razgovor je obavljen',
}

const accountStatusLabels = {
  ACTIVE: 'Aktivan',
  PENDING_ACTIVATION: 'Čeka aktivaciju',
  SUSPENDED: 'Suspendovan',
} as const

const outcomeLabels: Record<ContactOutcome, string> = {
  CALLBACK_REQUESTED: 'Tražen ponovni poziv',
  INVALID_CONTACT: 'Neispravan kontakt',
  NO_ANSWER: 'Bez odgovora',
  REACHED: 'Razgovor obavljen',
}

function initialLocalDateTime() {
  return localDateTimeValue(new Date())
}

function localDateTimeValue(value: Date) {
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset())
  return value.toISOString().slice(0, 16)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function PreApplicationProcessingPanel() {
  const { config } = useConfig()
  const { id } = useDocumentInfo()
  const [state, setState] = useState<ProcessingState>()
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [pending, setPending] = useState(false)
  const [attemptedAt, setAttemptedAt] = useState(initialLocalDateTime)
  const [nextContactAt, setNextContactAt] = useState('')
  const [contactNote, setContactNote] = useState('')
  const [outcome, setOutcome] = useState<ContactOutcome>('NO_ANSWER')
  const [decisionNote, setDecisionNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [consultationStartsAt, setConsultationStartsAt] = useState(initialLocalDateTime)
  const [consultationEndsAt, setConsultationEndsAt] = useState('')
  const [consultationTimeZone, setConsultationTimeZone] = useState('Europe/Belgrade')
  const [consultationOutcome, setConsultationOutcome] = useState<
    'ATTENDED' | 'CANCELLED' | 'NO_SHOW'
  >('ATTENDED')
  const [consultationNotes, setConsultationNotes] = useState('')
  const [profileReadinessNote, setProfileReadinessNote] = useState('')

  const endpoint = buildProcessingEndpoint(config.routes.api, id ?? '')

  useEffect(() => {
    if (!id) return
    let ignore = false
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    async function loadState() {
      try {
        const response = await fetch(endpoint, { credentials: 'include' })
        const body = (await response.json()) as ProcessingState | ApiError
        if (!response.ok) {
          throw new Error(
            'message' in body && body.message ? body.message : 'Podaci nisu učitani.',
          )
        }
        if (!isProcessingState(body)) {
          throw new Error('Server je vratio neočekivan odgovor. Osvežite stranicu i pokušajte ponovo.')
        }
        if (!ignore) {
          setState(body)
          if (body.application.consultationStartsAt) {
            setConsultationStartsAt(
              localDateTimeValue(new Date(body.application.consultationStartsAt)),
            )
          }
          if (body.application.consultationEndsAt) {
            setConsultationEndsAt(
              localDateTimeValue(new Date(body.application.consultationEndsAt)),
            )
          }
          if (body.application.consultationTimeZone) {
            setConsultationTimeZone(body.application.consultationTimeZone)
          }
          if (['MATERIALS_SENT', 'QUALIFIED'].includes(body.application.status)) {
            refreshTimer = setTimeout(() => void loadState(), 3_000)
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Podaci nisu učitani.')
        }
      }
    }

    void loadState()

    return () => {
      ignore = true
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [endpoint, id])

  async function sendCommand(command: Record<string, unknown>, message: string) {
    if (!state) return false
    setPending(true)
    setError(undefined)
    setSuccess(undefined)

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify({ ...command, expectedVersion: state.application.workflowVersion }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const body = (await response.json()) as ProcessingState | ApiError
      if (!response.ok) {
        throw new Error('message' in body && body.message ? body.message : 'Akcija nije izvršena.')
      }

      if (!isProcessingState(body)) {
        throw new Error('Server je vratio neočekivan odgovor. Osvežite stranicu i pokušajte ponovo.')
      }

      setState(body)
      setSuccess(message)
      return true
    } catch (commandError) {
      setError(commandError instanceof Error ? commandError.message : 'Akcija nije izvršena.')
      return false
    } finally {
      setPending(false)
    }
  }

  async function recordContact() {
    const saved = await sendCommand(
      {
        action: 'RECORD_CONTACT',
        attemptedAt: new Date(attemptedAt).toISOString(),
        nextContactAt: nextContactAt ? new Date(nextContactAt).toISOString() : undefined,
        note: contactNote || undefined,
        outcome,
      },
      'Pokušaj kontakta je evidentiran.',
    )
    if (saved) {
      setAttemptedAt(initialLocalDateTime())
      setNextContactAt('')
      setContactNote('')
      setOutcome('NO_ANSWER')
    }
  }

  async function scheduleConsultation() {
    const saved = await sendCommand(
      {
        action: 'SCHEDULE_CONSULTATION',
        endsAt: consultationEndsAt ? new Date(consultationEndsAt).toISOString() : undefined,
        startsAt: new Date(consultationStartsAt).toISOString(),
        timeZone: consultationTimeZone,
      },
      state?.application.status === 'CONSULTATION_SCHEDULED'
        ? 'Termin konsultacija je promenjen.'
        : 'Termin konsultacija je evidentiran.',
    )
    if (saved) setConsultationEndsAt('')
  }

  async function recordConsultationOutcome() {
    const saved = await sendCommand(
      {
        action: 'RECORD_CONSULTATION_OUTCOME',
        notes: consultationNotes,
        outcome: consultationOutcome,
      },
      consultationOutcome === 'ATTENDED'
        ? 'Prisustvo i beleške sa konsultacija su evidentirani.'
        : 'Ishod termina i beleške su evidentirani.',
    )
    if (saved) setConsultationNotes('')
  }

  async function copyActivationLink() {
    const activationUrl = state?.candidateAccount?.activationUrl
    if (!activationUrl) return
    try {
      await navigator.clipboard.writeText(activationUrl)
      setSuccess('Aktivacioni link je kopiran.')
    } catch {
      setError('Link nije automatski kopiran. Označite ga i kopirajte ručno.')
    }
  }

  if (!id) return null

  return (
    <section className="aa-processing-panel">
      <div className="aa-processing-panel__heading">
        <div>
          <p className="aa-processing-panel__eyebrow">Kontrolisani poslovni tok</p>
          <h2>Administrativna obrada prijave</h2>
        </div>
        {state ? (
          <span className={`aa-processing-panel__status aa-processing-panel__status--${state.application.status.toLowerCase()}`}>
            {statusLabels[state.application.status]}
          </span>
        ) : null}
      </div>

      {error ? <p className="aa-processing-panel__message aa-processing-panel__message--error">{error}</p> : null}
      {success ? <p className="aa-processing-panel__message aa-processing-panel__message--success">{success}</p> : null}
      {!state ? <p>Učitavanje administrativnog toka…</p> : null}

      {state ? (
        <>
          <div className="aa-processing-panel__summary">
            <div><span>Status kontakta</span><strong>{contactStatusLabels[state.application.contactStatus]}</strong></div>
            <div><span>Broj pokušaja</span><strong>{state.application.contactAttemptCount}</strong></div>
            <div><span>Poslednji kontakt</span><strong>{formatDate(state.application.latestContactAt)}</strong></div>
            <div><span>Planiran kontakt</span><strong>{formatDate(state.application.nextContactAt)}</strong></div>
          </div>

          <div className="aa-processing-panel__summary aa-processing-panel__summary--consultation">
            <div><span>Status konsultacija</span><strong>{consultationStatusLabels[state.application.consultationStatus]}</strong></div>
            <div><span>Početak</span><strong>{formatDate(state.application.consultationStartsAt)}</strong></div>
            <div><span>Završetak</span><strong>{formatDate(state.application.consultationEndsAt)}</strong></div>
            <div><span>Izvor / zona</span><strong>{state.application.consultationProvider || '—'} / {state.application.consultationTimeZone || '—'}</strong></div>
          </div>

          {state.application.status === 'SUBMITTED' ? (
            <div className="aa-processing-panel__action-card">
              <h3>Preuzmite prijavu u obradu</h3>
              <p>Ovim se beleže administrator i vreme početka obrade.</p>
              <button disabled={pending} onClick={() => void sendCommand({ action: 'START_REVIEW' }, 'Obrada prijave je započeta.')} type="button">
                {pending ? 'Čuvanje…' : 'Započni obradu'}
              </button>
            </div>
          ) : null}

          {state.application.status === 'UNDER_REVIEW' ? (
            <div className="aa-processing-panel__grid">
              <div className="aa-processing-panel__action-card">
                <h3>Evidentiraj telefonski kontakt</h3>
                <label>
                  Ishod
                  <select onChange={(event) => setOutcome(event.target.value as ContactOutcome)} value={outcome}>
                    {Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  Vreme pokušaja
                  <input onChange={(event) => setAttemptedAt(event.target.value)} required type="datetime-local" value={attemptedAt} />
                </label>
                <label>
                  Sledeći kontakt (opciono)
                  <input onChange={(event) => setNextContactAt(event.target.value)} type="datetime-local" value={nextContactAt} />
                </label>
                <label>
                  Beleška (opciono)
                  <textarea maxLength={2000} onChange={(event) => setContactNote(event.target.value)} rows={3} value={contactNote} />
                </label>
                <button disabled={pending} onClick={() => void recordContact()} type="button">
                  {pending ? 'Čuvanje…' : 'Sačuvaj kontakt'}
                </button>
              </div>

              <div className="aa-processing-panel__action-card">
                <h3>Odluka o kandidatu</h3>
                {state.application.contactAttemptCount < 1 ? (
                  <p className="aa-processing-panel__hint">Najpre evidentirajte najmanje jedan pokušaj kontakta.</p>
                ) : (
                  <>
                    <label>
                      Beleška uz pozitivnu odluku (opciono)
                      <textarea maxLength={2000} onChange={(event) => setDecisionNote(event.target.value)} rows={2} value={decisionNote} />
                    </label>
                    <button className="aa-processing-panel__button--positive" disabled={pending} onClick={() => void sendCommand({ action: 'MARK_QUALIFIED', decisionNote: decisionNote || undefined }, 'Kandidat je kvalifikovan. Slanje materijala je pouzdano zakazano za sledeći automatizovani korak.')} type="button">
                      Označi kao kvalifikovanog
                    </button>
                    <label>
                      Razlog odbijanja
                      <textarea maxLength={2000} onChange={(event) => setRejectionReason(event.target.value)} required rows={3} value={rejectionReason} />
                    </label>
                    <button className="aa-processing-panel__button--danger" disabled={pending || !rejectionReason.trim()} onClick={() => void sendCommand({ action: 'MARK_REJECTED', rejectionReason }, 'Kandidat je odbijen i obrada je završena.')} type="button">
                      Odbij kandidata
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {state.application.status === 'QUALIFIED' ? (
            <p className="aa-processing-panel__terminal">Kandidat je kvalifikovan. Slanje paketa informacija je na čekanju ili se automatski ponavlja.</p>
          ) : null}
          {state.application.status === 'MATERIALS_SENT' ? (
            <p className="aa-processing-panel__terminal">Paket informacija je uspešno isporučen provajderu. Poseban poziv za konsultacije je na čekanju.</p>
          ) : null}
          {state.application.status === 'CONSULTATION_INVITED' ? (
            <p className="aa-processing-panel__terminal">Kandidatu su poslati paket informacija i poseban poziv. Sačekajte integraciju servisa za zakazivanje ili ručno evidentirajte termin.</p>
          ) : null}
          {['CONSULTATION_INVITED', 'CONSULTATION_SCHEDULED'].includes(state.application.status) ? (
            <div className="aa-processing-panel__action-card aa-processing-panel__consultation-card">
              <h3>{state.application.status === 'CONSULTATION_SCHEDULED' ? 'Promeni termin konsultacija' : 'Ručno evidentiraj termin'}</h3>
              <p>Ovo je operativna rezerva dok ne izaberemo i povežemo produkcioni servis za zakazivanje.</p>
              <div className="aa-processing-panel__grid">
                <label>
                  Početak
                  <input onChange={(event) => setConsultationStartsAt(event.target.value)} required type="datetime-local" value={consultationStartsAt} />
                </label>
                <label>
                  Završetak (opciono)
                  <input onChange={(event) => setConsultationEndsAt(event.target.value)} type="datetime-local" value={consultationEndsAt} />
                </label>
                <label>
                  Vremenska zona
                  <input maxLength={100} onChange={(event) => setConsultationTimeZone(event.target.value)} required value={consultationTimeZone} />
                </label>
              </div>
              <button disabled={pending || !consultationStartsAt || !consultationTimeZone.trim()} onClick={() => void scheduleConsultation()} type="button">
                {pending ? 'Čuvanje…' : state.application.status === 'CONSULTATION_SCHEDULED' ? 'Sačuvaj novi termin' : 'Sačuvaj termin'}
              </button>
            </div>
          ) : null}
          {state.application.status === 'CONSULTATION_SCHEDULED' ? (
            <div className="aa-processing-panel__action-card aa-processing-panel__consultation-card">
              <h3>Evidentiraj ishod konsultacija</h3>
              <label>
                Ishod
                <select onChange={(event) => setConsultationOutcome(event.target.value as typeof consultationOutcome)} value={consultationOutcome}>
                  <option value="ATTENDED">Kandidat je prisustvovao</option>
                  <option value="NO_SHOW">Kandidat se nije pojavio</option>
                  <option value="CANCELLED">Termin je otkazan</option>
                </select>
              </label>
              <label>
                Beleške i utisci
                <textarea maxLength={4000} onChange={(event) => setConsultationNotes(event.target.value)} required rows={4} value={consultationNotes} />
              </label>
              <button disabled={pending || !consultationNotes.trim()} onClick={() => void recordConsultationOutcome()} type="button">
                {pending ? 'Čuvanje…' : 'Sačuvaj ishod konsultacija'}
              </button>
            </div>
          ) : null}
          {state.application.status === 'CONSULTATION_COMPLETED' ? (
            <div className="aa-processing-panel__action-card aa-processing-panel__consultation-card">
              <h3>Završna provera pre profila</h3>
              <p>Potvrdite da su dokumenti poslati, konsultacije završene i da kandidat može u sledeću fazu.</p>
              <label>
                Beleška uz odobrenje (opciono)
                <textarea maxLength={2000} onChange={(event) => setProfileReadinessNote(event.target.value)} rows={3} value={profileReadinessNote} />
              </label>
              <button className="aa-processing-panel__button--positive" disabled={pending} onClick={() => void sendCommand({ action: 'MARK_READY_FOR_PROFILE', approvalNote: profileReadinessNote || undefined }, 'Kandidat je označen kao spreman za kreiranje profila.')} type="button">
                {pending ? 'Čuvanje…' : 'Odobri prelazak ka profilu'}
              </button>
            </div>
          ) : null}
          {state.application.status === 'READY_FOR_PROFILE' ? (
            <div className="aa-processing-panel__action-card aa-processing-panel__consultation-card">
              <h3>Pristup kandidatskom portalu</h3>
              {state.candidateAccount ? (
                <div className="aa-processing-panel__account-summary">
                  <p><strong>Status:</strong> {accountStatusLabels[state.candidateAccount.status]}</p>
                  <p><strong>Email:</strong> {state.candidateAccount.email}</p>
                  <p><strong>Poziv izdat:</strong> {formatDate(state.candidateAccount.activationIssuedAt)}</p>
                  <p><strong>Link važi do:</strong> {formatDate(state.candidateAccount.activationExpiresAt)}</p>
                </div>
              ) : (
                <p>Nalog još nije pripremljen. Kreiranjem pristupa kandidat dobija lični aktivacioni poziv.</p>
              )}
              {state.candidateAccount?.status === 'PENDING_ACTIVATION' && state.candidateAccount.activationUrl ? (
                <label>
                  Lokalni aktivacioni link
                  <div className="aa-processing-panel__copy-row">
                    <input readOnly value={state.candidateAccount.activationUrl} />
                    <button disabled={pending} onClick={() => void copyActivationLink()} type="button">Kopiraj link</button>
                  </div>
                  <span className="aa-processing-panel__hint">Ovaj link se prikazuje samo kada je uključen lokalni „capture“ režim. U produkciji se šalje emailom.</span>
                </label>
              ) : null}
              {!state.candidateAccount || state.candidateAccount.status === 'PENDING_ACTIVATION' ? (
                <button className="aa-processing-panel__button--positive" disabled={pending} onClick={() => void sendCommand({ action: 'ISSUE_PROFILE_ACTIVATION' }, state.candidateAccount ? 'Novi aktivacioni poziv je pripremljen; prethodni link više ne važi.' : 'Kandidatski nalog i aktivacioni poziv su pripremljeni.')} type="button">
                  {pending ? 'Priprema…' : state.candidateAccount ? 'Pošalji novi aktivacioni poziv' : 'Kreiraj pristup portalu'}
                </button>
              ) : null}
              {state.candidateAccount?.status === 'ACTIVE' ? <p className="aa-processing-panel__terminal">Kandidat je aktivirao nalog i može da koristi portal.</p> : null}
              {state.candidateAccount?.status === 'SUSPENDED' ? <p className="aa-processing-panel__terminal">Nalog je suspendovan. Ponovna aktivacija zahteva posebnu administrativnu odluku.</p> : null}
            </div>
          ) : null}
          {state.application.status === 'REJECTED' ? (
            <p className="aa-processing-panel__terminal">Prijava je zatvorena odbijanjem. Obični administratori ne mogu ponovo da je otvore.</p>
          ) : null}

          <div className="aa-processing-panel__history">
            <h3>Automatizovana komunikacija</h3>
            {state.deliveries.length === 0 ? <p>Još nema evidentiranih poruka kandidatu.</p> : (
              <div className="aa-processing-panel__table-wrap">
                <table>
                  <thead><tr><th>Poruka</th><th>Status</th><th>Pokušaji</th><th>Poslednji pokušaj</th><th>Verzija</th></tr></thead>
                  <tbody>
                    {state.deliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td>{deliveryCategoryLabels[delivery.category]}</td>
                        <td>{deliveryStatusLabels[delivery.status]}{delivery.lastErrorCode ? ` (${delivery.lastErrorCode})` : ''}</td>
                        <td>{delivery.attemptCount}</td>
                        <td>{formatDate(delivery.deliveredAt || delivery.lastAttemptAt)}</td>
                        <td>{delivery.templateVersion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="aa-processing-panel__history">
            <h3>Istorija kontakata</h3>
            {state.contactAttempts.length === 0 ? <p>Još nema evidentiranih pokušaja kontakta.</p> : (
              <div className="aa-processing-panel__table-wrap">
                <table>
                  <thead><tr><th>Vreme</th><th>Ishod</th><th>Administrator</th><th>Beleška</th></tr></thead>
                  <tbody>
                    {state.contactAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td>{formatDate(attempt.attemptedAt)}</td>
                        <td>{outcomeLabels[attempt.outcome]}</td>
                        <td>{attempt.actor}</td>
                        <td>{attempt.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}

