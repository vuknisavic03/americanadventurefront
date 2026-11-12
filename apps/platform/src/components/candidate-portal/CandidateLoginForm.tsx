'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export function CandidateLoginForm() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setPending(true)
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/candidate-accounts/login', {
        body: JSON.stringify({
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) {
        setMessage('Podaci nisu ispravni ili nalog još nije aktiviran.')
        return
      }

      router.push('/moj-nalog')
      router.refresh()
    } catch {
      setMessage('Veza sa serverom nije uspela. Molimo pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="account-card" noValidate onSubmit={submit}>
      <p className="eyebrow">Kandidatski portal</p>
      <h1>Prijava</h1>
      <p className="account-lead">Pratite svoj Work &amp; Travel proces na jednom mestu.</p>
      {message ? <div className="form-alert" role="alert">{message}</div> : null}
      <div className="account-fields">
        <label><span>Email</span><input autoComplete="email" name="email" required type="email" /></label>
        <label><span>Lozinka</span><input autoComplete="current-password" name="password" required type="password" /></label>
      </div>
      <button className="submit-button" disabled={pending} type="submit">
        {pending ? 'Prijavljivanje…' : 'Prijavite se'}
      </button>
      <p className="account-help"><Link href="/nalog/zaboravljena-lozinka">Zaboravili ste lozinku?</Link></p>
      <p className="account-help">Nemate pristup? <Link href="/nalog/registracija">Kako se dobija nalog</Link></p>
    </form>
  )
}

