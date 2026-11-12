import { describe, expect, it, vi } from 'vitest'

import {
  createOperationalEvent,
  isObservabilityRequestAuthorized,
  summarizeOperationalSignals,
  withHealthTimeout,
} from './observability'

const token = 'a-secure-observability-token-at-least-32-characters'

describe('operational monitoring', () => {
  it('uses timing-safe bearer-token authorization and fails closed', () => {
    expect(isObservabilityRequestAuthorized(`Bearer ${token}`, token)).toBe(true)
    expect(isObservabilityRequestAuthorized(`Bearer ${token}-wrong`, token)).toBe(false)
    expect(isObservabilityRequestAuthorized(null, token)).toBe(false)
    expect(isObservabilityRequestAuthorized(`Bearer ${token}`, undefined)).toBe(false)
  })

  it('marks actionable background failures as degraded', () => {
    const report = summarizeOperationalSignals({
      activeRateLimitBlocks: 2,
      failedCommunicationEvents: 1,
      overdueCommunicationEvents: 0,
      stuckCommunicationEvents: 0,
      stuckJobs: 0,
      terminalJobFailures: 1,
    }, new Date('2026-09-05T12:00:00.000Z'))

    expect(report.status).toBe('degraded')
    expect(report.checks.security).toBe('attention')
    expect(report.checks.backgroundJobs).toBe('degraded')
  })

  it('logs only an error type and correlation identifier', () => {
    const event = createOperationalEvent(
      'readiness_check_failed',
      new Error('password=secret candidate@example.com'),
      new Date('2026-09-05T12:00:00.000Z'),
      'known-correlation-id',
    )
    const serialized = JSON.stringify(event)

    expect(event.errorType).toBe('Error')
    expect(serialized).not.toContain('secret')
    expect(serialized).not.toContain('candidate@example.com')
  })

  it('bounds dependency checks with a timeout', async () => {
    vi.useFakeTimers()
    const result = withHealthTimeout(new Promise<never>(() => {}), 100)
    const expectedRejection = expect(result).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(100)
    await expectedRejection
    vi.useRealTimers()
  })
})
