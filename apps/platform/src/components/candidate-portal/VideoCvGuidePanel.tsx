'use client'

import { type FormEvent, useState } from 'react'

import {
  extractYouTubeVideoId,
  validateYouTubeUrl,
  VIDEO_CV_GUIDELINES,
} from '@/modules/candidate-documents/videoCvGuide.ts'

export interface VideoCvGuidePanelProps {
  initialYoutubeUrl?: string
  onSave?: (url: string) => Promise<void>
}

export function VideoCvGuidePanel({ initialYoutubeUrl = '', onSave }: VideoCvGuidePanelProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl)
  const [savedUrl, setSavedUrl] = useState(initialYoutubeUrl)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const videoId = extractYouTubeVideoId(savedUrl || youtubeUrl)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    const trimmed = youtubeUrl.trim()
    if (!trimmed) {
      setError('Unesite YouTube link ka Vašem Video CV-u.')
      return
    }

    if (!validateYouTubeUrl(trimmed)) {
      setError('Unesite ispravan YouTube URL (npr. https://www.youtube.com/watch?v=... ili https://youtu.be/...).')
      return
    }

    setPending(true)
    try {
      if (onSave) {
        await onSave(trimmed)
      } else {
        const response = await fetch('/api/candidate/video-cv', {
          body: JSON.stringify({ youtubeUrl: trimmed }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          const res = (await response.json()) as { message?: string }
          throw new Error(res.message || 'Čuvanje linka nije uspelo.')
        }
      }
      setSavedUrl(trimmed)
      setMessage('Vaš Video CV link je uspešno sačuvan!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Došlo je do greške prilikom čuvanja.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="portal-subsection video-cv-guide" aria-labelledby="video-cv-heading" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px 0' }}>
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <p className="eyebrow" style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FR-042 · Instrukcija agencije</p>
        <h2 id="video-cv-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>Uputstvo za izradu Video CV-a</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Video CV je Vaša prva i najvažnija prezentacija pred američkim poslodavcima. Pratite zvanične preporuke agencije American Adventure kako biste ostavili najbolji utisak.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>⏱️ Trajanje i govor</h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            Maksimalno <strong>do 2 minuta</strong>. {VIDEO_CV_GUIDELINES.speechAdvice}
          </p>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>👔 Oblačenje i stav</h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            {VIDEO_CV_GUIDELINES.dressCode}
          </p>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>🔒 YouTube podešavanje</h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            Video postavite na YouTube kao <strong>Unlisted (Neizlistan)</strong> kako bi bio vidljiv samo agenciji i poslodavcima koji poseduju link.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>📋 Obavezne teme za predstavljanje:</h3>
        <ul style={{ paddingLeft: '20px', color: '#334155', fontSize: '0.925rem', lineHeight: 1.6 }}>
          {VIDEO_CV_GUIDELINES.mandatoryTopics.map((topic, i) => (
            <li key={i} style={{ marginBottom: '6px' }}>{topic}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>💡 Dodatna pitanja (izaberite 3–5 na koja želite da odgovorite):</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '12px' }}>
          <em>Napomena: Ne treba odgovarati na sva pitanja, izaberite ona koja Vas najbolje predstavljaju.</em>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
          {VIDEO_CV_GUIDELINES.recommendedQuestions.map((q, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.875rem', color: '#334155' }}>
              • {q}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '24px' }}>
        <strong style={{ color: '#92400e', fontSize: '0.925rem' }}>⭐ Obavezno završno pitanje:</strong>
        <p style={{ color: '#78350f', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          {VIDEO_CV_GUIDELINES.mandatoryFinalQuestion}
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>🎥 Zvanični primeri uspešnih Video CV-ja studenata:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {VIDEO_CV_GUIDELINES.officialSampleVideos.map((sample, i) => (
            <a
              key={i}
              href={sample.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ▶️ {sample.title}
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>🔗 Vaš YouTube Video CV link</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Unesite link ka vašem neizlistanom (Unlisted) YouTube videu:</span>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={pending}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
              }}
            />
          </label>

          {error && <div style={{ color: '#dc2626', fontSize: '0.875rem' }} role="alert">{error}</div>}
          {message && <div style={{ color: '#16a34a', fontSize: '0.875rem' }} role="status">{message}</div>}

          <button
            type="submit"
            disabled={pending}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 20px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: pending ? 'wait' : 'pointer',
            }}
          >
            {pending ? 'Čuvanje…' : 'Sačuvaj Video CV link'}
          </button>
        </form>

        {videoId && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>Pregled unetog videa:</p>
            <div style={{ position: 'relative', width: '100%', maxWidth: '480px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title="Video CV Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
