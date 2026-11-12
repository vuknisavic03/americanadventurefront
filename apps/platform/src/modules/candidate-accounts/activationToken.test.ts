import { describe, expect, it } from 'vitest'

import { createCandidateActivationToken, readCandidateActivationToken } from './activationToken.ts'

const secret = 'test-secret-that-is-long-enough-for-signing'
const tokenData = { accountId: 42, expiresAt: 1_800_000_000_000, nonce: 'a-secure-random-nonce', version: 3 }

describe('candidate activation token', () => {
  it('round-trips a valid signed token', () => {
    const token = createCandidateActivationToken(tokenData, secret)
    expect(readCandidateActivationToken(token, secret)).toEqual(tokenData)
  })

  it('rejects tampering and a different signing secret', () => {
    const token = createCandidateActivationToken(tokenData, secret)
    expect(readCandidateActivationToken(`${token}x`, secret)).toBeUndefined()
    expect(readCandidateActivationToken(token, `${secret}-other`)).toBeUndefined()
  })
})

