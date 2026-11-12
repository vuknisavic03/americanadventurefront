'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState, useSyncExternalStore } from 'react'

import './PrivateDocumentReviewPanel.scss'

const subscribe = () => () => {}
const clientReady = () => true
const serverReady = () => false

type OcrState = {
  success?: boolean
  status?: string
  confidence?: number
  extracted?: {
    documentNumber?: string | null
    firstName?: string | null
    lastName?: string | null
    birthDate?: string | null
    expirationDate?: string | null
    nationality?: string | null
    personalNumber?: string | null
    mrzFormat?: string | null
    mrzValid?: boolean
  }
  match?: {
    overallMatch?: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'NOT_EVALUATED'
    nameMatch?: boolean | null
    birthDateMatch?: boolean | null
    jmbgMatch?: boolean | null
    isExpired?: boolean
    expiresWithinSeason?: boolean
    notes?: string[]
  }
}

export function PrivateDocumentReviewPanel() {
  const { id } = useDocumentInfo()
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [ocrRunning, setOcrRunning] = useState(false)
  const [ocrState, setOcrState] = useState<OcrState | null>(null)

  async function review(action: 'REJECT' | 'VERIFY') {
    if (!id || !ready || pending) return
    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/private-documents/${id}/review`, {
        body: JSON.stringify({ action, rejectionReason: reason || undefined }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) window.location.reload()
    } catch {
      setMessage('Veza sa serverom nije uspela.')
    } finally {
      setPending(false)
    }
  }

  async function triggerOcr() {
    if (!id || !ready || ocrRunning) return
    setOcrRunning(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/private-documents/${id}/ocr`, {
        method: 'POST',
      })
      const result = await response.json() as { message?: string; ocr?: OcrState }
      setMessage(result.message ?? 'OCR obrada je završena.')
      if (result.ocr) {
        setOcrState(result.ocr)
      }
    } catch {
      setMessage('Pokretanje OCR analize nije uspelo.')
    } finally {
      setOcrRunning(false)
    }
  }

  if (!id) return null

  return (
    <section className="private-document-review">
      <h3>Kontrolisana provera dokumenta</h3>
      <p>Preuzimanje, OCR očitavanje i svaka administrativna odluka se automatski evidentiraju u reviziji.</p>

      <div className="private-document-review__toolbar">
        <a className="btn btn--style-secondary" href={`/api/private-documents/${id}/download`}>
          Preuzmi dokument za proveru
        </a>
        <button
          className="btn btn--style-secondary"
          disabled={!ready || pending || ocrRunning}
          onClick={triggerOcr}
          type="button"
        >
          {ocrRunning ? 'OCR očitavanje u toku…' : '🔍 Pokreni OCR analizu pasoša'}
        </button>
      </div>

      {ocrState?.extracted ? (
        <div className="private-document-ocr-card">
          <h4>Očitani podaci iz pasoša (OCR & MRZ)</h4>
          <div className="ocr-grid">
            <div>
              <span className="ocr-label">Broj pasoša</span>
              <strong className="ocr-value">{ocrState.extracted.documentNumber || '—'}</strong>
            </div>
            <div>
              <span className="ocr-label">Ime i prezime</span>
              <strong className="ocr-value">
                {ocrState.extracted.firstName} {ocrState.extracted.lastName}
              </strong>
            </div>
            <div>
              <span className="ocr-label">Datum rođenja</span>
              <strong className="ocr-value">{ocrState.extracted.birthDate || '—'}</strong>
            </div>
            <div>
              <span className="ocr-label">Važi do</span>
              <strong className="ocr-value">{ocrState.extracted.expirationDate || '—'}</strong>
            </div>
            <div>
              <span className="ocr-label">JMBG / Broj</span>
              <strong className="ocr-value">{ocrState.extracted.personalNumber || '—'}</strong>
            </div>
            <div>
              <span className="ocr-label">Državljanstvo</span>
              <strong className="ocr-value">{ocrState.extracted.nationality || '—'}</strong>
            </div>
          </div>

          {ocrState.match ? (
            <div className={`ocr-match-banner ocr-match-banner--${ocrState.match.overallMatch?.toLowerCase() || 'neutral'}`}>
              <strong>
                Usklađenost sa prijavom:{' '}
                {ocrState.match.overallMatch === 'MATCH'
                  ? '✓ Podaci se u potpunosti poklapaju'
                  : ocrState.match.overallMatch === 'MISMATCH'
                    ? '⚠ Uočena su neslaganja sa prijavom'
                    : 'Podaci delimično uočeni'}
              </strong>
              {ocrState.match.notes?.length ? (
                <ul className="ocr-notes">
                  {ocrState.match.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <label>
        <span>Razlog odbijanja (obavezno ako se dokument odbija)</span>
        <textarea
          disabled={!ready || pending || ocrRunning}
          maxLength={600}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          value={reason}
        />
      </label>

      {message ? (
        <div className="private-document-review__message" role="status">
          {message}
        </div>
      ) : null}

      <div className="private-document-review__actions">
        <button
          className="btn btn--style-primary"
          disabled={!ready || pending || ocrRunning}
          onClick={() => review('VERIFY')}
          type="button"
        >
          Verifikuj dokument
        </button>
        <button
          className="btn btn--style-secondary"
          disabled={!ready || pending || ocrRunning}
          onClick={() => review('REJECT')}
          type="button"
        >
          Odbij dokument
        </button>
      </div>
    </section>
  )
}
