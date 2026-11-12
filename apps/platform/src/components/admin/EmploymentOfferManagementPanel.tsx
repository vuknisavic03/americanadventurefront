'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

import './EmploymentOfferManagementPanel.scss'

type Opening = { availablePositions?: number; employerName: string; expectedWeeklyHours: number; hourlyWageCents: number; housingProvided: boolean; id: number; jobCategory: string; jobTitle: string; openingCode: string; workCity: string; workState: string }
type Option = Opening & { status: 'AVAILABLE' | 'EMPLOYER_CONFIRMED' | 'INTERESTED' | 'NOT_INTERESTED' | 'NOT_SELECTED' | 'SELECTED' | 'WITHDRAWN'; statusVersion: number }
type Offer = { employerName: string; id: number; jobTitle: string; notificationStatus: 'DELIVERED' | 'FAILED' | 'PENDING'; offerVersion: number; status: 'ACCEPTED' | 'PUBLISHED' | 'WITHDRAWN'; statusVersion: number }
type State = { campaignCode: string; currentStep: string; offers: Offer[]; openings: Opening[]; options: Option[]; processStatus: string }

const categoryLabels: Record<string, string> = { FOOD_SERVICE: 'Hrana i piće', HOSPITALITY: 'Ugostiteljstvo', HOUSEKEEPING: 'Održavanje i domaćinstvo', LIFEGUARD: 'Spasilac', OTHER: 'Ostalo', RECREATION: 'Zabavni park i rekreacija', RETAIL: 'Prodaja' }
const optionStatusLabels: Record<Option['status'], string> = { AVAILABLE: 'Čeka odluku kandidata', EMPLOYER_CONFIRMED: 'Potvrđeno kod poslodavca', INTERESTED: 'Kandidat je zainteresovan', NOT_INTERESTED: 'Kandidat trenutno nije zainteresovan', NOT_SELECTED: 'Nije izabrano', SELECTED: 'Izabrani posao', WITHDRAWN: 'Povučeno' }
const notificationLabels: Record<Offer['notificationStatus'], string> = { DELIVERED: 'poslato', FAILED: 'slanje nije uspelo', PENDING: 'čeka slanje' }
function money(cents: number) { return new Intl.NumberFormat('sr-Latn-RS', { currency: 'USD', style: 'currency' }).format(cents / 100) }

