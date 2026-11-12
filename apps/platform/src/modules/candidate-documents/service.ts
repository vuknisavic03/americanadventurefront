import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { validateJmbg } from './jmbg.ts'
import {
  inspectPrivateDocument,
  privateDocumentEncryptionContext,
  retentionReviewDate,
  type PrivateDocumentType,
  type SupportedDocumentMimeType,
} from './privateDocument.ts'
import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  sensitiveFingerprint,
  type EncryptedValue,
} from './sensitiveDataCrypto.ts'
import {
  inspectProgramDocument,
  programDocumentRequirement,
  requiredProgramDocumentsVerified,
  SWT_PROGRAM_DOCUMENT_CHECKLIST_VERSION,
  swtProgramDocumentRequirements,
  type ProgramDocumentType,
} from '../program-documents/requirements.ts'
import {
  inspectVisaDocument,
  requiredVisaDocumentsVerified,
  SWT_VISA_DOCUMENT_CHECKLIST_VERSION,
  swtVisaDocumentRequirements,
  uploadableVisaDocumentRequirement,
  visaDocumentRequirement,
  type UploadableVisaDocumentType,
} from '../visa-documents/requirements.ts'
import { processPassportOcr } from '../passport-ocr/ocrService.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

export class CandidateDocumentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'CandidateDocumentError'
  }
}

type PassportUploadStage =
  | 'audit.create'
  | 'document.create'
  | 'previousDocument.supersede'
  | 'profile.create'
  | 'profile.linkDocument'

export class CandidateDocumentValidationError extends Error {
  constructor(
    readonly stage: PassportUploadStage,
    readonly issues: Array<{ message: string; path: string }>,
  ) {
    super('Private document upload failed Payload validation.')
    this.name = 'CandidateDocumentValidationError'
  }
}

export function payloadValidationIssues(error: unknown) {
  if (!error || typeof error !== 'object') return undefined

  const candidate = error as {
    data?: { errors?: unknown }
    name?: unknown
  }
  if (candidate.name !== 'ValidationError' || !Array.isArray(candidate.data?.errors)) {
    return undefined
  }

  return candidate.data.errors.flatMap((issue) => {
    if (!issue || typeof issue !== 'object') return []
    const { message, path } = issue as { message?: unknown; path?: unknown }
    return typeof message === 'string' && typeof path === 'string'
      ? [{ message, path }]
      : []
  })
}

async function activeCandidate(payload: Payload, accountId: number) {
  const account = await payload.findByID({
    collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true,
  }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) {
    throw new CandidateDocumentError('Sesija nije aktivna. Prijavite se ponovo.', 401)
  }
  const applicant = await payload.findByID({
    collection: 'applicants', depth: 0, id: relationId(account.applicant), overrideAccess: true,
  })
  const application = await payload.findByID({
    collection: 'pre-applications', depth: 0, id: relationId(account.preApplication), overrideAccess: true,
  })
  return { account, applicant, application }
}

async function sensitiveProfile(payload: Payload, accountId: number) {
  return (
    await payload.find({
      collection: 'candidate-sensitive-profiles',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: accountId } },
    })
  ).docs[0]
}

