'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { questionnaireFields, questionnaireSections, type Answers, type QuestionnaireView } from '@/modules/visa-questionnaires/schema.ts'

const labels = { DRAFT: 'Nacrt', SUBMITTED: 'Predato agenciji', CHANGES_REQUESTED: 'Potrebna dopuna', REVIEWED: 'Pregled završen' }

export function VisaQuestionnairePanel({ processId }: { processId?: number | string }) {
  const admin = processId !== undefined
  const endpoint = admin ? `/api/admin/visa-questionnaires/${processId}` : '/api/candidate/visa-questionnaire'
  const [state, setState] = useState<QuestionnaireView | null>()
  const [answers, setAnswers] = useState<Answers>({})
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [reviewAllowed, setReviewAllowed] = useState(false)
  const busy = useRef(false)
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { cache: 'no-store', signal })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message ?? 'Upitnik nije dostupan.')
    setState(result.questionnaire)
    setAnswers(result.questionnaire?.answers ?? {})
    setReviewAllowed(result.reviewAllowed ?? false)
  }, [endpoint])
  useEffect(() => {
    const controller = new AbortController()
    fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.message ?? 'Upitnik nije dostupan.')
      if (!controller.signal.aborted) {
        setState(result.questionnaire)
        setAnswers(result.questionnaire?.answers ?? {})
        setReviewAllowed(result.reviewAllowed ?? false)
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) { setMessage(error instanceof Error ? error.message : 'Veza sa serverom nije uspela.'); setState(null) }
    })
    return () => controller.abort()
  }, [endpoint])

  async function submit(action: 'SAVE_DRAFT' | 'SUBMIT' | 'REQUEST_CHANGES' | 'APPROVE') {
    if (busy.current || !state) return
    busy.current = true
    setPending(true); setMessage(''); setErrors({})
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, expectedRevision: state.revision, ...(admin ? { note } : { answers }) }) })
      const result = await response.json()
      if (!response.ok) { setMessage(result.message); setErrors(result.fieldErrors ?? {}); return }
      setMessage(result.message)
      try { await load() } catch { setMessage(`${result.message} Osvežite stranicu da biste videli novo stanje.`) }
    } catch { setMessage('Veza sa serverom nije uspela. Proverite stanje pre ponovnog slanja.') }
    finally { busy.current = false; setPending(false) }
  }

  return <section className="visa-questionnaire" aria-label="Vizni upitnik">
    <h2>Vizni upitnik</h2>
    <p>Zvanični upitnik za izradu DS-160 vize (J-1). Molimo Vas da pažljivo proverite sve unete podatke pre predaje agenciji.</p>
    {message && <p role="status">{message}</p>}
    {state === undefined ? <p>Učitavanje upitnika…</p> : state === null ? <p>{admin ? 'Kandidat još nije sačuvao upitnik ili pregled nije dostupan.' : 'Upitnik će biti dostupan nakon potvrđene vizne uplate.'}</p> : <>
      <p><strong>{labels[state.status]}</strong> · Verzija obrasca {state.schemaVersion} · Revizija {state.revision}</p>
      {state.feedback && <div className="visa-questionnaire__feedback"><strong>Napomena agencije</strong><p>{state.feedback}</p></div>}
      <div className="visa-questionnaire__fields">
        {questionnaireSections.map((sec) => {
          const sectionFields = questionnaireFields.filter((f) => f.section === sec.id)
          if (sectionFields.length === 0) return null
          return (
            <fieldset key={sec.id} className="visa-questionnaire__section" style={{ gridColumn: '1 / -1', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '8px 0' }}>
              <legend style={{ fontWeight: 600, padding: '0 8px', color: '#1e293b' }}>{sec.title}</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
                {sectionFields.map((field) => (
                  <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>{field.label}{field.required ? ' *' : ''}</span>
                    <textarea
                      aria-invalid={Boolean(errors[field.key])}
                      aria-describedby={errors[field.key] ? `visa-error-${field.key}` : undefined}
                      disabled={pending || admin || !state.editable}
                      maxLength={field.maxLength}
                      onChange={(event) => setAnswers({ ...answers, [field.key]: event.target.value })}
                      rows={field.maxLength > 300 ? 3 : 2}
                      value={answers[field.key] ?? ''}
                    />
                    {errors[field.key] && <span id={`visa-error-${field.key}`} role="alert" style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errors[field.key]}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        })}
      </div>
      {!admin && state.editable && <div className="visa-questionnaire__actions">
        <button type="button" disabled={pending} onClick={() => void submit('SAVE_DRAFT')}>Sačuvaj nacrt upitnika</button>
        <button type="button" disabled={pending} onClick={() => void submit('SUBMIT')}>Predaj vizni upitnik</button>
        <p>Predajom potvrđujete da ste proverili podatke. Nakon predaje izmene su moguće kada agencija zatraži dopunu.</p>
      </div>}
      {admin && reviewAllowed && state.status === 'SUBMITTED' && <div className="visa-questionnaire__actions">
        <label><span>Napomena kandidatu (obavezna za dopunu)</span><textarea maxLength={2000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} disabled={pending} /></label>
        <button type="button" disabled={pending || note.trim().length < 5} onClick={() => void submit('REQUEST_CHANGES')}>Vrati na dopunu</button>
        <button type="button" disabled={pending} onClick={() => void submit('APPROVE')}>Završi pregled upitnika</button>
        <p>Završen pregled označava proveru podataka u agenciji i ne predstavlja odobrenje vize.</p>
      </div>}
      {state.history.length > 0 && <details><summary>Istorija predaje i pregleda</summary><ol>{state.history.map((entry) => <li key={entry.revision}>
        {entry.action === 'SUBMIT' ? 'Upitnik predat' : entry.action === 'APPROVE' ? 'Pregled završen' : 'Zatražena dopuna'} · {new Date(entry.at).toLocaleString('sr-Latn-RS')} · revizija {entry.revision}
        {entry.note && <p>{entry.note}</p>}
        {entry.answers && <details><summary>Predati odgovori</summary><dl>{questionnaireFields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{entry.answers?.[field.key] || '—'}</dd></div>)}</dl></details>}
      </li>)}</ol></details>}
    </>}
  </section>
}
