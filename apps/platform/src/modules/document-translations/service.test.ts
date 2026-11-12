import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { DocumentTranslationError } from './rules.ts'
import {
  getCandidateTranslations,
  getTranslationPdf,
  listTranslations,
  requestDocumentTranslation,
  reviewDocumentTranslation,
  updateTranslationDraft,
} from './service.ts'

function mockProcess() {
  return {
    applicant: {
      dateOfBirth: '2003-05-15',
      firstName: 'Nikola',
      fullName: 'Nikola Petrović',
      id: 11,
      lastName: 'Petrović',
    },
    candidateAccount: 21,
    id: 1,
    preApplication: {
      academicCreditsEspb: 120,
      facultyName: 'Fakultet organizacionih nauka',
      id: 31,
      studyCity: 'Beograd',
      studyYear: '3',
    },
    programCode: 'SWT',
  }
}

describe('document-translations service', () => {
  it('requests document translation and logs audit event', async () => {
    const createdDoc = {
      candidateAccount: 21,
      candidateProcess: 1,
      documentType: 'STUDENT_STATUS_CERTIFICATE',
      id: 55,
      sourceData: {},
      status: 'PENDING_REVIEW',
      title: 'Potvrda o statusu studenta',
      translatedData: {
        facultyNameEn: 'Faculty of Organizational Sciences',
        universityNameEn: 'University of Belgrade',
      },
    }

    const payload = {
      create: vi.fn().mockResolvedValueOnce(createdDoc).mockResolvedValueOnce({ id: 101 }),
      findByID: vi.fn().mockResolvedValueOnce(mockProcess()),
    } as unknown as Payload

    const result = await requestDocumentTranslation({
      input: {
        candidateProcessId: 1,
        documentType: 'STUDENT_STATUS_CERTIFICATE',
      },
      payload,
      requesterId: 21,
      requesterType: 'PUBLIC_APPLICANT',
    })

    expect(result.id).toBe(55)
    expect(result.status).toBe('PENDING_REVIEW')
    expect(payload.create).toHaveBeenCalledTimes(2)

    // Check audit event
    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actorType: 'PUBLIC_APPLICANT',
          eventType: 'DOCUMENT_TRANSLATION_REQUESTED',
        }),
      }),
    )
  })

  it('updates translation draft and increments version', async () => {
    const existingDoc = {
      adminNotes: 'Inicijalna beleška',
      candidateProcess: 1,
      id: 55,
      status: 'PENDING_REVIEW',
      translatedData: { oldField: 'val' },
      version: 1,
    }

    const updatedDoc = {
      ...existingDoc,
      adminNotes: 'Izmenjena fakultetska katedra',
      translatedData: { facultyNameEn: 'Faculty of Law' },
      version: 2,
    }

    const payload = {
      create: vi.fn().mockResolvedValueOnce({ id: 102 }),
      findByID: vi.fn().mockResolvedValueOnce(existingDoc),
      update: vi.fn().mockResolvedValueOnce(updatedDoc),
    } as unknown as Payload

    const result = await updateTranslationDraft({
      adminId: 99,
      data: {
        adminNotes: 'Izmenjena fakultetska katedra',
        translatedData: { facultyNameEn: 'Faculty of Law' },
      },
      payload,
      translationId: 55,
    })

    expect(result.version).toBe(2)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'translated-documents',
        data: expect.objectContaining({
          adminNotes: 'Izmenjena fakultetska katedra',
          version: 2,
        }),
        id: 55,
      }),
    )

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actor: 99,
          eventType: 'DOCUMENT_TRANSLATION_UPDATED',
        }),
      }),
    )
  })

  it('prevents updating already APPROVED translation', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValueOnce({
        id: 55,
        status: 'APPROVED',
      }),
    } as unknown as Payload

    await expect(
      updateTranslationDraft({
        adminId: 99,
        data: { translatedData: {} },
        payload,
        translationId: 55,
      }),
    ).rejects.toThrow(DocumentTranslationError)
  })

  it('reviews and approves translation under BR-010 human verification rule', async () => {
    const existingDoc = {
      candidateAccount: 21,
      candidateProcess: 1,
      documentType: 'STUDENT_STATUS_CERTIFICATE',
      id: 55,
      status: 'PENDING_REVIEW',
      title: 'Potvrda o statusu studenta',
      translatedData: {
        facultyNameEn: 'Faculty of Organizational Sciences',
        studentFullName: 'Nikola Petrović',
        universityNameEn: 'University of Belgrade',
      },
      version: 1,
    }

    const payload = {
      create: vi.fn().mockResolvedValueOnce({ id: 103 }), // audit
      findByID: vi
        .fn()
        .mockResolvedValueOnce(existingDoc) // find translation
        .mockResolvedValueOnce({ displayName: 'Admin Milica', id: 99 }) // find admin user
        .mockResolvedValueOnce(mockProcess()), // resolveCandidateContext
      update: vi.fn().mockImplementationOnce(({ data }) => ({
        ...existingDoc,
        ...data,
      })),
    } as unknown as Payload

    const result = await reviewDocumentTranslation({
      adminId: 99,
      data: {
        action: 'APPROVE',
        adminNotes: 'Verifikovano sa originalom indeksa.',
      },
      payload,
      translationId: 55,
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe('APPROVED')
    expect(result.pdfChecksum).toMatch(/^[a-f0-9]{64}$/u)
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array)

    // Verify audit event
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actor: 99,
          eventType: 'DOCUMENT_TRANSLATION_APPROVED',
          metadata: expect.objectContaining({
            pdfChecksum: result.pdfChecksum,
          }),
        }),
      }),
    )
  })

  it('rejects translation when rejection reason is provided', async () => {
    const existingDoc = {
      candidateAccount: 21,
      candidateProcess: 1,
      id: 55,
      status: 'PENDING_REVIEW',
    }

    const payload = {
      create: vi.fn().mockResolvedValueOnce({ id: 104 }), // audit
      findByID: vi
        .fn()
        .mockResolvedValueOnce(existingDoc)
        .mockResolvedValueOnce({ displayName: 'Admin Milica', id: 99 }),
      update: vi.fn().mockImplementationOnce(({ data }) => ({
        ...existingDoc,
        ...data,
      })),
    } as unknown as Payload

    const result = await reviewDocumentTranslation({
      adminId: 99,
      data: {
        action: 'REJECT',
        rejectionReason: 'Fali pečat dekana na prvoj strani.',
      },
      payload,
      translationId: 55,
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe('REJECTED')
    expect(result.rejectionReason).toBe('Fali pečat dekana na prvoj strani.')

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          eventType: 'DOCUMENT_TRANSLATION_REJECTED',
        }),
      }),
    )
  })

  it('fails BR-010 review when adminId is missing or invalid', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValueOnce({
        id: 55,
        status: 'PENDING_REVIEW',
      }),
    } as unknown as Payload

    await expect(
      reviewDocumentTranslation({
        adminId: 0,
        data: { action: 'APPROVE' },
        payload,
        translationId: 55,
      }),
    ).rejects.toThrow('BR-010')
  })

  it('delivers PDF for approved translation and rejects unapproved download', async () => {
    const payloadUnapproved = {
      findByID: vi.fn().mockResolvedValueOnce({
        id: 55,
        status: 'PENDING_REVIEW',
      }),
    } as unknown as Payload

    await expect(
      getTranslationPdf({ payload: payloadUnapproved, translationId: 55 }),
    ).rejects.toThrow(DocumentTranslationError)

    const approvedDoc = {
      candidateAccount: 21,
      candidateProcess: 1,
      documentType: 'STUDENT_STATUS_CERTIFICATE',
      id: 55,
      pdfChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      reviewedAt: '2026-10-09T10:00:00.000Z',
      reviewedBy: { displayName: 'Admin Milica' },
      status: 'APPROVED',
      title: 'Potvrda o statusu studenta',
      translatedData: { studentFullName: 'Nikola Petrović' },
    }

    const payloadApproved = {
      findByID: vi
        .fn()
        .mockResolvedValueOnce(approvedDoc)
        .mockResolvedValueOnce(mockProcess()),
    } as unknown as Payload

    const pdfResult = await getTranslationPdf({ payload: payloadApproved, translationId: 55 })
    expect(pdfResult.buffer).toBeInstanceOf(Uint8Array)
    expect(pdfResult.checksum).toMatch(/^[a-f0-9]{64}$/u)
    expect(pdfResult.filename).toContain('prevod-')
  })

  it('lists translations with filters and pagination', async () => {
    const payload = {
      find: vi.fn().mockResolvedValueOnce({
        docs: [{ id: 55 }],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20,
        page: 1,
        totalDocs: 1,
        totalPages: 1,
      }),
    } as unknown as Payload

    const list = await listTranslations({
      filters: { limit: 20, page: 1, status: 'PENDING_REVIEW' },
      payload,
    })

    expect(list.totalDocs).toBe(1)
    expect(list.docs).toHaveLength(1)
  })

  it('retrieves candidate translations list', async () => {
    const payload = {
      find: vi.fn().mockResolvedValueOnce({
        docs: [
          {
            documentType: 'STUDENT_STATUS_CERTIFICATE',
            id: 55,
            pdfChecksum: 'abc',
            pdfGeneratedAt: '2026-10-09T10:00:00Z',
            status: 'APPROVED',
            title: 'Potvrda o statusu studenta',
          },
        ],
      }),
    } as unknown as Payload

    const result = await getCandidateTranslations({
      candidateAccountId: 21,
      payload,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].pdfAvailable).toBe(true)
  })
})
