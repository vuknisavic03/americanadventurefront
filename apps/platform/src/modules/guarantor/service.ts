import { createHash } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  sensitiveFingerprint,
} from '../candidate-documents/sensitiveDataCrypto.ts'
import {
  inspectPrivateDocument,
  retentionReviewDate,
} from '../candidate-documents/privateDocument.ts'
import {
  formatGuarantorEmployment,
  formatGuarantorRelationship,
  maskJmbg,
  validateGuarantorInput,
} from './rules.ts'
import { renderGuarantorContractPdf } from './renderGuarantorContractPdf.ts'
import type {
  GuarantorContractTerms,
  GuarantorEmploymentStatus,
  GuarantorRelationship,
  GuarantorStatus,
  GuarantorSubmissionInput,
} from './types.ts'

function relationId(value: number | { id: number } | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  return typeof value === 'number' ? value : value.id
}

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export class GuarantorServiceError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 400) {
    super(message)
    this.name = 'GuarantorServiceError'
  }
}

export type CandidateGuarantorSummary = {
  candidateAccountId: number
  candidateProcessId: number
  contractGeneratedAt: string | null
  email: string
  employerName: string
  employmentStatus: string
  fullName: string
  hasContractPdf: boolean
  hasIdCardDocument: boolean
  id: number
  idCardIssuer: string
  idCardNumber: string
  jobTitle: string
  jmbgMasked: string
  monthlyIncomeRsd: number
  promissoryNotesCount: number
  rejectionReason: string | null
  relationship: string
  residentialAddress: string
  status: GuarantorStatus
  submittedAt: string
  verifiedAt: string | null
}

