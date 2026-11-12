import { describe, expect, it } from 'vitest'

import { createHealthStatus, createReadinessStatus } from './health'

describe('createHealthStatus', () => {
  it('returns a deterministic service status', () => {
    expect(createHealthStatus(new Date('2026-08-26T12:00:00.000Z'))).toEqual({
      service: 'american-adventure-platform',
      status: 'ok',
      timestamp: '2026-08-26T12:00:00.000Z',
    })
  })

  it('does not expose dependency details in readiness responses', () => {
    const now = new Date('2026-09-05T12:00:00.000Z')

    expect(createReadinessStatus(true, now)).toEqual({
      service: 'american-adventure-platform',
      status: 'ready',
      timestamp: now.toISOString(),
    })
    expect(createReadinessStatus(false, now).status).toBe('unavailable')
  })
})

