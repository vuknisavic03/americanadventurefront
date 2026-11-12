import { createHash } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  type EncryptedValue,
} from '../candidate-documents/sensitiveDataCrypto.ts'
import {
  CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
  contractAcceptanceStatement,
} from './acceptanceStatement.ts'
import { renderContractPdf } from './renderContractPdf.ts'
import { MAX_GENERATED_CONTRACT_PDF_BYTES } from './storage.ts'
import { createPaymentPlanForAcceptance } from '../payments/service.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

function sha256(value: Uint8Array | string) {
  return createHash('sha256').update(value).digest('hex')
}

function paymentLabel(value: string) {
  if (value === 'ONE_TIME') return 'Jednokratno plaćanje'
  if (value === 'INSTALLMENTS') return 'Plaćanje na rate'
  if (value === 'PAY_WHEN_YOU_EARN') return 'Platiš kad zaradiš'
  throw new Error('Stored contract snapshot has an unsupported payment method.')
}

function money(cents: number, currency: string) {
  return `${new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(cents / 100)} ${currency}`
}

type ContractSnapshot = {
  candidate: { fullName: string }
  commercialTerms: { currency: string; selectedMethod: string; totalCents: number }
  contract: { date: string; number: string; renderedBody: string }
  programCode: string
}

function parseSnapshot(bytes: Buffer, expectedContractNumber: string): ContractSnapshot {
  const value = JSON.parse(bytes.toString('utf8')) as Partial<ContractSnapshot>
  if (
    !value.candidate || typeof value.candidate.fullName !== 'string' ||
    !value.commercialTerms || typeof value.commercialTerms.currency !== 'string' ||
    typeof value.commercialTerms.selectedMethod !== 'string' ||
    !Number.isSafeInteger(value.commercialTerms.totalCents) ||
    !value.contract || value.contract.number !== expectedContractNumber ||
    typeof value.contract.date !== 'string' || typeof value.contract.renderedBody !== 'string' ||
    typeof value.programCode !== 'string'
  ) {
    throw new Error('Stored contract snapshot is invalid.')
  }
  return value as ContractSnapshot
}

async function existingAcceptance(payload: Payload, contractId: number) {
  return (await payload.find({
    collection: 'contract-acceptances',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { contract: { equals: contractId } },
  })).docs[0]
}

export class ContractAcceptanceError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'ContractAcceptanceError'
  }
}