export async function updateCandidatePersonalId({
  accountId,
  now,
  payload,
  personalId,
}: {
  accountId: number
  now: Date
  payload: Payload
  personalId: string
}) {
  const { account, applicant, application } = await activeCandidate(payload, accountId)
  const result = validateJmbg(personalId, applicant.dateOfBirth)
  if (!result.valid) throw new CandidateDocumentError(result.message)

  const keyring = readSensitiveDataKeyring()
  const encrypted = encryptSensitiveBytes(Buffer.from(result.normalized, 'utf8'), keyring, `jmbg:${account.id}`)
  const fingerprint = sensitiveFingerprint(result.normalized, keyring, 'candidate-jmbg')
  const existing = await sensitiveProfile(payload, account.id)
  const activeDocument = existing?.activePassportDocument
    ? await payload.findByID({
        collection: 'candidate-private-documents',
        depth: 0,
        id: relationId(existing.activePassportDocument),
        overrideAccess: true,
      })
    : undefined
  const readinessStatus = activeDocument?.status === 'VERIFIED'
    ? 'READY' as const
    : activeDocument?.status === 'UPLOADED'
      ? 'UNDER_REVIEW' as const
      : 'INCOMPLETE' as const
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Sensitive profile update requires a database transaction.')
  const req = { transactionID }

  try {
    const values = {
      applicant: applicant.id,
      candidateAccount: account.id,
      contractReadinessStatus: readinessStatus,
      personalIdAuthTag: encrypted.authTag,
      personalIdCiphertext: encrypted.ciphertext,
      personalIdFingerprint: fingerprint,
      personalIdIv: encrypted.iv,
      personalIdKeyId: encrypted.keyId,
      personalIdStatus: 'VALIDATED' as const,
      personalIdUpdatedAt: now.toISOString(),
      preApplication: application.id,
      programCode: account.programCode,
      readinessUpdatedAt: now.toISOString(),
      retentionReviewAt: retentionReviewDate(now).toISOString(),
    }
    const profile = existing
      ? await payload.update({ collection: 'candidate-sensitive-profiles', data: values, id: existing.id, overrideAccess: true, req })
      : await payload.create({ collection: 'candidate-sensitive-profiles', data: values, overrideAccess: true, req })

    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT',
        correlationId: application.correlationId,
        eventType: 'SENSITIVE_PROFILE_UPDATED',
        metadata: { candidateAccountId: account.id, fields: ['personalId'], profileId: profile.id },
        newStatus: application.status,
        occurredAt: now.toISOString(),
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req,
    })
    if (readinessStatus === 'READY' && existing?.contractReadinessStatus !== 'READY') {
      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId,
          eventType: 'CONTRACT_READINESS_ACHIEVED', metadata: { profileId: profile.id },
          newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
          previousStatus: application.status, workflowVersion: application.workflowVersion,
        },
        overrideAccess: true,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
    return { status: values.personalIdStatus }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      throw new CandidateDocumentError('Ovaj JMBG je već povezan sa drugim kandidatskim nalogom.', 409)
    }
    throw error
  }
}

export async function uploadCandidatePassport({
  accountId,
  bytes,
  fileName,
  now,
  payload,
}: {
  accountId: number
  bytes: Uint8Array
  fileName: string
  now: Date
  payload: Payload
}) {
  const { account, applicant, application } = await activeCandidate(payload, accountId)
  let inspected: ReturnType<typeof inspectPrivateDocument>
  try {
    inspected = inspectPrivateDocument(fileName, bytes)
  } catch (error) {
    throw new CandidateDocumentError(error instanceof Error ? error.message : 'Dokument nije ispravan.')
  }
  const keyring = readSensitiveDataKeyring()
  const encrypted = encryptSensitiveBytes(
    bytes,
    keyring,
    privateDocumentEncryptionContext('PASSPORT', account.id),
  )
  const existingProfile = await sensitiveProfile(payload, account.id)
  const activeDocument = existingProfile?.activePassportDocument
    ? await payload.findByID({
        collection: 'candidate-private-documents', depth: 0,
        id: relationId(existingProfile.activePassportDocument), overrideAccess: true,
      })
    : undefined
  if (activeDocument?.status === 'VERIFIED') {
    throw new CandidateDocumentError('Za zamenu verifikovanog pasoša kontaktirajte administratora.', 409)
  }

  let ocrResult: Awaited<ReturnType<typeof processPassportOcr>> | undefined
  try {
    ocrResult = await processPassportOcr(bytes, inspected.mimeType, {
      dateOfBirth: applicant.dateOfBirth,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
    })
  } catch (ocrErr) {
    console.error('Passport OCR processing error:', ocrErr)
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Private document upload requires a database transaction.')
  const req = { transactionID }
  let stage: PassportUploadStage = 'profile.create'
  try {
    const profile = existingProfile ?? await payload.create({
      collection: 'candidate-sensitive-profiles',
      data: {
        applicant: applicant.id,
        candidateAccount: account.id,
        contractReadinessStatus: 'INCOMPLETE',
        personalIdStatus: 'MISSING',
        preApplication: application.id,
        programCode: account.programCode,
        readinessUpdatedAt: now.toISOString(),
        retentionReviewAt: retentionReviewDate(now).toISOString(),
      },
      overrideAccess: true,
      req,
    })
    if (activeDocument) {
      stage = 'previousDocument.supersede'
      await payload.update({
        collection: 'candidate-private-documents',
        data: { status: 'SUPERSEDED', supersededAt: now.toISOString() },
        id: activeDocument.id,
        overrideAccess: true,
        req,
      })
    }
    stage = 'document.create'
    const document = await payload.create({
      collection: 'candidate-private-documents',
      data: {
        authTag: encrypted.authTag,
        candidateAccount: account.id,
        ciphertext: encrypted.ciphertext,
        documentType: 'PASSPORT',
        iv: encrypted.iv,
        keyId: encrypted.keyId,
        mimeType: inspected.mimeType,
        ocrData: ocrResult ? (ocrResult as unknown as Record<string, unknown>) : null,
        ocrExpirationDate: ocrResult?.extracted?.expirationDate ?? null,
        ocrPassportNumber: ocrResult?.extracted?.documentNumber ?? null,
        ocrStatus: ocrResult?.status ?? 'NOT_APPLICABLE',
        originalFileName: inspected.fileName,
        preApplication: application.id,
        retentionReviewAt: retentionReviewDate(now).toISOString(),
        sensitiveProfile: profile.id,
        sha256: inspected.sha256,
        sizeBytes: inspected.sizeBytes,
        status: 'UPLOADED',
        uploadedAt: now.toISOString(),
      },
      overrideAccess: true,
      req,
    })
    stage = 'profile.linkDocument'
    await payload.update({
      collection: 'candidate-sensitive-profiles',
      data: {
        activePassportDocument: document.id,
        contractReadinessStatus: profile.personalIdStatus === 'VALIDATED' ? 'UNDER_REVIEW' : 'INCOMPLETE',
        readinessUpdatedAt: now.toISOString(),
      },
      id: profile.id,
      overrideAccess: true,
      req,
    })
    stage = 'audit.create'
    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId,
        eventType: 'PRIVATE_DOCUMENT_UPLOADED',
        metadata: {
          candidateAccountId: account.id,
          documentId: document.id,
          documentType: 'PASSPORT',
          mimeType: inspected.mimeType,
          ocrStatus: ocrResult?.status,
          sizeBytes: inspected.sizeBytes,
        },
        newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
        previousStatus: application.status, workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return {
      documentId: document.id,
      fileName: document.originalFileName,
      ocr: ocrResult,
      status: document.status,
    }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const issues = payloadValidationIssues(error)
    if (issues) {
      throw new CandidateDocumentValidationError(
        stage,
        issues,
      )
    }
    throw error
  }
}

async function candidateProcess(payload: Payload, accountId: number, req?: { transactionID?: number | string }) {
  return (
    await payload.find({
      collection: 'candidate-processes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateAccount: { equals: accountId } },
    })
  ).docs[0]
}

async function lockCandidateProcess(payload: Payload, transactionID: number | string, processId: number) {
  const database = payload.db.sessions?.[String(transactionID)]?.db as { execute: (query: unknown) => Promise<unknown> } | undefined
  if (!database) throw new Error('Visa document upload requires a transaction with row locking.')
  await database.execute(sql`SELECT id FROM candidate_processes WHERE id = ${processId} FOR UPDATE`)
}

async function reviewedVisaQuestionnaire(
  payload: Payload,
  processId: number,
  accountId: number,
  req?: { transactionID?: number | string },
) {
  return (
    await payload.find({
      collection: 'visa-questionnaires',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [
          { candidateProcess: { equals: processId } },
          { candidateAccount: { equals: accountId } },
          { status: { equals: 'REVIEWED' } },
        ],
      },
    })
  ).docs[0]
}

