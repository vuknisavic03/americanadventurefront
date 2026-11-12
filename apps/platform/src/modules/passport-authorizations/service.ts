import { createHash } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { adminVisaDocumentChecklist } from '../candidate-documents/service.ts'
import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  type EncryptedValue,
} from '../candidate-documents/sensitiveDataCrypto.ts'
import {
  PASSPORT_AUTHORIZATION_ACCEPTANCE_STATEMENT_VERSION,
  passportAuthorizationAcceptanceStatement,
} from './acceptanceStatement.ts'
import { renderPassportAuthorizationPdf } from './renderPassportAuthorizationPdf.ts'
import {
  MAX_PASSPORT_AUTHORIZATION_PDF_BYTES,
  MAX_PASSPORT_AUTHORIZATION_SNAPSHOT_BYTES,
} from './storage.ts'
import { renderPassportAuthorizationTemplate } from './templateRules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }
function sha256(value: Uint8Array | string) { return createHash('sha256').update(value).digest('hex') }
function localDate(value: Date) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(value) }
function authorizationNumber(processId: number, now: Date) { return `AA-PUN-${now.getUTCFullYear()}-${String(processId).padStart(6, '0')}` }

export class PassportAuthorizationError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'PassportAuthorizationError'
  }
}

async function existingForProcess(payload: Payload, candidateProcessId: number) {
  return (await payload.find({
    collection: 'passport-collection-authorizations', depth: 0, limit: 1, overrideAccess: true,
    where: { candidateProcess: { equals: candidateProcessId } },
  })).docs[0]
}

async function lockAuthorization(payload: Payload, transactionID: number | string, authorizationId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute: (query: unknown) => Promise<unknown> }
  if (!transaction) throw new Error('Passport authorization transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "passport_collection_authorizations" WHERE "id" = ${authorizationId} FOR UPDATE`)
}

export async function passportAuthorizationForPortal(payload: Payload, candidateAccountId: number) {
  const authorization = (await payload.find({
    collection: 'passport-collection-authorizations', depth: 0, limit: 1, overrideAccess: true,
    where: { candidateAccount: { equals: candidateAccountId } },
  })).docs[0]
  if (!authorization) return undefined
  return {
    acceptedAt: authorization.acceptedAt ?? undefined,
    acceptanceReference: authorization.acceptanceReference ?? undefined,
    authorizationNumber: authorization.authorizationNumber,
    generatedAt: authorization.generatedAt,
    id: authorization.id,
    sourcePdfSha256: authorization.pdfSha256,
    status: authorization.status,
  }
}

export async function passportAuthorizationForAdmin(payload: Payload, candidateProcessId: number) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new PassportAuthorizationError('Proces kandidata nije pronađen.', 404)
  const authorization = await existingForProcess(payload, process.id)
  const templates = await payload.find({
    collection: 'passport-authorization-templates', depth: 0, limit: 2, overrideAccess: true,
    where: { and: [{ programCode: { equals: process.programCode } }, { status: { equals: 'ACTIVE' } }] },
  })
  const checklist = await adminVisaDocumentChecklist({ candidateProcessId: process.id, payload })
  const profile = (await payload.find({
    collection: 'candidate-sensitive-profiles', depth: 0, limit: 1, overrideAccess: true,
    where: { candidateAccount: { equals: relationId(process.candidateAccount) } },
  })).docs[0]
  const blockers: string[] = []
  if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') blockers.push('Proces mora biti aktivan i na koraku „Viza“.')
  if (!checklist.complete) blockers.push('Sva vizna dokumentacija mora biti prihvaćena.')
  if (!profile || profile.contractReadinessStatus !== 'READY' || profile.personalIdStatus !== 'VALIDATED') blockers.push('Verifikovani identifikacioni podaci nisu kompletni.')
  if (templates.docs.length !== 1) blockers.push('Mora postojati tačno jedan aktivan šablon punomoćja za program.')
  return {
    authorization: authorization ? {
      acceptedAt: authorization.acceptedAt ?? undefined,
      acceptanceReference: authorization.acceptanceReference ?? undefined,
      authorizationNumber: authorization.authorizationNumber,
      generatedAt: authorization.generatedAt,
      id: authorization.id,
      status: authorization.status,
    } : undefined,
    blockers,
    ready: !authorization && blockers.length === 0,
    template: templates.docs.length === 1 ? { id: templates.docs[0]!.id, name: templates.docs[0]!.name, version: templates.docs[0]!.version } : undefined,
  }
}

