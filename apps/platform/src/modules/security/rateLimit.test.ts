import { describe, expect, it, vi } from 'vitest'

import { consumePersistentRateLimit, rateLimitIdentityHash } from './rateLimit.ts'

describe('persistent rate limiting', () => {
  it('hashes identities per scope without retaining their raw value', () => {
    const first = rateLimitIdentityHash({
      identity: '198.51.100.7',
      scope: 'candidate-login',
      secret: 'test-secret',
    })
    const second = rateLimitIdentityHash({
      identity: '198.51.100.7',
      scope: 'admin-login',
      secret: 'test-secret',
    })

    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(first).not.toContain('198.51.100.7')
    expect(first).not.toBe(second)
  })

  it('returns a deterministic allowance from the atomic database result', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ attempts: 6, expires_at: new Date('2026-09-03T12:10:00.000Z') }],
    })

    await expect(
      consumePersistentRateLimit({
        databaseURL: 'postgresql://unused',
        identity: '198.51.100.7',
        now: new Date('2026-09-03T12:00:00.000Z'),
        policy: { limit: 5, scope: 'public-intake', windowSeconds: 600 },
        pool: { query },
        secret: 'test-secret',
      }),
    ).resolves.toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: new Date('2026-09-03T12:10:00.000Z'),
      retryAfterSeconds: 600,
    })
    expect(query).toHaveBeenCalledOnce()
  })
})