export async function submitGuarantorData({
  candidateAccountId,
  input,
  now,
  payload,
  req,
}: {
  candidateAccountId: number
  input: GuarantorSubmissionInput
  now: Date
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}): Promise<CandidateGuarantorSummary> {
  const account = await payload
    .findByID({
      collection: 'candidate-accounts',
      depth: 0,
      id: candidateAccountId,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)

  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) {
    throw new GuarantorServiceError('Korisnički nalog nije aktivan ili verifikovan.', 403)
  }

  // Find candidate process
  const processes = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateAccount: { equals: candidateAccountId } },
  })
  const process = processes.docs[0]
  if (!process) {
    throw new GuarantorServiceError('Aktivni proces kandidata nije pronađen.', 404)
  }

  // Check payment selection for PAY_WHEN_YOU_EARN
  const selections = await payload.find({
    collection: 'program-offer-selections',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateProcess: { equals: process.id } },
  })
  const selection = selections.docs[0]
  if (!selection) {
    throw new GuarantorServiceError('Kandidat još uvek nije izabrao način plaćanja.')
  }
  if (selection.selectedMethod !== 'PAY_WHEN_YOU_EARN') {
    throw new GuarantorServiceError('Jemac se unosi isključivo za model „Platiš kad zaradiš“ (PKZ).')
  }

  // Validate business rules
  const validation = validateGuarantorInput(input, now)
  if (!validation.valid) {
    const errorMsg = validation.errors.map((e) => e.message).join(' ')
    throw new GuarantorServiceError(errorMsg)
  }

  const { data } = validation
  const keyring = readSensitiveDataKeyring()
  const encryptedJmbg = encryptSensitiveBytes(
    Buffer.from(data.jmbg, 'utf8'),
    keyring,
    `guarantor-jmbg:${candidateAccountId}`,
  )
  const jmbgFingerprint = sensitiveFingerprint(data.jmbg, keyring, 'guarantor-jmbg')

  // Sensitive profile
  const sensitiveProfiles = await payload.find({
    collection: 'candidate-sensitive-profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateAccount: { equals: candidateAccountId } },
  })
  const sensitiveProfile = sensitiveProfiles.docs[0]
  if (!sensitiveProfile) {
    throw new GuarantorServiceError('Bezbedni profil kandidata nije pronađen.', 404)
  }

  // Pre-application
  const preApplicationId = relationId(process.preApplication)
  if (!preApplicationId) {
    throw new GuarantorServiceError('Prijava kandidata nije pronađena.', 404)
  }

  // Check if guarantor record already exists
  const existing = (
    await payload.find({
      collection: 'candidate-guarantors',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateAccount: { equals: candidateAccountId } },
    })
  ).docs[0]

  let guarantorDoc
  if (existing) {
    if (existing.status === 'VERIFIED') {
      throw new GuarantorServiceError('Verifikovani podaci jemca ne mogu se menjati bez odobrenja agencije.', 409)
    }

    guarantorDoc = await payload.update({
      collection: 'candidate-guarantors',
      data: {
        email: data.email,
        employerName: data.employerName,
        employmentStatus: data.employmentStatus,
        fullName: data.fullName,
        idCardIssuer: data.idCardIssuer,
        idCardNumber: data.idCardNumber,
        jmbgAuthTag: encryptedJmbg.authTag,
        jmbgCiphertext: encryptedJmbg.ciphertext,
        jmbgFingerprint,
        jmbgIv: encryptedJmbg.iv,
        jmbgKeyId: encryptedJmbg.keyId,
        jobTitle: data.jobTitle,
        monthlyIncomeRsd: data.monthlyIncomeRsd,
        phone: data.phone,
        promissoryNotesCount: data.promissoryNotesCount,
        rejectionReason: null,
        relationship: data.relationship,
        residentialAddress: data.residentialAddress,
        status: 'PENDING_REVIEW',
        submittedAt: now.toISOString(),
      },
      id: existing.id,
      overrideAccess: true,
      req,
    })
  } else {
    guarantorDoc = await payload.create({
      collection: 'candidate-guarantors',
      data: {
        candidateAccount: candidateAccountId,
        candidateProcess: process.id,
        email: data.email,
        employerName: data.employerName,
        employmentStatus: data.employmentStatus,
        fullName: data.fullName,
        idCardIssuer: data.idCardIssuer,
        idCardNumber: data.idCardNumber,
        jmbgAuthTag: encryptedJmbg.authTag,
        jmbgCiphertext: encryptedJmbg.ciphertext,
        jmbgFingerprint,
        jmbgIv: encryptedJmbg.iv,
        jmbgKeyId: encryptedJmbg.keyId,
        jobTitle: data.jobTitle,
        monthlyIncomeRsd: data.monthlyIncomeRsd,
        phone: data.phone,
        preApplication: preApplicationId,
        promissoryNotesCount: data.promissoryNotesCount,
        relationship: data.relationship,
        residentialAddress: data.residentialAddress,
        sensitiveProfile: sensitiveProfile.id,
        status: 'PENDING_REVIEW',
        submittedAt: now.toISOString(),
      },
      overrideAccess: true,
      req,
    })
  }

  // Audit event
  const preApp = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actorType: 'PUBLIC_APPLICANT',
      correlationId: preApp.correlationId,
      eventType: 'GUARANTOR_DATA_SUBMITTED',
      metadata: {
        candidateAccountId,
        guarantorId: guarantorDoc.id,
        relationship: data.relationship,
      },
      occurredAt: now.toISOString(),
      preApplication: preApplicationId,
    },
    overrideAccess: true,
    req,
  })

  return {
    candidateAccountId,
    candidateProcessId: process.id,
    contractGeneratedAt: guarantorDoc.contractGeneratedAt ?? null,
    email: guarantorDoc.email,
    employerName: guarantorDoc.employerName,
    employmentStatus: guarantorDoc.employmentStatus,
    fullName: guarantorDoc.fullName,
    hasContractPdf: Boolean(guarantorDoc.contractPdfSha256),
    hasIdCardDocument: Boolean(guarantorDoc.idCardDocument),
    id: guarantorDoc.id,
    idCardIssuer: guarantorDoc.idCardIssuer,
    idCardNumber: guarantorDoc.idCardNumber,
    jobTitle: guarantorDoc.jobTitle,
    jmbgMasked: maskJmbg(data.jmbg),
    monthlyIncomeRsd: guarantorDoc.monthlyIncomeRsd,
    promissoryNotesCount: guarantorDoc.promissoryNotesCount,
    rejectionReason: guarantorDoc.rejectionReason ?? null,
    relationship: guarantorDoc.relationship,
    residentialAddress: guarantorDoc.residentialAddress,
    status: guarantorDoc.status as GuarantorStatus,
    submittedAt: guarantorDoc.submittedAt,
    verifiedAt: guarantorDoc.verifiedAt ?? null,
  }
}

