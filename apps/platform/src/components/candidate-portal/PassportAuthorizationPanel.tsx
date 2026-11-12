'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export type PassportAuthorizationView = {
  acceptedAt?: string
  acceptanceReference?: string
  authorizationNumber: string
  generatedAt: string
  id: number
  sourcePdfSha256: string
  status: 'ACCEPTED' | 'GENERATED'
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(new Date(value))
}

export function PassportAuthorizationPanel({ authorization, visible }: { authorization?: PassportAuthorizationView; visible: boolean }) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  if (!visible) return null
  if (!authorization) return <section className="profile-reference" aria-labelledby="passport-authorization-heading"><div className="section-heading"><div><p className="eyebrow">Vizni proces</p><h2 id="passport-authorization-heading">Punomoćje za preuzimanje pasoša</h2></div><p>Agencija još nije generisala punomoćje. Biće prikazano ovde kada vizna dokumentacija bude proverena.</p></div></section>

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!confirmed) { setMessage('Potvrdite da ste pročitali punomoćje i da su podaci tačni.'); return }
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/candidate/passport-authorizations/${authorization!.id}/accept`, {
        body: JSON.stringify({ confirmed, sourcePdfSha256: authorization!.sourcePdfSha256 }), headers: { 'Content-Type': 'application/json' }, method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) router.refresh()
    } catch { setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.') }
    finally { setPending(false) }
  }

  if (authorization.status === 'ACCEPTED') return <section className="profile-reference" aria-labelledby="passport-authorization-heading"><div className="section-heading"><div><p className="eyebrow">Vizni proces</p><h2 id="passport-authorization-heading">Punomoćje je prihvaćeno</h2></div><p>Konačna verzija je arhivirana i dostupna agenciji za preuzimanje i štampu.</p></div><dl className="portal-details"><div><dt>Broj punomoćja</dt><dd>{authorization.authorizationNumber}</dd></div><div><dt>Status</dt><dd>Elektronski prihvaćeno</dd></div><div><dt>Vreme prihvatanja</dt><dd>{dateTime(authorization.acceptedAt!)}</dd></div><div><dt>Referenca</dt><dd>{authorization.acceptanceReference}</dd></div></dl><p className="contract-download-actions"><a className="portal-button portal-button--primary" href={`/api/passport-authorizations/${authorization.id}/download?version=accepted`}>Preuzmi prihvaćeni PDF</a>{' '}<a className="portal-button" href={`/api/passport-authorizations/${authorization.id}/download`}>Preuzmi izvorni nacrt</a></p></section>

  return <section className="profile-reference" aria-labelledby="passport-authorization-heading"><div className="section-heading"><div><p className="eyebrow">Vizni proces</p><h2 id="passport-authorization-heading">Pregledajte i prihvatite punomoćje</h2></div><p>Pre potvrde preuzmite nacrt i proverite svaki podatak. Ako nešto nije tačno, kontaktirajte agenciju i nemojte prihvatati dokument.</p></div><dl className="portal-details"><div><dt>Broj punomoćja</dt><dd>{authorization.authorizationNumber}</dd></div><div><dt>Status</dt><dd>Čeka vaše prihvatanje</dd></div><div><dt>Generisano</dt><dd>{dateTime(authorization.generatedAt)}</dd></div></dl><p className="contract-download-actions"><a className="portal-button portal-button--primary" href={`/api/passport-authorizations/${authorization.id}/download`}>Preuzmi nacrt punomoćja</a></p><form noValidate onSubmit={accept}>{message ? <div className="form-alert" role="status">{message}</div> : null}<label className="checkbox-field offer-confirmation"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Pročitao/la sam punomoćje, proverio/la podatke i prihvatam prikazanu verziju.</span></label><button className="submit-button" disabled={pending} type="submit">{pending ? 'Evidentiranje prihvatanja…' : 'Elektronski prihvati punomoćje'}</button></form><p><small>Ova potvrda predstavlja elektronsko prihvatanje u okviru zaštićenog naloga; nije kvalifikovani elektronski potpis.</small></p></section>
}
