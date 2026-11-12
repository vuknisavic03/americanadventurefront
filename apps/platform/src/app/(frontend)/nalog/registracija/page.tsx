import { AccountFrame } from '@/components/candidate-portal/AccountFrame.tsx'
import Link from 'next/link'

export default function CandidateRegistrationPage() {
  return <AccountFrame><section className="account-card account-card--center">
    <p className="eyebrow">Kandidatski portal</p>
    <h1>Pristup kreira agencija</h1>
    <p>Nakon završenih konsultacija administrator će vam poslati lični, jednokratni aktivacioni link.</p>
    <p className="account-help"><Link href="/nalog/prijava">Nazad na prijavu</Link></p>
  </section></AccountFrame>
}