export async function generatePassportAuthorization({ administratorId, candidateProcessId, now, payload }: {
  administratorId: number
  candidateProcessId: number
  now: Date
  payload: Payload
}) {
  const existing = await existingForProcess(payload, candidateProcessId)
  if (existing) return { authorization: existing, created: false }
  const state = await passportAuthorizationForAdmin(payload, candidateProcessId)
  if (!state.ready || !state.template) throw new PassportAuthorizationError(state.blockers[0] ?? 'Punomoćje trenutno nije moguće generisati.')
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true })
  const accountId = relationId(process.candidateAccount)
  const applicantId = relationId(process.applicant)
  const applicationId = relationId(process.preApplication)
  const [account, applicant, application, profile, template] = await Promise.all([
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true }),
    payload.findByID({ collection: 'applicants', depth: 0, id: applicantId, overrideAccess: true }),
    payload.findByID({ collection: 'pre-applications', depth: 0, id: applicationId, overrideAccess: true }),
    payload.find({ collection: 'candidate-sensitive-profiles', depth: 0, limit: 1, overrideAccess: true, where: { candidateAccount: { equals: accountId } } }).then((result) => result.docs[0]),
    payload.findByID({ collection: 'passport-authorization-templates', depth: 0, id: state.template.id, overrideAccess: true }),
  ])
  if (!profile?.personalIdCiphertext || !profile.personalIdIv || !profile.personalIdAuthTag || !profile.personalIdKeyId) {
    throw new PassportAuthorizationError('Validirani JMBG nije dostupan.')
  }
  const number = authorizationNumber(process.id, now)
  const keyring = readSensitiveDataKeyring()
  const personalIdBytes = decryptSensitiveBytes({
    authTag: profile.personalIdAuthTag, ciphertext: profile.personalIdCiphertext, iv: profile.personalIdIv, keyId: profile.personalIdKeyId,
  }, keyring, `jmbg:${accountId}`)
  try {
    const renderedBody = renderPassportAuthorizationTemplate(template.body, {
      'authorization.date': localDate(now), 'authorization.number': number,
      'candidate.address': applicant.residentialAddress, 'candidate.fullName': applicant.fullName,
      'candidate.personalId': personalIdBytes.toString('utf8'),
    })
    const snapshot = {
      authorization: { date: now.toISOString(), number, renderedBody },
      candidate: { address: applicant.residentialAddress, fullName: applicant.fullName, personalId: personalIdBytes.toString('utf8') },
      programCode: account.programCode,
      schemaVersion: 1,
      template: { checksum: template.contentChecksum, id: template.id, name: template.name, version: template.version },
    }
    const snapshotBytes = Buffer.from(JSON.stringify(snapshot), 'utf8')
    if (snapshotBytes.length > MAX_PASSPORT_AUTHORIZATION_SNAPSHOT_BYTES) throw new Error('Passport authorization snapshot exceeds its safe storage limit.')
    const pdfBytes = Buffer.from(await renderPassportAuthorizationPdf({ authorizationDate: now, authorizationNumber: number, body: renderedBody, candidateName: applicant.fullName }))
    if (pdfBytes.length > MAX_PASSPORT_AUTHORIZATION_PDF_BYTES) throw new Error('Passport authorization PDF exceeds its safe storage limit.')
    const encryptedSnapshot = encryptSensitiveBytes(snapshotBytes, keyring, `passport-authorization-snapshot:${accountId}:${number}`)
    const encryptedPdf = encryptSensitiveBytes(pdfBytes, keyring, `passport-authorization-pdf:${accountId}:${number}`)
    const retention = new Date(now); retention.setUTCFullYear(retention.getUTCFullYear() + 7)
    const transactionID = await payload.db.beginTransaction()
    if (transactionID === null) throw new Error('Passport authorization generation requires a database transaction.')
    const req = { transactionID } as PayloadRequest
    try {
      const authorization = await payload.create({ collection: 'passport-collection-authorizations', data: {
        applicant: applicantId, authorizationNumber: number, candidateAccount: accountId,
        candidateProcess: process.id, generatedAt: now.toISOString(), generatedBy: administratorId,
        generationKey: sha256(`candidate-process:${process.id}`), pdfAuthTag: encryptedPdf.authTag,
        pdfCiphertext: encryptedPdf.ciphertext, pdfFileName: `punomocje-${number}.pdf`, pdfIv: encryptedPdf.iv,
        pdfKeyId: encryptedPdf.keyId, pdfSha256: sha256(pdfBytes), pdfSizeBytes: pdfBytes.length,
        preApplication: applicationId, programCode: account.programCode, retentionReviewAt: retention.toISOString(),
        sensitiveProfile: profile.id, snapshotAuthTag: encryptedSnapshot.authTag, snapshotCiphertext: encryptedSnapshot.ciphertext,
        snapshotIv: encryptedSnapshot.iv, snapshotKeyId: encryptedSnapshot.keyId, snapshotSha256: sha256(snapshotBytes),
        status: 'GENERATED', template: template.id, templateChecksum: template.contentChecksum, templateVersion: template.version,
      }, overrideAccess: true, req })
      await payload.create({ collection: 'audit-events', data: {
        actor: administratorId, actorType: 'ADMIN', correlationId: application.correlationId,
        eventType: 'PASSPORT_AUTHORIZATION_GENERATED', metadata: { authorizationId: authorization.id, authorizationNumber: number, candidateProcessId: process.id, templateId: template.id, templateVersion: template.version },
        newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion,
      }, overrideAccess: true, req })
      await payload.update({ collection: 'candidate-processes', id: process.id, data: {
        nextActionDescription: 'Pregledajte generisano punomoćje i prihvatite ga ako su podaci tačni.', nextActionDueAt: null,
        nextActionTitle: 'Pregledajte i prihvatite punomoćje',
      }, overrideAccess: true, req })
      await payload.db.commitTransaction(transactionID)
      return { authorization, created: true }
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)
      const concurrent = await existingForProcess(payload, process.id)
      if (concurrent) return { authorization: concurrent, created: false }
      throw error
    } finally { snapshotBytes.fill(0); pdfBytes.fill(0) }
  } finally { personalIdBytes.fill(0) }
}

