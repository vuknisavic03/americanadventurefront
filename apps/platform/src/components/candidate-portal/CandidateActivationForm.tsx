'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'

type ActivationResponse = {
  fieldErrors?: Record<string, string>
  message?: string
}

function FieldError({ errors, field }: { errors: Record<string, string>; field: string }) {
  const message = errors[field]
  return message ? <span className="field-error" role="alert">{message}</span> : null
}

export function CandidateActivationForm({ token }: { token?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [completed, setCompleted] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setPending(true)
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/public/candidate-accounts/activate', {
        body: JSON.stringify({
          citizenship: String(formData.get('citizenship') ?? ''),
          confirmPassword: String(formData.get('confirmPassword') ?? ''),
          password: String(formData.get('password') ?? ''),
          token: token ?? '',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json()) as ActivationResponse
      setMessage(result.message ?? 'Zahtev nije obrađen. Molimo pokušajte ponovo.')
      setErrors(result.fieldErrors ?? {})
      if (response.ok) setCompleted(true)
    } catch {
      setMessage('Veza sa serverom nije uspela. Molimo pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  if (completed) {
    return (
      <section className="account-card account-card--center" aria-live="polite">
        <span className="success-icon" aria-hidden="true">✓</span>
        <p className="eyebrow">Aktivacija završena</p>
        <h1>Vaš nalog je spreman</h1>
        <p>{message}</p>
        <p className="account-help"><Link href="/nalog/prijava">Prijavite se na portal</Link></p>
      </section>
    )
  }

  if (!token) {
    return (
      <section className="account-card account-card--center">
        <p className="eyebrow">Kandidatski portal</p>
        <h1>Nedostaje aktivacioni link</h1>
        <p>Otvorite ceo link koji ste dobili od agencije ili zatražite novi poziv.</p>
        <p className="account-help"><Link href="/nalog/prijava">Nazad na prijavu</Link></p>
      </section>
    )
  }

  return (
    <form className="account-card" noValidate onSubmit={submit}>
      <p className="eyebrow">Kandidatski portal</p>
      <h1>Aktivirajte svoj nalog</h1>
      <p className="account-lead">Potvrdite osnovni podatak i izaberite lozinku. Link se može iskoristiti samo jednom.</p>
      {message ? <div className="form-alert" role="alert">{message}</div> : null}
      <div className="account-fields">
        <label><span>Državljanstvo</span><input autoComplete="country-name" name="citizenship" required /><FieldError errors={errors} field="citizenship" /></label>
        <label><span>Lozinka</span><input autoComplete="new-password" minLength={12} name="password" required type="password" /><small>Najmanje 12 znakova. Dozvoljeni su razmaci.</small><FieldError errors={errors} field="password" /></label>
        <label><span>Ponovite lozinku</span><input autoComplete="new-password" minLength={12} name="confirmPassword" required type="password" /><FieldError errors={errors} field="confirmPassword" /></label>
      </div>
      <button className="submit-button" disabled={pending} type="submit">{pending ? 'Aktiviranje…' : 'Aktiviraj nalog'}</button>
    </form>
  )
}

