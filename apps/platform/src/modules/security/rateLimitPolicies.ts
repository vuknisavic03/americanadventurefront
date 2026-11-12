import type { RateLimitPolicy } from './rateLimit.ts'

const policies = new Map<string, RateLimitPolicy>([
  [
    '/api/public/pre-applications',
    { limit: 5, scope: 'public-pre-application', windowSeconds: 10 * 60 },
  ],
  [
    '/api/public/candidate-accounts/forgot-password',
    { limit: 5, scope: 'candidate-password-recovery', windowSeconds: 15 * 60 },
  ],
  [
    '/api/public/candidate-accounts/activate',
    { limit: 10, scope: 'candidate-account-activation', windowSeconds: 15 * 60 },
  ],
  [
    '/api/candidate-accounts/login',
    { limit: 10, scope: 'candidate-login', windowSeconds: 15 * 60 },
  ],
  [
    '/api/candidate-accounts/forgot-password',
    { limit: 5, scope: 'candidate-payload-password-recovery', windowSeconds: 15 * 60 },
  ],
  [
    '/api/candidate-accounts/reset-password',
    { limit: 10, scope: 'candidate-password-reset', windowSeconds: 15 * 60 },
  ],
  ['/api/users/login', { limit: 10, scope: 'admin-login', windowSeconds: 15 * 60 }],
  [
    '/api/users/forgot-password',
    { limit: 5, scope: 'admin-password-recovery', windowSeconds: 15 * 60 },
  ],
  [
    '/api/users/reset-password',
    { limit: 10, scope: 'admin-password-reset', windowSeconds: 15 * 60 },
  ],
  [
    '/api/users/first-register',
    { limit: 5, scope: 'first-admin-registration', windowSeconds: 15 * 60 },
  ],
])

export function rateLimitPolicy(method: string, pathname: string) {
  return method === 'POST' ? policies.get(pathname) : undefined
}
