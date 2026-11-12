import { describe, expect, it } from 'vitest'

import { candidateActivationSchema, normalizeCandidateEmail } from './schema.ts'

describe('candidate account activation schema', () => {
  const validInput = {
    citizenship: 'Republika Srbija',
    confirmPassword: 'sigurna lozinka 2026',
    password: 'sigurna lozinka 2026',
    token: 'signed-activation-token',
  }

  it('accepts a strong matching password and citizenship', () => {
    expect(candidateActivationSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects short and mismatched passwords', () => {
    const result = candidateActivationSchema.safeParse({
      ...validInput,
      confirmPassword: 'druga lozinka 2026',
      password: 'kratka',
    })

    expect(result.success).toBe(false)
  })

  it('normalizes email without changing the stored password', () => {
    expect(normalizeCandidateEmail('  KANDIDAT@EXAMPLE.COM ')).toBe('kandidat@example.com')
  })
})

