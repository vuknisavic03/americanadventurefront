const baseDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
]

export function securityHeaders({
  enableHSTS = false,
  isDevelopment = false,
} = {}) {
  const connectSources = ["'self'"]
  const directives = [...baseDirectives]

  if (isDevelopment) {
    connectSources.push('ws:', 'wss:')
    const scriptIndex = directives.findIndex((directive) => directive.startsWith('script-src'))
    directives[scriptIndex] += " 'unsafe-eval'"
  } else {
    directives.push('upgrade-insecure-requests')
  }

  directives.push(`connect-src ${connectSources.join(' ')}`)

  const headers = [
    { key: 'Content-Security-Policy', value: directives.join('; ') },
    { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-XSS-Protection', value: '0' },
  ]

  if (enableHSTS) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    })
  }

  return headers
}
