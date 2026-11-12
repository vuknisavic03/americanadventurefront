'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import './FlightTicketPaymentOrderManagementPanel.scss'

const EXCHANGE_RATE_SCALE = 1_000_000
function rateToScaled(value: string) {
  if (!/^\d+(?:[.,]\d{1,6})?$/.test(value.trim())) throw new Error('Kurs mora biti pozitivan broj sa najviše šest decimala.')
  const scaled = Math.round(Number(value.replace(',', '.')) * EXCHANGE_RATE_SCALE)
  if (!Number.isSafeInteger(scaled) || scaled < 1) throw new Error('Kurs nije ispravan.')
  return scaled
}

type Order = { airlineName: string; dueAt: string; exchangeRateScaled: number; id: number; orderNumber: string; originalAmountMinor: number; originalCurrency: 'EUR' | 'RSD' | 'USD'; overdue: boolean; paidAt?: string; settlementAmountMinor: number; status: 'CANCELLED' | 'ISSUED' | 'PAID'; statusVersion: number }
type Selection = { airlineName: string; currency: 'EUR' | 'RSD' | 'USD'; offerVersion: number; optionCode: string; outboundRoute: string; totalPriceMinor: number }
type State = { acceptedSelection?: Selection; currentStep: string; orders: Order[]; processStatus: string }
const money = (minor: number, currency: string) => new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(minor / 100)
const date = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium' }).format(new Date(value))

