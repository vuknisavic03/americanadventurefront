'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRef, useState } from 'react'

import './PaymentPanel.scss'

export function PaymentReversalPanel() {
  const { id } = useDocumentInfo()
  const entryType = useFormFields(([fields]) => fields.entryType?.value)
  const idempotencyKey = useRef(crypto.randomUUID())
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [reason, setReason] = useState('')

  async function reverse() {
    if (!id) return
    if (reason.trim().length < 5) { setMessage('Unesite jasan razlog poništenja.'); return }
    setPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/payments/reverse', {
        body: JSON.stringify({ idempotencyKey: idempotencyKey.current, paymentId: Number(id), reason }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) {
        idempotencyKey.current = crypto.randomUUID()
        window.setTimeout(() => window.location.reload(), 700)
      }
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  if (!id || entryType !== 'PAYMENT') return null
  return (
    <section className="payment-panel payment-panel--danger">
      <h3>Poništi ovu uplatu</h3>
      <p>Originalni zapis ostaje sačuvan. Sistem dodaje suprotan zapis, ponovo obračunava saldo i po potrebi zaustavlja dalji proces kandidata.</p>
      {message ? <div className="payment-panel__message" role="status">{message}</div> : null}
      <div className="payment-panel__reversal-controls">
        <label><span>Razlog poništenja</span><textarea maxLength={1_000} onChange={(event) => setReason(event.target.value)} required rows={3} value={reason} /></label>
        <button className="btn btn--style-secondary" disabled={pending} onClick={reverse} type="button">{pending ? 'Poništavanje…' : 'Evidentiraj poništenje'}</button>
      </div>
    </section>
  )
}
