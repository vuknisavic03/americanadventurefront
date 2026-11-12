import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

const snapshot = {
  candidate: { fullName: 'Ana Anić' },
  commercialTerms: { currency: 'USD', selectedMethod: 'ONE_TIME', totalCents: 270_000 },
  contract: {
    date: '2026-09-01T10:00:00.000Z',
    number: 'AA-SWT-2026-000051',
    renderedBody: 'Test ugovor za Ana Anić.',
  },
  programCode: 'SWT',
}
const snapshotBytes = Buffer.from(JSON.stringify(snapshot), 'utf8')
const snapshotSha256 = createHash('sha256').update(snapshotBytes).digest('hex')
const sourcePdfSha256 = 'a'.repeat(64)
const acceptedPdfBytes = Buffer.from('%PDF-1.7 accepted contract')
const acceptedPdfSha256 = createHash('sha256').update(acceptedPdfBytes).digest('hex')

vi.mock('../candidate-documents/sensitiveDataCrypto.ts', () => ({
  decryptSensitiveBytes: vi.fn((encrypted: { ciphertext: string }) => Buffer.from(
    encrypted.ciphertext === 'accepted-cipher' ? acceptedPdfBytes : snapshotBytes,
  )),
  encryptSensitiveBytes: vi.fn(() => ({ authTag: 'tag', ciphertext: 'cipher', iv: 'iv', keyId: 'key-1' })),
  readSensitiveDataKeyring: vi.fn(() => ({ activeKeyId: 'key-1', fingerprintKey: Buffer.alloc(32), keys: new Map() })),
}))
vi.mock('./renderContractPdf.ts', () => ({
  renderContractPdf: vi.fn(async () => new Uint8Array(Buffer.from('%PDF-1.7 accepted contract'))),
}))

import { acceptCandidateContract, ContractAcceptanceError, downloadAcceptedContract } from './acceptance.ts'
import {
  CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
  contractAcceptanceStatement,
  RESPONSIBILITY_STATEMENT_2027_POINTS,
  responsibilityStatement,
  SPONSOR_CONSENT_2027_POINTS,
  sponsorConsentStatement,
} from './acceptanceStatement.ts'

function generatedContract() {
  return {
    candidateAccount: 21,
    contractNumber: 'AA-SWT-2026-000051',
    id: 91,
    pdfSha256: sourcePdfSha256,
    preApplication: 41,
    programOfferSelection: 51,
    retentionReviewAt: '2033-09-01T10:00:00.000Z',
    snapshotAuthTag: 'tag',
    snapshotCiphertext: 'cipher',
    snapshotIv: 'iv',
    snapshotKeyId: 'key-1',
    snapshotSha256,
  }
}

