'use client'

type UsaStayMaterialItem = {
  category: string
  description?: string
  fileName: string
  fileSize?: string
  fileUrl: string
  id: number
  sortOrder: number
  title: string
}

const categoryLabels: Record<string, string> = {
  EMERGENCY: 'SOS & Hitni kontakti',
  HANDBOOK: 'Priručnik programa',
  INSURANCE: 'Zdravstveno osiguranje',
  OTHER: 'Vodiči i obrasci',
  SEVIS: 'SEVIS smernice',
  TAXES: 'Poreski vodič (W-2)',
}

export function UsaStayMaterialsPanel({ materials }: { materials: UsaStayMaterialItem[] }) {
  if (!materials || materials.length === 0) {
    return (
      <section className="portal-subsection usa-stay-materials" aria-labelledby="materials-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Boravak u SAD (FR-060)</p>
            <h2 id="materials-heading">Materijali i priručnici za boravak u SAD</h2>
          </div>
          <p>Zvanični dokumenti, priručnici i SOS kontakti koje možete koristiti i preuzeti tokom boravka.</p>
        </div>
        <p className="empty-state">Trenutno nema objavljenih materijala za preuzimanje.</p>
      </section>
    )
  }

  return (
    <section className="portal-subsection usa-stay-materials" aria-labelledby="materials-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Boravak u SAD (FR-060)</p>
          <h2 id="materials-heading">Materijali i priručnici za boravak u SAD</h2>
        </div>
        <p>Zvanični vodiči, instrukcije za osiguranje i brojevi za hitne slučajeve koji su vam dostupni u svakom trenutku.</p>
      </div>

      <div className="materials-grid" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {materials.map((mat) => (
          <article
            key={mat.id}
            className="material-card"
            style={{
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              backgroundColor: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(253,213,3,0.25)',
                    color: '#231f20',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {categoryLabels[mat.category] ?? mat.category}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{mat.title}</h3>
                {mat.description ? (
                  <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.7)', margin: '0 0 0.75rem 0' }}>
                    {mat.description}
                  </p>
                ) : null}
                <div style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>
                  <span>Fajl: {mat.fileName}</span>
                  {mat.fileSize ? <span> • {mat.fileSize}</span> : null}
                </div>
              </div>
              <a
                href={mat.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={mat.fileName}
                className="submit-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Preuzmi dokument
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
