'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type Installment = { amountCents: number; dueAt: string; label: string }
type PaymentMethod = 'INSTALLMENTS' | 'ONE_TIME' | 'PAY_WHEN_YOU_EARN'

export type ProgramOfferView = {
  basePriceCents: number
  id: number
  installments: { enabled: boolean; items: Installment[] }
  oneTime: { discountCents: number; discountLabel?: null | string; enabled: boolean }
  payWhenYouEarn: {
    deferredAmountCents: number
    depositCents: number
    description: string
    enabled: boolean
  }
  validUntil: string
}

export type PaymentSelectionView = {
  acceptedAt: string
  discountCents: number
  installmentSchedule: Installment[]
  payWhenYouEarn: null | {
    deferredAmountCents: number
    depositCents: number
    description: string
  }
  selectedMethod: PaymentMethod
  totalCents: number
}

const methodLabels: Record<PaymentMethod, string> = {
  INSTALLMENTS: 'Plaćanje na rate',
  ONE_TIME: 'Jednokratno plaćanje',
  PAY_WHEN_YOU_EARN: 'Platiš kad zaradiš',
}

function money(cents: number) {
  return new Intl.NumberFormat('sr-Latn-RS', { currency: 'USD', style: 'currency' }).format(cents / 100)
}

function date(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long' }).format(new Date(value))
}

function InstallmentList({ items }: { items: Installment[] }) {
  return (
    <ol className="installment-list">
      {items.map((item) => (
        <li key={`${item.label}-${item.dueAt}`}>
          <span><strong>{item.label}</strong><small>dospeva {date(item.dueAt)}</small></span>
          <strong>{money(item.amountCents)}</strong>
        </li>
      ))}
    </ol>
  )
}

export function ProgramOfferPanel({ offer, selection }: { offer?: ProgramOfferView; selection?: PaymentSelectionView }) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  if (selection) {
    return (
      <section className="offer-section" aria-labelledby="offer-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Programska ponuda</p><h2 id="offer-heading">Vaš izbor je sačuvan</h2></div>
          <p>Ovaj zapis je zaključan kako bi cena i uslovi ostali isti tokom pripreme ugovora.</p>
        </div>
        <div className="accepted-offer">
          <span>Izabrani način plaćanja</span>
          <strong>{methodLabels[selection.selectedMethod]}</strong>
          <p>Konačan iznos: <b>{money(selection.totalCents)}</b></p>
          {selection.discountCents > 0 ? <p>Uračunat popust: {money(selection.discountCents)}</p> : null}
          <small>Izbor potvrđen {date(selection.acceptedAt)}</small>
        </div>
        {selection.installmentSchedule.length > 0 ? <InstallmentList items={selection.installmentSchedule} /> : null}
        {selection.payWhenYouEarn ? (
          <div className="pkz-summary">
            <p>Početni iznos: <strong>{money(selection.payWhenYouEarn.depositCents)}</strong></p>
            <p>Odloženi iznos: <strong>{money(selection.payWhenYouEarn.deferredAmountCents)}</strong></p>
            <p>{selection.payWhenYouEarn.description}</p>
          </div>
        ) : null}
      </section>
    )
  }

  if (!offer) {
    return (
      <section className="offer-section" aria-labelledby="offer-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Programska ponuda</p><h2 id="offer-heading">Ponuda je u pripremi</h2></div>
          <p>Agencija će ovde objaviti cenu i dostupne načine plaćanja kada ponuda bude spremna.</p>
        </div>
      </section>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!method || !confirmed || !offer) {
      setMessage('Izaberite opciju i potvrdite da ste pregledali uslove.')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/candidate/program-offers/${offer.id}/select`, {
        body: JSON.stringify({ confirmed, method }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json()) as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen. Pokušajte ponovo.')
      if (response.ok) router.refresh()
    } catch {
      setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="offer-section" aria-labelledby="offer-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Programska ponuda</p><h2 id="offer-heading">Izaberite način plaćanja</h2></div>
        <p>Ponuda važi do {date(offer.validUntil)}. Izbor se posle potvrde zaključava.</p>
      </div>
      <div className="offer-price"><span>Osnovna cena programa</span><strong>{money(offer.basePriceCents)}</strong></div>
      <form noValidate onSubmit={submit}>
        <div className="payment-options">
          {offer.oneTime.enabled ? (
            <label className={`payment-option ${method === 'ONE_TIME' ? 'payment-option--selected' : ''}`}>
              <input name="paymentMethod" onChange={() => setMethod('ONE_TIME')} type="radio" />
              <span><strong>Jednokratno plaćanje</strong><small>{offer.oneTime.discountLabel || 'Plaćanje celog iznosa odjednom'}</small></span>
              <b>{money(offer.basePriceCents - offer.oneTime.discountCents)}</b>
              {offer.oneTime.discountCents > 0 ? <em>Ušteda {money(offer.oneTime.discountCents)}</em> : null}
            </label>
          ) : null}
          {offer.installments.enabled ? (
            <label className={`payment-option payment-option--stacked ${method === 'INSTALLMENTS' ? 'payment-option--selected' : ''}`}>
              <span className="payment-option-heading">
                <input name="paymentMethod" onChange={() => setMethod('INSTALLMENTS')} type="radio" />
                <span><strong>Plaćanje na rate</strong><small>{offer.installments.items.length} unapred definisanih rata</small></span>
                <b>{money(offer.basePriceCents)}</b>
              </span>
              <InstallmentList items={offer.installments.items} />
            </label>
          ) : null}
          {offer.payWhenYouEarn.enabled ? (
            <label className={`payment-option payment-option--stacked ${method === 'PAY_WHEN_YOU_EARN' ? 'payment-option--selected' : ''}`}>
              <span className="payment-option-heading">
                <input name="paymentMethod" onChange={() => setMethod('PAY_WHEN_YOU_EARN')} type="radio" />
                <span><strong>Platiš kad zaradiš</strong><small>Poseban SWT model sa odloženim delom obaveze</small></span>
                <b>{money(offer.basePriceCents)}</b>
              </span>
              <p>{offer.payWhenYouEarn.description}</p>
              <div className="pkz-amounts"><span>Sada: {money(offer.payWhenYouEarn.depositCents)}</span><span>Odloženo: {money(offer.payWhenYouEarn.deferredAmountCents)}</span></div>
              <small>Poseban ugovor i dokumentacija jemca biće predstavljeni pre potpisivanja.</small>
            </label>
          ) : null}
        </div>
        {message ? <div className="form-alert" role="status">{message}</div> : null}
        <label className="checkbox-field offer-confirmation">
          <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
          <span>Pregledao/la sam izabrani način plaćanja i razumem da će se ovaj izbor koristiti za pripremu ugovora.</span>
        </label>
        <button className="submit-button" disabled={pending} type="submit">
          {pending ? 'Čuvanje izbora…' : 'Potvrdi način plaćanja'}
        </button>
      </form>
    </section>
  )
}
