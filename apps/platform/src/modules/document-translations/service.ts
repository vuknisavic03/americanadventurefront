import { randomUUID } from 'node:crypto'
import type { Payload, Where } from 'payload'

import {
  DocumentTranslationError,
  getDocumentTypeDefaultTitle,
  validateTranslationReview,
} from './rules.ts'
import { renderCertifiedTranslationPdf } from './pdfRenderer.ts'
import { translateDocument } from './translator.ts'
import type {
  DocumentTranslationType,
} from './templates.ts'
import type {
  RequestTranslationInput,
  ReviewTranslationInput,
  TranslationQuery,
  UpdateTranslationDraftInput,
} from './schema.ts'

function extractRelationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return Number((value as { id: unknown }).id)
  }
  return undefined
}

export interface CandidateContext {
  accountId?: number
  creditsEspb?: number
  dateOfBirth?: string
  facultyName?: string
  firstName: string
  fullName: string
  lastName: string
  processId: number
  programCode: string
  studyCity?: string
  studyYear?: string
}

export async function resolveCandidateContext(
  payload: Payload,
  candidateProcessId: number,
): Promise<CandidateContext> {
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 2,
    id: candidateProcessId,
    overrideAccess: true,
  })

  if (!process) {
    throw new DocumentTranslationError(`Kandidatski proces #${candidateProcessId} nije pronađen.`, 404)
  }

  const accountId = extractRelationId(process.candidateAccount)

  const applicantObj =
    typeof process.applicant === 'object' && process.applicant !== null
      ? (process.applicant as {
          dateOfBirth?: string
          firstName?: string
          fullName?: string
          id?: number
          lastName?: string
        })
      : null

  const preAppObj =
    typeof process.preApplication === 'object' && process.preApplication !== null
      ? (process.preApplication as {
          academicCreditsEspb?: number
          dateOfBirth?: string
          facultyName?: string
          firstName?: string
          id?: number
          lastName?: string
          studyCity?: string
          studyYear?: string
          submission?: {
            academicCreditsEspb?: number
            facultyName?: string
            studyCity?: string
            studyYear?: string
          }
        })
      : null

  let firstName = applicantObj?.firstName || preAppObj?.firstName || ''
  let lastName = applicantObj?.lastName || preAppObj?.lastName || ''
  let dateOfBirth = applicantObj?.dateOfBirth || preAppObj?.dateOfBirth || ''

  if (!firstName) {
    const applicantId = extractRelationId(process.applicant)
    if (applicantId) {
      const applicant = await payload.findByID({
        collection: 'applicants',
        depth: 0,
        id: applicantId,
        overrideAccess: true,
      })
      if (applicant) {
        firstName = applicant.firstName || ''
        lastName = applicant.lastName || ''
        dateOfBirth = applicant.dateOfBirth || dateOfBirth
      }
    }
  }

  let facultyName = preAppObj?.submission?.facultyName || preAppObj?.facultyName
  let studyCity = preAppObj?.submission?.studyCity || preAppObj?.studyCity
  let studyYear = preAppObj?.submission?.studyYear || preAppObj?.studyYear
  let creditsEspb = preAppObj?.submission?.academicCreditsEspb || preAppObj?.academicCreditsEspb

  if (!facultyName) {
    const preAppId = extractRelationId(process.preApplication)
    if (preAppId) {
      const preApp = await payload.findByID({
        collection: 'pre-applications',
        depth: 1,
        id: preAppId,
        overrideAccess: true,
      })
      if (preApp) {
        const preAppTyped = preApp as {
          academicCreditsEspb?: number
          facultyName?: string
          studyCity?: string
          studyYear?: string
          submission?: {
            academicCreditsEspb?: number
            facultyName?: string
            studyCity?: string
            studyYear?: string
          }
        }
        facultyName = preAppTyped.submission?.facultyName || preAppTyped.facultyName
        studyCity = preAppTyped.submission?.studyCity || preAppTyped.studyCity
        studyYear = preAppTyped.submission?.studyYear || preAppTyped.studyYear
        creditsEspb = preAppTyped.submission?.academicCreditsEspb || preAppTyped.academicCreditsEspb
      }
    }
  }

  const fullName = `${firstName} ${lastName}`.trim() || `Kandidat #${candidateProcessId}`

  return {
    accountId,
    creditsEspb: creditsEspb ? Number(creditsEspb) : undefined,
    dateOfBirth,
    facultyName,
    firstName: firstName || 'Kandidat',
    fullName,
    lastName,
    processId: candidateProcessId,
    programCode: process.programCode || 'SWT',
    studyCity,
    studyYear: studyYear ? String(studyYear) : undefined,
  }
}

