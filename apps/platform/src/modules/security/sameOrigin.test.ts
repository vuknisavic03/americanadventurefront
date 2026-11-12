import { afterEach, describe, expect, it } from 'vitest'

import { isSameOriginRequest } from './sameOrigin.ts'

const previousServerURL = process.env.NEXT_PUBLIC_SERVER_URL

afterEach(() => {
  if (previousServerURL === undefined) delete process.env.NEXT_PUBLIC_SERVER_URL
  else process.env.NEXT_PUBLIC_SERVER_URL = previousServerURL
})

describe('same-origin request validation', () => {
  it('uses the configured public origin behind an internal server address', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://portal.example.test'
    const request = new Request('http://127.0.0.1:3000/api/action', { headers: { Origin: 'https://portal.example.test' } })
    expect(isSameOriginRequest(request)).toBe(true)
  })

  it('rejects an unrelated browser origin', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://portal.example.test'
    const request = new Request('http://127.0.0.1:3000/api/action', { headers: { Origin: 'https://attacker.example' } })
    expect(isSameOriginRequest(request)).toBe(false)
  })

  it('allows non-browser clients without an Origin header', () => {
    expect(isSameOriginRequest(new Request('http://127.0.0.1:3000/api/action'))).toBe(true)
  })
})
