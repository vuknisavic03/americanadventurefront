import { Pool } from 'pg'

import { expect, test } from '@playwright/test'

const rateLimitScope = 'public-pre-application'
const observabilityToken = 'synthetic-observability-token-for-tests-only'

test('health endpoints separate liveness, readiness, and protected diagnostics', async ({ request }) => {
  const liveness = await request.get('/api/health')
  expect(liveness.status()).toBe(200)
  expect((await liveness.json()).status).toBe('ok')
  expect(liveness.headers()['cache-control']).toBe('no-store')

  const readiness = await request.get('/api/ready')
  expect(readiness.status()).toBe(200)
  expect((await readiness.json()).status).toBe('ready')
  expect(readiness.headers()['cache-control']).toBe('no-store')

  expect((await request.get('/api/operations/status')).status()).toBe(404)
  expect((await request.get('/api/operations/status', {
    headers: { authorization: 'Bearer wrong-token' },
  })).status()).toBe(404)

  const operations = await request.get('/api/operations/status', {
    headers: { authorization: `Bearer ${observabilityToken}` },
  })
  expect(operations.status()).toBe(200)
  const report = await operations.json()
  expect(['ok', 'degraded']).toContain(report.status)
  expect(report.checks.database).toBe('ok')
  expect(report.signals).toEqual(expect.objectContaining({
    activeRateLimitBlocks: expect.any(Number),
    failedCommunicationEvents: expect.any(Number),
    stuckJobs: expect.any(Number),
  }))
  expect(JSON.stringify(report)).not.toContain('candidate@example.com')
})

function invalidSubmissionHeaders(realAddress: string, spoofedAddress: string) {
  return {
    'X-Forwarded-For': spoofedAddress + ', ' + realAddress,
  }
}

test('responses include the platform security policy', async ({ request }) => {
  const response = await request.get('/')

  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(response.headers()['x-frame-options']).toBe('DENY')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(response.headers()['permissions-policy']).toContain('camera=()')
  expect(response.headers()['x-powered-by']).toBeUndefined()
  expect(response.headers()['strict-transport-security']).toBeUndefined()
})

test('program document upload is unavailable without a candidate session', async ({ request }) => {
  const response = await request.post('/api/candidate/program-documents/CV', {
    multipart: {
      document: {
        buffer: Buffer.from('%PDF-1.7 synthetic'),
        mimeType: 'application/pdf',
        name: 'synthetic-cv.pdf',
      },
    },
  })
  expect(response.status()).toBe(401)
})

test('interview preparation administration is unavailable without an admin session', async ({ request }) => {
  const read = await request.get('/api/admin/interview-preparations/1')
  expect(read.status()).toBe(401)
  expect(read.headers()['cache-control']).toBe('no-store')

  const mutation = await request.post('/api/admin/interview-preparations/1', {
    data: {
      action: 'SCHEDULE',
      deliveryMode: 'ONLINE',
      locationDetails: 'https://example.invalid/synthetic-meeting',
      startsAt: '2030-01-01T10:00:00.000Z',
      timeZone: 'Europe/Belgrade',
    },
  })
  expect(mutation.status()).toBe(401)
  expect(mutation.headers()['cache-control']).toBe('no-store')
})

test('employment offers are unavailable without the appropriate authenticated session', async ({ request }) => {
  const adminRead = await request.get('/api/admin/employment-offers/1')
  expect(adminRead.status()).toBe(401)
  expect(adminRead.headers()['cache-control']).toBe('no-store')

  const adminMutation = await request.post('/api/admin/employment-offers/1', {
    data: {
      action: 'WITHDRAW',
      employmentOfferId: 1,
      expectedStatusVersion: 1,
      reason: 'Sintetički razlog povlačenja.',
    },
  })
  expect(adminMutation.status()).toBe(401)
  expect(adminMutation.headers()['cache-control']).toBe('no-store')

  const candidateAcceptance = await request.post('/api/employment-offers/1/accept', {
    data: { confirmed: true, snapshotChecksum: 'a'.repeat(64) },
  })
  expect(candidateAcceptance.status()).toBe(401)
  expect(candidateAcceptance.headers()['cache-control']).toBe('no-store')

  const candidatePreference = await request.post('/api/candidate/job-options/1/preference', {
    data: { action: 'INTERESTED', expectedStatusVersion: 1 },
  })
  expect(candidatePreference.status()).toBe(401)
  expect(candidatePreference.headers()['cache-control']).toBe('no-store')
})

test('visa payment order administration is unavailable without an admin session', async ({ request }) => {
  const read = await request.get('/api/admin/visa-payment-orders/1')
  expect(read.status()).toBe(401)
  expect(read.headers()['cache-control']).toBe('no-store')

  const mutation = await request.post('/api/admin/visa-payment-orders/1', {
    data: {
      action: 'ISSUE',
      amountMinor: 18_500_00,
      bankAccount: 'SYNTHETIC-ACCOUNT',
      beneficiaryName: 'Synthetic Beneficiary',
      candidateInstructions: 'Synthetic instructions.',
      currency: 'RSD',
      dueAt: '2030-01-01T23:59:59.000Z',
    },
  })
  expect(mutation.status()).toBe(401)
  expect(mutation.headers()['cache-control']).toBe('no-store')
})

test('persistent limiter resists spoofing, resets expired windows, and counts concurrently', async ({
  request,
}) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const sequentialAddress = '198.51.100.42'
  const concurrentAddress = '198.51.100.43'

  try {
    await pool.query('DELETE FROM request_rate_limits WHERE scope = $1', [rateLimitScope])

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request.post('/api/public/pre-applications', {
        data: {},
        headers: invalidSubmissionHeaders(
          sequentialAddress,
          '203.0.113.' + (attempt + 1),
        ),
      })
      expect(response.status()).toBe(400)
    }

    const throttled = await request.post('/api/public/pre-applications', {
      data: {},
      headers: invalidSubmissionHeaders(sequentialAddress, '203.0.113.250'),
    })
    expect(throttled.status()).toBe(429)
    expect(Number(throttled.headers()['retry-after'])).toBeGreaterThan(0)
    expect(throttled.headers()['ratelimit-remaining']).toBe('0')

    await pool.query(
      "UPDATE request_rate_limits SET expires_at = now() - interval '1 second' WHERE scope = $1",
      [rateLimitScope],
    )
    const afterExpiry = await request.post('/api/public/pre-applications', {
      data: {},
      headers: invalidSubmissionHeaders(sequentialAddress, '203.0.113.251'),
    })
    expect(afterExpiry.status()).toBe(400)
    expect(afterExpiry.headers()['ratelimit-remaining']).toBe('4')

    await pool.query('DELETE FROM request_rate_limits WHERE scope = $1', [rateLimitScope])
    const concurrent = await Promise.all(
      Array.from({ length: 10 }, (_, attempt) =>
        request.post('/api/public/pre-applications', {
          data: {},
          headers: invalidSubmissionHeaders(
            concurrentAddress,
            '192.0.2.' + (attempt + 1),
          ),
        }),
      ),
    )
    const statuses = concurrent.map((response) => response.status())
    expect(statuses.filter((status) => status === 400)).toHaveLength(5)
    expect(statuses.filter((status) => status === 429)).toHaveLength(5)
  } finally {
    await pool.query('DELETE FROM request_rate_limits WHERE scope = $1', [rateLimitScope])
    await pool.end()
  }
})