export async function uploadGuarantorIdCard({
  candidateAccountId,
  fileBytes,
  fileName,
  now,
  payload,
  req,
}: {
  candidateAccountId: number
  fileBytes: Uint8Array
  fileName: string
  now: Date
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}) {
  const existing = (
    await payload.find({
      collection: 'candidate-guarantors',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateAccount: { equals: candidateAccountId } },
    })
  ).docs[0]

  if (!existing) {
    throw new GuarantorServiceError('Prvo morate uneti osnovne podatke o jemcu.', 404)
  }
  if (existing.status === 'VERIFIED') {
    throw new GuarantorServiceError('Verifikovani dokumenti jemca ne mogu se menjati.', 409)
  }

  const inspected = inspectPrivateDocument(fileName, fileBytes)
  const keyring = readSensitiveDataKeyring()
  const encryptedFile = encryptSensitiveBytes(
    fileBytes,
    keyring,
    `guarantor-id-card:${candidateAccountId}`,
  )

  const preApplicationId = relationId(existing.preApplication)!
  const sensitiveProfileId = relationId(existing.sensitiveProfile)!

  const document = await payload.create({
    collection: 'candidate-private-documents',
    data: {
      authTag: encryptedFile.authTag,
      candidateAccount: candidateAccountId,
      ciphertext: encryptedFile.ciphertext,
      documentType: 'GUARANTOR_ID_CARD',
      iv: encryptedFile.iv,
      keyId: encryptedFile.keyId,
      mimeType: inspected.mimeType,
      originalFileName: inspected.fileName,
      preApplication: preApplicationId,
      retentionReviewAt: retentionReviewDate(now).toISOString(),
      sensitiveProfile: sensitiveProfileId,
      sha256: inspected.sha256,
      sizeBytes: inspected.sizeBytes,
      status: 'UPLOADED',
      uploadedAt: now.toISOString(),
    },
    overrideAccess: true,
    req,
  })

  // Link document to guarantor record
  await payload.update({
    collection: 'candidate-guarantors',
    data: {
      idCardDocument: document.id,
      status: 'PENDING_REVIEW',
    },
    id: existing.id,
    overrideAccess: true,
    req,
  })

  // Audit event
  const preApp = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actorType: 'PUBLIC_APPLICANT',
      correlationId: preApp.correlationId,
      eventType: 'GUARANTOR_ID_CARD_UPLOADED',
      metadata: {
        candidateAccountId,
        documentId: document.id,
        guarantorId: existing.id,
      },
      occurredAt: now.toISOString(),
      preApplication: preApplicationId,
    },
    overrideAccess: true,
    req,
  })

  return {
    documentId: document.id,
    fileName: inspected.fileName,
    guarantorId: existing.id,
    mimeType: inspected.mimeType,
    sha256: inspected.sha256,
    sizeBytes: inspected.sizeBytes,
  }
}

export async function verifyGuarantor({
  administratorId,
  guarantorId,
  now,
  payload,
  req,
}: {
  administratorId: number
  guarantorId: number
  now: Date
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}) {
  const guarantor = await payload
    .findByID({
      collection: 'candidate-guarantors',
      depth: 0,
      id: guarantorId,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)

  if (!guarantor) {
    throw new GuarantorServiceError('Jemac nije pronađen.', 404)
  }

  if (!guarantor.idCardDocument) {
    throw new GuarantorServiceError('Jemac mora imati postavljenu očitanu ličnu kartu pre verifikacije.')
  }

  // Update private document status to VERIFIED
  const idCardDocId = relationId(guarantor.idCardDocument)
  if (idCardDocId) {
    await payload.update({
      collection: 'candidate-private-documents',
      data: {
        status: 'VERIFIED',
        verifiedAt: now.toISOString(),
        verifiedBy: administratorId,
      },
      id: idCardDocId,
      overrideAccess: true,
      req,
    })
  }

  const updated = await payload.update({
    collection: 'candidate-guarantors',
    data: {
      rejectionReason: null,
      status: 'VERIFIED',
      verifiedAt: now.toISOString(),
      verifiedBy: administratorId,
    },
    id: guarantorId,
    overrideAccess: true,
    req,
  })

  const preApplicationId = relationId(guarantor.preApplication)!
  const preApp = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: administratorId,
      actorType: 'ADMIN',
      correlationId: preApp.correlationId,
      eventType: 'GUARANTOR_VERIFIED',
      metadata: {
        administratorId,
        guarantorId,
      },
      occurredAt: now.toISOString(),
      preApplication: preApplicationId,
    },
    overrideAccess: true,
    req,
  })

  return updated
}

