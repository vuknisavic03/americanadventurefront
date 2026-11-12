import { describe, expect, it } from 'vitest'

import { assertCandidatePassword } from './passwordPolicy.ts'

describe('candidate password policy', () => {
  it('accepts passwords from 12 through 128 characters', () => {
    expect(() => assertCandidatePassword('x'.repeat(12))).not.toThrow()
    expect(() => assertCandidatePassword('x'.repeat(128))).not.toThrow()
  })

  it('rejects missing, short, and oversized passwords', () => {
    expect(() => assertCandidatePassword(undefined)).toThrow()
    expect(() => assertCandidatePassword('x'.repeat(11))).toThrow()
    expect(() => assertCandidatePassword('x'.repeat(129))).toThrow()
  })
})