type Snapshot = { authorization: { date: string; number: string; renderedBody: string }; candidate: { fullName: string }; programCode: string }
function parseSnapshot(bytes: Buffer, number: string): Snapshot {
  const value = JSON.parse(bytes.toString('utf8')) as Partial<Snapshot>
  if (!value.authorization || value.authorization.number !== number || typeof value.authorization.date !== 'string' || typeof value.authorization.renderedBody !== 'string' || !value.candidate || typeof value.candidate.fullName !== 'string' || typeof value.programCode !== 'string') {
    throw new Error('Stored passport authorization snapshot is invalid.')
  }
  return value as Snapshot
}

export async function acceptPassportAuthorization({ candidateAccountId, authorizationId, expectedSourcePdfSha256, now, payload }: {
  candidateAccountId: number
  authorizationId: number
  expectedSourcePdfSha256: string
  now: Date
  payload: Payload
}) {
  const authorization = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true }).catch(() => undefined)
  if (!authorization || relationId(authorization.candidateAccount) !== candidateAccountId) throw new PassportAuthorizationError('Punomoćje nije pronađeno.', 404)
  if (expectedSourcePdfSha256 !== authorization.pdfSha256) throw new PassportAuthorizationError('Prikazana verzija punomoćja više nije važeća za prihvatanje.')
  if (authorization.status === 'ACCEPTED') return { authorization, created: false }
  const keyring = readSensitiveDataKeyring()
  const snapshotBytes = decryptSensitiveBytes({ authTag: authorization.snapshotAuthTag, ciphertext: authorization.snapshotCiphertext, iv: authorization.snapshotIv, keyId: authorization.snapshotKeyId }, keyring, `passport-authorization-snapshot:${candidateAccountId}:${authorization.authorizationNumber}`)
  let finalPdfBytes: Buffer | undefined
  try {
    if (sha256(snapshotBytes) !== authorization.snapshotSha256) throw new Error('Passport authorization snapshot integrity verification failed.')
    const snapshot = parseSnapshot(snapshotBytes, authorization.authorizationNumber)
    const documentDate = new Date(snapshot.authorization.date)
    if (Number.isNaN(documentDate.getTime())) throw new Error('Stored passport authorization date is invalid.')
    const statement = passportAuthorizationAcceptanceStatement(authorization.authorizationNumber)
    const reference = `AA-PUN-ACCEPT-${sha256(`authorization:${authorization.id}:candidate:${candidateAccountId}:source:${authorization.pdfSha256}`).slice(0, 16).toUpperCase()}`
    const statementChecksum = sha256(statement)
    const evidenceSha256 = sha256(JSON.stringify({ acceptedAt: now.toISOString(), authorizationId: authorization.id, candidateAccountId, reference, sourcePdfSha256: authorization.pdfSha256, statementChecksum, statementVersion: PASSPORT_AUTHORIZATION_ACCEPTANCE_STATEMENT_VERSION }))
    finalPdfBytes = Buffer.from(await renderPassportAuthorizationPdf({
      acceptance: { acceptedAt: now, reference, statement, statementVersion: PASSPORT_AUTHORIZATION_ACCEPTANCE_STATEMENT_VERSION },
      authorizationDate: documentDate, authorizationNumber: authorization.authorizationNumber,
      body: snapshot.authorization.renderedBody, candidateName: snapshot.candidate.fullName,
    }))
    if (finalPdfBytes.length > MAX_PASSPORT_AUTHORIZATION_PDF_BYTES) throw new Error('Accepted passport authorization PDF exceeds its safe storage limit.')
    const encrypted = encryptSensitiveBytes(finalPdfBytes, keyring, `accepted-passport-authorization-pdf:${candidateAccountId}:${authorization.authorizationNumber}:${reference}`)
    const transactionID = await payload.db.beginTransaction()
    if (transactionID === null) throw new Error('Passport authorization acceptance requires a database transaction.')
    const req = { transactionID } as PayloadRequest
    try {
      await lockAuthorization(payload, transactionID, authorization.id)
      const current = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorization.id, overrideAccess: true, req })
      if (relationId(current.candidateAccount) !== candidateAccountId) throw new PassportAuthorizationError('Punomoćje nije pronađeno.', 404)
      if (expectedSourcePdfSha256 !== current.pdfSha256) throw new PassportAuthorizationError('Prikazana verzija punomoćja više nije važeća za prihvatanje.')
      if (current.status === 'ACCEPTED') {
        await payload.db.commitTransaction(transactionID)
        return { authorization: current, created: false }
      }
      const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(current.preApplication), overrideAccess: true, req })
      const accepted = await payload.update({ collection: 'passport-collection-authorizations', id: current.id, data: {
        acceptanceReference: reference, acceptedAt: now.toISOString(), evidenceSha256,
        finalPdfAuthTag: encrypted.authTag, finalPdfCiphertext: encrypted.ciphertext,
        finalPdfFileName: `punomocje-${authorization.authorizationNumber}-prihvaceno.pdf`, finalPdfIv: encrypted.iv,
        finalPdfKeyId: encrypted.keyId, finalPdfSha256: sha256(finalPdfBytes), finalPdfSizeBytes: finalPdfBytes.length,
        statementChecksum, statementText: statement, statementVersion: PASSPORT_AUTHORIZATION_ACCEPTANCE_STATEMENT_VERSION, status: 'ACCEPTED',
      }, overrideAccess: true, req })
      await payload.create({ collection: 'audit-events', data: {
        actorType: 'PUBLIC_APPLICANT', correlationId: application.correlationId, eventType: 'PASSPORT_AUTHORIZATION_ACCEPTED',
        metadata: { actorAccountId: candidateAccountId, authorizationId: current.id, authorizationNumber: current.authorizationNumber, evidenceSha256, finalPdfSha256: accepted.finalPdfSha256, reference, sourcePdfSha256: current.pdfSha256 },
        newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion,
      }, overrideAccess: true, req })
      await payload.update({ collection: 'candidate-processes', id: relationId(current.candidateProcess), data: {
        nextActionDescription: 'Punomoćje je prihvaćeno i dostupno agenciji za preuzimanje i štampu.', nextActionDueAt: null,
        nextActionTitle: 'Sačekajte omogućavanje unosa termina u ambasadi',
      }, overrideAccess: true, req })
      await payload.db.commitTransaction(transactionID)
      return { authorization: accepted, created: true }
    } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
  } finally { snapshotBytes.fill(0); finalPdfBytes?.fill(0) }
}

