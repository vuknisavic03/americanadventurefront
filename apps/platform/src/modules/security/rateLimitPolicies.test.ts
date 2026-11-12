import { describe, expect, it } from 'vitest'

import { rateLimitPolicy } from './rateLimitPolicies.ts'

describe('public endpoint rate-limit policies', () => {
  it('covers intake and authentication endpoints only for mutating requests', () => {
    expect(rateLimitPolicy('POST', '/api/public/pre-applications')).toMatchObject({
      limit: 5,
      scope: 'public-pre-application',
    })
    expect(rateLimitPolicy('POST', '/api/candidate-accounts/login')).toMatchObject({
      scope: 'candidate-login',
    })
    expect(rateLimitPolicy('POST', '/api/users/login')).toMatchObject({
      scope: 'admin-login',
    })
    expect(rateLimitPolicy('GET', '/api/users/login')).toBeUndefined()
    expect(rateLimitPolicy('POST', '/api/health')).toBeUndefined()
  })
})
