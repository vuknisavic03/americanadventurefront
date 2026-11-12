import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { createReadinessStatus } from '@/lib/health'
import { logOperationalFailure, withHealthTimeout } from '@/modules/monitoring/observability'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await withHealthTimeout(getPayload({ config }))
    await withHealthTimeout(payload.count({ collection: 'users' }))
    return NextResponse.json(createReadinessStatus(true), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    logOperationalFailure('readiness_check_failed', error)
    return NextResponse.json(createReadinessStatus(false), {
      headers: { 'Cache-Control': 'no-store' },
      status: 503,
    })
  }
}
