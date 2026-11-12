import type { Metadata } from 'next'
import Link from 'next/link'

import { SubmissionForm } from './SubmissionForm.tsx'

export const metadata: Metadata = {
  description: 'Prijavite se za Work & Travel USA program agencije American Adventure.',
  title: 'Prijava za Work & Travel | American Adventure',
}

export default function WorkAndTravelApplicationPage() {
  return (
    <main className="application-page">
      <header className="application-header">
        <Link className="brand" href="/">
          <span className="brand-mark">AA</span>
          <span>American Adventure</span>
        </Link>
        <span className="secure-label">Sigurna online prijava</span>
      </header>
      <SubmissionForm />
      <footer className="application-footer">
        <p>© American Adventure DOO</p>
        <Link href="/">Nazad na početnu stranu</Link>
      </footer>
    </main>
  )
}
