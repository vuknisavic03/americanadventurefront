'use client'

import React, { useState } from 'react'

export function PreApplicationsExportBar() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setDownloading(true)
      setError(null)

      const response = await fetch('/api/admin/pre-applications/export', {
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message || 'Greška pri generisanju Excel izvoza.')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'pre-prijave.xlsx'

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Pre-application export failed:', err)
      setError(err instanceof Error ? err.message : 'Izvoz nije uspeo.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px 16px',
      }}
    >
      <div>
        <strong style={{ color: '#0f172a', display: 'block', fontSize: '14px' }}>
          Izvoz pre-prijava (FR-005)
        </strong>
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          Preuzmite sve pre-prijave kandidata sa detaljnim podacima u Microsoft Excel (.xlsx) formatu.
        </span>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        {error && (
          <span style={{ color: '#dc2626', fontSize: '13px' }}>
            {error}
          </span>
        )}
        <button
          disabled={downloading}
          onClick={handleExport}
          style={{
            alignItems: 'center',
            backgroundColor: downloading ? '#94a3b8' : '#15386B',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            fontSize: '13px',
            fontWeight: 600,
            gap: '8px',
            padding: '8px 16px',
            transition: 'background-color 0.2s',
          }}
          type="button"
        >
          {downloading ? 'Generisanje tabele…' : '📥 Izvezi u Excel'}
        </button>
      </div>
    </div>
  )
}