export async function rejectGuarantor({
  administratorId,
  guarantorId,
  now,
  payload,
  reason,
  req,
}: {
  administratorId: number
  guarantorId: number
  now: Date
  payload: Payload
  reason: string
  req?: PayloadRequest | { transactionID?: number | string }
}) {
  const trimmedReason = reason?.trim() ?? ''
  if (trimmedReason.length < 5) {
    throw new GuarantorServiceError('Obavezno je navesti obrazloženje za odbijanje jemca (najmanje 5 karaktera).')
  }

  const guarantor = await payload
    .findByID({
      collection: 'candidate-guarantors',
      depth: 0,
      id: guarantorId,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)

  if (!guarantor) {
    throw new GuarantorServiceError('Jemac nije pronađen.', 404)
  }

  // Update private document status to REJECTED if present
  const idCardDocId = relationId(guarantor.idCardDocument)
  if (idCardDocId) {
    await payload.update({
      collection: 'candidate-private-documents',
      data: {
        rejectionReason: trimmedReason,
        status: 'REJECTED',
        verifiedAt: now.toISOString(),
        verifiedBy: administratorId,
      },
      id: idCardDocId,
      overrideAccess: true,
      req,
    })
  }

  const updated = await payload.update({
    collection: 'candidate-guarantors',
    data: {
      rejectionReason: trimmedReason,
      status: 'REJECTED',
    },
    id: guarantorId,
    overrideAccess: true,
    req,
  })

  const preApplicationId = relationId(guarantor.preApplication)!
  const preApp = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: administratorId,
      actorType: 'ADMIN',
      correlationId: preApp.correlationId,
      eventType: 'GUARANTOR_REJECTED',
      metadata: {
        administratorId,
        guarantorId,
        reason: trimmedReason,
      },
      occurredAt: now.toISOString(),
      preApplication: preApplicationId,
    },
    overrideAccess: true,
    req,
  })

  return updated
}

export async function getGuarantorForCandidate({
  candidateAccountId,
  payload,
  req,
}: {
  candidateAccountId: number
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}): Promise<CandidateGuarantorSummary | null> {
  const result = await payload.find({
    collection: 'candidate-guarantors',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateAccount: { equals: candidateAccountId } },
  })
  const doc = result.docs[0]
  if (!doc) return null

  const candidateProcessId = relationId(doc.candidateProcess)!

  return {
    candidateAccountId,
    candidateProcessId,
    contractGeneratedAt: doc.contractGeneratedAt ?? null,
    email: doc.email,
    employerName: doc.employerName,
    employmentStatus: doc.employmentStatus,
    fullName: doc.fullName,
    hasContractPdf: Boolean(doc.contractPdfSha256),
    hasIdCardDocument: Boolean(doc.idCardDocument),
    id: doc.id,
    idCardIssuer: doc.idCardIssuer,
    idCardNumber: doc.idCardNumber,
    jobTitle: doc.jobTitle,
    jmbgMasked: '******', // default masked
    monthlyIncomeRsd: doc.monthlyIncomeRsd,
    promissoryNotesCount: doc.promissoryNotesCount,
    rejectionReason: doc.rejectionReason ?? null,
    relationship: doc.relationship,
    residentialAddress: doc.residentialAddress,
    status: doc.status as GuarantorStatus,
    submittedAt: doc.submittedAt,
    verifiedAt: doc.verifiedAt ?? null,
  }
}

