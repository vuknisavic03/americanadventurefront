'use client'

import { useState } from 'react'

import type { ProgramApplicationFieldDefinition } from '@/modules/program-applications/schema.ts'

type PortalApplication = {
  answers: Record<string, number | string>
  completionPercent: number
  fields: ProgramApplicationFieldDefinition[]
  instructions?: string
  lastSavedAt: string
  revision: number
  status: 'DRAFT' | 'SUBMITTED'
  submittedAt?: null | string
  templateName: string
  templateVersion: number
}

type MutationResponse = {
  application?: PortalApplication
  fieldErrors?: Record<string, string>
  message?: string
}

function formatDateTime(value?: null | string) {
  if (!value) return undefined
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ReadOnlyAnswer({ field, value }: { field: ProgramApplicationFieldDefinition; value: unknown }) {
  const display = value === undefined || value === null || value === ''
    ? 'Nije uneto'
    : field.fieldType === 'DATE'
      ? new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${String(value)}T00:00:00Z`))
      : String(value)
  return (
    <div className="program-application-answer">
      <dt>{field.label}</dt>
      <dd className={display === 'Nije uneto' ? 'program-application-answer--empty' : undefined}>{display}</dd>
    </div>
  )
}

export function ProgramApplicationForm({ application }: { application?: PortalApplication }) {
  const [answers, setAnswers] = useState<Record<string, number | string>>(application?.answers ?? {})
  const [completionPercent, setCompletionPercent] = useState(application?.completionPercent ?? 0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastSavedAt, setLastSavedAt] = useState(application?.lastSavedAt)
  const [message, setMessage] = useState('')
  const [messageIsSuccess, setMessageIsSuccess] = useState(false)
  const [pendingAction, setPendingAction] = useState<'' | 'SAVE_DRAFT' | 'SUBMIT'>('')
  const [revision, setRevision] = useState(application?.revision ?? 1)
  const [status, setStatus] = useState(application?.status ?? 'DRAFT')

  if (!application) {
    return (
      <section className="program-application-card" aria-labelledby="program-application-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Programska aplikacija</p><h2 id="program-application-heading">Formular se priprema</h2></div>
        </div>
        <div className="form-alert" role="status">
          Agencija još nije objavila formular za vaš program. Vaš napredak je sačuvan i dobićete uputstvo kada formular bude dostupan.
        </div>
      </section>
    )
  }

  function updateAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function persist(mode: 'SAVE_DRAFT' | 'SUBMIT') {
    if (mode === 'SUBMIT' && !window.confirm('Predajete programsku aplikaciju na pregled. Nakon predaje više nećete moći da menjate odgovore. Želite li da nastavite?')) return
    setPendingAction(mode)
    setMessage('')
    setMessageIsSuccess(false)
    setErrors({})
    try {
      const response = await fetch('/api/candidate/program-application', {
        body: JSON.stringify({ answers, expectedRevision: revision }),
        headers: { 'Content-Type': 'application/json' },
        method: mode === 'SUBMIT' ? 'POST' : 'PATCH',
      })
      const result = await response.json() as MutationResponse
      setMessage(result.message ?? 'Zahtev nije obrađen. Pokušajte ponovo.')
      setMessageIsSuccess(response.ok)
      setErrors(result.fieldErrors ?? {})
      if (response.ok && result.application) {
        setAnswers(result.application.answers)
        setCompletionPercent(result.application.completionPercent)
        setLastSavedAt(result.application.lastSavedAt)
        setRevision(result.application.revision)
        setStatus(result.application.status)
        if (mode === 'SUBMIT') window.setTimeout(() => window.location.reload(), 800)
      }
    } catch {
      setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.')
    } finally {
      setPendingAction('')
    }
  }

  const submitted = status === 'SUBMITTED'
  return (
    <section className="program-application-card" aria-labelledby="program-application-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Programska aplikacija</p>
          <h2 id="program-application-heading">{application.templateName}</h2>
        </div>
        <div className="program-application-status">
          <span>{submitted ? 'Predato' : 'Nacrt'}</span>
          <strong>{completionPercent}% obaveznih polja</strong>
        </div>
      </div>
      <p className="program-application-meta">
        Verzija formulara {application.templateVersion}
        {submitted ? ` · Predato ${formatDateTime(application.submittedAt)}` : lastSavedAt ? ` · Sačuvano ${formatDateTime(lastSavedAt)}` : ''}
      </p>
      {application.instructions ? <p className="program-application-instructions">{application.instructions}</p> : null}
      {message ? <div className={messageIsSuccess ? 'form-success' : 'form-alert'} role="status">{message}</div> : null}

      {submitted ? (
        <dl className="program-application-review">
          {application.fields.map((field) => <ReadOnlyAnswer field={field} key={field.key} value={answers[field.key]} />)}
        </dl>
      ) : (
        <div className="program-application-fields">
          {application.fields.map((field) => (
            <label className={field.fieldType === 'TEXTAREA' ? 'program-application-field--wide' : undefined} key={field.key}>
              <span>{field.label}{field.required ? <em aria-label="obavezno"> *</em> : null}</span>
              {field.helpText ? <small>{field.helpText}</small> : null}
              {field.fieldType === 'TEXTAREA' ? (
                <textarea
                  maxLength={field.maxLength}
                  onChange={(event) => updateAnswer(field.key, event.target.value)}
                  rows={5}
                  value={String(answers[field.key] ?? '')}
                />
              ) : (
                <input
                  inputMode={field.fieldType === 'NUMBER' ? 'decimal' : undefined}
                  maxLength={field.fieldType === 'TEXT' ? field.maxLength : undefined}
                  onChange={(event) => updateAnswer(field.key, event.target.value)}
                  type={field.fieldType === 'DATE' ? 'date' : field.fieldType === 'NUMBER' ? 'number' : 'text'}
                  value={String(answers[field.key] ?? '')}
                />
              )}
              {errors[field.key] ? <span className="field-error" role="alert">{errors[field.key]}</span> : null}
            </label>
          ))}
        </div>
      )}

      {!submitted ? (
        <div className="program-application-actions">
          <button className="secondary-button" disabled={Boolean(pendingAction)} onClick={() => persist('SAVE_DRAFT')} type="button">
            {pendingAction === 'SAVE_DRAFT' ? 'Čuvanje…' : 'Sačuvaj nacrt'}
          </button>
          <button className="submit-button" disabled={Boolean(pendingAction)} onClick={() => persist('SUBMIT')} type="button">
            {pendingAction === 'SUBMIT' ? 'Predaja…' : 'Predaj aplikaciju'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
