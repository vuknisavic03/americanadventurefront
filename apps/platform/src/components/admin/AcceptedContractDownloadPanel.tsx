'use client'

import { useDocumentInfo } from '@payloadcms/ui'

import './ContractGenerationPanel.scss'

export function AcceptedContractDownloadPanel() {
  const { id } = useDocumentInfo()
  if (!id) return null
  return (
    <section className="contract-generation-panel">
      <h3>Konačna prihvaćena verzija</h3>
      <p>PDF je šifrovan u bazi. Svako preuzimanje se proverava i beleži u revizijskoj evidenciji.</p>
      <a className="btn btn--style-primary" href={`/api/contract-acceptances/${id}/download`}>Preuzmi prihvaćeni PDF</a>
    </section>
  )
}

