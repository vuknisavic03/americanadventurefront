import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import {
  exportCandidatesOverview,
  getCandidateOverviewDetail,
  listCandidatesOverview,
  updateCandidateOverview,
} from './service.ts'

describe('Admin Candidates Service', () => {
  const mockProcess1 = {
    applicant: {
      dateOfBirth: '2001-05-20',
      email: 'petar@example.test',
      firstName: 'Petar',
      fullName: 'Petar Petrović',
      id: 101,
      lastName: 'Petrović',
      phone: '+38161111111',
      residentialAddress: 'Kneza Miloša 10',
    },
    candidateAccount: {
      citizenship: 'Srbija',
      email: 'petar@example.test',
      fullName: 'Petar Petrović',
      id: 201,
    },
    createdAt: '2026-06-01T10:00:00Z',
    currentStep: 'JOB_PLACEMENT',
    id: 1,
    preApplication: {
      id: 301,
      submission: { facultyName: 'FON', studyCity: 'Beograd' },
    },
    processStatus: 'ACTIVE',
    programCode: 'SWT',
    progressNote: 'Kandidat čeka intervju za posao.',
    progressVersion: 1,
    updatedAt: '2026-06-01T10:00:00Z',
  }

  const mockProcess2 = {
    applicant: {
      dateOfBirth: '2002-08-14',
      email: 'ana@example.test',
      firstName: 'Ana',
      fullName: 'Ana Anić',
      id: 102,
      lastName: 'Anić',
      phone: '+38162222222',
      residentialAddress: 'Bulevar Kralja Aleksandra 50',
    },
    candidateAccount: {
      citizenship: 'Srbija',
      email: 'ana@example.test',
      fullName: 'Ana Anić',
      id: 202,
    },
    createdAt: '2026-06-02T10:00:00Z',
    currentStep: 'VISA',
    id: 2,
    preApplication: {
      id: 302,
      submission: { facultyName: 'ETF', studyCity: 'Beograd' },
    },
    processStatus: 'ACTIVE',
    programCode: 'SWT',
    progressNote: 'Viza u pripremi.',
    progressVersion: 1,
    updatedAt: '2026-06-02T10:00:00Z',
  }

  const mockAcceptedOffer = {
    candidateProcess: 2,
    employerName: 'Cedar Point Amusement Park',
    id: 501,
    jobTitle: 'Ride Operator',
    status: 'ACCEPTED',
    workCity: 'Sandusky',
    workState: 'OH',
  }

  const mockAppForPetar = {
    createdAt: '2026-06-01T10:00:00Z',
    email: 'petar@example.test',
    finalPrice: 1750,
    firstName: 'Petar',
    fullName: 'Petar Petrović',
    id: 601,
    idCardNumber: 'P010948212',
    lastName: 'Petrović',
    notes: 'Kandidat čeka intervju za posao.',
    packageName: 'Work & Travel USA — Full Placement',
    paymentMethod: 'installments',
    phone: '+38161111111',
    progress: 75,
    status: 'job',
    updatedAt: '2026-06-01T10:00:00Z',
  }

  function createMockPayload() {
    const processes = [structuredClone(mockProcess1), structuredClone(mockProcess2)]
    const offers = [structuredClone(mockAcceptedOffer)]
    const applications = [structuredClone(mockAppForPetar)]
    const auditEvents: Array<Record<string, unknown>> = []

    return {
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'audit-events') {
          auditEvents.push(data)
          return { id: 999, ...data }
        }
        return { id: 888, ...data }
      }),
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'candidate-processes') {
          return { docs: processes, totalDocs: processes.length }
        }
        if (collection === 'employment-offers') {
          return { docs: offers, totalDocs: offers.length }
        }
        if (collection === 'candidate-applications') {
          return { docs: applications, totalDocs: applications.length }
        }
        if (collection === 'audit-events') {
          return { docs: auditEvents, totalDocs: auditEvents.length }
        }
        return { docs: [], totalDocs: 0 }
      }),
      findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'candidate-processes') {
          return processes.find((p) => p.id === id) || null
        }
        if (collection === 'candidate-applications') {
          return applications.find((a) => a.id === id) || null
        }
        return null
      }),
      update: vi.fn(async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
        if (collection === 'candidate-processes') {
          const proc = processes.find((p) => p.id === id)
          if (proc) Object.assign(proc, data)
          return proc
        }
        return { id, ...data }
      }),
    } as unknown as Payload
  }

  it('lists candidates with aggregated process, job offer, and application data (FR-064)', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesOverview({ payload })

    expect(result.total).toBe(2)
    const petar = result.candidates.find((c) => c.email === 'petar@example.test')
    const ana = result.candidates.find((c) => c.email === 'ana@example.test')

    expect(petar).toBeDefined()
    expect(petar?.hasJobOffer).toBe(false)
    expect(petar?.currentStep).toBe('JOB_PLACEMENT')
    expect(petar?.idCardOrPassportNumber).toBe('P010948212')

    expect(ana).toBeDefined()
    expect(ana?.hasJobOffer).toBe(true)
    expect(ana?.employerName).toBe('Cedar Point Amusement Park')
    expect(ana?.currentStep).toBe('VISA')
  })

  it('filters candidates without a job offer (FR-068)', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesOverview({
      filters: { withoutJobOffer: true },
      payload,
    })

    expect(result.total).toBe(1)
    expect(result.candidates[0].email).toBe('petar@example.test')
    expect(result.candidates[0].hasJobOffer).toBe(false)
  })

  it('searches candidates by name, email or phone (FR-074)', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesOverview({
      filters: { search: 'petar' },
      payload,
    })

    expect(result.total).toBe(1)
    expect(result.candidates[0].fullName).toBe('Petar Petrović')
  })

  it('filters and projects passport number (FR-067)', async () => {
    const payload = createMockPayload()
    const result = await listCandidatesOverview({
      filters: {
        fields: 'fullName,idCardOrPassportNumber',
        passportNumber: '010948',
      },
      payload,
    })

    expect(result.total).toBe(1)
    expect(result.candidates[0]).toEqual({
      fullName: 'Petar Petrović',
      id: 1,
      idCardOrPassportNumber: 'P010948212',
    })
  })

  it('fetches single candidate detail (FR-065)', async () => {
    const payload = createMockPayload()
    const detail = await getCandidateOverviewDetail({ id: 1, payload })

    expect(detail).toBeDefined()
    expect(detail?.id).toBe(1)
    expect(detail?.fullName).toBe('Petar Petrović')
    expect(detail?.facultyName).toBe('FON')
  })

  it('updates candidate process and records audit event (FR-065, FR-070)', async () => {
    const payload = createMockPayload()
    const updated = await updateCandidateOverview({
      adminId: 99,
      id: 1,
      payload,
      updates: {
        adminNotes: 'Ažurirana napomena od strane administratora.',
        currentStep: 'VISA',
        processStatus: 'ACTIVE',
      },
    })

    expect(payload.update).toHaveBeenCalled()
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actor: 99,
          actorType: 'ADMIN',
          eventType: 'CANDIDATE_PROCESS_UPDATED',
        }),
      }),
    )

    expect(updated?.currentStep).toBe('VISA')
    expect(updated?.adminNotes).toBe('Ažurirana napomena od strane administratora.')
  })

  it('exports candidates to Excel buffer and logs audit event (FR-069, FR-070)', async () => {
    const payload = createMockPayload()
    const result = await exportCandidatesOverview({
      adminId: 99,
      filters: { currentStep: 'JOB_PLACEMENT' },
      payload,
    })

    expect(result.count).toBe(1)
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.filename).toMatch(/^kandidati-\d{4}-\d{2}-\d{2}\.xlsx$/)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actor: 99,
          actorType: 'ADMIN',
          eventType: 'CANDIDATE_DATA_EXPORTED',
          metadata: expect.objectContaining({
            exportedCount: 1,
            format: 'XLSX',
          }),
        }),
      }),
    )
  })
})
