'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import './PassportAuthorizationManagementPanel.scss'

type State = {
  authorization?: { acceptedAt?: string; acceptanceReference?: string; authorizationNumber: string; generatedAt: string; id: number; status: 'ACCEPTED' | 'GENERATED' }
  blockers: string[]
  ready: boolean
  template?: { id: number; name: string; version: number }
}

async function fetchState(id: number | string, signal?: AbortSignal) {
  const response = await fetch(`/api/admin/passport-authorizations/${id}`, { cache: 'no-store', signal })
  const result = await response.json() as State & { message?: string }
  if (!response.ok) throw new Error(result.message ?? 'Punomoćje nije dostupno.')
  return result
}

export function PassportAuthorizationManagementPanel() {
  const { id } = useDocumentInfo()
  const [state, setState] = useState<State>()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    void fetchState(id, controller.signal).then(setState).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Punomoćje nije dostupno.')
    })
    return () => controller.abort()
  }, [id])
  async function generate() {
    if (!id) return
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/admin/passport-authorizations/${id}`, { method: 'POST' })
      const result = await response.json() as { message?: string }
      setMessage(result.message ?? 'Zahtev nije obrađen.')
      if (response.ok) setState(await fetchState(id))
    } catch { setMessage('Veza sa serverom nije uspela.') }
    finally { setPending(false) }
  }
  if (!id) return null
  return <section className="passport-authorization-admin" aria-label="Punomoćje za preuzimanje pasoša"><h3>Punomoćje za preuzimanje pasoša</h3><p>Dokument se generiše iz verifikovanih podataka i aktivnog šablona, a kandidat ga prihvata u zaštićenom portalu.</p>{message ? <div className="passport-authorization-admin__message" role="status">{message}</div> : null}{!state ? <p>Učitavanje…</p> : state.authorization ? <><p><strong>{state.authorization.authorizationNumber}</strong> · {state.authorization.status === 'ACCEPTED' ? 'Elektronski prihvaćeno' : 'Čeka prihvatanje kandidata'}</p><div className="passport-authorization-admin__actions"><a className="btn btn--style-secondary" href={`/api/passport-authorizations/${state.authorization.id}/download`}>Preuzmi nacrt</a>{state.authorization.status === 'ACCEPTED' ? <a className="btn btn--style-primary" href={`/api/passport-authorizations/${state.authorization.id}/download?version=accepted`}>Preuzmi za štampu</a> : null}<a className="btn btn--style-secondary" href={`/admin/collections/passport-collection-authorizations/${state.authorization.id}`}>Otvori zapis</a></div></> : <>{state.template ? <p>Aktivan šablon: <strong>{state.template.name}</strong> (verzija {state.template.version})</p> : null}{state.blockers.length ? <ul>{state.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : null}<button className="btn btn--style-primary" disabled={!state.ready || pending} onClick={generate} type="button">{pending ? 'Generisanje…' : 'Generiši punomoćje'}</button></>}</section>
}
