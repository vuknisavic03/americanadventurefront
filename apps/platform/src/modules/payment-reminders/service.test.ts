import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  listCandidatesForPaymentReminders,
  runAutomatedPaymentRemindersJob,
  sendPaymentReminder,
} from './service.ts'

type MockDoc = Record<string, unknown>

describe('Payment reminders service (FR-039)', () => {
  const asOf = new Date('2026-04-10T12:00:00.000Z')

  let mockProcesses: Record<number, MockDoc>
  let mockAccounts: Record<number, MockDoc>
  let mockApplicants: Record<number, MockDoc>
  let mockPlans: MockDoc[]
  let mockCommLogs: MockDoc[]
  let mockAuditEvents: MockDoc[]

  beforeEach(() => {
    mockProcesses = {
      1: {
        candidateAccount: 10,
        id: 1,
        preApplication: 100,
        programCode: 'SWT',
      },
      2: {
        candidateAccount: 20,
        id: 2,
        preApplication: 200,
        programCode: 'SWT',
      },
    }

    mockAccounts = {
      10: {
        applicant: 101,
        email: 'marko@example.test',
        fullName: 'Marko Jovanović',
        id: 10,
      },
      20: {
        applicant: 201,
        email: 'ana@example.test',
        fullName: 'Ana Nikolić',
        id: 20,
      },
    }

    mockApplicants = {
      101: {
        correlationId: 'corr-101',
        firstName: 'Marko',
        id: 101,
        lastName: 'Jovanović',
        phone: '+381641234567',
        phoneNormalized: '+381641234567',
      },
      201: {
        correlationId: 'corr-201',
        firstName: 'Ana',
        id: 201,
        lastName: 'Nikolić',
        phone: '+381657654321',
        phoneNormalized: '+381657654321',
      },
    }

    mockPlans = [
      {
        candidateAccount: 10,
        candidateProcess: 1,
        id: 501,
        obligations: [
          {
            amountCents: 35000,
            dueAt: '2026-03-01T00:00:00.000Z',
            key: 'INITIAL',
            label: 'I rata programa',
          },
          {
            amountCents: 70000,
            dueAt: '2026-04-14T00:00:00.000Z', // 4 days -> PRE_DUE
            key: 'INSTALLMENT_2',
            label: 'II rata programa',
          },
        ],
        paidCents: 35000,
        remainingCents: 70000,
        selectedMethod: 'INSTALLMENTS',
        status: 'ACTIVE',
        totalCents: 105000,
      },
      {
        candidateAccount: 20,
        candidateProcess: 2,
        id: 502,
        obligations: [
          {
            amountCents: 50000,
            dueAt: '2026-04-05T00:00:00.000Z', // Past due -> OVERDUE
            key: 'INITIAL',
            label: 'I rata programa',
          },
        ],
        paidCents: 0,
        remainingCents: 50000,
        selectedMethod: 'INSTALLMENTS',
        status: 'ACTIVE',
        totalCents: 50000,
      },
    ]

    mockCommLogs = []
    mockAuditEvents = []
  })

  function createMockPayload(): Payload {
    return {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        const id = Math.floor(Math.random() * 10000) + 1
        const doc = { id, ...data }
        if (collection === 'communication-logs') mockCommLogs.push(doc)
        if (collection === 'audit-events') mockAuditEvents.push(doc)
        return doc
      }),
      find: vi.fn(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
        if (collection === 'candidate-payment-plans') {
          const candidateProcess = where?.candidateProcess as { equals?: number } | undefined
          if (candidateProcess?.equals) {
            const pId = candidateProcess.equals
            const docs = mockPlans.filter((p) => p.candidateProcess === pId)
            return { docs, totalDocs: docs.length }
          }
          return { docs: mockPlans, totalDocs: mockPlans.length }
        }
        if (collection === 'communication-logs') {
          let docs = [...mockCommLogs]
          const andConditions = where?.and as Array<Record<string, { equals?: unknown }>> | undefined
          if (andConditions) {
            for (const cond of andConditions) {
              if (cond.idempotencyKey?.equals) {
                docs = docs.filter((l) => l.idempotencyKey === cond.idempotencyKey?.equals)
              }
              if (cond.status?.equals) {
                docs = docs.filter((l) => l.status === cond.status?.equals)
              }
            }
          }
          return { docs, totalDocs: docs.length }
        }
        return { docs: [], totalDocs: 0 }
      }),
      findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'candidate-processes') return mockProcesses[id] || null
        if (collection === 'candidate-accounts') return mockAccounts[id] || null
        if (collection === 'applicants') return mockApplicants[id] || null
        return null
      }),
    } as unknown as Payload
  }

  it('lists candidates with evaluated obligations and stats', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesForPaymentReminders({
      asOfDate: asOf,
      payload,
    })

    expect(result.items).toHaveLength(2)
    expect(result.stats.totalActivePlans).toBe(2)
    expect(result.stats.preDueCount).toBe(1) // Candidate 1 has PRE_DUE II rata
    expect(result.stats.overdueCount).toBe(1) // Candidate 2 has OVERDUE I rata
    expect(result.stats.eligibleCount).toBe(2)

    const marko = result.items.find((i) => i.fullName === 'Marko Jovanović')
    expect(marko).toBeDefined()
    expect(marko?.activeObligation?.key).toBe('INSTALLMENT_2')
    expect(marko?.activeObligation?.trigger).toBe('PRE_DUE')

    const ana = result.items.find((i) => i.fullName === 'Ana Nikolić')
    expect(ana).toBeDefined()
    expect(ana?.activeObligation?.trigger).toBe('OVERDUE')
  })

  it('filters candidates by trigger type (e.g. OVERDUE only)', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesForPaymentReminders({
      asOfDate: asOf,
      payload,
      triggerFilter: 'OVERDUE',
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].fullName).toBe('Ana Nikolić')
  })

  it('dispatches payment reminder across Email, SMS and In-App, recording audit logs', async () => {
    const payload = createMockPayload()
    const results = await sendPaymentReminder({
      administratorId: 99,
      asOfDate: asOf,
      input: {
        candidateProcessId: 1,
        obligationKey: 'INSTALLMENT_2',
      },
      payload,
    })

    expect(results).toHaveLength(3) // EMAIL, SMS, IN_APP
    expect(results.every((r) => r.status === 'DELIVERED')).toBe(true)

    // Verify communication-logs records
    expect(mockCommLogs).toHaveLength(3)
    const emailLog = mockCommLogs.find((l) => l.channel === 'EMAIL')
    expect(emailLog).toBeDefined()
    expect(emailLog?.recipient).toBe('marko@example.test')
    expect(String(emailLog?.subject)).toContain('Podsetnik za dospeće rate: II rata programa')
    expect(emailLog?.sentBy).toBe(99)

    const smsLog = mockCommLogs.find((l) => l.channel === 'SMS')
    expect(smsLog).toBeDefined()
    expect(smsLog?.recipient).toBe('+381641234567')

    const inAppLog = mockCommLogs.find((l) => l.channel === 'IN_APP')
    expect(inAppLog).toBeDefined()

    // Verify audit events recorded
    expect(mockAuditEvents).toHaveLength(3)
    expect(mockAuditEvents[0].eventType).toBe('PAYMENT_REMINDER_SENT')
    expect(mockAuditEvents[0].actor).toBe(99)
  })

  it('skips duplicate sending idempotently when already delivered for the same cycle', async () => {
    const payload = createMockPayload()

    // First send
    const firstRun = await sendPaymentReminder({
      administratorId: 99,
      asOfDate: asOf,
      input: {
        candidateProcessId: 1,
        channel: 'EMAIL',
        obligationKey: 'INSTALLMENT_2',
      },
      payload,
    })
    expect(firstRun[0].status).toBe('DELIVERED')
    expect(mockCommLogs).toHaveLength(1)

    // Second send without force
    const secondRun = await sendPaymentReminder({
      administratorId: 99,
      asOfDate: asOf,
      input: {
        candidateProcessId: 1,
        channel: 'EMAIL',
        obligationKey: 'INSTALLMENT_2',
      },
      payload,
    })
    expect(secondRun[0].status).toBe('SKIPPED')
    expect(secondRun[0].reason).toBe('ALREADY_DELIVERED')
    expect(mockCommLogs).toHaveLength(1) // No new log added
  })

  it('allows forced re-sending when force flag is set', async () => {
    const payload = createMockPayload()

    await sendPaymentReminder({
      asOfDate: asOf,
      input: {
        candidateProcessId: 1,
        channel: 'EMAIL',
        obligationKey: 'INSTALLMENT_2',
      },
      payload,
    })

    const forcedRun = await sendPaymentReminder({
      asOfDate: asOf,
      input: {
        candidateProcessId: 1,
        channel: 'EMAIL',
        force: true,
        obligationKey: 'INSTALLMENT_2',
      },
      payload,
    })
    expect(forcedRun[0].status).toBe('DELIVERED')
    expect(mockCommLogs).toHaveLength(2)
  })

  it('rejects sending reminder for an already paid obligation', async () => {
    const payload = createMockPayload()

    await expect(
      sendPaymentReminder({
        asOfDate: asOf,
        input: {
          candidateProcessId: 1,
          obligationKey: 'INITIAL', // Already paid
        },
        payload,
      }),
    ).rejects.toThrow('već u celosti izmirena')
  })

  it('supports dryRun mode in automated job runner', async () => {
    const payload = createMockPayload()
    const jobRes = await runAutomatedPaymentRemindersJob({
      asOfDate: asOf,
      dryRun: true,
      payload,
    })

    expect(jobRes.totalEvaluated).toBe(2)
    expect(jobRes.eligible).toBe(2)
    expect(jobRes.dispatched).toBe(0)
    expect(mockCommLogs).toHaveLength(0)
  })
})
