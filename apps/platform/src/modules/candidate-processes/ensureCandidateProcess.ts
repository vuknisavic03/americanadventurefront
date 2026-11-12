import type { Payload, PayloadRequest } from 'payload'

import type { CandidateAccount, PreApplication } from '../../payload-types.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

export async function ensureCandidateProcess({
  account,
  application,
  now,
  payload,
  req,
}: {
  account: Pick<CandidateAccount, 'applicant' | 'id'>
  application: PreApplication
  now: Date
  payload: Payload
  req?: PayloadRequest
}) {
  const existing = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { preApplication: { equals: application.id } },
  })
  if (existing.docs[0]) return existing.docs[0]

  const recordedAt = now.toISOString()
  return payload.create({
    collection: 'candidate-processes',
    data: {
      applicant: relationId(account.applicant),
      candidateAccount: account.id,
      currentStep: 'PROFILE_SETUP',
      currentStepStartedAt: recordedAt,
      nextActionDescription:
        'Proverite podatke prenete iz prijave i dopunite kontaktne podatke ako su se promenili.',
      nextActionTitle: 'Proverite i dopunite svoj profil',
      preApplication: application.id,
      processStatus: 'ACTIVE',
      progressVersion: 1,
      progressUpdatedAt: recordedAt,
      programCode: application.programCode,
    },
    overrideAccess: true,
    req,
  })
}
