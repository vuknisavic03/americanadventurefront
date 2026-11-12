'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type ProgramDocumentItem = {
  acceptedMimeTypes: readonly string[]
  description: string
  document?: {
    fileName: string
    id: number
    rejectionReason?: string
    status: 'REJECTED' | 'UPLOADED' | 'VERIFIED'
  }
  documentType: string
  label: string
  required: true
}

const statusLabels = {
  REJECTED: 'Potrebna je zamena',
  UPLOADED: 'Čeka proveru agencije',
  VERIFIED: 'Verifikovano',
} as const

export function ProgramDocumentsPanel({ items }: { items: ProgramDocumentItem[] }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string>()
  const verifiedCount = items.filter((item) => item.document?.status === 'VERIFIED').length

  async function upload(event: FormEvent<HTMLFormElement>, documentType: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setUploading(documentType)
    setMessages((current) => ({ ...current, [documentType]: '' }))
    try {
      const response = await fetch(`/api/candidate/program-documents/${documentType}`, {
        body: form,
        method: 'POST',
      })
      const result = await response.json() as { message?: string }
      setMessages((current) => ({
        ...current,
        [documentType]: result.message ?? 'Zahtev nije obrađen.',
      }))
      if (response.ok) router.refresh()
    } catch {
      setMessages((current) => ({
        ...current,
        [documentType]: 'Veza sa serverom nije uspela. Pokušajte ponovo.',
      }))
    } finally {
      setUploading(undefined)
    }
  }

  return (
    <section className="portal-subsection program-documents" aria-labelledby="program-documents-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dokumentacija programa</p>
          <h2 id="program-documents-heading">Dokumenti za Work &amp; Travel</h2>
        </div>
        <p>{verifiedCount} od {items.length} verifikovano</p>
      </div>
      <p>
        Svaki fajl se čuva šifrovano. Postavite samo sintetičke dokumente tokom razvoja;
        fotografija pasoša pripada ranijoj, odvojenoj proveri za ugovor.
      </p>
      <div className="program-documents__list">
        {items.map((item, index) => {
          const document = item.document
          const canUpload = !document || document.status === 'REJECTED'
          return (
            <article className="program-document" key={item.documentType}>
              <div className="program-document__heading">
                <span>{index + 1}</span>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
              {document ? (
                <div className={`program-document__status program-document__status--${document.status.toLowerCase()}`}>
                  <strong>{statusLabels[document.status]}</strong>
                  <span>{document.fileName}</span>
                  {document.rejectionReason ? <p>Napomena agencije: {document.rejectionReason}</p> : null}
                  <a href={`/api/private-documents/${document.id}/download`}>Preuzmi dokument</a>
                </div>
              ) : null}
              {canUpload ? (
                <form onSubmit={(event) => upload(event, item.documentType)}>
                  <label>
                    <span>{document ? 'Izaberite ispravan novi fajl' : 'Izaberite fajl'}</span>
                    <input
                      accept={item.acceptedMimeTypes.join(',')}
                      name="document"
                      required
                      type="file"
                    />
                  </label>
                  <small>Do 5 MB. Dozvoljeni format zavisi od stavke.</small>
                  {messages[item.documentType] ? (
                    <div className="form-alert" role="status">{messages[item.documentType]}</div>
                  ) : null}
                  <button
                    className="secondary-button"
                    disabled={uploading === item.documentType}
                    type="submit"
                  >
                    {uploading === item.documentType ? 'Bezbedno postavljanje…' : 'Postavi dokument'}
                  </button>
                </form>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
