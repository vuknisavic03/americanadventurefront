export type HealthStatus = {
  service: 'american-adventure-platform'
  status: 'ok'
  timestamp: string
}

export type ReadinessStatus = {
  service: 'american-adventure-platform'
  status: 'ready' | 'unavailable'
  timestamp: string
}

export function createHealthStatus(now: Date = new Date()): HealthStatus {
  return {
    service: 'american-adventure-platform',
    status: 'ok',
    timestamp: now.toISOString(),
  }
}

export function createReadinessStatus(
  available: boolean,
  now: Date = new Date(),
): ReadinessStatus {
  return {
    service: 'american-adventure-platform',
    status: available ? 'ready' : 'unavailable',
    timestamp: now.toISOString(),
  }
}