async function currentProgramDocument(
  payload: Payload,
  accountId: number,
  documentType: ProgramDocumentType,
  req?: { transactionID?: number | string },
) {
  return (
    await payload.find({
      collection: 'candidate-private-documents',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      sort: '-uploadedAt',
      where: {
        and: [
          { candidateAccount: { equals: accountId } },
          { documentType: { equals: documentType } },
          { status: { not_equals: 'SUPERSEDED' } },
        ],
      },
    })
  ).docs[0]
}

export async function candidateProgramDocumentChecklist({
  accountId,
  payload,
}: {
  accountId: number
  payload: Payload
}) {
  const documents = (
    await payload.find({
      collection: 'candidate-private-documents',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: '-uploadedAt',
      where: {
        and: [
          { candidateAccount: { equals: accountId } },
          { documentType: { in: swtProgramDocumentRequirements.map((item) => item.documentType) } },
          { status: { not_equals: 'SUPERSEDED' } },
        ],
      },
    })
  ).docs
  const byType = new Map<string, (typeof documents)[number]>()
  for (const document of documents) {
    if (!byType.has(document.documentType)) byType.set(document.documentType, document)
  }

  return swtProgramDocumentRequirements.map((requirement) => {
    const document = byType.get(requirement.documentType)
    return {
      ...requirement,
      document: document
        ? {
            fileName: document.originalFileName,
            id: document.id,
            rejectionReason: document.rejectionReason ?? undefined,
            status: document.status as 'REJECTED' | 'UPLOADED' | 'VERIFIED',
          }
        : undefined,
    }
  })
}

