import { NextResponse } from 'next/server'

import { createHealthStatus } from '@/lib/health'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(createHealthStatus(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

