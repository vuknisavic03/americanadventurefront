import { createHash } from 'node:crypto'
import type { Payload } from 'payload'

import { renderContractTemplate } from '../contract-templates/rules.ts'
import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  type EncryptedValue,
} from '../candidate-documents/sensitiveDataCrypto.ts'
import { renderContractPdf } from './renderContractPdf.ts'
import {
  MAX_GENERATED_CONTRACT_PDF_BYTES,
  MAX_GENERATED_CONTRACT_SNAPSHOT_BYTES,
} from './storage.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

function sha256(value: Uint8Array) {
  return createHash('sha256').update(value).digest('hex')
}

function paymentLabel(value: string) {
  if (value === 'ONE_TIME') return 'Jednokratno plaćanje'
  if (value === 'INSTALLMENTS') return 'Plaćanje na rate'
  return 'Platiš kad zaradiš'
}

function money(cents: number, currency: string) {
  return `${new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(cents / 100)} ${currency}`
}

function contractDate(value: Date) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(value)
}

export class GeneratedContractError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'GeneratedContractError'
  }
}

async function existingForProfile(payload: Payload, profileId: number) {
  const result = await payload.find({
    collection: 'generated-contracts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-generatedAt',
    where: { sensitiveProfile: { equals: profileId } },
  })
  return result.docs[0]
}

function contractNumber(selectionId: number, now: Date) {
  if (!Number.isSafeInteger(selectionId) || selectionId < 1) {
    throw new Error('Program offer selection has an invalid identifier.')
  }
  return `AA-SWT-${now.getUTCFullYear()}-${String(selectionId).padStart(6, '0')}`
}