export async function requestDocumentTranslation({
  input,
  payload,
  requesterId,
  requesterType,
}: {
  input: RequestTranslationInput
  payload: Payload
  requesterId: number
  requesterType: 'ADMIN' | 'PUBLIC_APPLICANT'
}) {
  const context = await resolveCandidateContext(payload, input.candidateProcessId)

  let sourceData: Record<string, unknown> = {}

  if (input.documentType === 'STUDENT_STATUS_CERTIFICATE') {
    sourceData = {
      academicCreditsEspb: context.creditsEspb || 60,
      academicYear: '2026/2027',
      dateOfBirth: context.dateOfBirth,
      enrollmentStatus: 'Redovan student',
      facultyName: context.facultyName || 'Fakultet organizacionih nauka',
      issuedCity: context.studyCity || 'Beograd',
      issuedDate: new Date().toISOString().split('T')[0],
      programCode: context.programCode,
      studentFullName: context.fullName,
      studentIndexNumber: '2022/0123',
      studyYear: context.studyYear || '3',
      universityName: 'Univerzitet u Beogradu',
      ...(input.customSourceData || {}),
    }
  } else if (input.documentType === 'GUARANTOR_STATEMENT') {
    sourceData = {
      candidateFullName: context.fullName,
      employmentStatus: 'Stalno zaposlen',
      guarantorAddress: 'Bulevar Kralja Aleksandra 10, Beograd',
      guarantorFullName: `${context.lastName || 'Porodica'} Roditelj`,
      guarantorIdNumber: '123456789',
      monthlyIncomeRsd: 120000,
      relationshipToCandidate: 'Otac',
      statementNotes: 'Finansijska podrška za učešće u programu kulturne razmene.',
      ...(input.customSourceData || {}),
    }
  } else {
    sourceData = {
      documentTitle: input.title || 'Dodatni dokument kandidata',
      originalText: 'Potvrda o ispunjavanju uslova za program.',
      personalDetails: context.fullName,
      ...(input.customSourceData || {}),
    }
  }

  // Prevođenje putem šablonskog i AI adaptera
  const translatedData = await translateDocument(
    input.documentType as DocumentTranslationType,
    sourceData,
  )

  const docTitle = input.title || getDocumentTypeDefaultTitle(input.documentType as DocumentTranslationType)

  const createdDoc = await payload.create({
    collection: 'translated-documents',
    data: {
      candidateAccount: context.accountId || undefined,
      candidateProcess: context.processId,
      documentType: input.documentType as DocumentTranslationType,
      sourceData,
      sourceLanguage: 'sr',
      status: 'PENDING_REVIEW',
      targetLanguage: 'en',
      title: docTitle,
      translatedData,
      version: 1,
    },
    overrideAccess: true,
  })

  // Evidentiranje revizijskog događaja
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: requesterType === 'ADMIN' ? requesterId : undefined,
      actorType: requesterType === 'ADMIN' ? 'ADMIN' : 'PUBLIC_APPLICANT',
      correlationId: `translation-req:${randomUUID()}`,
      eventType: 'DOCUMENT_TRANSLATION_REQUESTED',
      metadata: {
        candidateProcessId: context.processId,
        documentType: input.documentType,
        title: docTitle,
        translatedDocumentId: createdDoc.id,
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return {
    candidateFullName: context.fullName,
    documentType: createdDoc.documentType,
    id: createdDoc.id,
    sourceData: createdDoc.sourceData,
    status: createdDoc.status,
    title: createdDoc.title,
    translatedData: createdDoc.translatedData,
  }
}

export async function updateTranslationDraft({
  adminId,
  data,
  payload,
  translationId,
}: {
  adminId: number
  data: UpdateTranslationDraftInput
  payload: Payload
  translationId: number
}) {
  const doc = await payload.findByID({
    collection: 'translated-documents',
    id: translationId,
    overrideAccess: true,
  })

  if (!doc) {
    throw new DocumentTranslationError(`Prevod sa ID #${translationId} nije pronađen.`, 404)
  }

  if (doc.status === 'APPROVED') {
    throw new DocumentTranslationError('Nije moguće menjati prevod koji je već odobren i overen.', 409)
  }

  const updatedDoc = await payload.update({
    collection: 'translated-documents',
    data: {
      adminNotes: data.adminNotes ?? doc.adminNotes,
      status: 'PENDING_REVIEW',
      translatedData: data.translatedData,
      version: (Number(doc.version) || 1) + 1,
    },
    id: translationId,
    overrideAccess: true,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: `translation-update:${randomUUID()}`,
      eventType: 'DOCUMENT_TRANSLATION_UPDATED',
      metadata: {
        candidateProcessId: extractRelationId(doc.candidateProcess),
        newVersion: updatedDoc.version,
        translatedDocumentId: translationId,
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return updatedDoc
}

export async function reviewDocumentTranslation({
  adminId,
  data,
  payload,
  translationId,
}: {
  adminId: number
  data: ReviewTranslationInput
  payload: Payload
  translationId: number
}) {
  const doc = await payload.findByID({
    collection: 'translated-documents',
    depth: 1,
    id: translationId,
    overrideAccess: true,
  })

  if (!doc) {
    throw new DocumentTranslationError(`Prevod sa ID #${translationId} nije pronađen.`, 404)
  }

  const validation = validateTranslationReview(doc.status, {
    action: data.action,
    adminId,
    adminNotes: data.adminNotes,
    rejectionReason: data.rejectionReason,
  })

  if (!validation.valid) {
    throw new DocumentTranslationError(validation.error || 'Neispravna akcija verifikacije prevoda.', 400)
  }

  const admin = await payload.findByID({
    collection: 'users',
    id: adminId,
    overrideAccess: true,
  })
  const adminName = admin?.displayName || admin?.email || 'Ovlašćeni administrator'

  const reviewedAt = new Date()

  if (data.action === 'APPROVE') {
    const finalTranslatedData = (data.correctedData || doc.translatedData) as Record<string, unknown>

    const candidateProcessId = extractRelationId(doc.candidateProcess)!
    const candidateContext = await resolveCandidateContext(payload, candidateProcessId)

    const reviewedIso = reviewedAt.toISOString()
    const normalizedReviewedAt = new Date(reviewedIso)

    // Renderovanje zvaničnog sertifikovanog engleskog PDF dokumenta
    const { buffer, checksum } = await renderCertifiedTranslationPdf({
      candidateName: candidateContext.fullName,
      documentTitle: doc.title,
      documentType: doc.documentType as DocumentTranslationType,
      reviewedAt: normalizedReviewedAt,
      reviewedByName: adminName,
      translatedFields: finalTranslatedData as Record<string, string | number | undefined | null>,
      translationId: doc.id,
    })

    const updatedDoc = await payload.update({
      collection: 'translated-documents',
      data: {
        adminNotes: data.adminNotes ?? doc.adminNotes,
        pdfChecksum: checksum,
        pdfGeneratedAt: reviewedIso,
        reviewedAt: reviewedIso,
        reviewedBy: adminId,
        status: 'APPROVED',
        translatedData: finalTranslatedData,
      },
      id: translationId,
      overrideAccess: true,
    })

    await payload.create({
      collection: 'audit-events',
      data: {
        actor: adminId,
        actorType: 'ADMIN',
        correlationId: `translation-approve:${randomUUID()}`,
        eventType: 'DOCUMENT_TRANSLATION_APPROVED',
        metadata: {
          candidateProcessId,
          pdfChecksum: checksum,
          translatedDocumentId: translationId,
        },
        occurredAt: reviewedAt.toISOString(),
      },
      overrideAccess: true,
    })

    return {
      pdfBuffer: buffer,
      pdfChecksum: checksum,
      reviewedAt: reviewedAt.toISOString(),
      status: 'APPROVED' as const,
      success: true,
      translatedDocument: updatedDoc,
    }
  }

  // REJECT
  const updatedDoc = await payload.update({
    collection: 'translated-documents',
    data: {
      adminNotes: data.adminNotes ?? doc.adminNotes,
      rejectionReason: data.rejectionReason,
      reviewedAt: reviewedAt.toISOString(),
      reviewedBy: adminId,
      status: 'REJECTED',
    },
    id: translationId,
    overrideAccess: true,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: `translation-reject:${randomUUID()}`,
      eventType: 'DOCUMENT_TRANSLATION_REJECTED',
      metadata: {
        candidateProcessId: extractRelationId(doc.candidateProcess),
        rejectionReason: data.rejectionReason,
        translatedDocumentId: translationId,
      },
      occurredAt: reviewedAt.toISOString(),
    },
    overrideAccess: true,
  })

  return {
    rejectionReason: data.rejectionReason,
    reviewedAt: reviewedAt.toISOString(),
    status: 'REJECTED' as const,
    success: true,
    translatedDocument: updatedDoc,
  }
}

export async function getTranslationPdf({
  payload,
  translationId,
}: {
  payload: Payload
  translationId: number
}): Promise<{ buffer: Uint8Array; checksum: string; filename: string }> {
  const doc = await payload.findByID({
    collection: 'translated-documents',
    depth: 1,
    id: translationId,
    overrideAccess: true,
  })

  if (!doc) {
    throw new DocumentTranslationError(`Prevedeni dokument #${translationId} nije pronađen.`, 404)
  }

  if (doc.status !== 'APPROVED' || !doc.pdfChecksum) {
    throw new DocumentTranslationError('Dokument još uvek nije odobren od strane administratora i spreman za preuzimanje.', 400)
  }

  const candidateProcessId = extractRelationId(doc.candidateProcess)!
  const candidateContext = await resolveCandidateContext(payload, candidateProcessId)

  const adminObj = typeof doc.reviewedBy === 'object' && doc.reviewedBy !== null ? (doc.reviewedBy as { displayName?: string }) : null
  const adminName = adminObj?.displayName || 'Ovlašćeni administrator'

  const reviewedDate = doc.reviewedAt ? new Date(doc.reviewedAt) : new Date()

  const { buffer, checksum } = await renderCertifiedTranslationPdf({
    candidateName: candidateContext.fullName,
    documentTitle: doc.title,
    documentType: doc.documentType as DocumentTranslationType,
    reviewedAt: reviewedDate,
    reviewedByName: adminName,
    translatedFields: doc.translatedData as Record<string, string | number | undefined | null>,
    translationId: doc.id,
  })

  const safeTitle = doc.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)

  return {
    buffer,
    checksum: doc.pdfChecksum || checksum,
    filename: `prevod-${safeTitle}-${doc.id}.pdf`,
  }
}

export async function listTranslations({
  filters,
  payload,
}: {
  filters: TranslationQuery
  payload: Payload
}) {
  const whereConditions: Where[] = []

  if (filters.status) {
    whereConditions.push({ status: { equals: filters.status } })
  }

  if (filters.documentType) {
    whereConditions.push({ documentType: { equals: filters.documentType } })
  }

  if (filters.candidateProcessId) {
    whereConditions.push({ candidateProcess: { equals: filters.candidateProcessId } })
  }

  const where: Where = whereConditions.length > 0 ? { and: whereConditions } : {}

  const result = await payload.find({
    collection: 'translated-documents',
    depth: 1,
    limit: filters.limit,
    overrideAccess: true,
    page: filters.page,
    sort: '-createdAt',
    where,
  })

  return {
    docs: result.docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    limit: result.limit,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

export async function getCandidateTranslations({
  candidateAccountId,
  payload,
}: {
  candidateAccountId: number
  payload: Payload
}) {
  const result = await payload.find({
    collection: 'translated-documents',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    sort: '-createdAt',
    where: { candidateAccount: { equals: candidateAccountId } },
  })

  return {
    items: result.docs.map((doc) => ({
      documentType: doc.documentType,
      id: doc.id,
      pdfAvailable: doc.status === 'APPROVED' && Boolean(doc.pdfChecksum),
      pdfChecksum: doc.pdfChecksum,
      pdfGeneratedAt: doc.pdfGeneratedAt,
      rejectionReason: doc.rejectionReason,
      reviewedAt: doc.reviewedAt,
      status: doc.status,
      title: doc.title,
      translatedData: doc.translatedData,
    })),
  }
}
