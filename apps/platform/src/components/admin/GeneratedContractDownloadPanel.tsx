'use client'

import { useDocumentInfo } from '@payloadcms/ui'

import './ContractGenerationPanel.scss'

export function GeneratedContractDownloadPanel() {
  const { id } = useDocumentInfo()
  if (!id) return null
  return (
    <section className="contract-generation-panel">
      <h3>Kontrolisano preuzimanje</h3>
      <p>PDF je šifrovan u bazi. Svako administratorsko ili kandidatsko preuzimanje beleži se u revizijskoj evidenciji.</p>
      <a className="btn btn--style-primary" href={`/api/contracts/${id}/download`}>Preuzmi generisani PDF</a>
    </section>
  )
}

