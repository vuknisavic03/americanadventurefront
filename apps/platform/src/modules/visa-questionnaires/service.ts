import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'
import type { CandidateProcess, VisaQuestionnaire } from '../../payload-types.ts'
import { decryptSensitiveBytes, encryptSensitiveBytes, readSensitiveDataKeyring, type EncryptedValue } from '../candidate-documents/sensitiveDataCrypto.ts'
import { questionnaireVersion, validateAnswers, type Answers, type QuestionnaireContent, type QuestionnaireView } from './schema.ts'

export class VisaQuestionnaireError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409, readonly fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'VisaQuestionnaireError'
  }
}
const relationId = (value: number | { id: number }) => typeof value === 'number' ? value : value.id
const encryptionContext = (processId: number, accountId: number, version: number) => `visa-questionnaire:${processId}:${accountId}:v${version}`

function content(record: VisaQuestionnaire): QuestionnaireContent {
  if (record.schemaVersion !== questionnaireVersion && record.schemaVersion !== 1) throw new Error('Unsupported visa questionnaire version.')
  return JSON.parse(decryptSensitiveBytes(
    record.encryptedContent as EncryptedValue,
    readSensitiveDataKeyring(),
    encryptionContext(relationId(record.candidateProcess), relationId(record.candidateAccount), record.schemaVersion),
  ).toString('utf8')) as QuestionnaireContent
}

function view(record: VisaQuestionnaire | undefined, editable: boolean): QuestionnaireView {
  const data = record ? content(record) : { answers: {}, feedback: '', history: [] }
  return {
    ...data,
    revision: record?.revision ?? 0,
    schemaVersion: record?.schemaVersion ?? questionnaireVersion,
    status: record?.status ?? 'DRAFT',
    submittedAt: record?.submittedAt,
    editable: editable && (!record || ['DRAFT', 'CHANGES_REQUESTED'].includes(record.status)),
  }
}

async function findQuestionnaire(payload: Payload, processId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'visa-questionnaires', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateProcess: { equals: processId } } })).docs[0]
}
async function paidOrder(payload: Payload, process: CandidateProcess, req?: PayloadRequest) {
  return (await payload.find({ collection: 'visa-payment-orders', depth: 0, limit: 1, overrideAccess: true, req, where: { and: [
    { candidateProcess: { equals: process.id } },
    { candidateAccount: { equals: relationId(process.candidateAccount) } },
    { status: { equals: 'PAID' } },
  ] } })).docs[0]
}
function assertOpen(process: CandidateProcess) {
  if (process.programCode !== 'SWT' || process.currentStep !== 'VISA' || process.processStatus !== 'ACTIVE') {
    throw new VisaQuestionnaireError('Vizni upitnik trenutno nije otvoren za izmene.', 403)
  }
}
async function candidateProcess(payload: Payload, accountId: number, req?: PayloadRequest) {
  const account = await payload.findByID({ collection: 'candidate-accounts', id: accountId, depth: 0, overrideAccess: true, req })
  if (account.accountStatus !== 'ACTIVE' || !account._verified) throw new VisaQuestionnaireError('Nalog kandidata nije aktivan.', 403)
  const process = (await payload.find({ collection: 'candidate-processes', depth: 0, limit: 1, overrideAccess: true, req, where: { candidateAccount: { equals: accountId } } })).docs[0]
  if (!process) throw new VisaQuestionnaireError('Proces kandidata nije pronađen.', 404)
  return process
}
async function lock(payload: Payload, transactionID: string | number, processId: number) {
  const db = payload.db.sessions?.[String(transactionID)]?.db as { execute: (query: unknown) => Promise<unknown> } | undefined
  if (!db) throw new Error('Visa questionnaire requires a transaction with row locking.')
  await db.execute(sql`SELECT id FROM candidate_processes WHERE id = ${processId} FOR UPDATE`)
}
async function audit(payload: Payload, process: CandidateProcess, revision: number, action: string, req: PayloadRequest, administratorId?: number) {
  const application = await payload.findByID({ collection: 'pre-applications', id: relationId(process.preApplication), depth: 0, overrideAccess: true, req })
  await payload.create({ collection: 'audit-events', overrideAccess: true, req, data: {
    eventType: 'VISA_QUESTIONNAIRE_UPDATED',
    actorType: administratorId ? 'ADMIN' : 'PUBLIC_APPLICANT',
    actor: administratorId,
    occurredAt: new Date().toISOString(),
    correlationId: application.correlationId,
    preApplication: application.id,
    metadata: { action, revision, candidateProcessId: process.id, candidateAccountId: relationId(process.candidateAccount) },
  } })
}

