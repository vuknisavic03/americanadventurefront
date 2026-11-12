'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import './VisaPaymentOrderManagementPanel.scss'

type Order = {
  amountMinor: number
  bankAccount: string
  beneficiaryName: string
  currency: 'RSD' | 'USD'
  dueAt: string
  id: number
  orderNumber: string
  orderVersion: number
  overdue: boolean
  paidAt?: string
  paymentReference: string
  status: 'CANCELLED' | 'ISSUED' | 'PAID'
  statusVersion: number
}
type State = { acceptedEmployment: boolean; currentStep: string; orders: Order[]; processStatus: string }

function amountInMinor(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return undefined
  const amount = Number(value.replace(',', '.'))
  const minor = Math.round(amount * 100)
  return Number.isSafeInteger(minor) && minor > 0 ? minor : undefined
}
function money(value: number, currency: string) {
  return new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(value / 100)
}
function date(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium' }).format(new Date(value))
}

export function VisaPaymentOrderManagementPanel() {
  const { id } = useDocumentInfo()
  const idempotencyKey = useRef(crypto.randomUUID())
  const [state, setState] = useState<State>()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'RSD' | 'USD'>('RSD')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [paymentModel, setPaymentModel] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentPurpose, setPaymentPurpose] = useState('Troškovi viziranja za Work & Travel USA program')
  const [candidateInstructions, setCandidateInstructions] = useState('Uplatu izvršite prema navedenim podacima. Sačuvajte potvrdu o uplati; agencija će evidentirati prijem sredstava u portalu.')
  const [dueDate, setDueDate] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [externalPaymentReference, setExternalPaymentReference] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (!id) return
    let ignore = false
    fetch(`/api/admin/visa-payment-orders/${id}`).then(async (response) => ({ response, result: await response.json() as State & { message?: string } })).then(({ response, result }) => {
      if (ignore) return
      if (!response.ok) { setMessage(result.message ?? 'Evidencija nije dostupna.'); return }
      setState(result)
    }).catch(() => { if (!ignore) setMessage('Veza sa serverom nije uspela.') })
    return () => { ignore = true }
  }, [id])

  async function submit(body: Record<string, unknown>) {
    if (!id) return
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/admin/visa-payment-orders/${id}`, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) { idempotencyKey.current = crypto.randomUUID(); window.setTimeout(() => window.location.reload(), 700) }
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  function issue() {
    const amountMinor = amountInMinor(amount)
    if (!amountMinor) { setMessage('Unesite ispravan pozitivan iznos sa najviše dve decimale.'); return }
    if (!dueDate || !beneficiaryName.trim() || !bankAccount.trim() || !paymentReference.trim()) { setMessage('Popunite primaoca, račun, poziv na broj i rok.'); return }
    void submit({ action: 'ISSUE', amountMinor, bankAccount: bankAccount.trim(), beneficiaryAddress: beneficiaryAddress.trim() || undefined, beneficiaryName: beneficiaryName.trim(), candidateInstructions: candidateInstructions.trim(), currency, dueAt: new Date(`${dueDate}T23:59:59`).toISOString(), idempotencyKey: idempotencyKey.current, paymentModel: paymentModel.trim() || undefined, paymentPurpose: paymentPurpose.trim(), paymentReference: paymentReference.trim() })
  }

  const active = state?.orders.find((order) => order.status === 'ISSUED')
  const paid = state?.orders.find((order) => order.status === 'PAID')
  const available = state?.processStatus === 'ACTIVE' && state.currentStep === 'VISA' && state.acceptedEmployment

  if (!id) return null
  return (
    <section className="visa-payment-admin">
      <h3>Vizni nalog za uplatu</h3>
      <p>Podaci izdati kandidatu ostaju zaključani. Ako nešto treba ispraviti, otkažite nalog uz razlog i napravite novu verziju.</p>
      {message ? <div className="visa-payment-admin__message" role="status">{message}</div> : null}
      {!state ? <p>Učitavanje evidencije…</p> : paid ? (
        <div className="visa-payment-admin__notice"><strong>Uplata je evidentirana</strong><span>{paid.orderNumber} · {money(paid.amountMinor, paid.currency)} · {paid.paidAt ? date(paid.paidAt) : ''}</span></div>
      ) : active ? (
        <div className="visa-payment-admin__active">
          <div className="visa-payment-admin__notice"><strong>{active.orderNumber} · {money(active.amountMinor, active.currency)}</strong><span>Rok: {date(active.dueAt)}{active.overdue ? ' · ROK JE ISTEKAO' : ''}</span></div>
          <div className="visa-payment-admin__details"><span>Primalac: {active.beneficiaryName}</span><span>Račun: {active.bankAccount}</span><span>Poziv na broj: {active.paymentReference}</span></div>
          <h4>Evidentiraj uplatu</h4>
          <div className="visa-payment-admin__form">
            <label><span>Datum prijema</span><input onChange={(event) => setPaidDate(event.target.value)} type="date" value={paidDate} /></label>
            <label><span>Referenca izvoda / potvrde</span><input maxLength={160} onChange={(event) => setExternalPaymentReference(event.target.value)} value={externalPaymentReference} /></label>
            <label className="visa-payment-admin__wide"><span>Napomena</span><textarea maxLength={1_000} onChange={(event) => setPaymentNote(event.target.value)} rows={2} value={paymentNote} /></label>
            <button className="btn btn--style-primary" disabled={pending || !paidDate} onClick={() => void submit({ action: 'RECORD_PAYMENT', expectedStatusVersion: active.statusVersion, externalPaymentReference: externalPaymentReference.trim() || undefined, orderId: active.id, paidAt: new Date(`${paidDate}T12:00:00`).toISOString(), paymentNote: paymentNote.trim() || undefined })} type="button">Evidentiraj uplatu</button>
          </div>
          <h4>Otkazivanje naloga</h4>
          <label><span>Razlog otkazivanja</span><textarea maxLength={1_000} onChange={(event) => setCancellationReason(event.target.value)} rows={2} value={cancellationReason} /></label>
          <button className="btn btn--style-secondary" disabled={pending || cancellationReason.trim().length < 5} onClick={() => void submit({ action: 'CANCEL', expectedStatusVersion: active.statusVersion, orderId: active.id, reason: cancellationReason.trim() })} type="button">Otkaži nalog</button>
        </div>
      ) : !available ? (
        <p className="visa-payment-admin__notice">Izdavanje je dostupno tek kada aktivan proces pređe na korak „Viza“ nakon prihvatanja radne ponude.</p>
      ) : (
        <div className="visa-payment-admin__form">
          <label><span>Iznos</span><input inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="npr. 18500.00" value={amount} /></label>
          <label><span>Valuta</span><select onChange={(event) => setCurrency(event.target.value as 'RSD' | 'USD')} value={currency}><option value="RSD">RSD</option><option value="USD">USD</option></select></label>
          <label><span>Primalac</span><input maxLength={200} onChange={(event) => setBeneficiaryName(event.target.value)} value={beneficiaryName} /></label>
          <label><span>Adresa primaoca (opciono)</span><input maxLength={300} onChange={(event) => setBeneficiaryAddress(event.target.value)} value={beneficiaryAddress} /></label>
          <label><span>Račun primaoca</span><input maxLength={100} onChange={(event) => setBankAccount(event.target.value)} value={bankAccount} /></label>
          <label><span>Model (opciono)</span><input maxLength={20} onChange={(event) => setPaymentModel(event.target.value)} value={paymentModel} /></label>
          <label><span>Poziv na broj</span><input maxLength={100} onChange={(event) => setPaymentReference(event.target.value)} value={paymentReference} /></label>
          <label><span>Rok za uplatu</span><input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
          <label className="visa-payment-admin__wide"><span>Svrha uplate</span><textarea maxLength={500} onChange={(event) => setPaymentPurpose(event.target.value)} rows={2} value={paymentPurpose} /></label>
          <label className="visa-payment-admin__wide"><span>Uputstvo kandidatu</span><textarea maxLength={2_000} onChange={(event) => setCandidateInstructions(event.target.value)} rows={4} value={candidateInstructions} /></label>
          <div className="visa-payment-admin__wide"><button className="btn btn--style-primary" disabled={pending} onClick={issue} type="button">Izdaj nalog kandidatu</button></div>
        </div>
      )}
      {state && state.orders.length > 0 ? <details className="visa-payment-admin__history"><summary>Istorija naloga ({state.orders.length})</summary><ul>{state.orders.map((order) => <li key={order.id}>{order.orderNumber} · {money(order.amountMinor, order.currency)} · {order.status === 'ISSUED' ? 'čeka uplatu' : order.status === 'PAID' ? 'plaćen' : 'otkazan'}</li>)}</ul></details> : null}
    </section>
  )
}
