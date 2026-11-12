import type { Payload } from 'payload'

import type { CandidateProfileUpdate } from './schema.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

export class CandidateProfileUpdateError extends Error {
  constructor() {
    super('Profil trenutno nije moguće izmeniti. Prijavite se ponovo i pokušajte.')
    this.name = 'CandidateProfileUpdateError'
  }
}

export async function updateCandidateProfile({
  accountId,
  data,
  now,
  payload,
}: {
  accountId: number
  data: CandidateProfileUpdate
  now: Date
  payload: Payload
}) {
  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: accountId,
    overrideAccess: true,
  }).catch(() => undefined)

  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) {
    throw new CandidateProfileUpdateError()
  }

  const applicationId = relationId(account.preApplication)
  const applicantId = relationId(account.applicant)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Candidate profile update requires a database transaction.')
  const transactionRequest = { transactionID }

  try {
    const application = await payload.findByID({
      collection: 'pre-applications',
      depth: 0,
      id: applicationId,
      overrideAccess: true,
      req: transactionRequest,
    })
    const applicant = await payload.findByID({
      collection: 'applicants',
      depth: 0,
      id: applicantId,
      overrideAccess: true,
      req: transactionRequest,
    })
    const process = (await payload.find({
      collection: 'candidate-processes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: transactionRequest,
      where: { candidateAccount: { equals: account.id } },
    })).docs[0]
    if (!process) throw new Error('Candidate process is missing for an active account.')

    const changedFields = [
      ...(account.citizenship !== data.citizenship ? ['citizenship'] : []),
      ...(applicant.phone !== data.phone ? ['phone'] : []),
      ...(applicant.residentialAddress !== data.residentialAddress ? ['residentialAddress'] : []),
    ]

    if (changedFields.includes('phone') || changedFields.includes('residentialAddress')) {
      const phoneDigits = data.phone.replace(/\D/g, '')
      await payload.update({
        collection: 'applicants',
        data: {
          phone: data.phone,
          phoneNormalized: data.phone.startsWith('+') ? `+${phoneDigits}` : phoneDigits,
          residentialAddress: data.residentialAddress,
        },
        id: applicantId,
        overrideAccess: true,
        req: transactionRequest,
      })
    }
    if (changedFields.includes('citizenship')) {
      await payload.update({
        collection: 'candidate-accounts',
        data: { citizenship: data.citizenship },
        id: account.id,
        overrideAccess: true,
        req: transactionRequest,
      })
    }
    if (changedFields.length > 0) {
      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'PUBLIC_APPLICANT',
          correlationId: application.correlationId,
          eventType: 'CANDIDATE_PROFILE_UPDATED',
          metadata: {
            candidateAccountId: account.id,
            changedFields,
          },
          newStatus: application.status,
          occurredAt: now.toISOString(),
          preApplication: application.id,
          previousStatus: application.status,
          workflowVersion: application.workflowVersion,
        },
        overrideAccess: true,
        req: transactionRequest,
      })
    }

    const advanced = process.processStatus === 'ACTIVE' && process.currentStep === 'PROFILE_SETUP'
    if (advanced) {
      await payload.update({
        collection: 'candidate-processes',
        data: {
          currentStep: 'CONTRACT_AND_PAYMENT_PLAN',
          nextActionDescription:
            'Profil je potvrđen. Agencija priprema programsku ponudu sa cenom i dostupnim načinima plaćanja.',
          nextActionDueAt: null,
          nextActionTitle: 'Sačekajte programsku ponudu',
        },
        id: process.id,
        overrideAccess: true,
        req: transactionRequest,
      })
      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'PUBLIC_APPLICANT',
          correlationId: application.correlationId,
          eventType: 'CANDIDATE_PROCESS_UPDATED',
          metadata: {
            candidateAccountId: account.id,
            candidateProcessId: process.id,
            changedFields: ['currentStep', 'nextActionDescription', 'nextActionDueAt', 'nextActionTitle'],
            currentStep: 'CONTRACT_AND_PAYMENT_PLAN',
            previousStep: 'PROFILE_SETUP',
            reason: 'PROFILE_CONFIRMED',
          },
          newStatus: application.status,
          occurredAt: now.toISOString(),
          preApplication: application.id,
          previousStatus: application.status,
          workflowVersion: application.workflowVersion,
        },
        overrideAccess: true,
        req: transactionRequest,
      })
    }

    await payload.db.commitTransaction(transactionID)
    return { advanced, changedFields }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
