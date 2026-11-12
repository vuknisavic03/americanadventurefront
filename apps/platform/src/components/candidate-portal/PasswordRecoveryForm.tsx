'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export function PasswordRecoveryForm({ resetToken }: { resetToken?: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [completed, setCompleted] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setPending(true)
    const formData = new FormData(event.currentTarget)

    try {
      const endpoint = resetToken
        ? '/api/candidate-accounts/reset-password'
        : '/api/public/candidate-accounts/forgot-password'
      const password = String(formData.get('password') ?? '')
      const confirmPassword = String(formData.get('confirmPassword') ?? '')

      if (resetToken && password !== confirmPassword) {
        setMessage('Lozinke se ne podudaraju.')
        return
      }
      if (resetToken && password.length < 12) {
        setMessage('Lozinka mora imati najmanje 12 znakova.')
        return
      }

      const response = await fetch(endpoint, {
        body: JSON.stringify(
          resetToken ? { password, token: resetToken } : { email: String(formData.get('email') ?? '') },
        ),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok) {
        setMessage(resetToken ? 'Link nije ispravan ili je istekao.' : result.message ?? 'Zahtev nije obrađen.')
        return
      }

      if (resetToken) {
        router.push('/moj-nalog')
        router.refresh()
      }
      else {
        setCompleted(true)
        setMessage(result.message ?? '')
      }
    } catch {
      setMessage('Veza sa serverom nije uspela. Molimo pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="account-card" noValidate onSubmit={submit}>
      <p className="eyebrow">Bezbednost naloga</p>
      <h1>{resetToken ? 'Postavite novu lozinku' : 'Zaboravljena lozinka'}</h1>
      <p className="account-lead">
        {resetToken
          ? 'Nova lozinka mora imati najmanje 12 znakova.'
          : 'Unesite email naloga. Odgovor ne otkriva da li je adresa registrovana.'}
      </p>
      {message ? <div className={completed ? 'form-success' : 'form-alert'} role="status">{message}</div> : null}
      {!completed ? (
        <>
          <div className="account-fields">
            {resetToken ? (
              <>
                <label><span>Nova lozinka</span><input autoComplete="new-password" minLength={12} name="password" required type="password" /></label>
                <label><span>Ponovite lozinku</span><input autoComplete="new-password" minLength={12} name="confirmPassword" required type="password" /></label>
              </>
            ) : (
              <label><span>Email</span><input autoComplete="email" name="email" required type="email" /></label>
            )}
          </div>
          <button className="submit-button" disabled={pending} type="submit">
            {pending ? 'Obrada…' : resetToken ? 'Sačuvaj novu lozinku' : 'Pošalji uputstvo'}
          </button>
        </>
      ) : null}
      <p className="account-help"><Link href="/nalog/prijava">Nazad na prijavu</Link></p>
    </form>
  )
}

