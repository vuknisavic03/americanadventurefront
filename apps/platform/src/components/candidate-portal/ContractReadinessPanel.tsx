'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type ReadinessView = {
  document?: { fileName: string; id: number; status: 'REJECTED' | 'UPLOADED' | 'VERIFIED' }
  personalIdStatus: 'MISSING' | 'VALIDATED'
  readinessStatus: 'INCOMPLETE' | 'READY' | 'UNDER_REVIEW'
}

const documentLabels = {
  REJECTED: 'Potrebna je zamena dokumenta',
  UPLOADED: 'Čeka proveru administratora',
  VERIFIED: 'Pasoš je verifikovan',
} as const

export function ContractReadinessPanel({ state }: { state: ReadinessView }) {
  const router = useRouter()
  const [personalId, setPersonalId] = useState('')
  const [personalIdMessage, setPersonalIdMessage] = useState('')
  const [documentMessage, setDocumentMessage] = useState('')
  const [savingPersonalId, setSavingPersonalId] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function savePersonalId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingPersonalId(true)
    setPersonalIdMessage('')
    try {
      const response = await fetch('/api/candidate/contract-readiness/personal-id', {
        body: JSON.stringify({ personalId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
      const result = await response.json() as { message?: string }
      setPersonalIdMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) { setPersonalId(''); router.refresh() }
    } catch { setPersonalIdMessage('Veza sa serverom nije uspela. Pokušajte ponovo.') }
    finally { setSavingPersonalId(false) }
  }

  async function uploadPassport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setUploading(true)
    setDocumentMessage('')
    try {
      const response = await fetch('/api/candidate/contract-readiness/passport', { body: form, method: 'POST' })
      const result = await response.json() as {
        message?: string
        ocr?: { success?: boolean; extracted?: { documentNumber?: string; expirationDate?: string } }
      }
      if (result.ocr?.success && result.ocr.extracted?.documentNumber) {
        setDocumentMessage(`✓ Pasoš je očitan (Broj: ${result.ocr.extracted.documentNumber}, Važi do: ${result.ocr.extracted.expirationDate || '—'}). ${result.message ?? ''}`)
      } else {
        setDocumentMessage(result.message ?? 'Zahtev nije obrađen.')
      }
      if (response.ok) { formElement.reset(); router.refresh() }
    } catch { setDocumentMessage('Veza sa serverom nije uspela. Pokušajte ponovo.') }
    finally { setUploading(false) }
  }

  return (
    <section className="contract-readiness" aria-labelledby="contract-readiness-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Priprema dokumentacije</p><h2 id="contract-readiness-heading">Podaci potrebni za ugovor</h2></div>
        <p>Osetljivi podaci su šifrovani, a svako preuzimanje dokumenta ostaje zabeleženo.</p>
      </div>
      <div className={`readiness-banner readiness-banner--${state.readinessStatus.toLowerCase()}`}>
        <strong>{state.readinessStatus === 'READY' ? 'Dokumentacija je spremna' : state.readinessStatus === 'UNDER_REVIEW' ? 'Dokumentacija je na proveri' : 'Dopunite dokumentaciju'}</strong>
        <span>{state.readinessStatus === 'READY' ? 'Agencija može da pripremi ugovor iz verifikovanih podataka.' : 'Za pripremu ugovora potreban je validan JMBG i verifikovan pasoš.'}</span>
      </div>
      <div className="readiness-grid">
        <article className="readiness-item">
          <span className="readiness-step">1</span>
          <h3>JMBG</h3>
          {state.personalIdStatus === 'VALIDATED' ? (
            <><p className="readiness-ok">JMBG je validiran</p><small>Nijedna cifra se ne prikazuje u portalu ili administraciji.</small></>
          ) : (
            <form onSubmit={savePersonalId}>
              <label><span>Unesite 13 cifara</span><input autoComplete="off" inputMode="numeric" maxLength={13} name="personalId" onChange={(event) => setPersonalId(event.target.value)} required type="password" value={personalId} /></label>
              {personalIdMessage ? <div className="form-alert" role="status">{personalIdMessage}</div> : null}
              <button className="secondary-button" disabled={savingPersonalId} type="submit">{savingPersonalId ? 'Provera…' : 'Validiraj i sačuvaj'}</button>
            </form>
          )}
        </article>
        <article className="readiness-item">
          <span className="readiness-step">2</span>
          <h3>Fotografija ili sken pasoša</h3>
          {state.document ? (
            <div className="document-state">
              <strong>{documentLabels[state.document.status]}</strong>
              <span>{state.document.fileName}</span>
              <a href={`/api/private-documents/${state.document.id}/download`}>Preuzmi svoj dokument</a>
            </div>
          ) : null}
          {state.document?.status !== 'VERIFIED' ? (
            <form onSubmit={uploadPassport}>
              <label><span>{state.document ? 'Postavite ispravan novi dokument' : 'Izaberite dokument'}</span><input accept="application/pdf,image/jpeg,image/png" name="passport" required type="file" /></label>
              <small>PDF, JPEG ili PNG, najviše 5 MB.</small>
              {documentMessage ? <div className="form-alert" role="status">{documentMessage}</div> : null}
              <button className="secondary-button" disabled={uploading} type="submit">{uploading ? 'Bezbedno postavljanje…' : 'Postavi pasoš'}</button>
            </form>
          ) : null}
        </article>
      </div>
    </section>
  )
}

