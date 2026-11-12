import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  applyDiscountsForProcess,
  claimDiscount,
  getAmbassadorSummary,
  getApplicableDiscountsForProcess,
  getCandidateDiscounts,
  getGroupSummary,
  rejectDiscount,
  verifyDiscount,
} from './service.ts'

describe('discounts service', () => {
  const mockProcess = {
    candidateAccount: 10,
    currentStep: 'PROGRAM_OFFER_SELECTION',
    id: 100,
    preApplication: 1,
  }

  const mockPreApplication = {
    correlationId: 'test-correlation-123',
    id: 1,
    status: 'READY_FOR_OFFER',
    workflowVersion: 1,
  }

  const mockGroup = {
    discountPerMemberCents: 5000,
    groupCode: 'GRP-FON-26',
    id: 201,
    minMembers: 3,
    name: 'FON Ekipa 2026',
    status: 'ACTIVE',
  }

  const mockAmbassador = {
    defaultDiscountCents: 5000,
    email: 'ambassador@example.com',
    fullName: 'Jelena Janković',
    id: 301,
    referralCode: 'JELENA2026',
    rewardPerReferralCents: 2500,
    status: 'ACTIVE',
  }

  it('rejects if candidate process is not found', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue(undefined),
    } as unknown as Payload

    await expect(
      claimDiscount({
        actor: { collection: 'candidate-accounts', id: 10 },
        candidateProcessId: 999,
        input: { groupCode: 'GRP-FON-26', type: 'GROUP' },
        payload,
      }),
    ).rejects.toThrow('Kandidatski proces nije pronađen.')
  })

  it('rejects if candidate tries to claim discount for a different account', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue(mockProcess),
    } as unknown as Payload

    await expect(
      claimDiscount({
        actor: { collection: 'candidate-accounts', id: 99 },
        candidateProcessId: 100,
        input: { groupCode: 'GRP-FON-26', type: 'GROUP' },
        payload,
      }),
    ).rejects.toThrow('Nemate dozvolu')
  })

  it('claims a group discount with leader role for the first member', async () => {
    const mockCreated = {
      amountCents: 5000,
      createdAt: '2026-10-12T10:00:00.000Z',
      discountType: 'GROUP',
      groupCode: 'GRP-FON-26',
      groupMemberRole: 'LEADER',
      id: 501,
      label: 'Grupni popust (FON Ekipa 2026)',
      status: 'VERIFIED',
    }

    const createdAudits: Array<Record<string, unknown>> = []
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'audit-events') {
          createdAudits.push(data)
          return { id: 901 }
        }
        return mockCreated
      }),
      find: vi.fn(async ({ collection, where }: { collection: string; where?: { and?: Array<Record<string, unknown>> } }) => {
        if (collection === 'candidate-discounts') {
          if (where?.and?.[1]?.discountType) return { docs: [] }
          if (where?.and?.[0]?.discountGroup) return { docs: [] }
        }
        if (collection === 'discount-groups') {
          return { docs: [mockGroup] }
        }
        return { docs: [] }
      }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return mockProcess
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
    } as unknown as Payload

    const res = await claimDiscount({
      actor: { collection: 'candidate-accounts', id: 10 },
      candidateProcessId: 100,
      input: { groupCode: 'grp-fon-26', type: 'GROUP' },
      payload,
    })

    expect(res.discountType).toBe('GROUP')
    expect(res.status).toBe('VERIFIED')
    expect(res.amountCents).toBe(5000)
    expect(res.groupMemberRole).toBe('LEADER')
    expect(createdAudits).toHaveLength(1)
    expect(createdAudits[0].eventType).toBe('DISCOUNT_CLAIMED')
  })

  it('claims a brand ambassador discount with default discount amount', async () => {
    const mockCreated = {
      amountCents: 5000,
      createdAt: '2026-10-12T10:00:00.000Z',
      discountType: 'BRAND_AMBASSADOR',
      ambassadorCode: 'JELENA2026',
      id: 502,
      label: 'Brand Ambassador popust (Jelena Janković)',
      status: 'VERIFIED',
    }

    const payload = {
      create: vi.fn(async () => mockCreated),
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-discounts') return { docs: [] }
        if (collection === 'brand-ambassadors') return { docs: [mockAmbassador] }
        return { docs: [] }
      }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return mockProcess
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
    } as unknown as Payload

    const res = await claimDiscount({
      actor: { collection: 'candidate-accounts', id: 10 },
      candidateProcessId: 100,
      input: { ambassadorCode: '  jelena2026  ', type: 'BRAND_AMBASSADOR' },
      payload,
    })

    expect(res.discountType).toBe('BRAND_AMBASSADOR')
    expect(res.status).toBe('VERIFIED')
    expect(res.amountCents).toBe(5000)
  })

  it('claims family discount with PENDING status for admin review', async () => {
    const mockCreated = {
      amountCents: 5000,
      createdAt: '2026-10-12T10:00:00.000Z',
      discountType: 'FAMILY',
      id: 503,
      kinshipType: 'SIBLING',
      label: 'Porodični popust (Marko Marković)',
      relativeFullName: 'Marko Marković',
      status: 'PENDING',
    }

    const payload = {
      create: vi.fn(async () => mockCreated),
      find: vi.fn(async () => ({ docs: [] })),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return mockProcess
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
    } as unknown as Payload

    const res = await claimDiscount({
      actor: { collection: 'candidate-accounts', id: 10 },
      candidateProcessId: 100,
      input: {
        kinshipType: 'SIBLING',
        relativeFullName: 'Marko Marković',
        type: 'FAMILY',
      },
      payload,
    })

    expect(res.discountType).toBe('FAMILY')
    expect(res.status).toBe('PENDING')
    expect(res.amountCents).toBe(5000)
  })

  it('claims returnee discount and validates previous year', async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [] })),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return mockProcess
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
    } as unknown as Payload

    await expect(
      claimDiscount({
        actor: { collection: 'candidate-accounts', id: 10 },
        candidateProcessId: 100,
        input: {
          returneePreviousYear: 2008,
          type: 'RETURNEE',
        },
        payload,
      }),
    ).rejects.toThrow('Godina prethodnog učešća mora biti')
  })

  it('allows admin to grant a custom discount', async () => {
    const mockCreated = {
      amountCents: 7500,
      createdAt: '2026-10-12T10:00:00.000Z',
      discountType: 'CUSTOM',
      id: 505,
      label: 'Sajamski popust 2026',
      status: 'VERIFIED',
    }

    const payload = {
      create: vi.fn(async () => mockCreated),
      find: vi.fn(async () => ({ docs: [] })),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return mockProcess
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
    } as unknown as Payload

    const res = await claimDiscount({
      actor: { collection: 'users', id: 1 },
      candidateProcessId: 100,
      input: {
        customAmountCents: 7500,
        customLabel: 'Sajamski popust 2026',
        type: 'CUSTOM',
      },
      payload,
    })

    expect(res.discountType).toBe('CUSTOM')
    expect(res.amountCents).toBe(7500)
    expect(res.status).toBe('VERIFIED')
  })

  it('verifies a pending discount and records audit event', async () => {
    const mockPendingDiscount = {
      amountCents: 5000,
      candidateAccount: 10,
      candidateProcess: 100,
      discountType: 'FAMILY',
      id: 503,
      label: 'Porodični popust (Marko Marković)',
      preApplication: 1,
      status: 'PENDING',
    }

    const mockUpdated = {
      ...mockPendingDiscount,
      status: 'VERIFIED',
      verificationNote: 'Potvrđeno ugovorom brata',
      verifiedAt: '2026-10-12T11:00:00.000Z',
      verifiedBy: 1,
    }

    const createdAudits: Array<Record<string, unknown>> = []
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'audit-events') createdAudits.push(data)
        return { id: 902 }
      }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-discounts') return mockPendingDiscount
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
      update: vi.fn(async () => mockUpdated),
    } as unknown as Payload

    const verified = await verifyDiscount({
      adminUserId: 1,
      discountId: 503,
      note: 'Potvrđeno ugovorom brata',
      payload,
    })

    expect(verified.status).toBe('VERIFIED')
    expect(verified.verifiedById).toBe(1)
    expect(createdAudits[0].eventType).toBe('DISCOUNT_VERIFIED')
  })

  it('rejects a discount and records reason in audit trail', async () => {
    const mockPendingDiscount = {
      amountCents: 5000,
      candidateAccount: 10,
      candidateProcess: 100,
      discountType: 'LIFEGUARD',
      id: 504,
      label: 'Lifeguard popust',
      preApplication: 1,
      status: 'PENDING',
    }

    const mockUpdated = {
      ...mockPendingDiscount,
      status: 'REJECTED',
      verificationNote: 'Sertifikat je istekao',
      verifiedAt: '2026-10-12T11:00:00.000Z',
      verifiedBy: 1,
    }

    const createdAudits: Array<Record<string, unknown>> = []
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'audit-events') createdAudits.push(data)
        return { id: 903 }
      }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-discounts') return mockPendingDiscount
        if (collection === 'pre-applications') return mockPreApplication
        return undefined
      }),
      update: vi.fn(async () => mockUpdated),
    } as unknown as Payload

    const rejected = await rejectDiscount({
      adminUserId: 1,
      discountId: 504,
      payload,
      reason: 'Sertifikat je istekao',
    })

    expect(rejected.status).toBe('REJECTED')
    expect(createdAudits[0].eventType).toBe('DISCOUNT_REJECTED')
  })

  it('applies verified discounts to candidate process', async () => {
    const verifiedDocs = [
      {
        amountCents: 5000,
        candidateAccount: 10,
        candidateProcess: 100,
        discountType: 'GROUP',
        id: 501,
        label: 'Grupni popust',
        preApplication: 1,
        status: 'VERIFIED',
      },
      {
        amountCents: 10000,
        candidateAccount: 10,
        candidateProcess: 100,
        discountType: 'RETURNEE',
        id: 502,
        label: 'Returnee popust',
        preApplication: 1,
        status: 'VERIFIED',
      },
    ]

    const createdAudits: Array<Record<string, unknown>> = []
    const payload = {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'audit-events') createdAudits.push(data)
        return { id: 904 }
      }),
      find: vi.fn(async () => ({ docs: verifiedDocs })),
      findByID: vi.fn(async () => mockPreApplication),
      update: vi.fn(async ({ data, id }: { data: Record<string, unknown>; id: number }) => {
        const found = verifiedDocs.find((d) => d.id === id)!
        return { ...found, ...data }
      }),
    } as unknown as Payload

    const applied = await applyDiscountsForProcess({
      candidateProcessId: 100,
      payload,
    })

    expect(applied).toHaveLength(2)
    expect(applied[0].status).toBe('APPLIED')
    expect(applied[1].status).toBe('APPLIED')
    expect(createdAudits).toHaveLength(2)
    expect(createdAudits[0].eventType).toBe('DISCOUNT_APPLIED')
  })

  it('retrieves candidate and applicable discounts', async () => {
    const docs = [
      {
        amountCents: 5000,
        candidateAccount: 10,
        candidateProcess: 100,
        discountType: 'GROUP',
        id: 501,
        label: 'Grupni popust',
        preApplication: 1,
        status: 'VERIFIED',
      },
      {
        amountCents: 5000,
        candidateAccount: 10,
        candidateProcess: 100,
        discountType: 'FAMILY',
        id: 502,
        label: 'Porodični popust',
        preApplication: 1,
        status: 'PENDING',
      },
    ]

    const payload = {
      find: vi.fn(async () => ({ docs })),
    } as unknown as Payload

    const allDiscounts = await getCandidateDiscounts({ candidateProcessId: 100, payload })
    expect(allDiscounts).toHaveLength(2)

    const payloadApplicable = {
      find: vi.fn(async () => ({ docs: [docs[0]] })),
    } as unknown as Payload

    const applicable = await getApplicableDiscountsForProcess({ candidateProcessId: 100, payload: payloadApplicable })
    expect(applicable).toHaveLength(1)
    expect(applicable[0].discountType).toBe('GROUP')
  })

  it('generates group and ambassador summaries', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-discounts') {
          return {
            docs: [
              {
                amountCents: 5000,
                candidateAccount: { email: 'student1@fon.bg.ac.rs', id: 10 },
                candidateProcess: 100,
                groupMemberRole: 'LEADER',
                id: 501,
                status: 'VERIFIED',
              },
              {
                amountCents: 5000,
                candidateAccount: { email: 'student2@fon.bg.ac.rs', id: 11 },
                candidateProcess: 101,
                groupMemberRole: 'MEMBER',
                id: 502,
                status: 'VERIFIED',
              },
            ],
          }
        }
        return { docs: [] }
      }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'discount-groups') return mockGroup
        if (collection === 'brand-ambassadors') return mockAmbassador
        return undefined
      }),
    } as unknown as Payload

    const groupSummary = await getGroupSummary({ groupId: 201, payload })
    expect(groupSummary.groupCode).toBe('GRP-FON-26')
    expect(groupSummary.totalMembers).toBe(2)
    expect(groupSummary.members[0].role).toBe('LEADER')

    const ambassadorSummary = await getAmbassadorSummary({ ambassadorId: 301, payload })
    expect(ambassadorSummary.ambassadorCode).toBe('JELENA2026')
    expect(ambassadorSummary.totalReferrals).toBe(2)
  })
})
