'use client'

import { useEffect, useRef, useState } from 'react'

type Appointment = { appointmentAt: string; appointmentDate: string; appointmentTime: string; cancelledAt?: string; id: number; reminderAt: string; status: 'CANCELLED' | 'SCHEDULED'; timeZone: string; version: number }
type State = { appointment?: Appointment; available: boolean; blocker?: string }

function display(value: string) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(new Date(value)) }

export function EmbassyAppointmentPanel() {
  const [state, setState] = useState<State>()
  const [date, setDate] = useState(''); const [time, setTime] = useState('')
  const [message, setMessage] = useState(''); const [pending, setPending] = useState(false)
  const busy = useRef(false)
  async function load(signal?: AbortSignal) {
    const response = await fetch('/api/candidate/embassy-appointment', { cache: 'no-store', signal }); const result = await response.json()
    if (!response.ok) throw new Error(result.message ?? 'Termin nije dostupan.')
    setState(result); setDate(result.appointment?.appointmentDate ?? ''); setTime(result.appointment?.appointmentTime ?? '')
  }
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/candidate/embassy-appointment', { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message ?? 'Termin nije dostupan.')
      if (!controller.signal.aborted) { setState(result); setDate(result.appointment?.appointmentDate ?? ''); setTime(result.appointment?.appointmentTime ?? '') }
    }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Termin nije dostupan.') })
    return () => controller.abort()
  }, [])
  async function mutate(action: 'CANCEL' | 'SAVE') {
    if (busy.current || !state) return
    busy.current = true; setPending(true); setMessage('')
    try {
      const body = action === 'SAVE' ? { action, appointmentDate: date, appointmentTime: time, expectedVersion: state.appointment?.version } : { action, expectedVersion: state.appointment!.version }
      const response = await fetch('/api/candidate/embassy-appointment', { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json(); setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) await load()
    } catch { setMessage('Veza sa serverom nije uspela. Proverite stanje pre ponovnog pokušaja.') }
    finally { busy.current = false; setPending(false) }
  }
  return <section className="profile-reference embassy-appointment" id="embassy-appointment" aria-labelledby="embassy-appointment-heading">
    <div className="section-heading"><div><p className="eyebrow">Vizni proces</p><h2 id="embassy-appointment-heading">Termin u ambasadi</h2></div><p>Unesite tačan datum i vreme sa zvanične potvrde ambasade.</p></div>
    <p>Vreme se čuva u vremenskoj zoni Beograda. Tri dana pre važećeg termina sistem automatski priprema e-mail i SMS podsetnik.</p>
    {message ? <div className="form-alert" role="status">{message}</div> : null}
    {!state ? <p>Učitavanje…</p> : !state.available ? <p>{state.blocker ?? 'Unos termina trenutno nije dostupan.'}</p> : <>
      {state.appointment?.status === 'SCHEDULED' ? <div className="embassy-appointment__current"><strong>Zakazan termin: {display(state.appointment.appointmentAt)}</strong><span>Podsetnik je planiran za {display(state.appointment.reminderAt)}.</span></div> : state.appointment ? <p>Prethodni termin je otkazan. Unesite novi kada ga dobijete.</p> : null}
      <div className="embassy-appointment__fields">
        <label><span>Datum termina</span><input disabled={pending} onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></label>
        <label><span>Vreme termina</span><input disabled={pending} onChange={(event) => setTime(event.target.value)} required type="time" value={time} /></label>
      </div>
      <div className="embassy-appointment__actions">
        <button disabled={pending || !date || !time} onClick={() => void mutate('SAVE')} type="button">{state.appointment?.status === 'SCHEDULED' ? 'Sačuvaj izmenjeni termin' : 'Sačuvaj termin'}</button>
        {state.appointment?.status === 'SCHEDULED' ? <button className="button-secondary" disabled={pending} onClick={() => void mutate('CANCEL')} type="button">Otkaži termin</button> : null}
      </div>
    </>}
  </section>
}