export function FlightTicketPaymentOrderManagementPanel() {
  const { id } = useDocumentInfo()
  const idempotencyKey = useRef(crypto.randomUUID())
  const [state, setState] = useState<State>()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [rate, setRate] = useState('')
  const [rateDate, setRateDate] = useState('')
  const [rateSource, setRateSource] = useState('Srednji kurs NBS')
  const [rateReference, setRateReference] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('American Adventure')
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [paymentModel, setPaymentModel] = useState('97')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentPurpose, setPaymentPurpose] = useState('Uplata prihvaćene avionske karte')
  const [instructions, setInstructions] = useState('Preuzmite nalog u PDF formatu i izvršite uplatu do naznačenog roka. Sačuvajte potvrdu o uplati.')
  const [dueDate, setDueDate] = useState('')
  const [includeAdvanceInvoice, setIncludeAdvanceInvoice] = useState(false)
  const [advanceInvoiceNumber, setAdvanceInvoiceNumber] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [externalReference, setExternalReference] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (!id) return
    let ignore = false
    fetch(`/api/admin/flight-ticket-payment-orders/${id}`).then(async (response) => ({ response, result: await response.json() as State & { message?: string } })).then(({ response, result }) => {
      if (ignore) return
      if (!response.ok) setMessage(result.message ?? 'Evidencija nije dostupna.'); else setState(result)
    }).catch(() => { if (!ignore) setMessage('Veza sa serverom nije uspela.') })
    return () => { ignore = true }
  }, [id])

  async function submit(body: Record<string, unknown>) {
    if (!id) return
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/admin/flight-ticket-payment-orders/${id}`, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? (response.ok ? 'Promena je sačuvana.' : 'Zahtev nije obrađen.'))
      if (response.ok) { idempotencyKey.current = crypto.randomUUID(); window.setTimeout(() => window.location.reload(), 650) }
    } catch { setMessage('Veza sa serverom nije uspela.') } finally { setPending(false) }
  }

  function issue() {
    const selection = state?.acceptedSelection
    if (!selection) return
    let exchangeRateScaled = EXCHANGE_RATE_SCALE
    try { if (selection.currency !== 'RSD') exchangeRateScaled = rateToScaled(rate) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kurs nije ispravan.'); return }
    if (!dueDate || !rateDate || !beneficiaryName.trim() || !beneficiaryAddress.trim() || !bankAccount.trim() || !paymentReference.trim()) { setMessage('Popunite datum kursa, primaoca, adresu, račun, poziv na broj i rok.'); return }
    if (includeAdvanceInvoice && (!advanceInvoiceNumber.trim() || !taxId.trim() || !registrationNumber.trim())) { setMessage('Za avansni dokument unesite broj dokumenta, PIB i matični broj.'); return }
    void submit({ action: 'ISSUE', advanceInvoiceNumber: advanceInvoiceNumber.trim() || undefined, bankAccount: bankAccount.trim(), beneficiaryAddress: beneficiaryAddress.trim(), beneficiaryName: beneficiaryName.trim(), beneficiaryRegistrationNumber: registrationNumber.trim() || undefined, beneficiaryTaxId: taxId.trim() || undefined, candidateInstructions: instructions.trim(), dueAt: new Date(`${dueDate}T23:59:59`).toISOString(), exchangeRateDate: new Date(`${rateDate}T12:00:00`).toISOString(), exchangeRateReference: rateReference.trim() || undefined, exchangeRateScaled, exchangeRateSource: rateSource.trim(), idempotencyKey: idempotencyKey.current, includeAdvanceInvoice, paymentModel: paymentModel.trim() || undefined, paymentPurpose: paymentPurpose.trim(), paymentReference: paymentReference.trim() })
  }

  const active = state?.orders.find((order) => order.status === 'ISSUED')
  const paid = state?.orders.find((order) => order.status === 'PAID')
  const available = state?.processStatus === 'ACTIVE' && state.currentStep === 'TRAVEL_PREPARATION' && state.acceptedSelection
  const calculated = state?.acceptedSelection && state.acceptedSelection.currency !== 'RSD' && rate ? Math.round(state.acceptedSelection.totalPriceMinor * Number(rate.replace(',', '.'))) : state?.acceptedSelection?.totalPriceMinor
  if (!id) return null

  return <section aria-labelledby="flight-payment-admin-heading" className="flight-payment-admin">
    <h3 id="flight-payment-admin-heading">Nalog za uplatu avionske karte</h3>
    <p>Nalog se generiše iz prihvaćene opcije. Cena, kurs i svi podaci dokumenta ostaju zaključani; ispravka zahteva otkazivanje i novu verziju.</p>
    {message ? <div className="flight-payment-admin__message" role="status">{message}</div> : null}
    {!state ? <p>Učitavanje evidencije…</p> : paid ? <div className="flight-payment-admin__notice"><strong>Uplata je evidentirana</strong><span>{paid.orderNumber} · {money(paid.settlementAmountMinor, 'RSD')} · {paid.paidAt ? date(paid.paidAt) : ''}</span><a href={`/api/flight-ticket-payment-orders/${paid.id}/download`}>Preuzmi PDF</a></div> : active ? <div>
      <div className="flight-payment-admin__notice"><strong>{active.orderNumber} · {money(active.settlementAmountMinor, 'RSD')}</strong><span>Rok: {date(active.dueAt)}{active.overdue ? ' · ROK JE ISTEKAO' : ''}</span><a href={`/api/flight-ticket-payment-orders/${active.id}/download`}>Preuzmi PDF</a></div>
      <h4>Evidentiraj uplatu</h4><div className="flight-payment-admin__grid"><label><span>Datum prijema</span><input onChange={(event) => setPaidDate(event.target.value)} type="date" value={paidDate} /></label><label><span>Referenca izvoda</span><input onChange={(event) => setExternalReference(event.target.value)} value={externalReference} /></label><label className="wide"><span>Napomena</span><textarea onChange={(event) => setPaymentNote(event.target.value)} value={paymentNote} /></label><button className="btn btn--style-primary" disabled={pending || !paidDate} onClick={() => void submit({ action: 'RECORD_PAYMENT', expectedStatusVersion: active.statusVersion, externalPaymentReference: externalReference.trim() || undefined, orderId: active.id, paidAt: new Date(`${paidDate}T12:00:00`).toISOString(), paymentNote: paymentNote.trim() || undefined })} type="button">Evidentiraj uplatu</button></div>
      <h4>Otkazivanje</h4><label><span>Razlog</span><textarea onChange={(event) => setCancellationReason(event.target.value)} value={cancellationReason} /></label><button className="btn btn--style-secondary" disabled={pending || cancellationReason.trim().length < 5} onClick={() => void submit({ action: 'CANCEL', expectedStatusVersion: active.statusVersion, orderId: active.id, reason: cancellationReason.trim() })} type="button">Otkaži nalog</button>
    </div> : !available ? <p className="flight-payment-admin__notice">Izdavanje je dostupno kada kandidat prihvati jednu opciju avionske karte.</p> : <div className="flight-payment-admin__grid">
      <div className="flight-payment-admin__selection wide"><strong>Prihvaćeno: {state.acceptedSelection?.airlineName} · {state.acceptedSelection?.outboundRoute}</strong><span>{money(state.acceptedSelection!.totalPriceMinor, state.acceptedSelection!.currency)} · {state.acceptedSelection?.optionCode}</span></div>
      {state.acceptedSelection?.currency !== 'RSD' ? <><label><span>Srednji kurs NBS (RSD za 1 {state.acceptedSelection?.currency})</span><input inputMode="decimal" onChange={(event) => setRate(event.target.value)} placeholder="npr. 117,1523" value={rate} /></label><label><span>Obračunati iznos</span><input disabled value={calculated ? money(calculated, 'RSD') : ''} /></label></> : null}
      <label><span>Datum kursa</span><input max={new Date().toISOString().slice(0, 10)} onChange={(event) => setRateDate(event.target.value)} type="date" value={rateDate} /></label><label><span>Izvor kursa</span><input disabled={state.acceptedSelection?.currency === 'RSD'} onChange={(event) => setRateSource(event.target.value)} value={state.acceptedSelection?.currency === 'RSD' ? 'Nije primenljivo - izvorna cena je u RSD' : rateSource} /></label>
      <label className="wide"><span>Referenca kursa (link ili broj liste)</span><input onChange={(event) => setRateReference(event.target.value)} value={rateReference} /></label>
      <label><span>Primalac</span><input onChange={(event) => setBeneficiaryName(event.target.value)} value={beneficiaryName} /></label><label><span>Adresa primaoca</span><input onChange={(event) => setBeneficiaryAddress(event.target.value)} value={beneficiaryAddress} /></label><label><span>Račun primaoca</span><input onChange={(event) => setBankAccount(event.target.value)} value={bankAccount} /></label><label><span>Model</span><input onChange={(event) => setPaymentModel(event.target.value)} value={paymentModel} /></label><label><span>Poziv na broj</span><input onChange={(event) => setPaymentReference(event.target.value)} value={paymentReference} /></label><label><span>Rok za uplatu</span><input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
      <label className="wide"><span>Svrha uplate</span><textarea onChange={(event) => setPaymentPurpose(event.target.value)} value={paymentPurpose} /></label><label className="wide"><span>Uputstvo kandidatu</span><textarea onChange={(event) => setInstructions(event.target.value)} value={instructions} /></label>
      <label className="wide flight-payment-admin__check"><input checked={includeAdvanceInvoice} onChange={(event) => setIncludeAdvanceInvoice(event.target.checked)} type="checkbox" /><span>Uključi prateći avansni obračun u PDF</span></label>
      {includeAdvanceInvoice ? <><label><span>Broj avansnog dokumenta</span><input onChange={(event) => setAdvanceInvoiceNumber(event.target.value)} value={advanceInvoiceNumber} /></label><label><span>PIB izdavaoca</span><input onChange={(event) => setTaxId(event.target.value)} value={taxId} /></label><label><span>Matični broj izdavaoca</span><input onChange={(event) => setRegistrationNumber(event.target.value)} value={registrationNumber} /></label></> : null}
      <div className="wide"><button className="btn btn--style-primary" disabled={pending} onClick={issue} type="button">Generiši i izdaj nalog</button></div>
    </div>}
    {state?.orders.length ? <details><summary>Istorija naloga ({state.orders.length})</summary><ul>{state.orders.map((order) => <li key={order.id}>{order.orderNumber} · {money(order.settlementAmountMinor, 'RSD')} · {order.status}</li>)}</ul></details> : null}
  </section>
}
