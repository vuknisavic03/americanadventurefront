import { AccountFrame } from '@/components/candidate-portal/AccountFrame.tsx'
import { CandidateActivationForm } from '@/components/candidate-portal/CandidateActivationForm.tsx'

export default async function CandidateActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AccountFrame><CandidateActivationForm token={token} /></AccountFrame>
}

