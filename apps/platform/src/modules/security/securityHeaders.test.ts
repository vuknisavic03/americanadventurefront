import { describe, expect, it } from 'vitest'

import { securityHeaders } from '../../../security-headers.mjs'

function headerRecord(options?: { enableHSTS?: boolean; isDevelopment?: boolean }) {
  return Object.fromEntries(
    securityHeaders(options).map(({ key, value }) => [key.toLowerCase(), value]),
  )
}

describe('security response headers', () => {
  it('sets CSP, anti-framing, MIME, referrer, and permissions policies', () => {
    const headers = headerRecord()

    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("object-src 'none'")
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['x-xss-protection']).toBe('0')
  })

  it('enables HSTS only after HTTPS ownership is explicitly confirmed', () => {
    expect(headerRecord()['strict-transport-security']).toBeUndefined()
    expect(
      headerRecord({ enableHSTS: true })['strict-transport-security'],
    ).toBe('max-age=63072000; includeSubDomains')
  })

  it('allows development websocket and evaluation requirements only in development', () => {
    const development = headerRecord({ isDevelopment: true })
    const production = headerRecord({ isDevelopment: false })

    expect(development['content-security-policy']).toContain("'unsafe-eval'")
    expect(development['content-security-policy']).toContain('ws:')
    expect(production['content-security-policy']).not.toContain("'unsafe-eval'")
    expect(production['content-security-policy']).toContain('upgrade-insecure-requests')
  })
})
