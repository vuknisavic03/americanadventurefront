'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { PeerNetworkingState } from '@/modules/usa-stay/rules.ts'

export function PeerNetworkingPanel({ initialState }: { initialState: PeerNetworkingState }) {
  const router = useRouter()
  const [hasConsent, setHasConsent] = useState(initialState.hasConsent)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function handleConsentToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const nextConsent = e.target.checked
    setPending(true)
    setMessage('')
    try {
      const res = await fetch('/api/candidate/usa-stay/peers/consent', {
        body: JSON.stringify({ consent: nextConsent }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await res.json() as { consent?: boolean; message?: string }
      if (res.ok) {
        setHasConsent(Boolean(data.consent))
        setMessage(data.message ?? 'Podešavanje je sačuvano.')
        router.refresh()
      } else {
        setMessage(data.message ?? 'Promena nije uspela.')
      }
    } catch {
      setMessage('Veza sa serverom nije uspela.')
    } finally {
      setPending(false)
    }
  }

  const { myPlacement, peersSameEmployer, peersSameState, totalEligiblePeers } = initialState

  return (
    <section className="portal-subsection peer-networking" aria-labelledby="peer-networking-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Povezivanje studenata u SAD (FR-061)</p>
          <h2 id="peer-networking-heading">Kolege kod istog poslodavca i u istoj državi</h2>
        </div>
        <p>Povežite se sa studentima koji idu na istu lokaciju radi lakše organizacije smeštaja, prevoza i zajedničkih letova.</p>
      </div>

      {myPlacement ? (
        <div
          style={{
            backgroundColor: 'rgba(253,213,3,0.1)',
            border: '1px solid rgba(253,213,3,0.4)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#231f20' }}>
            <strong>Vaša lokacija u SAD:</strong> {myPlacement.employerName} — {myPlacement.city}, {myPlacement.state}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(0,0,0,0.7)' }}>
            Podaci o poslodavcu će biti automatski učitani čim prihvatite zvaničnu radnu ponudu (Job Offer).
          </p>
        </div>
      )}

      {/* Kontrola privatnosti / Opt-in saglasnost */}
      <div
        className="consent-box"
        style={{
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          backgroundColor: '#fff',
          marginBottom: '1.25rem',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasConsent}
            disabled={pending}
            onChange={handleConsentToggle}
            style={{ marginTop: '0.25rem', transform: 'scale(1.2)' }}
          />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>
              Dozvoli deljenje mog imena i email adrese sa studentima kod istog poslodavca ili u istoj državi
            </strong>
            <small style={{ color: 'rgba(0,0,0,0.65)', display: 'block', marginTop: '0.25rem' }}>
              Radi zaštite vaše privatnosti, kontakte kolega možete videti isključivo ako ste omogućili deljenje svog kontakta.
              Podatke delimo samo sa verifikovanim kandidatima istog programa. Saglasnost možete povući u bilo kom trenutku.
            </small>
          </div>
        </label>
        {message ? (
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
            {message}
          </p>
        ) : null}
      </div>

      {/* Prikaz kolega */}
      {!hasConsent ? (
        <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '0.75rem' }}>
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', fontSize: '0.9rem' }}>
            {totalEligiblePeers > 0
              ? `U vašoj regiji ima ${totalEligiblePeers} student(a). Uključite opciju iznad da biste videli njihove email kontakte.`
              : 'Uključite saglasnost iznad kako biste pristupili bazi kontakata čim se druge kolege prijave na istu lokaciju.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Isti poslodavac */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
              Kolege kod istog poslodavca ({peersSameEmployer.length})
            </h3>
            {peersSameEmployer.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', margin: 0 }}>
                Trenutno nema drugih studenata kod istog poslodavca koji su uključili deljenje kontakta.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {peersSameEmployer.map((peer) => (
                  <div
                    key={peer.id}
                    style={{
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{peer.fullName}</strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)' }}>
                        {peer.employerName} • {peer.city}, {peer.state}
                      </p>
                    </div>
                    <a
                      href={`mailto:${peer.email}`}
                      className="submit-button"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      Kontaktiraj ({peer.email})
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ista savezna država */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
              Kolege u istoj saveznoj državi ({peersSameState.length})
            </h3>
            {peersSameState.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', margin: 0 }}>
                Trenutno nema drugih studenata u istoj saveznoj državi koji su uključili deljenje kontakta.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {peersSameState.map((peer) => (
                  <div
                    key={peer.id}
                    style={{
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{peer.fullName}</strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)' }}>
                        {peer.employerName} • {peer.city}, {peer.state}
                      </p>
                    </div>
                    <a
                      href={`mailto:${peer.email}`}
                      className="submit-button"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      Kontaktiraj ({peer.email})
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