async function visaDocumentChecklistItems(payload: Payload, accountId: number, req?: { transactionID?: number | string }) {
  const documents = (
    await payload.find({
      collection: 'candidate-private-documents',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      req,
      sort: '-uploadedAt',
      where: {
        and: [
          { candidateAccount: { equals: accountId } },
          { documentType: { in: swtVisaDocumentRequirements.map((item) => item.documentType) } },
          { status: { not_equals: 'SUPERSEDED' } },
        ],
      },
    })
  ).docs
  const byType = new Map<string, (typeof documents)[number]>()
  for (const document of documents) {
    if (!byType.has(document.documentType)) byType.set(document.documentType, document)
  }
  return swtVisaDocumentRequirements.map((requirement) => {
    const document = byType.get(requirement.documentType)
    return {
      ...requirement,
      document: document ? {
        fileName: document.originalFileName,
        id: document.id,
        rejectionReason: document.rejectionReason ?? undefined,
        status: document.status as 'REJECTED' | 'UPLOADED' | 'VERIFIED',
      } : undefined,
    }
  })
}

export async function candidateVisaDocumentChecklist({ accountId, payload }: { accountId: number; payload: Payload }) {
  const { account } = await activeCandidate(payload, accountId)
  const process = await candidateProcess(payload, account.id)
  if (!process || process.programCode !== 'SWT' || !['VISA', 'TRAVEL_PREPARATION', 'USA_STAY'].includes(process.currentStep)) {
    throw new CandidateDocumentError('Vizna dokumentacija trenutno nije dostupna.', 403)
  }
  const available = Boolean(await reviewedVisaQuestionnaire(payload, process.id, account.id))
  const items = await visaDocumentChecklistItems(payload, account.id)
  return {
    available,
    checklistVersion: SWT_VISA_DOCUMENT_CHECKLIST_VERSION,
    complete: available && requiredVisaDocumentsVerified(items.filter((item) => item.document?.status === 'VERIFIED').map((item) => item.documentType)),
    editable: available && process.processStatus === 'ACTIVE' && process.currentStep === 'VISA',
    items,
  }
}

