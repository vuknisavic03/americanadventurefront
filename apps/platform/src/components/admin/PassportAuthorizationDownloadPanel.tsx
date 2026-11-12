'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export function PassportAuthorizationDownloadPanel() {
  const { data, id } = useDocumentInfo()
  if (!id) return null
  const accepted = data?.status === 'ACCEPTED'
  return <section><h3>Preuzimanje punomoćja</h3><p>Svako preuzimanje ostaje zabeleženo u revizijskoj evidenciji.</p><p><a className="btn btn--style-secondary" href={`/api/passport-authorizations/${id}/download`}>Preuzmi izvorni nacrt</a>{' '}{accepted ? <a className="btn btn--style-primary" href={`/api/passport-authorizations/${id}/download?version=accepted`}>Preuzmi prihvaćeni PDF za štampu</a> : null}</p></section>
}
