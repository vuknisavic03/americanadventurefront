import { describe, expect, it } from 'vitest'

import {
  INTERNAL_CLIENT_ADDRESS_HEADER,
  resolveClientAddress,
  UNRESOLVED_CLIENT_ADDRESS,
} from './clientAddress.ts'

describe('trusted proxy client address resolution', () => {
  it('ignores every client-supplied forwarding value when no proxy is trusted', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.250',
      [INTERNAL_CLIENT_ADDRESS_HEADER]: '198.51.100.99',
    })

    expect(resolveClientAddress(headers, 0)).toBe(UNRESOLVED_CLIENT_ADDRESS)
  })

  it('selects addresses from the trusted edge inward', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.250, 198.51.100.7',
    })

    expect(resolveClientAddress(headers, 1)).toBe('198.51.100.7')
    expect(resolveClientAddress(headers, 2)).toBe('203.0.113.250')
  })

  it('fails closed when the forwarding chain is missing or malformed', () => {
    expect(resolveClientAddress(new Headers(), 1)).toBe(UNRESOLVED_CLIENT_ADDRESS)
    expect(
      resolveClientAddress(new Headers({ 'x-forwarded-for': 'not-an-ip' }), 1),
    ).toBe(UNRESOLVED_CLIENT_ADDRESS)
  })
})
