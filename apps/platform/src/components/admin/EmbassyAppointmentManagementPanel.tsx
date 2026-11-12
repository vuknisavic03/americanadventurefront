'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import './EmbassyAppointmentManagementPanel.scss'

type State = { appointment?: { appointmentAt: string; reminderAt: string; status: 'CANCELLED' | 'SCHEDULED'; version: number }; deliveries: { appointmentVersion: number; channel: 'EMAIL' | 'SMS'; deliveredAt?: string; id: number; lastErrorCode?: string; provider: string; status: string }[] }
const display = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(new Date(value))

export function EmbassyAppointmentManagementPanel() {
  const { id } = useDocumentInfo(); const [state, setState] = useState<State>(); const [message, setMessage] = useState('')
  useEffect(() => { if (!id) return; const controller = new AbortController(); fetch(`/api/admin/embassy-appointments/${id}`, { cache: 'no-store', signal: controller.signal }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); if (!controller.signal.aborted) setState(result) }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Termin nije dostupan.') }); return () => controller.abort() }, [id])
  if (!id) return null
  return <section className="embassy-appointment-admin" aria-label="Termin kandidata u ambasadi"><h3>Termin u ambasadi i podsetnici</h3><p>Kandidat termin unosi u svom portalu. Ovde je prikaz samo za pregled; svaka izmena i svako slanje ostaju u revizijskom tragu.</p>{message ? <div className="embassy-appointment-admin__message" role="status">{message}</div> : null}{!state ? <p>Učitavanje…</p> : !state.appointment ? <p>Kandidat još nije evidentirao termin.</p> : <><dl><div><dt>Status</dt><dd>{state.appointment.status === 'SCHEDULED' ? 'Zakazan' : 'Otkazan'}</dd></div><div><dt>Termin</dt><dd>{display(state.appointment.appointmentAt)}</dd></div><div><dt>Podsetnik</dt><dd>{display(state.appointment.reminderAt)}</dd></div><div><dt>Verzija</dt><dd>{state.appointment.version}</dd></div></dl><h4>Evidencija slanja</h4>{state.deliveries.length ? <ul>{state.deliveries.map((delivery) => <li key={delivery.id}>{delivery.channel} · verzija {delivery.appointmentVersion} · {delivery.status}{delivery.deliveredAt ? ` · ${display(delivery.deliveredAt)}` : ''}{delivery.lastErrorCode ? ` · ${delivery.lastErrorCode}` : ''}</li>)}</ul> : <p>Za važeću verziju još nema pokušaja slanja.</p>}</> }</section>
}