describe('electronic contract acceptance', () => {
  it('creates immutable evidence, an accepted PDF, and an audit event in one transaction', async () => {
    const acceptance = {
      acceptanceReference: 'AA-ACCEPT-TEST',
      acceptedAt: '2026-09-01T14:00:00.000Z',
      candidateAccount: 21,
      contract: 91,
      id: 111,
      preApplication: 41,
    }
    const payload = {
      create: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'contract-acceptances') return acceptance
        if (collection === 'candidate-payment-plans') return { id: 131 }
        return { id: 121 }
      }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(7),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
      },
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'generated-contracts') return generatedContract()
        if (collection === 'pre-applications') return { correlationId: 'ref-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 4 }
        if (collection === 'program-offer-selections') return {
          candidateAccount: 21,
          candidateProcess: 61,
          currency: 'USD',
          id: 51,
          selectedMethod: 'ONE_TIME',
          totalCents: 270_000,
        }
        if (collection === 'candidate-processes') return { candidateAccount: 21, currentStep: 'CONTRACT_AND_PAYMENT_PLAN', id: 61, preApplication: 41 }
        if (collection === 'contract-acceptances') return acceptance
        throw new Error(`Unexpected collection: ${collection}`)
      }),
      update: vi.fn().mockResolvedValue({ id: 61 }),
    } as unknown as Payload

    const result = await acceptCandidateContract({
      candidateAccountId: 21,
      contractId: 91,
      expectedSourcePdfSha256: sourcePdfSha256,
      now: new Date('2026-09-01T14:00:00.000Z'),
      payload,
    })

    expect(result).toEqual({ acceptance, created: true })
    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'contract-acceptances',
      data: expect.objectContaining({
        acceptedAt: '2026-09-01T14:00:00.000Z',
        candidateAccount: 21,
        contract: 91,
        finalPdfCiphertext: 'cipher',
        sourcePdfSha256,
        statementVersion: CONTRACT_ACCEPTANCE_STATEMENT_VERSION,
      }),
    }))
    expect(payload.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'CONTRACT_ACCEPTED' }),
    }))
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-payment-plans',
      data: expect.objectContaining({ firstPaymentRequiredCents: 270_000, paidCents: 0 }),
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'candidate-processes',
      data: expect.objectContaining({ currentStep: 'INITIAL_PAYMENT' }),
      id: 61,
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(7)
  })

  it('does not reveal a contract that belongs to another candidate', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue(generatedContract()) } as unknown as Payload
    await expect(acceptCandidateContract({
      candidateAccountId: 22,
      contractId: 91,
      expectedSourcePdfSha256: sourcePdfSha256,
      now: new Date(),
      payload,
    })).rejects.toMatchObject({ message: 'Ugovor nije pronađen.', status: 404 })
  })

  it('rejects acceptance when the displayed draft checksum is stale', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue(generatedContract()) } as unknown as Payload
    await expect(acceptCandidateContract({
      candidateAccountId: 21,
      contractId: 91,
      expectedSourcePdfSha256: 'b'.repeat(64),
      now: new Date(),
      payload,
    })).rejects.toBeInstanceOf(ContractAcceptanceError)
  })

  it('returns the existing acceptance without creating a duplicate', async () => {
    const existing = { acceptanceReference: 'AA-ACCEPT-EXISTING', id: 111 }
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [existing] }),
      findByID: vi.fn().mockResolvedValue(generatedContract()),
    } as unknown as Payload
    await expect(acceptCandidateContract({
      candidateAccountId: 21,
      contractId: 91,
      expectedSourcePdfSha256: sourcePdfSha256,
      now: new Date(),
      payload,
    })).resolves.toEqual({ acceptance: existing, created: false })
  })

  it('allows only the owning candidate to download the verified accepted PDF', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 121 }),
      findByID: vi.fn()
        .mockResolvedValueOnce({
          acceptanceReference: 'AA-ACCEPT-0123456789ABCDEF',
          candidateAccount: 21,
          contract: 91,
          finalPdfAuthTag: 'tag',
          finalPdfCiphertext: 'accepted-cipher',
          finalPdfFileName: 'ugovor-AA-SWT-2026-000051-prihvacen.pdf',
          finalPdfIv: 'iv',
          finalPdfKeyId: 'key-1',
          finalPdfSha256: acceptedPdfSha256,
          finalPdfSizeBytes: acceptedPdfBytes.length,
          id: 111,
          preApplication: 41,
        })
        .mockResolvedValueOnce({ correlationId: 'ref-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 4 })
        .mockResolvedValueOnce({ contractNumber: 'AA-SWT-2026-000051', id: 91 }),
    } as unknown as Payload

    const result = await downloadAcceptedContract({
      acceptanceId: 111,
      actor: { collection: 'candidate-accounts', id: 21 },
      now: new Date('2026-09-01T15:00:00.000Z'),
      payload,
    })

    expect(result.fileName).toBe('ugovor-AA-SWT-2026-000051-prihvacen.pdf')
    expect(result.bytes).toEqual(acceptedPdfBytes)
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'audit-events',
      data: expect.objectContaining({ eventType: 'ACCEPTED_CONTRACT_ACCESSED' }),
    }))
  })

  it('hides an accepted PDF from another candidate', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({ candidateAccount: 21, id: 111 }),
    } as unknown as Payload
    await expect(downloadAcceptedContract({
      acceptanceId: 111,
      actor: { collection: 'candidate-accounts', id: 22 },
      now: new Date(),
      payload,
    })).rejects.toMatchObject({ message: 'Prihvaćeni ugovor nije pronađen.', status: 404 })
  })

  it('provides official 2027 responsibility statement with 15 points and sponsor consent', () => {
    expect(CONTRACT_ACCEPTANCE_STATEMENT_VERSION).toBe('2.0')
    expect(contractAcceptanceStatement('AA-SWT-2027-001')).toContain('AA-SWT-2027-001')
    expect(RESPONSIBILITY_STATEMENT_2027_POINTS).toHaveLength(15)
    expect(SPONSOR_CONSENT_2027_POINTS.length).toBeGreaterThanOrEqual(4)

    const resp = responsibilityStatement('Marko Marković', '0101995710123')
    expect(resp).toContain('Marko Marković')
    expect(resp).toContain('0101995710123')
    expect(resp).toContain('15 pravila i obaveza')

    const consent = sponsorConsentStatement('Marko Marković')
    expect(consent).toContain('Marko Marković')
    expect(consent).toContain('SWT USA 2027')
  })
})

