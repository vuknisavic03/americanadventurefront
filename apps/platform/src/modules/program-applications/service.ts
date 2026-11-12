import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type {
  CandidateProgramApplication,
  CandidateProcess,
  PreApplication,
  ProgramApplicationTemplate,
} from '../../payload-types.ts'
import { swtProcessSteps } from '../candidate-processes/workflow.ts'
import {
  applicationSchemaChecksum,
  normalizeTemplateFields,
  type ProgramApplicationSchemaSnapshot,
  validateProgramApplicationAnswers,
} from './schema.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

function stepIndex(step: string) {
  return swtProcessSteps.findIndex((candidateStep) => candidateStep.key === step)
}

function isEligibleProcess(process: CandidateProcess) {
  return process.processStatus === 'ACTIVE' && stepIndex(process.currentStep) >= stepIndex('PROGRAM_APPLICATION')
}

function assertSnapshot(application: CandidateProgramApplication) {
  const snapshot = application.schemaSnapshot as ProgramApplicationSchemaSnapshot
  if (!snapshot || applicationSchemaChecksum(snapshot) !== application.schemaChecksum) {
    throw new Error('Candidate program application schema integrity check failed.')
  }
  return { ...snapshot, fields: normalizeTemplateFields(snapshot.fields) }
}

export class CandidateProgramApplicationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409 = 409,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'CandidateProgramApplicationError'
  }
}

async function resolveCandidateContext(payload: Payload, accountId: number, req?: PayloadRequest) {
  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: accountId,
    overrideAccess: true,
    req,
  }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) {
    throw new CandidateProgramApplicationError('Sesija kandidata više nije aktivna.', 403)
  }

  const process = (await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateAccount: { equals: account.id } },
  })).docs[0]
  if (!process || !isEligibleProcess(process)) {
    throw new CandidateProgramApplicationError('Programska aplikacija još nije dostupna za ovaj nalog.', 403)
  }

  const preApplication = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: relationId(process.preApplication),
    overrideAccess: true,
    req,
  })
  return { account, preApplication, process }
}

async function audit({
  application,
  eventType,
  metadata,
  now,
  payload,
  preApplication,
  req,
}: {
  application: CandidateProgramApplication
  eventType: 'PROGRAM_APPLICATION_CREATED' | 'PROGRAM_APPLICATION_DRAFT_SAVED' | 'PROGRAM_APPLICATION_SUBMITTED'
  metadata?: Record<string, unknown>
  now: Date
  payload: Payload
  preApplication: PreApplication
  req: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actorType: 'PUBLIC_APPLICANT',
      correlationId: preApplication.correlationId,
      eventType,
      metadata: {
        candidateAccountId: relationId(application.candidateAccount),
        candidateProcessId: relationId(application.candidateProcess),
        programApplicationId: application.id,
        revision: application.revision,
        ...metadata,
      },
      newStatus: preApplication.status,
      occurredAt: now.toISOString(),
      preApplication: preApplication.id,
      previousStatus: preApplication.status,
      workflowVersion: preApplication.workflowVersion,
    },
    overrideAccess: true,
    req,
  })
}

function snapshotFromTemplate(template: ProgramApplicationTemplate): ProgramApplicationSchemaSnapshot {
  return {
    fields: normalizeTemplateFields(template.fields),
    instructions: template.instructions?.trim() || undefined,
    name: template.name,
    programCode: template.programCode,
    version: template.version,
  }
}

async function findApplication(payload: Payload, processId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'candidate-program-applications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateProcess: { equals: processId } },
  })).docs[0]
}

async function activeTemplate(payload: Payload, programCode: string, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'program-application-templates',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    sort: '-version',
    where: {
      and: [
        { programCode: { equals: programCode } },
        { status: { equals: 'ACTIVE' } },
      ],
    },
  })).docs[0]
}