export async function questionnaireForCandidate(payload: Payload, accountId: number) {
  const process = await candidateProcess(payload, accountId)
  if (!await paidOrder(payload, process)) throw new VisaQuestionnaireError('Vizni upitnik se otključava nakon evidentirane vizne uplate.', 403)
  const record = await findQuestionnaire(payload, process.id)
  if (record && relationId(record.candidateAccount) !== accountId) throw new VisaQuestionnaireError('Upitnik nije dostupan.', 403)
  const result = view(record, process.currentStep === 'VISA' && process.processStatus === 'ACTIVE' && process.programCode === 'SWT')
  // Staff identities are not needed in the candidate projection.
  result.history = result.history.map(({ administratorId: _administratorId, ...entry }) => { void _administratorId; return entry })
  return result
}

export async function questionnaireForAdmin(payload: Payload, processId: number) {
  const process = await payload.findByID({ collection: 'candidate-processes', id: processId, depth: 0, overrideAccess: true })
  const record = await findQuestionnaire(payload, process.id)
  return { questionnaire: record ? view(record, false) : null, reviewAllowed: process.currentStep === 'VISA' && process.processStatus === 'ACTIVE' }
}

export async function saveQuestionnaire({ payload, accountId, expectedRevision, answers, action }: {
  payload: Payload; accountId: number; expectedRevision: number; answers: Answers; action: 'SAVE_DRAFT' | 'SUBMIT'
}) {
  const initial = await candidateProcess(payload, accountId)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Visa questionnaire requires a transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lock(payload, transactionID, initial.id)
    const process = await candidateProcess(payload, accountId, req)
    if (process.id !== initial.id) throw new VisaQuestionnaireError('Proces je izmenjen. Osvežite stranicu.')
    assertOpen(process)
    const payment = await paidOrder(payload, process, req)
    if (!payment) throw new VisaQuestionnaireError('Prvo je potrebno evidentirati uplatu viznih troškova.', 403)
    const record = await findQuestionnaire(payload, process.id, req)
    if (record && relationId(record.candidateAccount) !== accountId) throw new VisaQuestionnaireError('Upitnik nije dostupan.', 403)
    if ((record?.revision ?? 0) !== expectedRevision) throw new VisaQuestionnaireError('Upitnik je u međuvremenu izmenjen. Osvežite stranicu pre nastavka.')
    if (record && !['DRAFT', 'CHANGES_REQUESTED'].includes(record.status)) throw new VisaQuestionnaireError('Predati upitnik je zaključan do eventualnog zahteva za dopunu.')
    let validation
    try { validation = validateAnswers(answers, action === 'SUBMIT') } catch {
      throw new VisaQuestionnaireError('Odgovori sadrže nepoznata polja.', 400)
    }
    if (Object.keys(validation.errors).length) throw new VisaQuestionnaireError('Proverite označena polja.', 400, validation.errors)
    const data = record ? content(record) : { answers: {}, feedback: '', history: [] }
    data.answers = validation.answers
    const revision = expectedRevision + 1
    const now = new Date().toISOString()
    const submitted = action === 'SUBMIT'
    if (submitted) data.history.push({ action: 'SUBMIT', answers: validation.answers, at: now, revision })
    const encryptedContent = encryptSensitiveBytes(Buffer.from(JSON.stringify(data)), readSensitiveDataKeyring(), encryptionContext(process.id, accountId, questionnaireVersion))
    const changes = {
      encryptedContent, revision,
      status: submitted ? 'SUBMITTED' as const : record?.status ?? 'DRAFT' as const,
      ...(submitted ? { submittedAt: now, reviewedAt: null, reviewedBy: null } : {}),
    }
    const updated = record
      ? await payload.update({ collection: 'visa-questionnaires', id: record.id, data: changes, overrideAccess: true, req })
      : await payload.create({ collection: 'visa-questionnaires', data: { ...changes, candidateAccount: accountId, candidateProcess: process.id, paymentOrder: payment.id, schemaVersion: questionnaireVersion }, overrideAccess: true, req })
    if (submitted) await payload.update({ collection: 'candidate-processes', id: process.id, overrideAccess: true, req, data: {
      nextActionTitle: 'Sačekajte pregled viznog upitnika', nextActionDescription: 'Agencija proverava predate podatke. Ovde ćete videti ako je potrebna dopuna.', nextActionDueAt: null,
    } })
    await audit(payload, process, revision, action, req)
    await payload.db.commitTransaction(transactionID)
    return { revision: updated.revision, status: updated.status }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function reviewQuestionnaire({ payload, processId, administratorId, expectedRevision, action, note }: {
  payload: Payload; processId: number; administratorId: number; expectedRevision: number; action: 'REQUEST_CHANGES' | 'APPROVE'; note: string
}) {
  const feedback = note.trim()
  if (feedback.length > 2000 || (action === 'REQUEST_CHANGES' && feedback.length < 5)) throw new VisaQuestionnaireError('Navedite razlog dopune (5–2000 znakova).', 400)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Visa questionnaire review requires a transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lock(payload, transactionID, processId)
    const process = await payload.findByID({ collection: 'candidate-processes', id: processId, depth: 0, overrideAccess: true, req })
    assertOpen(process)
    if (!await paidOrder(payload, process, req)) throw new VisaQuestionnaireError('Vizna uplata nije evidentirana.', 403)
    const record = await findQuestionnaire(payload, processId, req)
    if (!record) throw new VisaQuestionnaireError('Kandidat još nije predao upitnik.', 404)
    if (record.revision !== expectedRevision || record.status !== 'SUBMITTED') throw new VisaQuestionnaireError('Samo aktuelna predata verzija može da se pregleda. Osvežite stranicu.')
    const data = content(record)
    const revision = record.revision + 1
    const now = new Date().toISOString()
    data.feedback = feedback
    data.history.push({ action, revision, at: now, note: feedback, administratorId })
    const status = action === 'APPROVE' ? 'REVIEWED' : 'CHANGES_REQUESTED'
    await payload.update({ collection: 'visa-questionnaires', id: record.id, overrideAccess: true, req, data: {
      revision, status, reviewedAt: now, reviewedBy: administratorId,
      encryptedContent: encryptSensitiveBytes(Buffer.from(JSON.stringify(data)), readSensitiveDataKeyring(), encryptionContext(process.id, relationId(record.candidateAccount), record.schemaVersion)),
    } })
    await payload.update({ collection: 'candidate-processes', id: processId, overrideAccess: true, req, data: {
      nextActionTitle: action === 'APPROVE' ? 'Sačekajte uputstvo za viznu dokumentaciju' : 'Dopunite vizni upitnik',
      nextActionDescription: action === 'APPROVE' ? 'Pregled upitnika je završen. Agencija će objaviti uputstvo za dokumentaciju.' : 'Otvorite vizni upitnik, pročitajte napomenu agencije i ponovo predajte ispravljene odgovore.',
      nextActionDueAt: null,
    } })
    await audit(payload, process, revision, action, req, administratorId)
    await payload.db.commitTransaction(transactionID)
    return { revision, status }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
