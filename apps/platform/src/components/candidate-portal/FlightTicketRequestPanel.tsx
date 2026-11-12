'use client'

import { useEffect, useRef, useState } from 'react'
import './FlightTicketRequestPanel.scss'

type Request = { departureDate: string; id: number; notificationDeliveredAt?: string; notificationStatus: 'DELIVERED' | 'FAILED' | 'PENDING'; returnDate: string; returnDestination: string; submittedAt: string; usaDestination: string; version: number }
type State = { available: boolean; blocker?: string; request?: Request }
const empty = { departureDate: '', returnDate: '', returnDestination: '', usaDestination: '' }

export function FlightTicketRequestPanel() {
  const [state, setState] = useState<State>(); const [values, setValues] = useState(empty)
  const [message, setMessage] = useState(''); const [messageSuccess, setMessageSuccess] = useState(false)
  const [pending, setPending] = useState(false); const busy = useRef(false)
  function apply(result: State) { setState(result); setValues(result.request ? { departureDate: result.request.departureDate, returnDate: result.request.returnDate, returnDestination: result.request.returnDestination, usaDestination: result.request.usaDestination } : empty) }
  async function reload() { const response = await fetch('/api/candidate/flight-ticket-request', { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.message); apply(result) }
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/candidate/flight-ticket-request', { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      if (!controller.signal.aborted) apply(result)
    }).catch((error: unknown) => { if (!controller.signal.aborted) { setMessageSuccess(false); setMessage(error instanceof Error ? error.message : 'Zahtev nije dostupan.') } })
    return () => controller.abort()
  }, [])
  async function submit() {
    if (!state || busy.current) return; busy.current = true; setPending(true); setMessage(''); setMessageSuccess(false)
    try {
      const response = await fetch('/api/candidate/flight-ticket-request', { body: JSON.stringify({ ...values, expectedVersion: state.request?.version }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json(); setMessageSuccess(response.ok); setMessage(result.message ?? 'Zahtev nije obrađen.'); if (response.ok) await reload()
    } catch { setMessageSuccess(false); setMessage('Veza sa serverom nije uspela. Proverite stanje pre ponovnog pokušaja.') }
    finally { busy.current = false; setPending(false) }
  }
  const complete = Object.values(values).every(Boolean)
  return <section className="profile-reference flight-request" id="flight-ticket-request" aria-labelledby="flight-ticket-request-heading">
    <div className="section-heading"><div><p className="eyebrow">Putovanje</p><h2 id="flight-ticket-request-heading">Zahtev za avionsku kartu</h2></div><p>Unesite planirane datume i odredišta kako bi agencija pripremila odgovarajuće opcije leta.</p></div>
    <p>Ovo nije kupovina karte. Nakon obrade dobićete posebnu ponudu koju ćete moći da prihvatite ili odbijete.</p>
    {message ? <div className={messageSuccess ? 'form-success' : 'form-alert'} role="status">{message}</div> : null}
    {!state ? <p>Učitavanje…</p> : <>
      {state.request ? <div className="flight-request__status"><strong>Zahtev je evidentiran · verzija {state.request.version}</strong><span>{state.request.notificationStatus === 'DELIVERED' ? 'Agencija je obaveštena.' : state.request.notificationStatus === 'FAILED' ? 'Zahtev je sačuvan, ali automatsko obaveštenje nije uspelo. Administratori ga i dalje vide u portalu.' : 'Automatsko obaveštenje čeka slanje.'}</span></div> : null}
      {!state.available ? <p>{state.blocker}</p> : <><div className="flight-request__fields">
        <label><span>Datum odlaska</span><input disabled={pending} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setValues({ ...values, departureDate: event.target.value })} required type="date" value={values.departureDate} /></label>
        <label><span>Destinacija u SAD</span><input disabled={pending} maxLength={200} onChange={(event) => setValues({ ...values, usaDestination: event.target.value })} placeholder="npr. Ocean City, MD ili BWI" required value={values.usaDestination} /></label>
        <label><span>Datum povratka</span><input disabled={pending} min={values.departureDate || new Date().toISOString().slice(0, 10)} onChange={(event) => setValues({ ...values, returnDate: event.target.value })} required type="date" value={values.returnDate} /></label>
        <label><span>Povratna destinacija</span><input disabled={pending} maxLength={200} onChange={(event) => setValues({ ...values, returnDestination: event.target.value })} placeholder="npr. Beograd (BEG)" required value={values.returnDestination} /></label>
      </div><button className="submit-button" disabled={pending || !complete} onClick={() => void submit()} type="button">{pending ? 'Čuvanje…' : state.request ? 'Sačuvaj izmene i prosledi' : 'Pošalji zahtev agenciji'}</button></>}
    </>}
  </section>
}
