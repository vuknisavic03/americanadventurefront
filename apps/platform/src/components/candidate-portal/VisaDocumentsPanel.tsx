'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export type VisaDocumentChecklistItem = {
  acceptedMimeTypes: readonly string[]
  description: string
  document?: { fileName: string; id: number; rejectionReason?: string; status: 'REJECTED' | 'UPLOADED' | 'VERIFIED' }
  documentType: string
  label: string
  required: true
  uploadable: boolean
}
export type VisaDocumentChecklistState = { available: boolean; checklistVersion: number; complete: boolean; editable: boolean; items: VisaDocumentChecklistItem[] }
const labels = { REJECTED: 'Potrebna je zamena', UPLOADED: 'Čeka proveru agencije', VERIFIED: 'Prihvaćeno' } as const

export function VisaDocumentsPanel({ state }: { state: VisaDocumentChecklistState }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string>()
  const accepted = state.items.filter((item) => item.document?.status === 'VERIFIED').length
  async function upload(event: FormEvent<HTMLFormElement>, documentType: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setUploading(documentType); setMessages((current) => ({ ...current, [documentType]: '' }))
    try {
      const response = await fetch(`/api/candidate/visa-documents/${documentType}`, { body: form, method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessages((current) => ({ ...current, [documentType]: result.message ?? 'Zahtev nije obrađen.' }))
      if (response.ok) router.refresh()
    } catch { setMessages((current) => ({ ...current, [documentType]: 'Veza sa serverom nije uspela. Pokušajte ponovo.' })) }
    finally { setUploading(undefined) }
  }
  return <section className="portal-subsection program-documents visa-documents" aria-labelledby="visa-documents-heading">
    <div className="section-heading"><div><p className="eyebrow">Proces viziranja</p><h2 id="visa-documents-heading">Dokumentacija za vizu</h2></div><p>{accepted} od {state.items.length} prihvaćeno</p></div>
    <p>Početna lista za pripremu J-1 Work &amp; Travel postupka, verzija {state.checklistVersion}. Agencija mora potvrditi konačan spisak prema mestu podnošenja zahteva.</p>
    {!state.available ? <div className="form-alert" role="status">Postavljanje će biti dostupno kada agencija završi pregled viznog upitnika.</div> : null}
    {state.available && !state.editable && !state.complete ? <div className="form-alert" role="status">Lista je dostupna samo za pregled jer je kandidat prešao na naredni korak procesa.</div> : null}
    {state.complete ? <div className="program-document__status program-document__status--verified"><strong>Lista je kompletna</strong><span>Svi dokumenti sa trenutne liste su prihvaćeni.</span></div> : null}
    <div className="program-documents__list">{state.items.map((item, index) => {
      const document = item.document
      const canUpload = state.editable && item.uploadable && (!document || document.status === 'REJECTED')
      return <article className="program-document" key={item.documentType}>
        <div className="program-document__heading"><span>{index + 1}</span><div><h3>{item.label}</h3><p>{item.description}</p></div></div>
        {document ? <div className={`program-document__status program-document__status--${document.status.toLowerCase()}`}><strong>{labels[document.status]}</strong><span>{document.fileName}</span>{document.rejectionReason ? <p>Napomena agencije: {document.rejectionReason}</p> : null}<a href={`/api/private-documents/${document.id}/download`}>Preuzmi dokument</a></div> : <p><strong>Nedostaje</strong></p>}
        {!item.uploadable && !document ? <p>Važeći pasoš dostavlja se kroz odeljak „Podaci potrebni za ugovor“.</p> : null}
        {canUpload ? <form onSubmit={(event) => upload(event, item.documentType)}><label><span>{document ? 'Izaberite ispravan novi fajl' : 'Izaberite fajl'}</span><input accept={item.acceptedMimeTypes.join(',')} name="document" required type="file" /></label><small>Do 5 MB. Dozvoljeni format zavisi od stavke.</small>{messages[item.documentType] ? <div className="form-alert" role="status">{messages[item.documentType]}</div> : null}<button className="secondary-button" disabled={uploading === item.documentType} type="submit">{uploading === item.documentType ? 'Bezbedno postavljanje…' : 'Postavi dokument'}</button></form> : null}
      </article>
    })}</div>
  </section>
}
