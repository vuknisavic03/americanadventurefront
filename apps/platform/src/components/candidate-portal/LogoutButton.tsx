'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch('/api/candidate-accounts/logout', { method: 'POST' })
    } finally {
      router.push('/nalog/prijava')
      router.refresh()
    }
  }

  return <button className="secondary-button" disabled={pending} onClick={() => void logout()} type="button">{pending ? 'Odjavljivanje…' : 'Odjavi se'}</button>
}

