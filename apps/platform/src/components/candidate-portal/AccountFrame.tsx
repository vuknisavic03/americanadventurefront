import Link from 'next/link'
import type { ReactNode } from 'react'

export function AccountFrame({ children }: { children: ReactNode }) {
  return (
    <main className="account-page">
      <header className="application-header">
        <Link className="brand" href="/">
          <span className="brand-mark">AA</span>
          <span>American Adventure</span>
        </Link>
        <span className="secure-label">Zaštićen kandidatski portal</span>
      </header>
      {children}
    </main>
  )
}

