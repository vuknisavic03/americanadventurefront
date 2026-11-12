import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  generateGuarantorContract,
  getGuarantorContractPdf,
  getGuarantorForCandidate,
  rejectGuarantor,
  submitGuarantorData,
  uploadGuarantorIdCard,
  verifyGuarantor,
} from './service.ts'
import type { GuarantorSubmissionInput } from './types.ts'

describe('guarantor service', () => {
  const now = new Date('2026-10-12T12:00:00Z')

  beforeEach(() => {
    process.env.SENSITIVE_DATA_ACTIVE_KEY_ID = 'test-v1'
    process.env.SENSITIVE_DATA_ENCRYPTION_KEYS = `test-v1:${Buffer.alloc(32, 7).toString('base64')}`
    process.env.SENSITIVE_DATA_FINGERPRINT_KEY = Buffer.alloc(32, 9).toString('base64')
  })

  const validSubmissionInput: GuarantorSubmissionInput = {
    email: 'marko.petrovic@example.com',
    employerName: 'Telekom Srbija a.d.',
    employmentStatus: 'EMPLOYED',
    fullName: 'Marko Petrović',
    idCardIssuer: 'PU Beograd, PS Stari Grad',
    idCardNumber: '012345678',
    jobTitle: 'Inženjer telekomunikacija',
    jmbg: '1505975710120',
    monthlyIncomeRsd: 120_000,
    phone: '+381641234567',
    promissoryNotesCount: 2,
    relationship: 'PARENT',
    residentialAddress: 'Kneza Miloša 14, 11000 Beograd',
  }

  const mockAccount = {
    _verified: true,
    accountStatus: 'ACTIVE',
    id: 10,
  }

  const mockProcess = {
    candidateAccount: 10,
    currentStep: 'CONTRACT_AND_PAYMENT_PLAN',
    id: 100,
    preApplication: 1,
  }

  const mockSelectionPkz = {
    candidateProcess: 100,
    id: 50,
    payWhenYouEarnSnapshot: {
      deferredAmountCents: 150_000,
      depositCents: 50_000,
      description: 'Platiš kad zaradiš',
    },
    selectedMethod: 'PAY_WHEN_YOU_EARN',
    totalCents: 200_000,
  }

  const mockPreApp = {
    applicant: 5,
    correlationId: 'test-corr-1',
    id: 1,
  }

  const mockApplicant = {
    fullName: 'Petar Petrović',
    id: 5,
    phone: '+38164000111',
    residentialAddress: 'Bulevar kralja Aleksandra 73',
  }

  const mockSensitiveProfile = {
    candidateAccount: 10,
    id: 70,
  }

  it('submits guarantor data successfully for candidate with PKZ payment method', async () => {
    let createdDoc: Record<string, unknown> | null = null
    const payload = {
      create: vi.fn().mockImplementation(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'candidate-guarantors') {
          createdDoc = {
            ...data,
            contractGeneratedAt: null,
            contractPdfSha256: null,
            id: 200,
            submittedAt: now.toISOString(),
          }
          return createdDoc
        }
        if (collection === 'audit-events') {
          return { id: 999 }
        }
        return { id: 1 }
      }),
      find: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return { docs: [mockProcess] }
        if (collection === 'program-offer-selections') return { docs: [mockSelectionPkz] }
        if (collection === 'candidate-sensitive-profiles') return { docs: [mockSensitiveProfile] }
        if (collection === 'candidate-guarantors') return { docs: [] }
        return { docs: [] }
      }),
      findByID: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-accounts') return mockAccount
        if (collection === 'pre-applications') return mockPreApp
        return undefined
      }),
    } as unknown as Payload

    const result = await submitGuarantorData({
      candidateAccountId: 10,
      input: validSubmissionInput,
      now,
      payload,
    })

    expect(result.id).toBe(200)
    expect(result.fullName).toBe('Marko Petrović')
    expect(result.status).toBe('PENDING_REVIEW')
    expect(result.jmbgMasked).toBe('1505975******')
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-guarantors',
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          eventType: 'GUARANTOR_DATA_SUBMITTED',
        }),
      }),
    )
  })

  it('retrieves guarantor data for candidate portal', async () => {
    const mockGuarantorDoc = {
      candidateAccount: 10,
      candidateProcess: 100,
      contractGeneratedAt: null,
      contractPdfSha256: null,
      email: 'marko.petrovic@example.com',
      employerName: 'Telekom Srbija a.d.',
      employmentStatus: 'EMPLOYED',
      fullName: 'Marko Petrović',
      id: 200,
      idCardDocument: null,
      idCardIssuer: 'PU Beograd',
      idCardNumber: '012345678',
      jobTitle: 'Inženjer',
      monthlyIncomeRsd: 120_000,
      promissoryNotesCount: 2,
      rejectionReason: null,
      relationship: 'PARENT',
      residentialAddress: 'Kneza Miloša 14',
      status: 'PENDING_REVIEW',
      submittedAt: now.toISOString(),
      verifiedAt: null,
    }

    const payload = {
      find: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-guarantors') return { docs: [mockGuarantorDoc] }
        return { docs: [] }
      }),
    } as unknown as Payload

    const result = await getGuarantorForCandidate({
      candidateAccountId: 10,
      payload,
    })

    expect(result).not.toBeNull()
    expect(result?.fullName).toBe('Marko Petrović')
    expect(result?.status).toBe('PENDING_REVIEW')
  })

  it('rejects submission if candidate selected ONE_TIME instead of PKZ', async () => {
    const payload = {
      find: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') return { docs: [mockProcess] }
        if (collection === 'program-offer-selections') {
          return { docs: [{ ...mockSelectionPkz, selectedMethod: 'ONE_TIME' }] }
        }
        return { docs: [] }
      }),
      findByID: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as Payload

    await expect(
      submitGuarantorData({
        candidateAccountId: 10,
        input: validSubmissionInput,
        now,
        payload,
      }),
    ).rejects.toThrow('Jemac se unosi isključivo za model „Platiš kad zaradiš“ (PKZ).')
  })

  it('uploads encrypted guarantor ID card and links to guarantor record', async () => {
    const mockGuarantorDoc = {
      candidateAccount: 10,
      id: 200,
      preApplication: 1,
      sensitiveProfile: 70,
      status: 'PENDING_REVIEW',
    }

    const payload = {
      create: vi.fn().mockImplementation(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'candidate-private-documents') {
          return { id: 300, ...data }
        }
        if (collection === 'audit-events') {
          return { id: 999 }
        }
        return { id: 1 }
      }),
      find: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-guarantors') return { docs: [mockGuarantorDoc] }
        return { docs: [] }
      }),
      findByID: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'pre-applications') return mockPreApp
        return undefined
      }),
      update: vi.fn().mockResolvedValue({ id: 200 }),
    } as unknown as Payload

    const pdfBytes = Buffer.from('%PDF-1.7 mock content for ID card')

    const result = await uploadGuarantorIdCard({
      candidateAccountId: 10,
      fileBytes: pdfBytes,
      fileName: 'ocitana_lk.pdf',
      now,
      payload,
    })

    expect(result.documentId).toBe(300)
    expect(result.fileName).toBe('ocitana_lk.pdf')
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-private-documents',
        data: expect.objectContaining({
          documentType: 'GUARANTOR_ID_CARD',
          status: 'UPLOADED',
        }),
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-guarantors',
        data: expect.objectContaining({
          idCardDocument: 300,
        }),
      }),
    )
  })

  it('allows administrator to verify guarantor once ID card is uploaded', async () => {
    const mockGuarantorWithDoc = {
      id: 200,
      idCardDocument: 300,
      preApplication: 1,
      status: 'PENDING_REVIEW',
    }

    const payload = {
      create: vi.fn().mockResolvedValue({ id: 999 }),
      findByID: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-guarantors') return mockGuarantorWithDoc
        if (collection === 'pre-applications') return mockPreApp
        return undefined
      }),
      update: vi.fn().mockImplementation(async ({ data, id }: { data: Record<string, unknown>; id: number }) => {
        return { id, ...data }
      }),
    } as unknown as Payload

    const verified = await verifyGuarantor({
      administratorId: 42,
      guarantorId: 200,
      now,
      payload,
    })

    expect(verified.status).toBe('VERIFIED')
    expect(verified.verifiedBy).toBe(42)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-private-documents',
        data: expect.objectContaining({
          status: 'VERIFIED',
        }),
        id: 300,
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          eventType: 'GUARANTOR_VERIFIED',
        }),
      }),
    )
  })

  it('allows administrator to reject guarantor with a clear rationale', async () => {
    const mockGuarantorWithDoc = {
      id: 200,
      idCardDocument: 300,
      preApplication: 1,
      status: 'PENDING_REVIEW',
    }

    const payload = {
      create: vi.fn().mockResolvedValue({ id: 999 }),
      findByID: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-guarantors') return mockGuarantorWithDoc
        if (collection === 'pre-applications') return mockPreApp
        return undefined
      }),
      update: vi.fn().mockImplementation(async ({ data, id }: { data: Record<string, unknown>; id: number }) => {
        return { id, ...data }
      }),
    } as unknown as Payload

    const rejected = await rejectGuarantor({
      administratorId: 42,
      guarantorId: 200,
      now,
      payload,
      reason: 'Očitana lična karta je istekla. Molimo postavite važeći dokument.',
    })

    expect(rejected.status).toBe('REJECTED')
    expect(rejected.rejectionReason).toContain('istekla')
  })

  it('generates and retrieves encrypted guarantor agreement PDF', async () => {
    let savedPdfData: Record<string, unknown> | null = null

    const mockVerifiedGuarantor = {
      candidateAccount: 10,
      candidateProcess: 100,
      email: 'marko.petrovic@example.com',
      employerName: 'Telekom Srbija a.d.',
      employmentStatus: 'EMPLOYED',
      fullName: 'Marko Petrović',
      id: 200,
      idCardIssuer: 'PU Beograd',
      idCardNumber: '012345678',
      monthlyIncomeRsd: 120_000,
      phone: '+381641234567',
      preApplication: 1,
      promissoryNotesCount: 2,
      relationship: 'PARENT',
      residentialAddress: 'Kneza Miloša 14',
      status: 'VERIFIED',
    }

    const payload = {
      create: vi.fn().mockResolvedValue({ id: 999 }),
      find: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'program-offer-selections') return { docs: [mockSelectionPkz] }
        return { docs: [] }
      }),
      findByID: vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-guarantors') {
          return savedPdfData ? { ...mockVerifiedGuarantor, ...savedPdfData } : mockVerifiedGuarantor
        }
        if (collection === 'pre-applications') return mockPreApp
        if (collection === 'applicants') return mockApplicant
        return undefined
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        savedPdfData = data
        return { ...mockVerifiedGuarantor, ...data }
      }),
    } as unknown as Payload

    const { contractNumber, pdfBytes } = await generateGuarantorContract({
      guarantorId: 200,
      now,
      payload,
    })

    expect(contractNumber).toBe('AA-JEM-2026-000200')
    expect(pdfBytes.length).toBeGreaterThan(1_000)

    // Now retrieve and decrypt the generated PDF
    const retrieved = await getGuarantorContractPdf({
      guarantorId: 200,
      payload,
    })

    expect(retrieved.fileName).toBe('ugovor-o-jemstvu-AA-JEM-2026-000200.pdf')
    expect(retrieved.pdfBytes).toBeInstanceOf(Buffer)
    expect(retrieved.pdfBytes.slice(0, 5).toString('utf8')).toBe('%PDF-')
  })
})
