import { createHmac } from 'node:crypto'
import { Pool, type QueryResultRow } from 'pg'

export type RateLimitPolicy = {
  limit: number
  scope: string
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfterSeconds: number
}

type RateLimitRow = QueryResultRow & {
  attempts: number | string
  expires_at: Date
}

type RateLimitPool = Pick<Pool, 'query'>

type GlobalRateLimitState = typeof globalThis & {
  americanAdventureRateLimitPool?: {
    databaseURL: string
    pool: Pool
  }
}

function poolFor(databaseURL: string) {
  const state = globalThis as GlobalRateLimitState
  if (state.americanAdventureRateLimitPool?.databaseURL === databaseURL) {
    return state.americanAdventureRateLimitPool.pool
  }

  void state.americanAdventureRateLimitPool?.pool.end()
  const pool = new Pool({
    allowExitOnIdle: true,
    connectionString: databaseURL,
    idleTimeoutMillis: 10_000,
    max: 4,
  })
  state.americanAdventureRateLimitPool = { databaseURL, pool }
  return pool
}

export function rateLimitIdentityHash({
  identity,
  scope,
  secret,
}: {
  identity: string
  scope: string
  secret: string
}) {
  return createHmac('sha256', secret).update(scope).update(':').update(identity).digest('hex')
}

export async function consumePersistentRateLimit({
  databaseURL,
  identity,
  now = new Date(),
  policy,
  pool = poolFor(databaseURL),
  secret,
}: {
  databaseURL: string
  identity: string
  now?: Date
  policy: RateLimitPolicy
  pool?: RateLimitPool
  secret: string
}): Promise<RateLimitResult> {
  const expiresAt = new Date(now.getTime() + policy.windowSeconds * 1_000)
  const keyHash = rateLimitIdentityHash({
    identity,
    scope: policy.scope,
    secret,
  })
  const result = await pool.query<RateLimitRow>(
    `
      WITH expired_rows AS (
        DELETE FROM request_rate_limits
        WHERE expires_at < $1::timestamptz - interval '1 day'
      )
      INSERT INTO request_rate_limits (
        scope,
        key_hash,
        attempts,
        window_started_at,
        expires_at,
        updated_at
      )
      VALUES ($2, $3, 1, $1, $4, $1)
      ON CONFLICT (scope, key_hash) DO UPDATE
      SET
        attempts = CASE
          WHEN request_rate_limits.expires_at <= EXCLUDED.window_started_at THEN 1
          ELSE LEAST(request_rate_limits.attempts + 1, $5)
        END,
        window_started_at = CASE
          WHEN request_rate_limits.expires_at <= EXCLUDED.window_started_at
            THEN EXCLUDED.window_started_at
          ELSE request_rate_limits.window_started_at
        END,
        expires_at = CASE
          WHEN request_rate_limits.expires_at <= EXCLUDED.window_started_at
            THEN EXCLUDED.expires_at
          ELSE request_rate_limits.expires_at
        END,
        updated_at = EXCLUDED.updated_at
      RETURNING attempts, expires_at
    `,
    [
      now.toISOString(),
      policy.scope,
      keyHash,
      expiresAt.toISOString(),
      policy.limit + 1,
    ],
  )

  const row = result.rows[0]
  if (!row) throw new Error('RATE_LIMIT_RESULT_MISSING')

  const attempts = Number(row.attempts)
  if (!Number.isSafeInteger(attempts)) throw new Error('RATE_LIMIT_ATTEMPTS_INVALID')

  const resetAt = new Date(row.expires_at)
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetAt.getTime() - now.getTime()) / 1_000),
  )

  return {
    allowed: attempts <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - attempts),
    resetAt,
    retryAfterSeconds,
  }
}
