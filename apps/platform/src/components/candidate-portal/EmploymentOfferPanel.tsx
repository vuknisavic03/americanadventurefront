'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type Offer = {
  candidateInstructions: string
  currency: 'USD'
  employerName: string
  endDate: string
  expectedWeeklyHours: number
  hourlyWageCents: number
  housingCostCents?: number
  housingDescription?: string
  housingProvided: boolean
  id: number
  jobTitle: string
  offerVersion: number
  publishedAt: string
  responseDueAt?: string
  snapshotChecksum: string
  startDate: string
  status: 'ACCEPTED' | 'PUBLISHED' | 'WITHDRAWN'
  workCity: string
  workState: string
}
type Acceptance = { acceptedAt: string; employmentOfferId: number; id: number; reference: string }

function date(value: string) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value)) }
function dateTime(value: string) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(new Date(value)) }
function money(cents: number) { return new Intl.NumberFormat('sr-Latn-RS', { currency: 'USD', style: 'currency' }).format(cents / 100) }

export function EmploymentOfferPanel({ acceptances, offers }: { acceptances: Acceptance[]; offers: Offer[] }) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const offer = offers.find((entry) => entry.status === 'PUBLISHED') ?? offers.find((entry) => entry.status === 'ACCEPTED') ?? offers[0]
  const acceptance = offer ? acceptances.find((entry) => entry.employmentOfferId === offer.id) : undefined

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!offer || !confirmed) { setMessage('Potvrdite da ste pročitali i prihvatate radnu ponudu.'); return }
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/employment-offers/${offer.id}/accept`, { body: JSON.stringify({ confirmed: true, snapshotChecksum: offer.snapshotChecksum }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) router.refresh()
    } catch { setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.') }
    finally { setPending(false) }
  }

  return (
    <section className="profile-reference employment-offer" id="employment-offer" aria-labelledby="employment-offer-heading">
      <div className="section-heading"><div><p className="eyebrow">Zaposlenje</p><h2 id="employment-offer-heading">Radna ponuda</h2></div><p>{acceptance ? 'Ponuda je elektronski prihvaćena.' : offer?.status === 'PUBLISHED' ? 'Pregledajte svaki uslov pre prihvatanja.' : 'Agencija još nije objavila aktivnu ponudu.'}</p></div>
      {!offer ? <p>Ponuda i uputstvo pojaviće se ovde nakon potvrde zaposlenja.</p> : offer.status === 'WITHDRAWN' ? <p className="form-alert">Prethodna ponuda je povučena. Sačekajte novu ponudu ili kontaktirajte agenciju.</p> : (
        <>
          <div className="employment-offer__hero"><strong>{offer.jobTitle}</strong><span>{offer.employerName}</span><small>{offer.workCity}, {offer.workState}, USA</small></div>
          <dl className="portal-details">
            <div><dt>Period rada</dt><dd>{date(offer.startDate)} — {date(offer.endDate)}</dd></div>
            <div><dt>Satnica</dt><dd>{money(offer.hourlyWageCents)} po satu</dd></div>
            <div><dt>Očekivani sati</dt><dd>{offer.expectedWeeklyHours} nedeljno</dd></div>
            <div><dt>Smeštaj</dt><dd>{offer.housingProvided ? offer.housingCostCents === undefined ? 'Obezbeđen' : `${money(offer.housingCostCents)} nedeljno` : 'Nije obezbeđen'}</dd></div>
            {offer.responseDueAt ? <div><dt>Rok za prihvatanje</dt><dd>{dateTime(offer.responseDueAt)}</dd></div> : null}
            <div><dt>Verzija ponude</dt><dd>{offer.offerVersion}</dd></div>
          </dl>
          {offer.housingDescription ? <div className="employment-offer__instructions"><h3>Informacije o smeštaju</h3><p>{offer.housingDescription}</p></div> : null}
          <div className="employment-offer__instructions"><h3>Uputstvo agencije</h3><p>{offer.candidateInstructions}</p></div>
          {acceptance ? <div className="form-success"><strong>Ponuda je prihvaćena</strong><p>Vreme: {dateTime(acceptance.acceptedAt)}<br />Referenca: {acceptance.reference}</p></div> : (
            <form noValidate onSubmit={accept}>
              {message ? <div className="form-alert" role="status">{message}</div> : null}
              <label className="checkbox-field offer-confirmation"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Potvrđujem da sam pročitao/la ovu radnu ponudu, da razumem uslove i da ih prihvatam.</span></label>
              <button className="submit-button" disabled={pending} type="submit">{pending ? 'Evidentiranje…' : 'Elektronski prihvati radnu ponudu'}</button>
              <p><small>Potvrda se vezuje za vaš zaštićeni nalog i tačan kontrolni otisak ove verzije; nije kvalifikovani elektronski potpis.</small></p>
            </form>
          )}
        </>
      )}
      {offers.length > 1 ? <details className="interview-preparation__history"><summary>Prethodne verzije</summary><ul>{offers.filter((entry) => entry.id !== offer?.id).map((entry) => <li key={entry.id}>Verzija {entry.offerVersion}: {entry.employerName} — {entry.status}</li>)}</ul></details> : null}
    </section>
  )
}