export async function adminVisaDocumentChecklist({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new CandidateDocumentError('Proces kandidata nije pronađen.', 404)
  if (process.programCode !== 'SWT') throw new CandidateDocumentError('Vizna dokumentacija nije dostupna za ovaj program.', 404)
  const accountId = relationId(process.candidateAccount)
  const available = process.processStatus === 'ACTIVE' && process.currentStep === 'VISA' && Boolean(await reviewedVisaQuestionnaire(payload, process.id, accountId))
  const items = await visaDocumentChecklistItems(payload, accountId)
  return {
    available,
    checklistVersion: SWT_VISA_DOCUMENT_CHECKLIST_VERSION,
    complete: available && requiredVisaDocumentsVerified(items.filter((item) => item.document?.status === 'VERIFIED').map((item) => item.documentType)),
    editable: available && process.processStatus === 'ACTIVE' && process.currentStep === 'VISA',
    items,
  }
}

async function currentVisaDocument(
  payload: Payload,
  accountId: number,
  documentType: UploadableVisaDocumentType,
  req?: { transactionID?: number | string },
) {
  return (
    await payload.find({
      collection: 'candidate-private-documents', depth: 0, limit: 1, overrideAccess: true, req, sort: '-uploadedAt',
      where: { and: [
        { candidateAccount: { equals: accountId } },
        { documentType: { equals: documentType } },
        { status: { not_equals: 'SUPERSEDED' } },
      ] },
    })
  ).docs[0]
}

export async function uploadCandidateVisaDocument({ accountId, bytes, documentType, fileName, now, payload }: {
  accountId: number
  bytes: Uint8Array
  documentType: UploadableVisaDocumentType
  fileName: string
  now: Date
  payload: Payload
}) {
  const requirement = uploadableVisaDocumentRequirement(documentType)
  if (!requirement) throw new CandidateDocumentError('Vrsta viznog dokumenta nije podržana.', 404)
  const { account, application } = await activeCandidate(payload, accountId)
  const initialProcess = await candidateProcess(payload, account.id)
  if (!initialProcess || initialProcess.programCode !== 'SWT' || initialProcess.processStatus !== 'ACTIVE' || initialProcess.currentStep !== 'VISA') {
    throw new CandidateDocumentError('Vizna dokumentacija trenutno nije otvorena.', 403)
  }
  if (!await reviewedVisaQuestionnaire(payload, initialProcess.id, account.id)) {
    throw new CandidateDocumentError('Vizna dokumentacija se otključava nakon pregleda viznog upitnika.', 403)
  }
  const profile = await sensitiveProfile(payload, account.id)
  if (!profile) throw new CandidateDocumentError('Bezbedni profil kandidata nije pronađen.', 409)
  let inspected: ReturnType<typeof inspectVisaDocument>
  try { inspected = inspectVisaDocument(documentType, fileName, bytes) }
  catch (error) { throw new CandidateDocumentError(error instanceof Error ? error.message : 'Dokument nije ispravan.') }

  const keyring = readSensitiveDataKeyring()
  const encrypted = encryptSensitiveBytes(bytes, keyring, privateDocumentEncryptionContext(documentType, account.id))
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Visa document upload requires a database transaction.')
  const req = { transactionID }
  let stage: PassportUploadStage = 'document.create'
  try {
    await lockCandidateProcess(payload, transactionID, initialProcess.id)
    const process = await candidateProcess(payload, account.id, req)
    if (!process || process.id !== initialProcess.id || process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') {
      throw new CandidateDocumentError('Vizna dokumentacija trenutno nije otvorena.', 403)
    }
    if (!await reviewedVisaQuestionnaire(payload, process.id, account.id, req)) {
      throw new CandidateDocumentError('Vizna dokumentacija se otključava nakon pregleda viznog upitnika.', 403)
    }
    const existing = await currentVisaDocument(payload, account.id, documentType, req)
    if (existing?.status === 'VERIFIED') throw new CandidateDocumentError('Verifikovan dokument može zameniti samo administrator.', 409)
    if (existing) {
      stage = 'previousDocument.supersede'
      await payload.update({ collection: 'candidate-private-documents', data: { status: 'SUPERSEDED', supersededAt: now.toISOString() }, id: existing.id, overrideAccess: true, req })
    }
    stage = 'document.create'
    const document = await payload.create({
      collection: 'candidate-private-documents', overrideAccess: true, req,
      data: {
        authTag: encrypted.authTag, candidateAccount: account.id, ciphertext: encrypted.ciphertext,
        documentType, iv: encrypted.iv, keyId: encrypted.keyId, mimeType: inspected.mimeType,
        originalFileName: inspected.fileName, preApplication: application.id,
        retentionReviewAt: retentionReviewDate(now).toISOString(), sensitiveProfile: profile.id,
        sha256: inspected.sha256, sizeBytes: inspected.sizeBytes, status: 'UPLOADED', uploadedAt: now.toISOString(),
      },
    })
    stage = 'audit.create'
    await payload.create({
      collection: 'audit-events', overrideAccess: true, req,
      data: {
        actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId,
        eventType: 'PRIVATE_DOCUMENT_UPLOADED',
        metadata: { candidateAccountId: account.id, checklistVersion: SWT_VISA_DOCUMENT_CHECKLIST_VERSION, documentId: document.id, documentType, mimeType: inspected.mimeType, sizeBytes: inspected.sizeBytes },
        newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
        previousStatus: application.status, workflowVersion: application.workflowVersion,
      },
    })
    await payload.update({
      collection: 'candidate-processes', id: process.id, overrideAccess: true, req,
      data: { nextActionDescription: `Vizni dokument „${requirement.label}“ čeka proveru agencije.`, nextActionTitle: 'Sačekajte proveru vizne dokumentacije' },
    })
    await payload.db.commitTransaction(transactionID)
    return { documentId: document.id, fileName: document.originalFileName, status: document.status }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const issues = payloadValidationIssues(error)
    if (issues) throw new CandidateDocumentValidationError(stage, issues)
    throw error
  }
}

export async function uploadCandidateProgramDocument({
  accountId,
  bytes,
  documentType,
  fileName,
  now,
  payload,
}: {
  accountId: number
  bytes: Uint8Array
  documentType: ProgramDocumentType
  fileName: string
  now: Date
  payload: Payload
}) {
  const requirement = programDocumentRequirement(documentType)
  if (!requirement) throw new CandidateDocumentError('Vrsta dokumenta nije podržana.', 404)
  const { account, application } = await activeCandidate(payload, accountId)
  const process = await candidateProcess(payload, account.id)
  if (!process || process.processStatus !== 'ACTIVE' || process.currentStep !== 'DOCUMENTS') {
    throw new CandidateDocumentError('Programska dokumentacija trenutno nije otvorena.', 403)
  }
  const profile = await sensitiveProfile(payload, account.id)
  if (!profile) throw new CandidateDocumentError('Bezbedni profil kandidata nije pronađen.', 409)
  let inspected: ReturnType<typeof inspectProgramDocument>
  try {
    inspected = inspectProgramDocument(documentType, fileName, bytes)
  } catch (error) {
    throw new CandidateDocumentError(error instanceof Error ? error.message : 'Dokument nije ispravan.')
  }
  const existing = await currentProgramDocument(payload, account.id, documentType)
  if (existing?.status === 'VERIFIED') {
    throw new CandidateDocumentError('Verifikovan dokument može zameniti samo administrator.', 409)
  }
  const keyring = readSensitiveDataKeyring()
  const encrypted = encryptSensitiveBytes(
    bytes,
    keyring,
    privateDocumentEncryptionContext(documentType, account.id),
  )
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Program document upload requires a database transaction.')
  const req = { transactionID }
  let stage: PassportUploadStage = 'document.create'
  try {
    if (existing) {
      stage = 'previousDocument.supersede'
      await payload.update({
        collection: 'candidate-private-documents',
        data: { status: 'SUPERSEDED', supersededAt: now.toISOString() },
        id: existing.id,
        overrideAccess: true,
        req,
      })
    }
    stage = 'document.create'
    const document = await payload.create({
      collection: 'candidate-private-documents',
      data: {
        authTag: encrypted.authTag,
        candidateAccount: account.id,
        ciphertext: encrypted.ciphertext,
        documentType,
        iv: encrypted.iv,
        keyId: encrypted.keyId,
        mimeType: inspected.mimeType,
        originalFileName: inspected.fileName,
        preApplication: application.id,
        retentionReviewAt: retentionReviewDate(now).toISOString(),
        sensitiveProfile: profile.id,
        sha256: inspected.sha256,
        sizeBytes: inspected.sizeBytes,
        status: 'UPLOADED',
        uploadedAt: now.toISOString(),
      },
      overrideAccess: true,
      req,
    })
    stage = 'audit.create'
    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT',
        correlationId: application.correlationId,
        eventType: 'PRIVATE_DOCUMENT_UPLOADED',
        metadata: {
          candidateAccountId: account.id,
          checklistVersion: SWT_PROGRAM_DOCUMENT_CHECKLIST_VERSION,
          documentId: document.id,
          documentType,
          mimeType: inspected.mimeType,
          sizeBytes: inspected.sizeBytes,
        },
        newStatus: application.status,
        occurredAt: now.toISOString(),
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req,
    })
    await payload.update({
      collection: 'candidate-processes',
      data: {
        nextActionDescription: `Dokument „${requirement.label}“ čeka proveru agencije.`,
        nextActionTitle: 'Sačekajte proveru dokumentacije',
      },
      id: process.id,
      overrideAccess: true,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return { documentId: document.id, fileName: document.originalFileName, status: document.status }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const issues = payloadValidationIssues(error)
    if (issues) throw new CandidateDocumentValidationError(stage, issues)
    throw error
  }
}

export async function reviewCandidatePrivateDocument({
  action,
  administratorId,
  documentId,
  now,
  payload,
  rejectionReason,
}: {
  action: 'REJECT' | 'VERIFY'
  administratorId: number
  documentId: number
  now: Date
  payload: Payload
  rejectionReason?: string
}) {
  const document = await payload.findByID({ collection: 'candidate-private-documents', depth: 0, id: documentId, overrideAccess: true })
  if (document.status !== 'UPLOADED') throw new CandidateDocumentError('Ovaj dokument je već obrađen.', 409)
  if (action === 'REJECT' && (!rejectionReason || rejectionReason.trim().length < 5)) {
    throw new CandidateDocumentError('Unesite jasan razlog odbijanja dokumenta.')
  }
  const profile = await payload.findByID({ collection: 'candidate-sensitive-profiles', depth: 0, id: relationId(document.sensitiveProfile), overrideAccess: true })
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(document.preApplication), overrideAccess: true })
  const isPassport = document.documentType === 'PASSPORT'
  const visaRequirement = visaDocumentRequirement(document.documentType)
  const ready = isPassport && action === 'VERIFY' && profile.personalIdStatus === 'VALIDATED'
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Private document review requires a database transaction.')
  const req = { transactionID }
  try {
    await payload.update({
      collection: 'candidate-private-documents',
      data: {
        rejectionReason: action === 'REJECT' ? rejectionReason?.trim() : null,
        status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
        verifiedAt: now.toISOString(),
        verifiedBy: administratorId,
      },
      id: document.id,
      overrideAccess: true,
      req,
    })
    if (isPassport) {
      await payload.update({
        collection: 'candidate-sensitive-profiles',
        data: { contractReadinessStatus: ready ? 'READY' : 'INCOMPLETE', readinessUpdatedAt: now.toISOString() },
        id: profile.id,
        overrideAccess: true,
        req,
      })
    }
    await payload.create({
      collection: 'audit-events',
      data: {
        actor: administratorId, actorType: 'ADMIN', correlationId: application.correlationId,
        eventType: action === 'VERIFY' ? 'PRIVATE_DOCUMENT_VERIFIED' : 'PRIVATE_DOCUMENT_REJECTED',
        metadata: { documentId: document.id, documentType: document.documentType, reasonProvided: action === 'REJECT' },
        newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
        previousStatus: application.status, workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req,
    })
    if (ready) {
      await payload.create({
        collection: 'audit-events',
        data: {
          actor: administratorId, actorType: 'ADMIN', correlationId: application.correlationId,
          eventType: 'CONTRACT_READINESS_ACHIEVED', metadata: { profileId: profile.id },
          newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
          previousStatus: application.status, workflowVersion: application.workflowVersion,
        },
        overrideAccess: true,
        req,
      })
    }
    let programDocumentsComplete = false
    let visaDocumentsComplete = false
    if (!isPassport) {
      const process = await candidateProcess(payload, relationId(document.candidateAccount), req)
      if (process?.processStatus === 'ACTIVE' && process.currentStep === 'DOCUMENTS') {
        if (action === 'REJECT') {
          const requirement = programDocumentRequirement(document.documentType)
          await payload.update({
            collection: 'candidate-processes',
            data: {
              nextActionDescription: `Postavite ispravan dokument „${requirement?.label ?? 'Programski dokument'}“ prema napomeni agencije.`,
              nextActionTitle: 'Zamenite odbijeni dokument',
            },
            id: process.id,
            overrideAccess: true,
            req,
          })
        } else {
          const verified = await payload.find({
            collection: 'candidate-private-documents',
            depth: 0,
            limit: 100,
            overrideAccess: true,
            req,
            where: {
              and: [
                { candidateAccount: { equals: relationId(document.candidateAccount) } },
                { documentType: { in: swtProgramDocumentRequirements.map((item) => item.documentType) } },
                { status: { equals: 'VERIFIED' } },
              ],
            },
          })
          const verifiedTypes = new Set(verified.docs.map((item) => item.documentType))
          programDocumentsComplete = requiredProgramDocumentsVerified(verifiedTypes)
          if (programDocumentsComplete) {
            await payload.update({
              collection: 'candidate-processes',
              data: {
                currentStep: 'JOB_PLACEMENT',
                nextActionDescription: 'Dokumentacija je prihvaćena. Agencija će evidentirati naredni korak pripreme za posao i intervju.',
                nextActionDueAt: null,
                nextActionTitle: 'Sačekajte informacije o poslu i intervjuu',
              },
              id: process.id,
              overrideAccess: true,
              req,
            })
            await payload.create({
              collection: 'audit-events',
              data: {
                actor: administratorId,
                actorType: 'ADMIN',
                correlationId: application.correlationId,
                eventType: 'CANDIDATE_PROCESS_UPDATED',
                metadata: {
                  candidateProcessId: process.id,
                  checklistVersion: SWT_PROGRAM_DOCUMENT_CHECKLIST_VERSION,
                  fromStep: 'DOCUMENTS',
                  reason: 'PROGRAM_DOCUMENTS_VERIFIED',
                  toStep: 'JOB_PLACEMENT',
                },
                newStatus: application.status,
                occurredAt: now.toISOString(),
                preApplication: application.id,
                previousStatus: application.status,
                workflowVersion: application.workflowVersion,
              },
              overrideAccess: true,
              req,
            })
          }
        }
      }
    }
    if (visaRequirement) {
      const process = await candidateProcess(payload, relationId(document.candidateAccount), req)
      if (process?.processStatus === 'ACTIVE' && process.currentStep === 'VISA') {
        if (action === 'REJECT') {
          await payload.update({
            collection: 'candidate-processes', id: process.id, overrideAccess: true, req,
            data: {
              nextActionDescription: `Postavite ispravan dokument „${visaRequirement.label}“ prema napomeni agencije.`,
              nextActionTitle: 'Zamenite odbijeni vizni dokument',
            },
          })
        } else {
          const verified = await payload.find({
            collection: 'candidate-private-documents', depth: 0, limit: 100, overrideAccess: true, req,
            where: { and: [
              { candidateAccount: { equals: relationId(document.candidateAccount) } },
              { documentType: { in: swtVisaDocumentRequirements.map((item) => item.documentType) } },
              { status: { equals: 'VERIFIED' } },
            ] },
          })
          visaDocumentsComplete = requiredVisaDocumentsVerified(verified.docs.map((item) => item.documentType))
          if (visaDocumentsComplete) {
            await payload.update({
              collection: 'candidate-processes', id: process.id, overrideAccess: true, req,
              data: {
                nextActionDescription: 'Svi dokumenti sa trenutne vizne liste su prihvaćeni. Agencija će evidentirati naredni korak viznog procesa.',
                nextActionDueAt: null,
                nextActionTitle: 'Sačekajte informacije o terminu u ambasadi',
              },
            })
          }
        }
      }
    }
    await payload.db.commitTransaction(transactionID)
    return {
      programDocumentsComplete,
      status: action === 'VERIFY' ? 'VERIFIED' as const : 'REJECTED' as const,
      visaDocumentsComplete,
    }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function downloadPrivateDocument({
  actor,
  documentId,
  now,
  payload,
}: {
  actor: { collection: 'candidate-accounts' | 'users'; id: number }
  documentId: number
  now: Date
  payload: Payload
}) {
  const document = await payload.findByID({ collection: 'candidate-private-documents', depth: 0, id: documentId, overrideAccess: true })
  if (actor.collection === 'candidate-accounts' && relationId(document.candidateAccount) !== actor.id) {
    throw new CandidateDocumentError('Dokument nije pronađen.', 404)
  }
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(document.preApplication), overrideAccess: true })
  const keyring = readSensitiveDataKeyring()
  const encrypted: EncryptedValue = { authTag: document.authTag, ciphertext: document.ciphertext, iv: document.iv, keyId: document.keyId }
  const bytes = decryptSensitiveBytes(
    encrypted,
    keyring,
    privateDocumentEncryptionContext(
      document.documentType as PrivateDocumentType,
      relationId(document.candidateAccount),
    ),
  )
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actor.collection === 'users' ? actor.id : undefined,
      actorType: actor.collection === 'users' ? 'ADMIN' : 'PUBLIC_APPLICANT',
      correlationId: application.correlationId,
      eventType: 'PRIVATE_DOCUMENT_ACCESSED',
      metadata: { actorAccountId: actor.collection === 'candidate-accounts' ? actor.id : undefined, documentId: document.id, documentType: document.documentType },
      newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id,
      previousStatus: application.status, workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
  })
  return { bytes, fileName: document.originalFileName, mimeType: document.mimeType }
}

