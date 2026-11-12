import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { readPlatformEnvironment } from '@/config/environment'
import {
  collectOperationalStatus,
  isObservabilityRequestAuthorized,
  logOperationalFailure,
  withHealthTimeout,
} from '@/modules/monitoring/observability'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const environment = readPlatformEnvironment()
  if (!isObservabilityRequestAuthorized(
    request.headers.get('authorization'),
    environment.operations.observabilityToken,
  )) {
    return new NextResponse(null, {
      headers: { 'Cache-Control': 'no-store' },
      status: 404,
    })
  }

  try {
    const payload = await withHealthTimeout(getPayload({ config }))
    const status = await withHealthTimeout(collectOperationalStatus(payload))
    return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logOperationalFailure('operations_status_failed', error)
    return NextResponse.json({
      service: 'american-adventure-platform',
      status: 'unavailable',
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
      status: 503,
    })
  }
}