export function EmploymentOfferManagementPanel() {
  const { id } = useDocumentInfo()
  const [state, setState] = useState<State>()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [withdrawalReason, setWithdrawalReason] = useState('')

  useEffect(() => {
    if (!id) return
    let ignore = false
    fetch(`/api/admin/employment-offers/${id}`).then(async (response) => ({ response, result: await response.json() as State & { message?: string } })).then(({ response, result }) => {
      if (ignore) return
      if (!response.ok) { setMessage(result.message ?? 'Evidencija nije dostupna.'); return }
      setState(result)
    }).catch(() => { if (!ignore) setMessage('Veza sa serverom nije uspela.') })
    return () => { ignore = true }
  }, [id])

  const filtered = useMemo(() => state?.openings.filter((opening) => {
    const haystack = `${opening.employerName} ${opening.jobTitle} ${opening.workCity} ${opening.workState} ${opening.openingCode}`.toLocaleLowerCase('sr')
    return (category === 'ALL' || opening.jobCategory === category) && haystack.includes(search.trim().toLocaleLowerCase('sr'))
  }) ?? [], [category, search, state?.openings])
  const activeOffer = state?.offers.find((offer) => offer.status === 'PUBLISHED')
  const acceptedOffer = state?.offers.find((offer) => offer.status === 'ACCEPTED')
  const available = state?.processStatus === 'ACTIVE' && state.currentStep === 'JOB_PLACEMENT'

  async function submit(body: Record<string, unknown>) {
    if (!id) return
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/admin/employment-offers/${id}`, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) window.setTimeout(() => window.location.reload(), 700)
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }

  if (!id) return null
  return (
    <section className="employment-offer-admin">
      <div className="employment-offer-admin__heading"><div><h3>Katalog i opcije poslova kandidata</h3><p>Izaberite više poslova iz aktuelne kampanje. Zvanična ponuda nastaje tek kada kandidat pokaže interesovanje i poslodavac potvrdi mesto.</p></div><a className="btn btn--style-secondary" href="/admin/collections/job-openings" target="_blank" rel="noreferrer">Otvori katalog poslova</a></div>
      {message ? <div className="employment-offer-admin__message" role="status">{message}</div> : null}
      {!state ? <p>Učitavanje evidencije…</p> : acceptedOffer ? <p className="employment-offer-admin__notice">Kandidat je prihvatio ponudu za {acceptedOffer.jobTitle} kod {acceptedOffer.employerName}. Proces je prešao na viziranje.</p> : !available ? <p className="employment-offer-admin__notice">Izbor poslova dostupan je samo u aktivnom koraku „Posao i intervju“.</p> : (
        <>
          {activeOffer ? <div className="employment-offer-admin__active"><strong>Potvrđena ponuda v{activeOffer.offerVersion}: {activeOffer.jobTitle} — {activeOffer.employerName}</strong><span>Obaveštenje: {notificationLabels[activeOffer.notificationStatus]}</span><label><span>Razlog povlačenja</span><textarea onChange={(event) => setWithdrawalReason(event.target.value)} rows={2} value={withdrawalReason} /></label><button className="btn btn--style-secondary" disabled={pending || withdrawalReason.trim().length < 5} onClick={() => void submit({ action: 'WITHDRAW_OFFER', employmentOfferId: activeOffer.id, expectedStatusVersion: activeOffer.statusVersion, reason: withdrawalReason.trim() })} type="button">Povuci potvrđenu ponudu</button></div> : null}

          {!activeOffer ? <div className="employment-offer-admin__catalog">
            <h4>Otvoreni poslovi za kampanju {state.campaignCode}</h4>
            <div className="employment-offer-admin__filters"><input aria-label="Pretraži katalog" onChange={(event) => setSearch(event.target.value)} placeholder="Poslodavac, grad, pozicija…" value={search} /><select aria-label="Vrsta posla" onChange={(event) => setCategory(event.target.value)} value={category}><option value="ALL">Sve vrste poslova</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            {filtered.length ? <div className="employment-offer-admin__opening-list">{filtered.map((opening) => <label className="employment-offer-admin__opening" key={opening.id}><input checked={selected.includes(opening.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, opening.id] : current.filter((id) => id !== opening.id))} type="checkbox" /><span><strong>{opening.jobTitle} — {opening.employerName}</strong><small>{opening.workCity}, {opening.workState} · {categoryLabels[opening.jobCategory] ?? opening.jobCategory} · {money(opening.hourlyWageCents)}/h · {opening.expectedWeeklyHours} h/ned. · {opening.housingProvided ? 'smeštaj obezbeđen' : 'bez smeštaja'}</small></span></label>)}</div> : <p>Nema novih otvorenih poslova koji odgovaraju ovoj kampanji. Dodajte ih u katalog ili promenite filter.</p>}
            <button className="btn btn--style-primary" disabled={pending || selected.length === 0} onClick={() => void submit({ action: 'SEND_SHORTLIST', jobOpeningIds: selected })} type="button">Pošalji izabrane opcije kandidatu ({selected.length})</button>
          </div> : null}

          {state.options.length ? <div className="employment-offer-admin__history"><h4>Dodeljene opcije i istorija</h4>{state.options.map((option) => <article key={option.id}><div><strong>{option.jobTitle} — {option.employerName}</strong><span>{option.workCity}, {option.workState} · {categoryLabels[option.jobCategory] ?? option.jobCategory} · {money(option.hourlyWageCents)}/h · {optionStatusLabels[option.status]}</span></div>{!activeOffer && option.status === 'INTERESTED' ? <button className="btn btn--style-primary" disabled={pending} onClick={() => void submit({ action: 'CONFIRM_OPTION', candidateJobOptionId: option.id, expectedStatusVersion: option.statusVersion })} type="button">Potvrdi posao i pošalji zvaničnu ponudu</button> : null}{!activeOffer && ['AVAILABLE', 'INTERESTED', 'NOT_INTERESTED'].includes(option.status) ? <button className="btn btn--style-secondary" disabled={pending || withdrawalReason.trim().length < 5} onClick={() => void submit({ action: 'WITHDRAW_OPTION', candidateJobOptionId: option.id, expectedStatusVersion: option.statusVersion, reason: withdrawalReason.trim() })} type="button">Povuci opciju</button> : null}</article>)}{!activeOffer && state.options.some((option) => ['AVAILABLE', 'INTERESTED', 'NOT_INTERESTED'].includes(option.status)) ? <label><span>Razlog povlačenja opcije</span><textarea onChange={(event) => setWithdrawalReason(event.target.value)} rows={2} value={withdrawalReason} /></label> : null}</div> : null}
        </>
      )}
    </section>
  )
}
