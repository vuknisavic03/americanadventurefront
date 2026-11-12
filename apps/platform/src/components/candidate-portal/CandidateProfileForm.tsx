'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type ProfileResponse = {
  advanced?: boolean
  fieldErrors?: Record<string, string>
  message?: string
}

type ProfileValues = {
  citizenship: string
  phone: string
  residentialAddress: string
}

function FieldError({ errors, field }: { errors: Record<string, string>; field: string }) {
  const message = errors[field]
  return message ? <span className="field-error" role="alert">{message}</span> : null
}

export function CandidateProfileForm({ initialValues }: { initialValues: ProfileValues }) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setSaved(false)
    setPending(true)
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/candidate/profile', {
        body: JSON.stringify({
          citizenship: String(formData.get('citizenship') ?? ''),
          phone: String(formData.get('phone') ?? ''),
          residentialAddress: String(formData.get('residentialAddress') ?? ''),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      const result = (await response.json()) as ProfileResponse
      setMessage(result.message ?? 'Zahtev nije obrađen. Molimo pokušajte ponovo.')
      setErrors(result.fieldErrors ?? {})
      setSaved(response.ok)
      if (response.ok) {
        router.refresh()
        if (result.advanced) window.scrollTo({ behavior: 'smooth', top: 0 })
      }
    } catch {
      setMessage('Veza sa serverom nije uspela. Molimo pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="profile-form" noValidate onSubmit={submit}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Lični podaci</p>
          <h2>Vaš profil</h2>
        </div>
        <p>Izmenite podatke ako su se promenili od trenutka prijave.</p>
      </div>
      {message ? (
        <div className={saved ? 'form-success' : 'form-alert'} role="status">{message}</div>
      ) : null}
      <div className="profile-fields">
        <label>
          <span>Telefon</span>
          <input defaultValue={initialValues.phone} inputMode="tel" name="phone" required />
          <FieldError errors={errors} field="phone" />
        </label>
        <label>
          <span>Državljanstvo</span>
          <input defaultValue={initialValues.citizenship} name="citizenship" required />
          <FieldError errors={errors} field="citizenship" />
        </label>
        <label className="profile-field--wide">
          <span>Adresa prebivališta</span>
          <textarea defaultValue={initialValues.residentialAddress} name="residentialAddress" required rows={3} />
          <FieldError errors={errors} field="residentialAddress" />
        </label>
      </div>
      <button className="submit-button" disabled={pending} type="submit">
        {pending ? 'Čuvanje…' : 'Sačuvaj izmene'}
      </button>
    </form>
  )
}
