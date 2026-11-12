'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Option = { candidateInstructions: string; employerName: string; endDate: string; expectedWeeklyHours: number; hourlyWageCents: number; housingCostCents?: number; housingDescription?: string; housingProvided: boolean; id: number; jobCategory: string; jobTitle: string; startDate: string; status: 'AVAILABLE' | 'EMPLOYER_CONFIRMED' | 'INTERESTED' | 'NOT_INTERESTED' | 'NOT_SELECTED' | 'SELECTED' | 'WITHDRAWN'; statusVersion: number; workCity: string; workState: string }
const categoryLabels: Record<string, string> = { FOOD_SERVICE: 'Hrana i piće', HOSPITALITY: 'Ugostiteljstvo', HOUSEKEEPING: 'Održavanje i domaćinstvo', LIFEGUARD: 'Spasilac', OTHER: 'Ostalo', RECREATION: 'Zabavni park i rekreacija', RETAIL: 'Prodaja' }
function date(value: string) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) }
function money(cents: number) { return new Intl.NumberFormat('sr-Latn-RS', { currency: 'USD', style: 'currency' }).format(cents / 100) }

export function CandidateJobOptionsPanel({ options }: { options: Option[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<number>()
  const [message, setMessage] = useState('')
  const active = options.filter((option) => ['AVAILABLE', 'INTERESTED', 'EMPLOYER_CONFIRMED'].includes(option.status))
  const other = options.filter((option) => !active.includes(option))

  async function preference(option: Option, action: 'INTERESTED' | 'NOT_INTERESTED' | 'RECONSIDER') {
    setPendingId(option.id); setMessage('')
    try {
      const response = await fetch(`/api/candidate/job-options/${option.id}/preference`, { body: JSON.stringify({ action, expectedStatusVersion: option.statusVersion }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) router.refresh()
    } catch { setMessage('Veza sa serverom nije uspela. Pokušajte ponovo.') }
    finally { setPendingId(undefined) }
  }

  function card(option: Option) {
    return <article className={`job-option job-option--${option.status.toLowerCase()}`} key={option.id}><div className="job-option__heading"><div><p className="eyebrow">{categoryLabels[option.jobCategory] ?? option.jobCategory}</p><h3>{option.jobTitle}</h3><strong>{option.employerName}</strong></div><span>{option.workCity}, {option.workState}</span></div><dl className="portal-details"><div><dt>Period</dt><dd>{date(option.startDate)} — {date(option.endDate)}</dd></div><div><dt>Satnica</dt><dd>{money(option.hourlyWageCents)}/h</dd></div><div><dt>Očekivani sati</dt><dd>{option.expectedWeeklyHours} nedeljno</dd></div><div><dt>Smeštaj</dt><dd>{option.housingProvided ? option.housingCostCents === undefined ? 'Obezbeđen' : `${money(option.housingCostCents)} nedeljno` : 'Nije obezbeđen'}</dd></div></dl>{option.housingDescription ? <p><strong>Smeštaj:</strong> {option.housingDescription}</p> : null}<p>{option.candidateInstructions}</p>{option.status === 'EMPLOYER_CONFIRMED' ? <div className="form-success">Poslodavac je potvrdio ovu opciju. Zvanična ponuda je prikazana ispod.</div> : option.status === 'INTERESTED' ? <div className="job-option__actions"><span className="status-chip">Zainteresovan/a sam</span><button disabled={pendingId === option.id} onClick={() => void preference(option, 'RECONSIDER')} type="button">Vrati na neodlučeno</button></div> : option.status === 'AVAILABLE' ? <div className="job-option__actions"><button className="submit-button" disabled={pendingId === option.id} onClick={() => void preference(option, 'INTERESTED')} type="button">Zainteresovan/a sam</button><button disabled={pendingId === option.id} onClick={() => void preference(option, 'NOT_INTERESTED')} type="button">Trenutno me ne interesuje</button></div> : option.status === 'NOT_INTERESTED' ? <div className="job-option__actions"><span>Trenutno nije u užem izboru.</span><button disabled={pendingId === option.id} onClick={() => void preference(option, 'RECONSIDER')} type="button">Vrati u razmatranje</button></div> : <p className="status-chip">{option.status === 'SELECTED' ? 'Izabrana opcija' : option.status === 'NOT_SELECTED' ? 'Nije izabrana' : 'Ponuda je povučena'}</p>}</article>
  }

  return <section className="profile-reference candidate-job-options" id="job-options" aria-labelledby="job-options-heading"><div className="section-heading"><div><p className="eyebrow">Posao i intervju</p><h2 id="job-options-heading">Vaše opcije poslova</h2></div><p>Uporedite uslove i označite sve poslove koji vas interesuju.</p></div><p>Ovo još nisu konačne ponude zaposlenja. Agencija proverava dostupnost sa poslodavcem nakon vašeg interesovanja.</p>{message ? <div className="form-alert" role="status">{message}</div> : null}{active.length ? <div className="job-option-grid">{active.map(card)}</div> : <p>Agencija još nije izdvojila aktivne opcije za vas.</p>}{other.length ? <details className="interview-preparation__history"><summary>Ostale i ranije opcije ({other.length})</summary><div className="job-option-grid">{other.map(card)}</div></details> : null}</section>
}
