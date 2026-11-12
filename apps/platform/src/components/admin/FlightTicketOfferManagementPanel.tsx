'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'
import './FlightTicketOfferManagementPanel.scss'

type Option = {
  airlineName: string
  baggageDescription: string
  currency: 'EUR' | 'RSD' | 'USD'
  fareConditions: string
  outboundArrivalAt: string
  outboundDepartureAt: string
  outboundRoute: string
  returnArrivalAt: string
  returnDepartureAt: string
  returnRoute: string
  totalPrice: string
}
type PublishedOption = Omit<Option, 'fareConditions' | 'totalPrice'> & { fareConditions?: string; optionCode: string; totalPriceMinor: number }
type Offer = { id: number; offerVersion: number; options: PublishedOption[]; publishedAt: string; responseDueAt?: string; status: 'ACCEPTED' | 'PUBLISHED' | 'REJECTED' | 'WITHDRAWN'; statusVersion: number; withdrawalReason?: string }
type Response = { action: 'ACCEPT' | 'REJECT'; flightTicketOfferId: number; rejectionReason?: string; respondedAt: string; selectedOptionCode?: string }
type State = {
  currentStep: string
  offers: Offer[]
  processStatus: string
  request?: { departureDate: string; returnDate: string; returnDestination: string; usaDestination: string; version: number }
  responses: Response[]
}

const emptyOption = (): Option => ({
  airlineName: '', baggageDescription: '', currency: 'EUR', fareConditions: '', outboundArrivalAt: '', outboundDepartureAt: '', outboundRoute: '', returnArrivalAt: '', returnDepartureAt: '', returnRoute: '', totalPrice: '',
})
const date = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const day = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
const money = (minor: number, currency: string) => new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(minor / 100)

