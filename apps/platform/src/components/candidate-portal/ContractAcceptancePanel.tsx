'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type ContractView = {
  generatedAt: string
  id: number
  number: string
  sourcePdfSha256: string
  statement: string
}

type AcceptanceView = {
  acceptedAt: string
  id: number
  reference: string
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Belgrade',
  }).format(new Date(value))
}

export function ContractAcceptancePanel({
  acceptance,
  contract,
}: {
  acceptance?: AcceptanceView
  contract: ContractView
}) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!confirmed) {
      setMessage('Potvrdite da ste pročitali i prihvatate ugovor.')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/contracts/${contract.id}/accept`, {
        body: JSON.stringify({ confirmed, sourcePdfSha256: contract.sourcePdfSha256 }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen. Pokušajte ponovo.')
      if (response.ok) router.refresh()
    } catch {
      setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  if (acceptance) {
    return (
      <section className="profile-reference" aria-labelledby="contract-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Ugovor</p><h2 id="contract-heading">Ugovor je elektronski prihvaćen</h2></div>
          <p>Konačna verzija i dokaz prihvatanja sačuvani su kao nepromenljivi zapisi.</p>
        </div>
        <dl className="portal-details">
          <div><dt>Broj ugovora</dt><dd>{contract.number}</dd></div>
          <div><dt>Status</dt><dd>Elektronski prihvaćen</dd></div>
          <div><dt>Vreme prihvatanja</dt><dd>{dateTime(acceptance.acceptedAt)}</dd></div>
          <div><dt>Referenca</dt><dd>{acceptance.reference}</dd></div>
        </dl>
        <p className="contract-download-actions">
          <a className="portal-button portal-button--primary" href={`/api/contract-acceptances/${acceptance.id}/download`}>
            Preuzmi prihvaćeni PDF
          </a>{' '}
          <a className="portal-button" href={`/api/contracts/${contract.id}/download`}>Preuzmi izvorni nacrt</a>
        </p>
      </section>
    )
  }

  return (
    <section className="profile-reference" aria-labelledby="contract-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Ugovor</p><h2 id="contract-heading">Pregledajte i prihvatite ugovor</h2></div>
        <p>Pre potvrde preuzmite nacrt i pažljivo proverite njegov sadržaj. Prihvatanje se ne može opozvati kroz portal.</p>
      </div>
      <dl className="portal-details">
        <div><dt>Broj ugovora</dt><dd>{contract.number}</dd></div>
        <div><dt>Status</dt><dd>Čeka vaše prihvatanje</dd></div>
        <div><dt>Datum generisanja</dt><dd>{dateTime(contract.generatedAt)}</dd></div>
      </dl>
      <p className="contract-download-actions"><a className="portal-button portal-button--primary" href={`/api/contracts/${contract.id}/download`}>Preuzmi nacrt ugovora</a></p>
      <form noValidate onSubmit={accept}>
        {message ? <div className="form-alert" role="status">{message}</div> : null}
        <label className="checkbox-field offer-confirmation">
          <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
          <span>{contract.statement}</span>
        </label>
        <button className="submit-button" disabled={pending} type="submit">
          {pending ? 'Evidentiranje prihvatanja…' : 'Elektronski prihvati ugovor'}
        </button>
      </form>
      <p><small>Ova potvrda predstavlja elektronsko prihvatanje u okviru vašeg zaštićenog naloga; nije kvalifikovani elektronski potpis.</small></p>
    </section>
  )
}