export async function acceptCandidateContract({
  candidateAccountId,
  contractId,
  expectedSourcePdfSha256,
  now,
  payload,
}: {
  candidateAccountId: number
  contractId: number
  expectedSourcePdfSha256: string
  now: Date
  payload: Payload
}) {
  const contract = await payload.findByID({
    collection: 'generated-contracts', depth: 0, id: contractId, overrideAccess: true,
  }).catch(() => undefined)
  if (!contract || relationId(contract.candidateAccount) !== candidateAccountId) {
    throw new ContractAcceptanceError('Ugovor nije pronađen.', 404)
  }
  if (expectedSourcePdfSha256 !== contract.pdfSha256) {
    throw new ContractAcceptanceError('Prikazana verzija ugovora više nije važeća za prihvatanje.')
  }
  const existing = await existingAcceptance(payload, contract.id)
  if (existing) return { acceptance: existing, created: false }

  const [application, selection] = await Promise.all([
    payload.findByID({
      collection: 'pre-applications', depth: 0, id: relationId(contract.preApplication), overrideAccess: true,
    }),
    payload.findByID({
      collection: 'program-offer-selections', depth: 0, id: relationId(contract.programOfferSelection), overrideAccess: true,
    }),
  ])
  const process = await payload.findByID({
    collection: 'candidate-processes', depth: 0, id: relationId(selection.candidateProcess), overrideAccess: true,
  })
  const keyring = readSensitiveDataKeyring()
  const encryptedSnapshot: EncryptedValue = {
    authTag: contract.snapshotAuthTag,
    ciphertext: contract.snapshotCiphertext,
    iv: contract.snapshotIv,
    keyId: contract.snapshotKeyId,
  }
  const snapshotBytes = decryptSensitiveBytes(
    encryptedSnapshot,
    keyring,
    `contract-snapshot:${candidateAccountId}:${contract.contractNumber}`,
  )
  let finalPdfBytes: Buffer | undefined
  try {
    if (sha256(snapshotBytes) !== contract.snapshotSha256) {
      throw new Error('Stored contract snapshot integrity verification failed.')
    }
    const snapshot = parseSnapshot(snapshotBytes, contract.contractNumber)
    const acceptedAt = now.toISOString()
    const statement = contractAcceptanceStatement(contract.contractNumber)
    const referenceSeed = `contract:${contract.id}:candidate:${candidateAccountId}:source:${contract.pdfSha256}`
    const acceptanceReference = `AA-ACCEPT-${sha256(referenceSeed).slice(0, 16).toUpperCase()}`
    const statementChecksum = sha256(statement)
    const evidenceSha256 = sha256(JSON.stringify({
      acceptanceReference,
      acceptedAt,
      candidateAccountId,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      sourcePdfSha256: contract.pdfSha256,
      statementChecksum,
      statementVersion: CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
    }))
    const contractDate = new Date(snapshot.contract.date)
    if (Number.isNaN(contractDate.getTime())) throw new Error('Stored contract snapshot date is invalid.')
    finalPdfBytes = Buffer.from(await renderContractPdf({
      acceptance: {
        acceptedAt: now,
        reference: acceptanceReference,
        statement,
        statementVersion: CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
      },
      body: snapshot.contract.renderedBody,
      candidateName: snapshot.candidate.fullName,
      contractDate,
      contractNumber: contract.contractNumber,
      paymentLabel: paymentLabel(snapshot.commercialTerms.selectedMethod),
      programLabel: snapshot.programCode === 'SWT' ? 'Work & Travel USA' : snapshot.programCode,
      totalLabel: money(snapshot.commercialTerms.totalCents, snapshot.commercialTerms.currency),
    }))
    if (finalPdfBytes.length > MAX_GENERATED_CONTRACT_PDF_BYTES) {
      throw new Error('Accepted contract PDF exceeds its safe storage limit.')
    }
    const finalPdfSha256 = sha256(finalPdfBytes)
    const finalPdfEncrypted = encryptSensitiveBytes(
      finalPdfBytes,
      keyring,
      `accepted-contract-pdf:${candidateAccountId}:${contract.contractNumber}:${acceptanceReference}`,
    )
    const transactionID = await payload.db.beginTransaction()
    if (transactionID === null) throw new Error('Contract acceptance requires a database transaction.')
    const req = { transactionID } as PayloadRequest
    try {
      const acceptance = await payload.create({
        collection: 'contract-acceptances',
        data: {
          acceptanceReference,
          acceptedAt,
          candidateAccount: candidateAccountId,
          contract: contract.id,
          evidenceSha256,
          finalPdfAuthTag: finalPdfEncrypted.authTag,
          finalPdfCiphertext: finalPdfEncrypted.ciphertext,
          finalPdfFileName: `ugovor-${contract.contractNumber}-prihvacen.pdf`,
          finalPdfIv: finalPdfEncrypted.iv,
          finalPdfKeyId: finalPdfEncrypted.keyId,
          finalPdfSha256,
          finalPdfSizeBytes: finalPdfBytes.length,
          preApplication: application.id,
          retentionReviewAt: contract.retentionReviewAt,
          sourcePdfSha256: contract.pdfSha256,
          statementChecksum,
          statementText: statement,
          statementVersion: CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
        },
        overrideAccess: true,
        req,
      })
      await payload.create({
        collection: 'audit-events',
        data: {
          actorType: 'PUBLIC_APPLICANT',
          correlationId: application.correlationId,
          eventType: 'CONTRACT_ACCEPTED',
          metadata: {
            acceptanceId: acceptance.id,
            acceptanceReference,
            actorAccountId: candidateAccountId,
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            evidenceSha256,
            finalPdfSha256,
            sourcePdfSha256: contract.pdfSha256,
            statementVersion: CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
          },
          newStatus: application.status,
          occurredAt: acceptedAt,
          preApplication: application.id,
          previousStatus: application.status,
          workflowVersion: application.workflowVersion,
        },
        overrideAccess: true,
        req,
      })
      if (process.currentStep === 'CONTRACT_AND_PAYMENT_PLAN') {
        await payload.update({
          collection: 'candidate-processes',
          data: {
            currentStep: 'INITIAL_PAYMENT',
            nextActionDescription: 'Agencija će evidentirati prvu uplatu i zatim omogućiti nastavak programske aplikacije.',
            nextActionDueAt: null,
            nextActionTitle: 'Sačekajte instrukcije za prvu uplatu',
          },
          id: process.id,
          overrideAccess: true,
          req,
        })
      }
      await createPaymentPlanForAcceptance({
        acceptanceId: acceptance.id,
        now,
        payload,
        req,
      })
      await payload.db.commitTransaction(transactionID)
      return { acceptance, created: true }
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)
      const concurrentAcceptance = await existingAcceptance(payload, contract.id)
      if (concurrentAcceptance) return { acceptance: concurrentAcceptance, created: false }
      throw error
    }
  } finally {
    snapshotBytes.fill(0)
    finalPdfBytes?.fill(0)
  }
}