export async function generateGuarantorContract({
  guarantorId,
  now,
  payload,
  req,
}: {
  guarantorId: number
  now: Date
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}): Promise<{ contractNumber: string; pdfBytes: Uint8Array }> {
  const guarantor = await payload
    .findByID({
      collection: 'candidate-guarantors',
      depth: 0,
      id: guarantorId,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)

  if (!guarantor) {
    throw new GuarantorServiceError('Jemac nije pronađen.', 404)
  }

  if (guarantor.status !== 'VERIFIED') {
    throw new GuarantorServiceError('Ugovor o jemstvu se može generisati tek nakon što administrator verifikuje jemca.')
  }

  const accountId = relationId(guarantor.candidateAccount)!
  const processId = relationId(guarantor.candidateProcess)!
  const preAppId = relationId(guarantor.preApplication)!

  const [selection, preApp] = await Promise.all([
    payload.find({
      collection: 'program-offer-selections',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateProcess: { equals: processId } },
    }),
    payload.findByID({
      collection: 'pre-applications',
      depth: 0,
      id: preAppId,
      overrideAccess: true,
      req,
    }),
  ])

  const selectedOffer = selection.docs[0]
  if (!selectedOffer || selectedOffer.selectedMethod !== 'PAY_WHEN_YOU_EARN') {
    throw new GuarantorServiceError('Nije pronađen prihvaćeni PKZ izbor plaćanja.')
  }

  const applicantId = relationId(preApp.applicant)!
  const applicant = await payload.findByID({
    collection: 'applicants',
    depth: 0,
    id: applicantId,
    overrideAccess: true,
    req,
  })

  const pkzSnapshot = selectedOffer.payWhenYouEarnSnapshot as
    | { deferredAmountCents: number; depositCents: number; description: string }
    | undefined

  const deferredAmountCents = pkzSnapshot?.deferredAmountCents ?? 0
  const depositCents = pkzSnapshot?.depositCents ?? 0
  const totalPriceCents = selectedOffer.totalCents

  const contractNumber = `AA-JEM-${now.getUTCFullYear()}-${String(guarantor.id).padStart(6, '0')}`

  const terms: GuarantorContractTerms = {
    agency: {
      address: 'Makedonska 22, 11000 Beograd',
      director: 'Aleksandar Popović',
      mb: '20123456',
      name: 'American Adventure d.o.o. Beograd',
      pib: '107654321',
    },
    candidate: {
      address: applicant.residentialAddress || 'Republika Srbija',
      fullName: applicant.fullName,
      phone: applicant.phone || '',
    },
    contractDate: now,
    contractNumber,
    finance: {
      currency: 'USD',
      deferredAmountCents,
      depositCents,
      promissoryNotesCount: guarantor.promissoryNotesCount || 2,
      totalPriceCents,
    },
    guarantor: {
      address: guarantor.residentialAddress,
      employerName: guarantor.employerName,
      employmentStatusLabel: formatGuarantorEmployment(guarantor.employmentStatus as GuarantorEmploymentStatus),
      fullName: guarantor.fullName,
      idCardIssuer: guarantor.idCardIssuer,
      idCardNumber: guarantor.idCardNumber,
      monthlyIncomeRsd: guarantor.monthlyIncomeRsd,
      phone: guarantor.phone,
      relationshipLabel: formatGuarantorRelationship(guarantor.relationship as GuarantorRelationship),
    },
  }

  const pdfBytes = await renderGuarantorContractPdf(terms)
  const keyring = readSensitiveDataKeyring()
  const encryptedPdf = encryptSensitiveBytes(
    pdfBytes,
    keyring,
    `guarantor-contract-pdf:${accountId}:${contractNumber}`,
  )

  await payload.update({
    collection: 'candidate-guarantors',
    data: {
      contractGeneratedAt: now.toISOString(),
      contractPdfAuthTag: encryptedPdf.authTag,
      contractPdfCiphertext: encryptedPdf.ciphertext,
      contractPdfFileName: `ugovor-o-jemstvu-${contractNumber}.pdf`,
      contractPdfIv: encryptedPdf.iv,
      contractPdfKeyId: encryptedPdf.keyId,
      contractPdfSha256: sha256(pdfBytes),
      contractPdfSizeBytes: pdfBytes.length,
    },
    id: guarantor.id,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actorType: 'SYSTEM',
      correlationId: preApp.correlationId,
      eventType: 'GUARANTOR_CONTRACT_GENERATED',
      metadata: {
        contractNumber,
        guarantorId: guarantor.id,
        pdfSha256: sha256(pdfBytes),
      },
      occurredAt: now.toISOString(),
      preApplication: preAppId,
    },
    overrideAccess: true,
    req,
  })

  return { contractNumber, pdfBytes }
}

export async function getGuarantorContractPdf({
  guarantorId,
  payload,
  req,
}: {
  guarantorId: number
  payload: Payload
  req?: PayloadRequest | { transactionID?: number | string }
}): Promise<{ fileName: string; pdfBytes: Buffer }> {
  const guarantor = await payload
    .findByID({
      collection: 'candidate-guarantors',
      depth: 0,
      id: guarantorId,
      overrideAccess: true,
      req,
    })
    .catch(() => undefined)

  if (!guarantor) {
    throw new GuarantorServiceError('Jemac nije pronađen.', 404)
  }

  if (
    !guarantor.contractPdfCiphertext ||
    !guarantor.contractPdfIv ||
    !guarantor.contractPdfAuthTag ||
    !guarantor.contractPdfKeyId
  ) {
    throw new GuarantorServiceError('PDF ugovora o jemstvu još uvek nije generisan.', 404)
  }

  const accountId = relationId(guarantor.candidateAccount)!
  const contractNumber = `AA-JEM-${new Date(guarantor.contractGeneratedAt || Date.now()).getUTCFullYear()}-${String(guarantor.id).padStart(6, '0')}`
  const keyring = readSensitiveDataKeyring()

  const decrypted = decryptSensitiveBytes(
    {
      authTag: guarantor.contractPdfAuthTag,
      ciphertext: guarantor.contractPdfCiphertext,
      iv: guarantor.contractPdfIv,
      keyId: guarantor.contractPdfKeyId,
    },
    keyring,
    `guarantor-contract-pdf:${accountId}:${contractNumber}`,
  )

  return {
    fileName: guarantor.contractPdfFileName || `ugovor-o-jemstvu-${contractNumber}.pdf`,
    pdfBytes: decrypted,
  }
}
