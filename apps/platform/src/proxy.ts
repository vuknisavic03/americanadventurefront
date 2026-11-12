import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { readPlatformEnvironment } from './config/environment.ts'
import {
  INTERNAL_CLIENT_ADDRESS_HEADER,
  resolveClientAddress,
} from './modules/security/clientAddress.ts'
import { consumePersistentRateLimit, type RateLimitResult } from './modules/security/rateLimit.ts'
import { rateLimitPolicy } from './modules/security/rateLimitPolicies.ts'

function rateLimitHeaders(result: RateLimitResult) {
  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1_000)),
  }
}

export async function proxy(request: NextRequest) {
  const environment = readPlatformEnvironment()
  const clientAddress = resolveClientAddress(
    request.headers,
    environment.security.trustedProxyHops,
  )
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(INTERNAL_CLIENT_ADDRESS_HEADER)
  requestHeaders.set(INTERNAL_CLIENT_ADDRESS_HEADER, clientAddress)

  const policy = rateLimitPolicy(request.method, request.nextUrl.pathname)
  if (!policy) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  try {
    const result = await consumePersistentRateLimit({
      databaseURL: environment.databaseUrl,
      identity: clientAddress,
      policy,
      secret: environment.payloadSecret,
    })
    const headers = rateLimitHeaders(result)

    if (!result.allowed) {
      return NextResponse.json(
        { message: 'Previše pokušaja. Molimo pokušajte ponovo kasnije.' },
        {
          headers: {
            ...headers,
            'Cache-Control': 'no-store',
            'Retry-After': String(result.retryAfterSeconds),
          },
          status: 429,
        },
      )
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value)
    return response
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Persistent rate-limit check failed in development (database offline). Allowing request in dev mode.',
      )
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    console.error(
      'Persistent rate-limit check failed.',
      error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    )
    return NextResponse.json(
      { message: 'Zaštita od zloupotrebe trenutno nije dostupna. Pokušajte ponovo.' },
      { headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' }, status: 503 },
    )
  }
}

export const config = {
  matcher: '/api/:path*',
}