export async function generateCandidateContract({
  administratorId,
  now,
  payload,
  sensitiveProfileId,
}: {
  administratorId: number
  now: Date
  payload: Payload
  sensitiveProfileId: number
}) {
  const alreadyGenerated = await existingForProfile(payload, sensitiveProfileId)
  if (alreadyGenerated) return { contract: alreadyGenerated, created: false }

  const profile = await payload.findByID({
    collection: 'candidate-sensitive-profiles', depth: 0, id: sensitiveProfileId, overrideAccess: true,
  }).catch(() => undefined)
  if (!profile) throw new GeneratedContractError('Bezbedni profil kandidata nije pronađen.', 404)
  if (profile.contractReadinessStatus !== 'READY' || profile.personalIdStatus !== 'VALIDATED') {
    throw new GeneratedContractError('Kandidat još nema sve verifikovane podatke potrebne za ugovor.')
  }
  if (!profile.personalIdCiphertext || !profile.personalIdIv || !profile.personalIdAuthTag || !profile.personalIdKeyId) {
    throw new GeneratedContractError('Validirani identifikacioni podaci nisu dostupni.')
  }
  if (!profile.activePassportDocument) throw new GeneratedContractError('Verifikovani pasoš nije dostupan.')

  const accountId = relationId(profile.candidateAccount)
  const applicantId = relationId(profile.applicant)
  const applicationId = relationId(profile.preApplication)
  const [account, applicant, application, passport] = await Promise.all([
    payload.findByID({ collection: 'candidate-accounts', depth: 0, id: accountId, overrideAccess: true }),
    payload.findByID({ collection: 'applicants', depth: 0, id: applicantId, overrideAccess: true }),
    payload.findByID({ collection: 'pre-applications', depth: 0, id: applicationId, overrideAccess: true }),
    payload.findByID({ collection: 'candidate-private-documents', depth: 0, id: relationId(profile.activePassportDocument), overrideAccess: true }),
  ])
  if (passport.status !== 'VERIFIED') throw new GeneratedContractError('Pasoš mora biti verifikovan pre generisanja ugovora.')

  const selection = (await payload.find({
    collection: 'program-offer-selections', depth: 0, limit: 1, overrideAccess: true,
    where: { candidateAccount: { equals: accountId } },
  })).docs[0]
  if (!selection) throw new GeneratedContractError('Kandidat još nije izabrao način plaćanja.')
  const offer = await payload.findByID({
    collection: 'program-offers', depth: 0, id: relationId(selection.offer), overrideAccess: true,
  })
  if (offer.status !== 'ACCEPTED') throw new GeneratedContractError('Programska ponuda nije prihvaćena.')

  const templateType = selection.selectedMethod === 'PAY_WHEN_YOU_EARN' ? 'PAY_WHEN_YOU_EARN' : 'STANDARD'
  const templates = await payload.find({
    collection: 'contract-templates', depth: 0, limit: 2, overrideAccess: true,
    where: { and: [
      { programCode: { equals: account.programCode } },
      { templateType: { equals: templateType } },
      { status: { equals: 'ACTIVE' } },
    ] },
  })
  if (templates.docs.length !== 1) {
    throw new GeneratedContractError('Nije pronađena tačno jedna aktivna verzija odgovarajućeg šablona.')
  }
  const template = templates.docs[0]
  const keyring = readSensitiveDataKeyring()
  const encryptedPersonalId: EncryptedValue = {
    authTag: profile.personalIdAuthTag,
    ciphertext: profile.personalIdCiphertext,
    iv: profile.personalIdIv,
    keyId: profile.personalIdKeyId,
  }
  const personalIdBytes = decryptSensitiveBytes(encryptedPersonalId, keyring, `jmbg:${accountId}`)

  try {
    const number = contractNumber(selection.id, now)
    const dateLabel = contractDate(now)
    const totalLabel = money(selection.totalCents, selection.currency)
    const methodLabel = paymentLabel(selection.selectedMethod)
    const renderedBody = renderContractTemplate(template.body, {
      'agency.address': 'Gospodar Jevremova 59/4, 11000 Beograd',
      'agency.bankAccount': '160-6000000728717-84',
      'agency.name': 'AMERICAN ADVENTURE D.O.O. BEOGRAD',
      'agency.registrationNumber': '20356090',
      'agency.representative': 'Ana Ristovski',
      'agency.taxId': '105311717',
      'candidate.address': applicant.residentialAddress,
      'candidate.birthDate': '',
      'candidate.email': applicant.email ?? '',
      'candidate.fullName': applicant.fullName,
      'candidate.passportFileName': passport.originalFileName,
      'candidate.passportNumber': '',
      'candidate.personalId': personalIdBytes.toString('utf8'),
      'candidate.phone': applicant.phone ?? '',
      'contract.date': dateLabel,
      'contract.number': number,
      'offer.total': totalLabel,
      'payment.method': methodLabel,
      'program.code': account.programCode,
      'program.option': selection.selectedMethod === 'PAY_WHEN_YOU_EARN' ? 'PKZ' : 'FULL',
      'program.season': '2027',
    })
    const snapshot = {
      candidate: {
        address: applicant.residentialAddress,
        fullName: applicant.fullName,
        passportFileName: passport.originalFileName,
        personalId: personalIdBytes.toString('utf8'),
      },
      commercialTerms: {
        acceptedAt: selection.acceptedAt,
        basePriceCents: selection.basePriceCents,
        currency: selection.currency,
        discountCents: selection.discountCents,
        installmentSchedule: selection.installmentSchedule,
        payWhenYouEarn: selection.payWhenYouEarnSnapshot,
        selectedMethod: selection.selectedMethod,
        totalCents: selection.totalCents,
      },
      contract: { date: now.toISOString(), number, renderedBody },
      programCode: account.programCode,
      schemaVersion: 1,
      template: {
        body: template.body,
        checksum: template.contentChecksum,
        id: template.id,
        name: template.name,
        type: template.templateType,
        version: template.version,
      },
    }
    const snapshotBytes = Buffer.from(JSON.stringify(snapshot), 'utf8')
    if (snapshotBytes.length > MAX_GENERATED_CONTRACT_SNAPSHOT_BYTES) throw new Error('Generated contract snapshot exceeds its safe storage limit.')
    const pdfBytes = Buffer.from(await renderContractPdf({
      body: renderedBody,
      candidateName: applicant.fullName,
      contractDate: now,
      contractNumber: number,
      paymentLabel: methodLabel,
      programLabel: 'Work & Travel USA',
      totalLabel,
    }))
    if (pdfBytes.length > MAX_GENERATED_CONTRACT_PDF_BYTES) throw new Error('Generated contract PDF exceeds its safe storage limit.')

    const snapshotEncrypted = encryptSensitiveBytes(snapshotBytes, keyring, `contract-snapshot:${accountId}:${number}`)
    const pdfEncrypted = encryptSensitiveBytes(pdfBytes, keyring, `contract-pdf:${accountId}:${number}`)
    const generatedAt = now.toISOString()
    const retentionReviewAt = new Date(now)
    retentionReviewAt.setUTCFullYear(retentionReviewAt.getUTCFullYear() + 7)
    const generationKey = sha256(Buffer.from(`selection:${selection.id}`, 'utf8'))
    const transactionID = await payload.db.beginTransaction()
    if (transactionID === null) throw new Error('Contract generation requires a database transaction.')
    const req = { transactionID }
    try {
      const contract = await payload.create({
        collection: 'generated-contracts',
        data: {
          candidateAccount: accountId,
          contractNumber: number,
          contractTemplate: template.id,
          generatedAt,
          generatedBy: administratorId,
          generationKey,
          pdfAuthTag: pdfEncrypted.authTag,
          pdfCiphertext: pdfEncrypted.ciphertext,
          pdfFileName: `ugovor-${number}.pdf`,
          pdfIv: pdfEncrypted.iv,
          pdfKeyId: pdfEncrypted.keyId,
          pdfSha256: sha256(pdfBytes),
          pdfSizeBytes: pdfBytes.length,
          preApplication: applicationId,
          programCode: account.programCode,
          programOfferSelection: selection.id,
          retentionReviewAt: retentionReviewAt.toISOString(),
          sensitiveProfile: profile.id,
          snapshotAuthTag: snapshotEncrypted.authTag,
          snapshotCiphertext: snapshotEncrypted.ciphertext,
          snapshotIv: snapshotEncrypted.iv,
          snapshotKeyId: snapshotEncrypted.keyId,
          snapshotSha256: sha256(snapshotBytes),
          status: 'GENERATED',
          templateChecksum: template.contentChecksum,
          templateType,
          templateVersion: template.version,
        },
        overrideAccess: true,
        req,
      })
      await payload.create({
        collection: 'audit-events',
        data: {
          actor: administratorId,
          actorType: 'ADMIN',
          correlationId: application.correlationId,
          eventType: 'CONTRACT_GENERATED',
          metadata: { contractId: contract.id, contractNumber: number, selectionId: selection.id, templateId: template.id, templateVersion: template.version },
          newStatus: application.status,
          occurredAt: generatedAt,
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
          nextActionDescription: 'Ugovor je pripremljen od verifikovanih podataka i dostupan je u vašem portalu za pregled.',
          nextActionDueAt: null,
          nextActionTitle: 'Pregledajte pripremljeni ugovor',
        },
        id: relationId(selection.candidateProcess),
        overrideAccess: true,
        req,
      })
      await payload.db.commitTransaction(transactionID)
      return { contract, created: true }
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)
      const existing = await existingForProfile(payload, profile.id)
      if (existing) return { contract: existing, created: false }
      throw error
    }
  } finally {
    personalIdBytes.fill(0)
  }
}

