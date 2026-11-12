import type { Payload } from 'payload'

import { SWT_PRE_APPLICATION } from './constants.ts'
import type { NormalizedPreApplicationInput } from './schema.ts'

type SubmissionResult = {
  created: boolean
  reference: string
}

async function findExistingSubmission(payload: Payload, idempotencyKeyHash: string) {
  const result = await payload.find({
    collection: 'pre-applications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { idempotencyKeyHash: { equals: idempotencyKeyHash } },
  })

  return result.docs[0]
}

export async function submitPreApplication({
  correlationId,
  idempotencyKeyHash,
  input,
  now,
  payload,
}: {
  correlationId: string
  idempotencyKeyHash: string
  input: NormalizedPreApplicationInput
  now: Date
  payload: Payload
}): Promise<SubmissionResult> {
  const existing = await findExistingSubmission(payload, idempotencyKeyHash)

  if (existing) {
    return { created: false, reference: existing.correlationId }
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) {
    throw new Error('Database transactions are required for pre-application submission.')
  }

  const transactionRequest = { transactionID }

  try {
    const applicants = await payload.find({
      collection: 'applicants',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: transactionRequest,
      where: {
        and: [
          { emailNormalized: { equals: input.emailNormalized } },
          { dateOfBirth: { equals: input.dateOfBirth } },
          { firstNameNormalized: { equals: input.firstNameNormalized } },
          { lastNameNormalized: { equals: input.lastNameNormalized } },
        ],
      },
    })

    const applicant =
      applicants.docs[0] ??
      (await payload.create({
        collection: 'applicants',
        data: {
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          emailNormalized: input.emailNormalized,
          firstName: input.firstName,
          firstNameNormalized: input.firstNameNormalized,
          fullName: `${input.firstName} ${input.lastName}`,
          lastName: input.lastName,
          lastNameNormalized: input.lastNameNormalized,
          phone: input.phone,
          phoneNormalized: input.phoneNormalized,
          residentialAddress: input.residentialAddress,
        },
        overrideAccess: true,
        req: transactionRequest,
      }))

    const preApplication = await payload.create({
      collection: 'pre-applications',
      data: {
        applicant: applicant.id,
        campaignCode: SWT_PRE_APPLICATION.campaignCode,
        correlationId,
        idempotencyKeyHash,
        programCode: SWT_PRE_APPLICATION.programCode,
        source: SWT_PRE_APPLICATION.source,
        status: 'SUBMITTED',
        contactAttemptCount: 0,
        contactStatus: 'NOT_ATTEMPTED',
        consultationStatus: 'NOT_SCHEDULED',
        workflowVersion: 1,
        submission: {
          applicantNote: input.applicantNote,
          currentStudyYear: input.currentStudyYear,
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          espbPoints: input.espbPoints,
          facultyName: input.facultyName,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          residentialAddress: input.residentialAddress,
          studyCity: input.studyCity,
          studyInterruptionExplanation: input.studyInterruptionExplanation,
          studyInterruptionStatus: input.studyInterruptionStatus,
        },
        submissionMetadata: {
          formSchemaVersion: SWT_PRE_APPLICATION.formSchemaVersion,
          sourcePage: SWT_PRE_APPLICATION.sourcePage,
          submissionLanguage: SWT_PRE_APPLICATION.submissionLanguage,
        },
      },
      overrideAccess: true,
      req: transactionRequest,
    })

    const recordedAt = now.toISOString()

    for (const consent of [
      {
        accepted: true,
        consentText: SWT_PRE_APPLICATION.privacyConsentText,
        consentType: 'PRIVACY' as const,
        textVersion: SWT_PRE_APPLICATION.privacyConsentTextVersion,
      },
      {
        accepted: input.newsletterConsent,
        consentText: SWT_PRE_APPLICATION.newsletterConsentText,
        consentType: 'NEWSLETTER' as const,
        textVersion: SWT_PRE_APPLICATION.newsletterConsentTextVersion,
      },
    ]) {
      await payload.create({
        collection: 'consent-records',
        data: {
          ...consent,
          correlationId,
          preApplication: preApplication.id,
          recordedAt,
          sourcePage: SWT_PRE_APPLICATION.sourcePage,
        },
        overrideAccess: true,
        req: transactionRequest,
      })
    }

    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT',
        correlationId,
        eventType: 'PRE_APPLICATION_SUBMITTED',
        metadata: {
          campaignCode: SWT_PRE_APPLICATION.campaignCode,
          formSchemaVersion: SWT_PRE_APPLICATION.formSchemaVersion,
          programCode: SWT_PRE_APPLICATION.programCode,
          source: SWT_PRE_APPLICATION.source,
        },
        occurredAt: recordedAt,
        preApplication: preApplication.id,
      },
      overrideAccess: true,
      req: transactionRequest,
    })

    await payload.db.commitTransaction(transactionID)
    return { created: true, reference: correlationId }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)

    const racedSubmission = await findExistingSubmission(payload, idempotencyKeyHash)
    if (racedSubmission) {
      return { created: false, reference: racedSubmission.correlationId }
    }

    throw error
  }
}

