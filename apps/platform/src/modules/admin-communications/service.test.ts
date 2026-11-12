import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import type { PlatformEnvironment } from '../../config/environment.ts'
import {
  getCommunicationTemplatesCatalog,
  listCandidateNotifications,
  listCommunicationLogs,
  markCandidateNotificationsAsRead,
  resolveCandidateTarget,
  sendBatchCandidateCommunication,
  sendCandidateCommunication,
} from './service.ts'

const mockEnvironment: PlatformEnvironment = {
  candidateCommunication: {
    consultationBookingUrl: 'http://localhost:3000/konsultacije',
    from: 'American Adventure <test@example.com>',
    officialPhone: '+381 11 000 0000',
    privacyPolicyUrl: 'http://localhost:3000/privatnost',
    provider: 'capture',
    replyTo: 'test@example.com',
  },
  candidateSms: {
    provider: 'capture',
    sender: 'AmAdventure',
  },
  consultationScheduling: {},
  databaseUrl: 'postgres://test',
  operations: {
    flightRequestNotificationEmail: 'ops@example.com',
  },
  payloadSecret: 'secret',
  security: {
    trustedProxyHops: 0,
  },
  serverUrl: 'http://localhost:3000',
}

describe('Admin Communications Service', () => {
  const mockProcess = {
    applicant: {
      email: 'petar@example.test',
      firstName: 'Petar',
      id: 101,
      lastName: 'Petrović',
      phone: '+38164111222',
    },
    candidateAccount: {
      id: 201,
    },
    createdAt: '2026-06-01T10:00:00Z',
    currentStep: 'VISA_PROCESSING',
    id: 1,
    preApplication: {
      id: 301,
    },
    processStatus: 'ACTIVE',
    programCode: 'SWT',
  }

  type MockDoc = Record<string, unknown> & { id: number }

  function createMockPayload() {
    const createdLogs: MockDoc[] = []
    const createdAuditEvents: MockDoc[] = []
    let nextLogId = 1

    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'communication-logs') {
          const doc = { ...data, createdAt: new Date().toISOString(), id: nextLogId++ }
          createdLogs.push(doc)
          return doc
        }
        if (collection === 'audit-events') {
          const doc = { ...data, id: nextLogId++ }
          createdAuditEvents.push(doc)
          return doc
        }
        return { ...data, id: nextLogId++ }
      }),
      findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'candidate-processes' && id === 1) {
          return mockProcess
        }
        return null
      }),
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'communication-logs') {
          return {
            docs: createdLogs,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20,
            page: 1,
            totalDocs: createdLogs.length,
            totalPages: 1,
          }
        }
        if (collection === 'candidate-processes') {
          return {
            docs: [mockProcess],
            hasNextPage: false,
            hasPrevPage: false,
            limit: 500,
            page: 1,
            totalDocs: 1,
            totalPages: 1,
          }
        }
        return {
          docs: [],
          hasNextPage: false,
          hasPrevPage: false,
          limit: 100,
          page: 1,
          totalDocs: 0,
          totalPages: 0,
        }
      }),
      update: vi.fn(async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
        if (collection === 'communication-logs') {
          const item = createdLogs.find((l) => l.id === id)
          if (item) {
            Object.assign(item, data)
            return item
          }
        }
        return { ...data, id }
      }),
    } as unknown as Payload

    return { createdAuditEvents, createdLogs, payload }
  }

  it('resolves candidate communication target from process', async () => {
    const { payload } = createMockPayload()
    const target = await resolveCandidateTarget(payload, 1)

    expect(target.candidateProcessId).toBe(1)
    expect(target.candidateAccountId).toBe(201)
    expect(target.firstName).toBe('Petar')
    expect(target.lastName).toBe('Petrović')
    expect(target.fullName).toBe('Petar Petrović')
    expect(target.email).toBe('petar@example.test')
    expect(target.phone).toBe('+38164111222')
    expect(target.programCode).toBe('SWT')
  })

  it('sends single candidate EMAIL communication using template', async () => {
    const { createdAuditEvents, createdLogs, payload } = createMockPayload()

    const result = await sendCandidateCommunication({
      adminId: 99,
      data: {
        candidateProcessId: 1,
        channel: 'EMAIL',
        templateKey: 'EMAIL_GENERAL_ANNOUNCEMENT',
        templateParams: {
          customNote: 'Vaša prijava je uspešno prihvaćena.',
        },
      },
      environment: mockEnvironment,
      payload,
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe('DELIVERED')
    expect(result.recipient).toBe('petar@example.test')
    expect(createdLogs.length).toBe(1)
    expect(createdLogs[0].channel).toBe('EMAIL')
    expect(createdLogs[0].recipient).toBe('petar@example.test')
    expect(createdLogs[0].body).toContain('Vaša prijava je uspešno prihvaćena.')
    expect(createdAuditEvents.length).toBe(1)
    expect(createdAuditEvents[0].eventType).toBe('ADMIN_COMMUNICATION_SENT')
  })

  it('sends single candidate SMS communication with action required', async () => {
    const { createdAuditEvents, createdLogs, payload } = createMockPayload()

    const result = await sendCandidateCommunication({
      adminId: 99,
      data: {
        actionRequiredDueAt: '2026-11-15T12:00:00.000Z',
        actionRequiredTitle: 'Dostava pasoša',
        candidateProcessId: 1,
        channel: 'SMS',
        templateKey: 'SMS_URGENT_ACTION',
      },
      environment: mockEnvironment,
      payload,
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe('DELIVERED')
    expect(result.recipient).toBe('+38164111222')
    expect(createdLogs.length).toBe(1)
    expect(createdLogs[0].channel).toBe('SMS')
    expect(createdLogs[0].actionRequiredTitle).toBe('Dostava pasoša')
    expect(createdAuditEvents.length).toBe(1)
  })

  it('sends single candidate IN_APP notification', async () => {
    const { createdAuditEvents, createdLogs, payload } = createMockPayload()

    const result = await sendCandidateCommunication({
      adminId: 99,
      data: {
        actionRequiredDueAt: '2026-12-01T10:00:00.000Z',
        actionRequiredTitle: 'Potpis ugovora',
        candidateProcessId: 1,
        channel: 'IN_APP',
        templateKey: 'IN_APP_ACTION_REQUIRED',
      },
      environment: mockEnvironment,
      payload,
    })

    expect(result.success).toBe(true)
    expect(result.provider).toBe('in-app')
    expect(createdLogs.length).toBe(1)
    expect(createdLogs[0].isRead).toBe(false)
    expect(createdLogs[0].candidateAccount).toBe(201)
    expect(createdAuditEvents.length).toBe(1)
  })

  it('sends batch communication to filtered candidates', async () => {
    const { createdAuditEvents, createdLogs, payload } = createMockPayload()

    const batchResult = await sendBatchCandidateCommunication({
      adminId: 99,
      data: {
        actionRequiredDueAt: '2026-12-01T10:00:00.000Z',
        actionRequiredTitle: 'Potvrda leta',
        candidateProcessIds: [1],
        channel: 'IN_APP',
        templateKey: 'IN_APP_ACTION_REQUIRED',
      },
      environment: mockEnvironment,
      payload,
    })

    expect(batchResult.total).toBe(1)
    expect(batchResult.succeeded).toBe(1)
    expect(batchResult.failed).toBe(0)
    expect(createdLogs.length).toBe(1)
    expect(createdAuditEvents.some((e) => e.eventType === 'ADMIN_BATCH_COMMUNICATION_SENT')).toBe(true)
  })

  it('lists communication logs and candidate notifications', async () => {
    const { createdLogs, payload } = createMockPayload()

    // Add a dummy notification to logs
    createdLogs.push({
      actionRequiredDueAt: '2026-12-01T10:00:00.000Z',
      actionRequiredTitle: 'Potpis',
      body: 'Molimo potpišite ugovor.',
      candidateAccount: 201,
      candidateProcess: 1,
      channel: 'IN_APP',
      createdAt: '2026-06-01T10:00:00Z',
      id: 10,
      isRead: false,
      recipient: 'Petar Petrović',
      sentAt: '2026-06-01T10:00:00Z',
      status: 'DELIVERED',
      subject: 'Potpis',
      templateKey: 'IN_APP_ACTION_REQUIRED',
    })

    const logsResult = await listCommunicationLogs({
      filters: { limit: 20, page: 1 },
      payload,
    })
    expect(logsResult.docs.length).toBe(1)

    const notifsResult = await listCandidateNotifications({
      candidateAccountId: 201,
      filters: { limit: 20, page: 1 },
      payload,
    })
    expect(notifsResult.items.length).toBe(1)
    expect(notifsResult.items[0].isRead).toBe(false)

    // Mark as read
    const markResult = await markCandidateNotificationsAsRead({
      candidateAccountId: 201,
      notificationIds: [10],
      payload,
    })
    expect(markResult.markedCount).toBe(1)
    expect(createdLogs[0].isRead).toBe(true)
  })

  it('retrieves templates catalog with SMS metrics', () => {
    const catalog = getCommunicationTemplatesCatalog('SMS')
    expect(catalog.length).toBeGreaterThan(0)
    for (const item of catalog) {
      expect(item.channel).toBe('SMS')
      expect(item.smsMetrics).toBeDefined()
    }
  })
})