export async function downloadGeneratedContract({
  actor,
  contractId,
  now,
  payload,
}: {
  actor: { collection: 'candidate-accounts' | 'users'; id: number }
  contractId: number
  now: Date
  payload: Payload
}) {
  const contract = await payload.findByID({
    collection: 'generated-contracts', depth: 0, id: contractId, overrideAccess: true,
  }).catch(() => undefined)
  if (!contract || (actor.collection === 'candidate-accounts' && relationId(contract.candidateAccount) !== actor.id)) {
    throw new GeneratedContractError('Ugovor nije pronađen.', 404)
  }
  const application = await payload.findByID({
    collection: 'pre-applications', depth: 0, id: relationId(contract.preApplication), overrideAccess: true,
  })
  const keyring = readSensitiveDataKeyring()
  const encrypted: EncryptedValue = {
    authTag: contract.pdfAuthTag,
    ciphertext: contract.pdfCiphertext,
    iv: contract.pdfIv,
    keyId: contract.pdfKeyId,
  }
  const bytes = decryptSensitiveBytes(encrypted, keyring, `contract-pdf:${relationId(contract.candidateAccount)}:${contract.contractNumber}`)
  if (bytes.length !== contract.pdfSizeBytes || sha256(bytes) !== contract.pdfSha256) {
    bytes.fill(0)
    throw new Error('Generated contract integrity verification failed.')
  }
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actor.collection === 'users' ? actor.id : undefined,
      actorType: actor.collection === 'users' ? 'ADMIN' : 'PUBLIC_APPLICANT',
      correlationId: application.correlationId,
      eventType: 'CONTRACT_ACCESSED',
      metadata: { actorAccountId: actor.collection === 'candidate-accounts' ? actor.id : undefined, contractId: contract.id, contractNumber: contract.contractNumber },
      newStatus: application.status,
      occurredAt: now.toISOString(),
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
  })
  return { bytes, fileName: contract.pdfFileName }
}
