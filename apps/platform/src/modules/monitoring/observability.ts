import { randomUUID, timingSafeEqual } from 'node:crypto'

import type { Payload } from 'payload'

const recentFailureWindowMs = 24 * 60 * 60 * 1000
const stuckProcessingMs = 15 * 60 * 1000

export type OperationalSignals = {
  activeRateLimitBlocks: number
  failedCommunicationEvents: number
  overdueCommunicationEvents: number
  stuckCommunicationEvents: number
  stuckJobs: number
  terminalJobFailures: number
}

export type OperationalStatus = {
  checks: {
    backgroundJobs: 'ok' | 'degraded'
    candidateCommunications: 'ok' | 'degraded'
    database: 'ok'
    security: 'ok' | 'attention'
  }
  service: 'american-adventure-platform'
  signals: OperationalSignals
  status: 'ok' | 'degraded'
  timestamp: string
}

export function isObservabilityRequestAuthorized(
  authorization: string | null,
  configuredToken?: string,
): boolean {
  if (!configuredToken || !authorization?.startsWith('Bearer ')) return false
  const supplied = authorization.slice('Bearer '.length)
  if (!supplied || supplied.length > 1024) return false

  const expectedBytes = Buffer.from(configuredToken)
  const suppliedBytes = Buffer.from(supplied)
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes)
}

export function summarizeOperationalSignals(
  signals: OperationalSignals,
  now: Date = new Date(),
): OperationalStatus {
  const communicationsDegraded =
    signals.failedCommunicationEvents > 0 ||
    signals.overdueCommunicationEvents > 0 ||
    signals.stuckCommunicationEvents > 0
  const jobsDegraded = signals.stuckJobs > 0 || signals.terminalJobFailures > 0

  return {
    checks: {
      backgroundJobs: jobsDegraded ? 'degraded' : 'ok',
      candidateCommunications: communicationsDegraded ? 'degraded' : 'ok',
      database: 'ok',
      security: signals.activeRateLimitBlocks > 0 ? 'attention' : 'ok',
    },
    service: 'american-adventure-platform',
    signals,
    status: communicationsDegraded || jobsDegraded ? 'degraded' : 'ok',
    timestamp: now.toISOString(),
  }
}

export async function collectOperationalStatus(
  payload: Pick<Payload, 'count'>,
  now: Date = new Date(),
): Promise<OperationalStatus> {
  const nowIso = now.toISOString()
  const stuckBefore = new Date(now.getTime() - stuckProcessingMs).toISOString()
  const recentFailureAfter = new Date(now.getTime() - recentFailureWindowMs).toISOString()

  const [
    failedOutboxCommunicationEvents,
    failedEmbassyReminderDeliveries,
    overdueCommunicationEvents,
    stuckCommunicationEvents,
    terminalJobFailures,
    stuckJobs,
    activeRateLimitBlocks,
  ] = await Promise.all([
    payload.count({ collection: 'outbox-events', where: { status: { equals: 'FAILED' } } }),
    payload.count({ collection: 'embassy-reminder-deliveries', where: { status: { equals: 'FAILED' } } }),
    payload.count({
      collection: 'outbox-events',
      where: {
        and: [
          { status: { in: ['PENDING', 'FAILED'] } },
          { availableAt: { less_than_equal: nowIso } },
        ],
      },
    }),
    payload.count({
      collection: 'outbox-events',
      where: {
        and: [
          { status: { equals: 'PROCESSING' } },
          { updatedAt: { less_than: stuckBefore } },
        ],
      },
    }),
    payload.count({
      collection: 'payload-jobs',
      where: {
        and: [
          { hasError: { equals: true } },
          { updatedAt: { greater_than_equal: recentFailureAfter } },
        ],
      },
    }),
    payload.count({
      collection: 'payload-jobs',
      where: {
        and: [
          { processing: { equals: true } },
          { updatedAt: { less_than: stuckBefore } },
        ],
      },
    }),
    payload.count({
      collection: 'request-rate-limits',
      where: {
        and: [
          { attempts: { greater_than_equal: 5 } },
          { expiresAt: { greater_than: nowIso } },
        ],
      },
    }),
  ])

  return summarizeOperationalSignals({
    activeRateLimitBlocks: activeRateLimitBlocks.totalDocs,
    failedCommunicationEvents: failedOutboxCommunicationEvents.totalDocs + failedEmbassyReminderDeliveries.totalDocs,
    overdueCommunicationEvents: overdueCommunicationEvents.totalDocs,
    stuckCommunicationEvents: stuckCommunicationEvents.totalDocs,
    stuckJobs: stuckJobs.totalDocs,
    terminalJobFailures: terminalJobFailures.totalDocs,
  }, now)
}

export async function withHealthTimeout<T>(operation: Promise<T>, timeoutMs = 15_000): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Health check timed out.')), timeoutMs)
  })

  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

type OperationalEvent = {
  correlationId: string
  errorType: string
  event: 'operations_status_failed' | 'readiness_check_failed'
  level: 'error'
  service: 'american-adventure-platform'
  timestamp: string
}

function safeErrorType(error: unknown): string {
  const name = error instanceof Error ? error.name : 'UnknownError'
  return /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name) ? name : 'UnknownError'
}

export function createOperationalEvent(
  event: OperationalEvent['event'],
  error: unknown,
  now: Date = new Date(),
  correlationId: string = randomUUID(),
): OperationalEvent {
  return {
    correlationId,
    errorType: safeErrorType(error),
    event,
    level: 'error',
    service: 'american-adventure-platform',
    timestamp: now.toISOString(),
  }
}

export function logOperationalFailure(event: OperationalEvent['event'], error: unknown) {
  console.error(JSON.stringify(createOperationalEvent(event, error)))
}
