'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { VisaDocumentChecklistState } from '../candidate-portal/VisaDocumentsPanel.tsx'
import './VisaDocumentChecklistManagementPanel.scss'

const labels = { REJECTED: 'Potrebna zamena', UPLOADED: 'Čeka proveru', VERIFIED: 'Prihvaćeno' } as const

export function VisaDocumentChecklistManagementPanel() {
  const { id } = useDocumentInfo()
  const [state, setState] = useState<VisaDocumentChecklistState>()
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    fetch(`/api/admin/visa-documents/${id}`, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      const result = await response.json() as VisaDocumentChecklistState & { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Lista nije dostupna.')
      setState(result)
    }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Lista nije dostupna.') })
    return () => controller.abort()
  }, [id])
  if (!id) return null
  return <section className="visa-document-admin" aria-label="Dokumentacija za vizu"><h3>Dokumentacija za vizu</h3><p>Početna SWT lista; konačne zahteve mora potvrditi agencija prema mestu podnošenja zahteva.</p>{message ? <div className="visa-document-admin__message" role="status">{message}</div> : null}{!state ? <p>Učitavanje liste…</p> : <><p><strong>{state.complete ? 'Lista je kompletna' : `${state.items.filter((item) => item.document?.status === 'VERIFIED').length} od ${state.items.length} prihvaćeno`}</strong> · verzija {state.checklistVersion}</p>{!state.available ? <p>Postavljanje se otključava nakon završenog pregleda viznog upitnika.</p> : null}<ul>{state.items.map((item) => <li key={item.documentType}><span><strong>{item.label}</strong><small>{item.document ? labels[item.document.status] : 'Nedostaje'}</small></span>{item.document ? <a className="btn btn--style-secondary" href={`/admin/collections/candidate-private-documents/${item.document.id}`}>Otvori dokument</a> : null}</li>)}</ul></>}</section>
}
