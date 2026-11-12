import { AccountFrame } from '@/components/candidate-portal/AccountFrame.tsx'
import { PasswordRecoveryForm } from '@/components/candidate-portal/PasswordRecoveryForm.tsx'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AccountFrame><PasswordRecoveryForm resetToken={token} /></AccountFrame>
}

