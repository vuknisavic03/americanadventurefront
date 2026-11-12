'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import './FlightTicketRequestManagementPanel.scss'

type State = { request?: { departureDate: string; notificationDeliveredAt?: string; notificationStatus: 'DELIVERED' | 'FAILED' | 'PENDING'; returnDate: string; returnDestination: string; submittedAt: string; usaDestination: string; version: number } }
const date = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
const dateTime = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function FlightTicketRequestManagementPanel() {
  const { id } = useDocumentInfo(); const [state, setState] = useState<State>(); const [message, setMessage] = useState('')
  useEffect(() => { if (!id) return; const controller = new AbortController(); fetch(`/api/admin/flight-ticket-requests/${id}`, { cache: 'no-store', signal: controller.signal }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); if (!controller.signal.aborted) setState(result) }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Zahtev nije dostupan.') }); return () => controller.abort() }, [id])
  if (!id) return null
  const notification = state?.request?.notificationStatus === 'DELIVERED' ? 'Isporučeno' : state?.request?.notificationStatus === 'FAILED' ? 'Neuspešno — zahtev je i dalje vidljiv ovde' : 'Čeka slanje'
  return <section className="flight-request-admin" aria-label="Zahtev kandidata za avionsku kartu"><h3>Zahtev za avionsku kartu</h3><p>Kandidat podatke unosi u svom portalu. Email sadrži samo obaveštenje i link; podaci ispod su merodavni.</p>{message ? <div className="flight-request-admin__message" role="status">{message}</div> : null}{!state ? <p>Učitavanje…</p> : !state.request ? <p>Kandidat još nije poslao zahtev.</p> : <dl><div><dt>Datum odlaska</dt><dd>{date(state.request.departureDate)}</dd></div><div><dt>Destinacija u SAD</dt><dd>{state.request.usaDestination}</dd></div><div><dt>Datum povratka</dt><dd>{date(state.request.returnDate)}</dd></div><div><dt>Povratna destinacija</dt><dd>{state.request.returnDestination}</dd></div><div><dt>Poslednja izmena</dt><dd>{dateTime(state.request.submittedAt)} · verzija {state.request.version}</dd></div><div><dt>Obaveštenje</dt><dd>{notification}{state.request.notificationDeliveredAt ? ` · ${dateTime(state.request.notificationDeliveredAt)}` : ''}</dd></div></dl>}</section>
}