export function FlightTicketOfferManagementPanel() {
  const { id } = useDocumentInfo()
  const [state, setState] = useState<State>()
  const [candidateInstructions, setCandidateInstructions] = useState('Pregledajte sve detalje, vreme presedanja, prtljag i uslove tarife pre izbora.')
  const [internalNotes, setInternalNotes] = useState('')
  const [responseDueAt, setResponseDueAt] = useState('')
  const [options, setOptions] = useState<Option[]>([emptyOption()])
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const endpoint = id ? `/api/admin/flight-ticket-offers/${id}` : ''

  async function reload() {
    const response = await fetch(endpoint, { cache: 'no-store' }); const result = await response.json()
    if (!response.ok) throw new Error(result.message); setState(result)
  }
  useEffect(() => { if (!endpoint) return; const controller = new AbortController(); fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); if (!controller.signal.aborted) setState(result) }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Ponude nisu dostupne.') }); return () => controller.abort() }, [endpoint])
  function updateOption(index: number, patch: Partial<Option>) { setOptions(options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option)) }
  async function publish() {
    if (busy.current) return; busy.current = true; setPending(true); setMessage(''); setSuccess(false)
    try {
      const body = {
        action: 'PUBLISH', candidateInstructions, internalNotes: internalNotes || undefined,
        options: options.map((option) => ({ airlineName: option.airlineName, baggageDescription: option.baggageDescription, currency: option.currency, fareConditions: option.fareConditions || undefined, outboundArrivalAt: new Date(option.outboundArrivalAt).toISOString(), outboundDepartureAt: new Date(option.outboundDepartureAt).toISOString(), outboundRoute: option.outboundRoute, returnArrivalAt: new Date(option.returnArrivalAt).toISOString(), returnDepartureAt: new Date(option.returnDepartureAt).toISOString(), returnRoute: option.returnRoute, totalPriceMinor: Math.round(Number(option.totalPrice.replace(',', '.')) * 100) })),
        responseDueAt: responseDueAt ? new Date(responseDueAt).toISOString() : undefined,
      }
      const response = await fetch(endpoint, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' }); const result = await response.json(); setSuccess(response.ok); setMessage(result.message ?? 'Ponuda nije obrađena.'); if (response.ok) { setOptions([emptyOption()]); setInternalNotes(''); setResponseDueAt(''); await reload() }
    } catch { setMessage('Veza sa serverom nije uspela. Proverite stanje pre ponovnog pokušaja.') }
    finally { busy.current = false; setPending(false) }
  }
  async function withdraw(offer: Offer) {
    const reason = window.prompt('Unesite razlog povlačenja ponude:')?.trim(); if (!reason || busy.current) return
    busy.current = true; setPending(true); setMessage(''); setSuccess(false)
    try { const response = await fetch(endpoint, { body: JSON.stringify({ action: 'WITHDRAW', expectedStatusVersion: offer.statusVersion, flightTicketOfferId: offer.id, reason }), headers: { 'Content-Type': 'application/json' }, method: 'POST' }); const result = await response.json(); setSuccess(response.ok); setMessage(result.message ?? 'Ponuda nije obrađena.'); if (response.ok) await reload() }
    catch { setMessage('Veza sa serverom nije uspela. Proverite stanje pre ponovnog pokušaja.') }
    finally { busy.current = false; setPending(false) }
  }
  if (!id) return null
  const canPublish = state?.request && state.processStatus === 'ACTIVE' && state.currentStep === 'TRAVEL_PREPARATION' && !state.offers.some((offer) => offer.status === 'PUBLISHED' || offer.status === 'ACCEPTED')
  const complete = candidateInstructions.trim().length >= 2 && options.every((option) => option.airlineName && option.baggageDescription && option.outboundArrivalAt && option.outboundDepartureAt && option.outboundRoute && option.returnArrivalAt && option.returnDepartureAt && option.returnRoute && Number(option.totalPrice.replace(',', '.')) > 0)
  return <section className="flight-offer-admin" aria-label="Ponuda avionske karte kandidatu">
    <h3>Ponuda avionske karte kandidatu</h3><p>Detalji ponude ostaju u portalu. Kandidatu se emailom šalje samo obaveštenje i bezbedan link.</p>
    {message ? <div className={success ? 'flight-offer-admin__success' : 'flight-offer-admin__message'} role="status">{message}</div> : null}
    {!state ? <p>Učitavanje…</p> : <>
      {!state.request ? <p>Kandidat još nije poslao zahtev za avionsku kartu.</p> : <div className="flight-offer-admin__request"><strong>Zahtev · verzija {state.request.version}</strong><span>{day(state.request.departureDate)} → {state.request.usaDestination}</span><span>{day(state.request.returnDate)} → {state.request.returnDestination}</span></div>}
      {state.offers.map((offer) => { const response = state.responses.find((item) => item.flightTicketOfferId === offer.id); return <article className="flight-offer-admin__published" key={offer.id}><header><strong>Ponuda v{offer.offerVersion}</strong><span>{offer.status} · {date(offer.publishedAt)}</span></header>{offer.options.map((option) => <div className="flight-offer-admin__summary" key={option.optionCode}><strong>{option.optionCode} · {option.airlineName}</strong><span>{option.outboundRoute} / {option.returnRoute}</span><span>{money(option.totalPriceMinor, option.currency)}</span></div>)}{response ? <p><strong>Odgovor:</strong> {response.action === 'ACCEPT' ? `prihvaćena ${response.selectedOptionCode}` : 'ponuda odbijena'} · {date(response.respondedAt)}{response.rejectionReason ? ` · ${response.rejectionReason}` : ''}</p> : null}{offer.status === 'PUBLISHED' ? <button disabled={pending} onClick={() => void withdraw(offer)} type="button">Povuci ponudu</button> : null}{offer.withdrawalReason ? <p>Razlog povlačenja: {offer.withdrawalReason}</p> : null}</article> })}
      {canPublish ? <div className="flight-offer-admin__editor"><h4>Nova ponuda</h4><label><span>Uputstvo kandidatu</span><textarea maxLength={2000} onChange={(event) => setCandidateInstructions(event.target.value)} value={candidateInstructions} /></label><label><span>Rok za odgovor (opciono)</span><input min={new Date().toISOString().slice(0, 16)} onChange={(event) => setResponseDueAt(event.target.value)} type="datetime-local" value={responseDueAt} /></label><label><span>Interna napomena (opciono)</span><textarea maxLength={2000} onChange={(event) => setInternalNotes(event.target.value)} value={internalNotes} /></label>
        {options.map((option, index) => <fieldset key={index}><legend>Opcija {index + 1}</legend><div className="flight-offer-admin__grid"><label><span>Aviokompanija</span><input aria-label={`Aviokompanija opcije ${index + 1}`} maxLength={160} onChange={(event) => updateOption(index, { airlineName: event.target.value })} value={option.airlineName} /></label><label><span>Cena</span><input aria-label={`Cena opcije ${index + 1}`} inputMode="decimal" onChange={(event) => updateOption(index, { totalPrice: event.target.value })} placeholder="850.00" value={option.totalPrice} /></label><label><span>Valuta</span><select aria-label={`Valuta opcije ${index + 1}`} onChange={(event) => updateOption(index, { currency: event.target.value as Option['currency'] })} value={option.currency}><option>EUR</option><option>USD</option><option>RSD</option></select></label><label><span>Odlazna ruta</span><input aria-label={`Odlazna ruta opcije ${index + 1}`} maxLength={300} onChange={(event) => updateOption(index, { outboundRoute: event.target.value })} placeholder="BEG–FRA–JFK" value={option.outboundRoute} /></label><label><span>Polazak</span><input aria-label={`Polazak opcije ${index + 1}`} onChange={(event) => updateOption(index, { outboundDepartureAt: event.target.value })} type="datetime-local" value={option.outboundDepartureAt} /></label><label><span>Dolazak</span><input aria-label={`Dolazak opcije ${index + 1}`} onChange={(event) => updateOption(index, { outboundArrivalAt: event.target.value })} type="datetime-local" value={option.outboundArrivalAt} /></label><label><span>Povratna ruta</span><input aria-label={`Povratna ruta opcije ${index + 1}`} maxLength={300} onChange={(event) => updateOption(index, { returnRoute: event.target.value })} placeholder="JFK–MUC–BEG" value={option.returnRoute} /></label><label><span>Povratni polazak</span><input aria-label={`Povratni polazak opcije ${index + 1}`} onChange={(event) => updateOption(index, { returnDepartureAt: event.target.value })} type="datetime-local" value={option.returnDepartureAt} /></label><label><span>Povratni dolazak</span><input aria-label={`Povratni dolazak opcije ${index + 1}`} onChange={(event) => updateOption(index, { returnArrivalAt: event.target.value })} type="datetime-local" value={option.returnArrivalAt} /></label><label><span>Prtljag</span><textarea aria-label={`Prtljag opcije ${index + 1}`} maxLength={500} onChange={(event) => updateOption(index, { baggageDescription: event.target.value })} value={option.baggageDescription} /></label><label><span>Uslovi tarife (opciono)</span><textarea aria-label={`Uslovi tarife opcije ${index + 1}`} maxLength={1000} onChange={(event) => updateOption(index, { fareConditions: event.target.value })} value={option.fareConditions} /></label></div>{options.length > 1 ? <button onClick={() => setOptions(options.filter((_, optionIndex) => optionIndex !== index))} type="button">Ukloni opciju</button> : null}</fieldset>)}
        <div className="flight-offer-admin__actions">{options.length < 5 ? <button onClick={() => setOptions([...options, emptyOption()])} type="button">Dodaj opciju leta</button> : null}<button disabled={pending || !complete} onClick={() => void publish()} type="button">{pending ? 'Objavljivanje…' : 'Objavi ponudu kandidatu'}</button></div>
      </div> : state.request && !state.offers.some((offer) => offer.status === 'PUBLISHED' || offer.status === 'ACCEPTED') ? <p>Ponudu nije moguće objaviti dok proces nije aktivan u koraku „Putovanje i orijentacija“.</p> : null}
    </>}
  </section>
}