export async function downloadPassportAuthorization({ actor, authorizationId, final, now, payload }: {
  actor: { collection: 'candidate-accounts' | 'users'; id: number }
  authorizationId: number
  final: boolean
  now: Date
  payload: Payload
}) {
  const authorization = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true }).catch(() => undefined)
  if (!authorization || (actor.collection === 'candidate-accounts' && relationId(authorization.candidateAccount) !== actor.id)) throw new PassportAuthorizationError('Punomoćje nije pronađeno.', 404)
  if (final && authorization.status !== 'ACCEPTED') throw new PassportAuthorizationError('Prihvaćeno punomoćje još nije dostupno.', 404)
  const encrypted: EncryptedValue = final
    ? { authTag: authorization.finalPdfAuthTag!, ciphertext: authorization.finalPdfCiphertext!, iv: authorization.finalPdfIv!, keyId: authorization.finalPdfKeyId! }
    : { authTag: authorization.pdfAuthTag, ciphertext: authorization.pdfCiphertext, iv: authorization.pdfIv, keyId: authorization.pdfKeyId }
  const context = final
    ? `accepted-passport-authorization-pdf:${relationId(authorization.candidateAccount)}:${authorization.authorizationNumber}:${authorization.acceptanceReference}`
    : `passport-authorization-pdf:${relationId(authorization.candidateAccount)}:${authorization.authorizationNumber}`
  const bytes = decryptSensitiveBytes(encrypted, readSensitiveDataKeyring(), context)
  const expectedSize = final ? authorization.finalPdfSizeBytes! : authorization.pdfSizeBytes
  const expectedHash = final ? authorization.finalPdfSha256! : authorization.pdfSha256
  if (bytes.length !== expectedSize || sha256(bytes) !== expectedHash) { bytes.fill(0); throw new Error('Passport authorization PDF integrity verification failed.') }
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(authorization.preApplication), overrideAccess: true })
  await payload.create({ collection: 'audit-events', data: {
    actor: actor.collection === 'users' ? actor.id : undefined, actorType: actor.collection === 'users' ? 'ADMIN' : 'PUBLIC_APPLICANT',
    correlationId: application.correlationId, eventType: 'PASSPORT_AUTHORIZATION_ACCESSED',
    metadata: { actorAccountId: actor.collection === 'candidate-accounts' ? actor.id : undefined, authorizationId: authorization.id, authorizationNumber: authorization.authorizationNumber, version: final ? 'ACCEPTED' : 'SOURCE' },
    newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion,
  }, overrideAccess: true })
  return { bytes, fileName: final ? authorization.finalPdfFileName! : authorization.pdfFileName }
}