export async function downloadAcceptedContract({
  acceptanceId,
  actor,
  now,
  payload,
}: {
  acceptanceId: number
  actor: { collection: 'candidate-accounts' | 'users'; id: number }
  now: Date
  payload: Payload
}) {
  const acceptance = await payload.findByID({
    collection: 'contract-acceptances', depth: 0, id: acceptanceId, overrideAccess: true,
  }).catch(() => undefined)
  if (!acceptance || (actor.collection === 'candidate-accounts' && relationId(acceptance.candidateAccount) !== actor.id)) {
    throw new ContractAcceptanceError('Prihvaćeni ugovor nije pronađen.', 404)
  }
  const application = await payload.findByID({
    collection: 'pre-applications', depth: 0, id: relationId(acceptance.preApplication), overrideAccess: true,
  })
  const contract = await payload.findByID({
    collection: 'generated-contracts', depth: 0, id: relationId(acceptance.contract), overrideAccess: true,
  })
  const keyring = readSensitiveDataKeyring()
  const encrypted: EncryptedValue = {
    authTag: acceptance.finalPdfAuthTag,
    ciphertext: acceptance.finalPdfCiphertext,
    iv: acceptance.finalPdfIv,
    keyId: acceptance.finalPdfKeyId,
  }
  const bytes = decryptSensitiveBytes(
    encrypted,
    keyring,
    `accepted-contract-pdf:${relationId(acceptance.candidateAccount)}:${contract.contractNumber}:${acceptance.acceptanceReference}`,
  )
  if (bytes.length !== acceptance.finalPdfSizeBytes || sha256(bytes) !== acceptance.finalPdfSha256) {
    bytes.fill(0)
    throw new Error('Accepted contract integrity verification failed.')
  }
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actor.collection === 'users' ? actor.id : undefined,
      actorType: actor.collection === 'users' ? 'ADMIN' : 'PUBLIC_APPLICANT',
      correlationId: application.correlationId,
      eventType: 'ACCEPTED_CONTRACT_ACCESSED',
      metadata: {
        acceptanceId: acceptance.id,
        acceptanceReference: acceptance.acceptanceReference,
        actorAccountId: actor.collection === 'candidate-accounts' ? actor.id : undefined,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
      },
      newStatus: application.status,
      occurredAt: now.toISOString(),
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
  })
  return { bytes, fileName: acceptance.finalPdfFileName }
}

