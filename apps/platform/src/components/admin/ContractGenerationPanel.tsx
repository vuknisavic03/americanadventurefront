'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

import './ContractGenerationPanel.scss'

export function ContractGenerationPanel() {
  const { id } = useDocumentInfo()
  const [contractId, setContractId] = useState<number>()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function generate() {
    if (!id) return
    setPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/contracts/generate', {
        body: JSON.stringify({ sensitiveProfileId: Number(id) }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { contractId?: number; message?: string }
      setContractId(result.contractId)
      setMessage(result.message ?? 'Zahtev nije obrađen.')
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  if (!id) return null
  return (
    <section className="contract-generation-panel">
      <h3>Generisanje ugovora</h3>
      <p>Ugovor se pravi samo iz verifikovanih podataka, prihvaćene ponude i aktivnog šablona. Generisana verzija ostaje nepromenljiva.</p>
      {message ? <div className="contract-generation-panel__message" role="status">{message}</div> : null}
      <div className="contract-generation-panel__actions">
        <button className="btn btn--style-primary" disabled={pending} onClick={generate} type="button">
          {pending ? 'Generisanje…' : 'Generiši ugovor'}
        </button>
        {contractId ? <a className="btn btn--style-secondary" href={`/admin/collections/generated-contracts/${contractId}`}>Otvori zapis ugovora</a> : null}
      </div>
    </section>
  )
}

