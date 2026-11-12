import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { consumePersistentRateLimit } = vi.hoisted(() => ({
  consumePersistentRateLimit: vi.fn(),
}))

vi.mock('./config/environment.ts', () => ({
  readPlatformEnvironment: () => ({
    databaseUrl: 'postgresql://unused',
    payloadSecret: 'test-secret',
    security: { trustedProxyHops: 1 },
  }),
}))

vi.mock('./modules/security/rateLimit.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('./modules/security/rateLimit.ts')>()
  return { ...original, consumePersistentRateLimit }
})

import { proxy } from './proxy.ts'

describe('HTTP security proxy failure handling', () => {
  beforeEach(() => {
    consumePersistentRateLimit.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fails closed when the shared limiter store is unavailable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    consumePersistentRateLimit.mockRejectedValueOnce(new Error('DATABASE_UNAVAILABLE'))
    const request = new NextRequest('http://localhost/api/users/login', {
      headers: { 'x-forwarded-for': '198.51.100.7' },
      method: 'POST',
    })

    const response = await proxy(request)

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('retry-after')).toBe('5')
    expect(consoleError).toHaveBeenCalledWith('Persistent rate-limit check failed.', 'Error')
    await expect(response.json()).resolves.toEqual({
      message: 'Zaštita od zloupotrebe trenutno nije dostupna. Pokušajte ponovo.',
    })
  })
})
