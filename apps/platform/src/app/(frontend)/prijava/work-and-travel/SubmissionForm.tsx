'use client'

import { type FormEvent, useRef, useState } from 'react'

import { SWT_PRE_APPLICATION, studyInterruptionOptions, studyYearOptions } from '@/modules/pre-applications/constants.ts'

type SubmissionResponse = {
  fieldErrors?: Record<string, string>
  message?: string
  reference?: string
}

function FieldError({ errors, field }: { errors: Record<string, string>; field: string }) {
  const message = errors[field]
  return message ? (
    <span className="field-error" id={`${field}-error`} role="alert">
      {message}
    </span>
  ) : null
}

export function SubmissionForm() {
  const idempotencyKey = useRef(globalThis.crypto.randomUUID())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState<string>()
  const [interruptionStatus, setInterruptionStatus] = useState('NONE')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setFormMessage('')
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const espbPoints = String(formData.get('espbPoints') ?? '').trim()
    const interruptionExplanation = String(formData.get('studyInterruptionExplanation') ?? '').trim()

    const requestBody = {
      applicantNote: String(formData.get('applicantNote') ?? '').trim() || undefined,
      currentStudyYear: String(formData.get('currentStudyYear') ?? ''),
      dateOfBirth: String(formData.get('dateOfBirth') ?? ''),
      email: String(formData.get('email') ?? ''),
      espbPoints: espbPoints ? Number(espbPoints) : null,
      facultyName: String(formData.get('facultyName') ?? ''),
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      newsletterConsent: formData.get('newsletterConsent') === 'on',
      phone: String(formData.get('phone') ?? ''),
      privacyConsent: formData.get('privacyConsent') === 'on',
      residentialAddress: String(formData.get('residentialAddress') ?? ''),
      studyCity: String(formData.get('studyCity') ?? ''),
      studyInterruptionExplanation: interruptionExplanation || undefined,
      studyInterruptionStatus: String(formData.get('studyInterruptionStatus') ?? ''),
      website: String(formData.get('website') ?? ''),
    }

    try {
      const response = await fetch('/api/public/pre-applications', {
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current,
        },
        method: 'POST',
      })
      const result = (await response.json()) as SubmissionResponse

      if (!response.ok) {
        setErrors(result.fieldErrors ?? {})
        setFormMessage(result.message ?? 'Prijava nije poslata. Molimo pokušajte ponovo.')
        return
      }

      setReference(result.reference)
    } catch {
      setFormMessage('Veza sa serverom nije uspela. Proverite internet vezu i pokušajte ponovo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (reference) {
    return (
      <section className="success-card" aria-live="polite">
        <span className="success-icon" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow">Prijava je uspešno poslata</p>
        <h2>Hvala na interesovanju!</h2>
        <p>
          Vaši podaci su bezbedno evidentirani. Naš tim će pregledati prijavu i kontaktirati vas kada
          bude vreme za sledeći korak.
        </p>
        <p className="reference">
          Referentni broj: <strong>{reference}</strong>
        </p>
      </section>
    )
  }

  return (
    <form className="application-form" noValidate onSubmit={handleSubmit}>
      <div className="form-intro">
        <p className="eyebrow">Work &amp; Travel USA</p>
        <h1>Prijava kandidata</h1>
        <p>
          Popunite osnovne podatke kako bi naš tim mogao da proceni prijavu i javi vam se u vezi sa
          narednim koracima. Polja označena zvezdicom su obavezna.
        </p>
      </div>

      {formMessage ? (
        <div className="form-alert" role="alert">
          {formMessage}
        </div>
      ) : null}

      <fieldset>
        <legend>Lični i kontakt podaci</legend>
        <div className="field-grid">
          <label>
            <span>Ime *</span>
            <input aria-describedby={errors.firstName ? 'firstName-error' : undefined} name="firstName" required />
            <FieldError errors={errors} field="firstName" />
          </label>
          <label>
            <span>Prezime *</span>
            <input aria-describedby={errors.lastName ? 'lastName-error' : undefined} name="lastName" required />
            <FieldError errors={errors} field="lastName" />
          </label>
          <label>
            <span>Datum rođenja *</span>
            <input
              aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
              name="dateOfBirth"
              required
              type="date"
            />
            <FieldError errors={errors} field="dateOfBirth" />
          </label>
          <label>
            <span>Broj telefona *</span>
            <input
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              autoComplete="tel"
              inputMode="tel"
              name="phone"
              placeholder="+381 6x xxx xxxx"
              required
              type="tel"
            />
            <FieldError errors={errors} field="phone" />
          </label>
          <label className="full-width">
            <span>Email adresa *</span>
            <input
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
              name="email"
              required
              type="email"
            />
            <FieldError errors={errors} field="email" />
          </label>
          <label className="full-width">
            <span>Adresa prebivališta *</span>
            <textarea
              aria-describedby={errors.residentialAddress ? 'residentialAddress-error' : undefined}
              name="residentialAddress"
              required
              rows={2}
            />
            <FieldError errors={errors} field="residentialAddress" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Podaci o studijama</legend>
        <div className="field-grid">
          <label className="full-width">
            <span>Naziv fakulteta *</span>
            <input aria-describedby={errors.facultyName ? 'facultyName-error' : undefined} name="facultyName" required />
            <FieldError errors={errors} field="facultyName" />
          </label>
          <label>
            <span>Grad studiranja *</span>
            <input aria-describedby={errors.studyCity ? 'studyCity-error' : undefined} name="studyCity" required />
            <FieldError errors={errors} field="studyCity" />
          </label>
          <label>
            <span>Trenutna godina studija *</span>
            <select
              aria-describedby={errors.currentStudyYear ? 'currentStudyYear-error' : undefined}
              defaultValue=""
              name="currentStudyYear"
              required
            >
              <option disabled value="">
                Izaberite
              </option>
              {studyYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError errors={errors} field="currentStudyYear" />
          </label>
          <label>
            <span>Broj ostvarenih ESPB bodova *</span>
            <input
              aria-describedby={errors.espbPoints ? 'espbPoints-error' : undefined}
              inputMode="numeric"
              min="0"
              name="espbPoints"
              required
              step="1"
              type="number"
            />
            <FieldError errors={errors} field="espbPoints" />
          </label>
          <label>
            <span>Obnova ili pauza studija *</span>
            <select
              aria-describedby={errors.studyInterruptionStatus ? 'studyInterruptionStatus-error' : undefined}
              name="studyInterruptionStatus"
              onChange={(event) => setInterruptionStatus(event.target.value)}
              required
              value={interruptionStatus}
            >
              {studyInterruptionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError errors={errors} field="studyInterruptionStatus" />
          </label>
          {interruptionStatus === 'OTHER' ? (
            <label className="full-width">
              <span>Kratko objašnjenje *</span>
              <textarea
                aria-describedby={
                  errors.studyInterruptionExplanation ? 'studyInterruptionExplanation-error' : undefined
                }
                name="studyInterruptionExplanation"
                required
                rows={3}
              />
              <FieldError errors={errors} field="studyInterruptionExplanation" />
            </label>
          ) : null}
          <label className="full-width">
            <span>Napomena za naš tim (opciono)</span>
            <textarea name="applicantNote" rows={4} />
            <FieldError errors={errors} field="applicantNote" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Saglasnosti</legend>
        <label className="checkbox-field">
          <input name="privacyConsent" required type="checkbox" />
          <span>{SWT_PRE_APPLICATION.privacyConsentText} *</span>
        </label>
        <FieldError errors={errors} field="privacyConsent" />
        <label className="checkbox-field optional-consent">
          <input name="newsletterConsent" type="checkbox" />
          <span>{SWT_PRE_APPLICATION.newsletterConsentText}</span>
        </label>
      </fieldset>

      <label aria-hidden="true" className="honeypot" tabIndex={-1}>
        Website
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>

      <button className="submit-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Slanje prijave…' : 'Pošalji prijavu'}
      </button>
      <p className="submit-note">Prijava se čuva direktno u zaštićenom administrativnom portalu.</p>
    </form>
  )
}