export async function runPassportOcrForDocument({
  documentId,
  now,
  payload,
}: {
  documentId: number
  now: Date
  payload: Payload
}) {
  const document = await payload.findByID({
    collection: 'candidate-private-documents',
    depth: 0,
    id: documentId,
    overrideAccess: true,
  })
  if (document.documentType !== 'PASSPORT') {
    throw new CandidateDocumentError('OCR obrada je podržana samo za dokumente pasoša.', 400)
  }

  const accountId = relationId(document.candidateAccount)
  const account = await payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true })
  const applicant = await payload.findByID({ collection: 'applicants', depth: 0, id: relationId(account.applicant), overrideAccess: true })
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(account.preApplication), overrideAccess: true })

  const keyring = readSensitiveDataKeyring()
  const encrypted: EncryptedValue = {
    authTag: document.authTag,
    ciphertext: document.ciphertext,
    iv: document.iv,
    keyId: document.keyId,
  }
  const bytes = decryptSensitiveBytes(
    encrypted,
    keyring,
    privateDocumentEncryptionContext('PASSPORT', accountId),
  )

  const ocrResult = await processPassportOcr(bytes, document.mimeType as SupportedDocumentMimeType, {
    dateOfBirth: applicant.dateOfBirth,
    firstName: applicant.firstName,
    lastName: applicant.lastName,
  })

  await payload.update({
    collection: 'candidate-private-documents',
    data: {
      ocrData: ocrResult as unknown as Record<string, unknown>,
      ocrExpirationDate: ocrResult.extracted?.expirationDate ?? null,
      ocrPassportNumber: ocrResult.extracted?.documentNumber ?? null,
      ocrStatus: ocrResult.status,
    },
    id: documentId,
    overrideAccess: true,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actorType: 'ADMIN',
      correlationId: application.correlationId,
      eventType: 'PASSPORT_OCR_PROCESSED',
      metadata: {
        documentId: document.id,
        ocrStatus: ocrResult.status,
        overallMatch: ocrResult.match?.overallMatch,
        passportNumberExtracted: !!ocrResult.extracted?.documentNumber,
      },
      newStatus: application.status,
      occurredAt: now.toISOString(),
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
  })

  return ocrResult
}


