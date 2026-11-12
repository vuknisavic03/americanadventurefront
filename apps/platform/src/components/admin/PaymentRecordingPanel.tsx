'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useRef, useState } from 'react'

import './PaymentPanel.scss'

function amountInCents(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return undefined
  const amount = Number(value.replace(',', '.'))
  const cents = Math.round(amount * 100)
  return Number.isSafeInteger(cents) && cents > 0 ? cents : undefined
}

function rateToScaled(value: string) {
  if (!value.trim()) return undefined
  if (!/^\d+(?:[.,]\d{1,6})?$/.test(value.trim())) return undefined
  const scaled = Math.round(Number(value.replace(',', '.')) * 1_000_000)
  return Number.isSafeInteger(scaled) && scaled > 0 ? scaled : undefined
}

export function PaymentRecordingPanel() {
  const { id } = useDocumentInfo()
  const idempotencyKey = useRef(crypto.randomUUID())
  const [amount, setAmount] = useState('')
  const [buyerTaxId, setBuyerTaxId] = useState('')
  const [exchangeRate, setExchangeRate] = useState('108.500000')
  const [externalReference, setExternalReference] = useState('')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [receivedDate, setReceivedDate] = useState('')

  async function record() {
    if (!id) return
    const cents = amountInCents(amount)
    if (!cents) { setMessage('Unesite ispravan pozitivan iznos sa najviše dve decimale.'); return }
    if (!receivedDate) { setMessage('Izaberite datum prijema.'); return }
    const receivedAt = new Date(`${receivedDate}T12:00:00`)
    if (Number.isNaN(receivedAt.getTime())) { setMessage('Izaberite ispravan datum prijema.'); return }

    const scaledRate = rateToScaled(exchangeRate)

    setPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/payments/record', {
        body: JSON.stringify({
          amountCents: cents,
          buyerTaxId: buyerTaxId.trim() || undefined,
          exchangeRateDate: receivedAt.toISOString(),
          exchangeRateScaled: scaledRate,
          externalReference: externalReference.trim() || undefined,
          idempotencyKey: idempotencyKey.current,
          note: note.trim() || undefined,
          paymentPlanId: Number(id),
          receivedAt: receivedAt.toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { invoiceNumber?: string; message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) {
        idempotencyKey.current = crypto.randomUUID()
        setAmount('')
        setExternalReference('')
        setBuyerTaxId('')
        setNote('')
        window.setTimeout(() => window.location.reload(), 1000)
      }
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  if (!id) return null
  return (
    <section className="payment-panel">
      <h3>Evidentiraj primljenu uplatu i izdaj fakturu</h3>
      <p>Unos stvara novi nepromenljivi finansijski zapis, automatski generiše zvanični PDF račun (fakturu) po kursu NBS i ažurira KIR knjigu izdatih računa.</p>
      {message ? <div className="payment-panel__message" role="status">{message}</div> : null}
      <div className="payment-panel__form">
        <label><span>Iznos (USD)</span><input inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="npr. 350.00" required value={amount} /></label>
        <label><span>Datum prijema</span><input onChange={(event) => setReceivedDate(event.target.value)} required type="date" value={receivedDate} /></label>
        <label><span>Srednji kurs NBS (RSD/USD)</span><input inputMode="decimal" onChange={(event) => setExchangeRate(event.target.value)} placeholder="108.500000" value={exchangeRate} /></label>
        <label><span>JMBG / PIB kandidata</span><input maxLength={20} onChange={(event) => setBuyerTaxId(event.target.value)} placeholder="Opciono (preuzima se iz profila)" value={buyerTaxId} /></label>
        <label><span>Poziv na broj / izvod</span><input maxLength={160} onChange={(event) => setExternalReference(event.target.value)} value={externalReference} /></label>
        <label className="payment-panel__wide"><span>Interna napomena / opis</span><textarea maxLength={1_000} onChange={(event) => setNote(event.target.value)} rows={3} value={note} /></label>
        <div className="payment-panel__wide"><button className="btn btn--style-primary" disabled={pending} onClick={record} type="button">{pending ? 'Obrada i generisanje fakture…' : 'Evidentiraj uplatu i izdaj fakturu'}</button></div>
      </div>
    </section>
  )
}