export async function ensureCandidateProgramApplication({
  accountId,
  now,
  payload,
}: {
  accountId: number
  now: Date
  payload: Payload
}): Promise<CandidateProgramApplication | undefined> {
  const context = await resolveCandidateContext(payload, accountId)
  const existing = await findApplication(payload, context.process.id)
  if (existing) {
    assertSnapshot(existing)
    return existing
  }

  const template = await activeTemplate(payload, context.process.programCode)
  if (!template) return undefined
  const snapshot = snapshotFromTemplate(template)
  if (applicationSchemaChecksum(snapshot) !== template.schemaChecksum) {
    throw new Error('Active program application template integrity check failed.')
  }
  const emptyApplicationState = validateProgramApplicationAnswers({
    answers: {},
    fields: snapshot.fields,
    requireComplete: false,
  })

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Creating a program application requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    const concurrent = await findApplication(payload, context.process.id, req)
    if (concurrent) {
      await payload.db.commitTransaction(transactionID)
      return concurrent
    }
    const application = await payload.create({
      collection: 'candidate-program-applications',
      data: {
        answers: {},
        candidateAccount: context.account.id,
        candidateProcess: context.process.id,
        completionPercent: emptyApplicationState.completionPercent,
        instructionsSnapshot: snapshot.instructions,
        lastSavedAt: now.toISOString(),
        preApplication: context.preApplication.id,
        programCode: snapshot.programCode,
        revision: 1,
        schemaChecksum: applicationSchemaChecksum(snapshot),
        schemaSnapshot: snapshot,
        status: 'DRAFT',
        template: template.id,
        templateName: snapshot.name,
        templateVersion: snapshot.version,
      },
      overrideAccess: true,
      req,
    })
    await audit({
      application,
      eventType: 'PROGRAM_APPLICATION_CREATED',
      metadata: { schemaChecksum: application.schemaChecksum, templateId: template.id, templateVersion: template.version },
      now,
      payload,
      preApplication: context.preApplication,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return application
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const concurrent = await findApplication(payload, context.process.id)
    if (concurrent) return concurrent
    throw error
  }
}

async function lockApplication(payload: Payload, transactionID: number | string, applicationId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | {
    execute: (query: unknown) => Promise<unknown>
  }
  if (!transaction) return
  await transaction.execute(sql`SELECT "id" FROM "candidate_program_applications" WHERE "id" = ${applicationId} FOR UPDATE`)
}

export async function mutateCandidateProgramApplication({
  accountId,
  answers,
  expectedRevision,
  mode,
  now,
  payload,
}: {
  accountId: number
  answers: Record<string, unknown>
  expectedRevision: number
  mode: 'SAVE_DRAFT' | 'SUBMIT'
  now: Date
  payload: Payload
}) {
  const provisioned = await ensureCandidateProgramApplication({ accountId, now, payload })
  if (!provisioned) {
    throw new CandidateProgramApplicationError('Agencija još nije objavila formular za vaš program.', 404)
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Updating a program application requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockApplication(payload, transactionID, provisioned.id)
    const application = await payload.findByID({
      collection: 'candidate-program-applications',
      depth: 0,
      id: provisioned.id,
      overrideAccess: true,
      req,
    })
    const context = await resolveCandidateContext(payload, accountId, req)
    if (
      relationId(application.candidateAccount) !== accountId ||
      relationId(application.candidateProcess) !== context.process.id
    ) {
      throw new CandidateProgramApplicationError('Programska aplikacija ne pripada ovom nalogu.', 403)
    }
    if (application.status === 'SUBMITTED') {
      throw new CandidateProgramApplicationError('Programska aplikacija je već predata i više se ne može menjati.')
    }
    if (context.process.currentStep !== 'PROGRAM_APPLICATION') {
      throw new CandidateProgramApplicationError('Programska aplikacija trenutno nije otvorena za izmene.', 403)
    }
    if (application.revision !== expectedRevision) {
      throw new CandidateProgramApplicationError('Nacrt je u međuvremenu izmenjen. Osvežite stranicu pre nastavka.')
    }

    const snapshot = assertSnapshot(application)
    let validation
    try {
      validation = validateProgramApplicationAnswers({
        answers,
        fields: snapshot.fields,
        requireComplete: mode === 'SUBMIT',
      })
    } catch (error) {
      throw new CandidateProgramApplicationError(error instanceof Error ? error.message : 'Odgovori nisu ispravni.', 400)
    }
    if (Object.keys(validation.fieldErrors).length > 0) {
      throw new CandidateProgramApplicationError(
        mode === 'SUBMIT' ? 'Popunite sva označena polja pre predaje.' : 'Proverite označena polja.',
        400,
        validation.fieldErrors,
      )
    }

    const submitted = mode === 'SUBMIT'
    const nextRevision = application.revision + 1
    const updated = await payload.update({
      collection: 'candidate-program-applications',
      data: {
        answers: validation.normalizedAnswers,
        completionPercent: validation.completionPercent,
        lastSavedAt: now.toISOString(),
        revision: nextRevision,
        status: submitted ? 'SUBMITTED' : 'DRAFT',
        submittedAt: submitted ? now.toISOString() : undefined,
      },
      id: application.id,
      overrideAccess: true,
      req,
    })

    if (submitted) {
      await payload.update({
        collection: 'candidate-processes',
        data: {
          currentStep: 'DOCUMENTS',
          nextActionDescription: 'Programska aplikacija je predata. Pripremite dokumenta koja će agencija tražiti u narednom koraku.',
          nextActionDueAt: null,
          nextActionTitle: 'Pripremite programsku dokumentaciju',
        },
        id: context.process.id,
        overrideAccess: true,
        req,
      })
    }
    await audit({
      application: updated,
      eventType: submitted ? 'PROGRAM_APPLICATION_SUBMITTED' : 'PROGRAM_APPLICATION_DRAFT_SAVED',
      metadata: { completionPercent: updated.completionPercent, schemaChecksum: updated.schemaChecksum },
      now,
      payload,
      preApplication: context.preApplication,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return updated
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export function programApplicationForPortal(application: CandidateProgramApplication) {
  const snapshot = assertSnapshot(application)
  return {
    answers: application.answers as Record<string, number | string>,
    completionPercent: application.completionPercent,
    instructions: snapshot.instructions,
    fields: snapshot.fields,
    lastSavedAt: application.lastSavedAt,
    revision: application.revision,
    status: application.status,
    submittedAt: application.submittedAt,
    templateName: application.templateName,
    templateVersion: application.templateVersion,
  }
}
