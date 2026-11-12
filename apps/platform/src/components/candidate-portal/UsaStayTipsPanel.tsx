'use client'

import { useState } from 'react'

type UsaStayTipItem = {
  category: string
  content: string
  id: number
  pinned: boolean
  sortOrder: number
  summary: string
  title: string
}

const tipCategories = [
  { label: 'Sve teme', value: 'ALL' },
  { label: 'SSN (Social Security)', value: 'SSN' },
  { label: 'Bankovni račun & kartice', value: 'BANKING' },
  { label: 'Smeštaj & depozit', value: 'HOUSING' },
  { label: 'Prevoz & transport', value: 'TRANSPORT' },
  { label: 'Kultura rada & bakšiš', value: 'WORK_CULTURE' },
  { label: 'Zdravlje & bezbednost', value: 'HEALTH_SAFETY' },
  { label: 'Opšti saveti', value: 'GENERAL' },
]

export function UsaStayTipsPanel({ tips }: { tips: UsaStayTipItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filteredTips = tips.filter((tip) => {
    if (selectedCategory === 'ALL') return true
    return tip.category === selectedCategory
  })

  return (
    <section className="portal-subsection usa-stay-tips" aria-labelledby="tips-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Korisni saveti (FR-062)</p>
          <h2 id="tips-heading">Saveti i smernice za život i rad u SAD</h2>
        </div>
        <p>Praktična uputstva agencije o procedurama (SSN, banka, stanovanje, prevoz) koja vam štede vreme i novac.</p>
      </div>

      {/* Filter tabovi */}
      <div
        className="category-filters"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '1rem',
          marginBottom: '1rem',
        }}
      >
        {tipCategories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === cat.value ? 700 : 500,
              backgroundColor: selectedCategory === cat.value ? '#231f20' : 'rgba(0,0,0,0.06)',
              color: selectedCategory === cat.value ? '#fff' : '#231f20',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filteredTips.length === 0 ? (
        <p className="empty-state">Nema saveta u izabranoj kategoriji.</p>
      ) : (
        <div className="tips-list" style={{ display: 'grid', gap: '0.75rem' }}>
          {filteredTips.map((tip) => {
            const isExpanded = expandedId === tip.id
            return (
              <div
                key={tip.id}
                className="tip-card"
                style={{
                  border: tip.pinned ? '2px solid #FDD503' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#fff',
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : tip.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setExpandedId(isExpanded ? null : tip.id)
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    {tip.pinned ? (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#FDD503',
                          color: '#231f20',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '0.25rem',
                          marginRight: '0.5rem',
                        }}
                      >
                        VAŽNO
                      </span>
                    ) : null}
                    <h3 style={{ display: 'inline', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      {tip.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.65)', margin: '0.25rem 0 0 0' }}>
                      {tip.summary}
                    </p>
                  </div>
                  <span style={{ fontSize: '1.25rem', color: 'rgba(0,0,0,0.4)', marginLeft: '1rem' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {isExpanded ? (
                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(0,0,0,0.08)',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                      color: 'rgba(0,0,0,0.85)',
                    }}
                  >
                    {tip.content}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
