import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../candidate-documents/sensitiveDataCrypto.ts', () => ({
  decryptSensitiveBytes: vi.fn(() => Buffer.from('0101990712345')),
  encryptSensitiveBytes: vi.fn(() => ({ authTag: 'tag', ciphertext: 'cipher', iv: 'iv', keyId: 'key-1' })),
  readSensitiveDataKeyring: vi.fn(() => ({ activeKeyId: 'key-1', fingerprintKey: Buffer.alloc(32), keys: new Map() })),
}))
vi.mock('./renderContractPdf.ts', () => ({
  renderContractPdf: vi.fn(async () => new Uint8Array(Buffer.from('%PDF-1.7 synthetic contract'))),
}))

import { generateCandidateContract, GeneratedContractError } from './service.ts'

function readyProfile() {
  return {
    activePassportDocument: 71,
    applicant: 31,
    candidateAccount: 21,
    contractReadinessStatus: 'READY',
    id: 11,
    personalIdAuthTag: 'tag',
    personalIdCiphertext: 'cipher',
    personalIdIv: 'iv',
    personalIdKeyId: 'key-1',
    personalIdStatus: 'VALIDATED',
    preApplication: 41,
  }
}

describe('generated contracts', () => {
  it('creates an encrypted immutable contract and audit record in one transaction', async () => {
    const contract = { contractNumber: 'AA-SWT-2026-000007', id: 91 }
    const payload = {
      create: vi.fn().mockResolvedValueOnce(contract).mockResolvedValueOnce({ id: 101 }),
      db: {
        beginTransaction: vi.fn().mockResolvedValue(5),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
      },
      find: vi.fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{
          acceptedAt: '2026-08-31T12:00:00.000Z', basePriceCents: 300_000, candidateProcess: 61,
          currency: 'USD', discountCents: 30_000, id: 51, installmentSchedule: null, offer: 81,
          payWhenYouEarnSnapshot: null, selectedMethod: 'ONE_TIME', totalCents: 270_000,
        }] })
        .mockResolvedValueOnce({ docs: [{
          body: '{{ candidate.fullName }} | {{ candidate.personalId }} | {{ contract.number }}',
          contentChecksum: 'template-hash', id: 1, name: 'Standard', templateType: 'STANDARD', version: 2,
        }] }),
      findByID: vi.fn()
        .mockResolvedValueOnce(readyProfile())
        .mockResolvedValueOnce({ fullName: 'Ana Anić', id: 21, programCode: 'SWT' })
        .mockResolvedValueOnce({ fullName: 'Ana Anić', id: 31, residentialAddress: 'Test adresa 1' })
        .mockResolvedValueOnce({ correlationId: 'ref-41', id: 41, status: 'READY_FOR_PROFILE', workflowVersion: 4 })
        .mockResolvedValueOnce({ id: 71, originalFileName: 'pasos.pdf', status: 'VERIFIED' })
        .mockResolvedValueOnce({ id: 81, status: 'ACCEPTED' }),
      update: vi.fn().mockResolvedValue({ id: 61 }),
    } as unknown as Payload

    const result = await generateCandidateContract({
      administratorId: 3,
      now: new Date('2026-09-01T10:00:00.000Z'),
      payload,
      sensitiveProfileId: 11,
    })

    expect(result).toEqual({ contract, created: true })
    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'generated-contracts',
      data: expect.objectContaining({
        contractNumber: 'AA-SWT-2026-000051',
        pdfCiphertext: 'cipher',
        programOfferSelection: 51,
        snapshotCiphertext: 'cipher',
        templateVersion: 2,
      }),
    }))
    expect(payload.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'audit-events', data: expect.objectContaining({ eventType: 'CONTRACT_GENERATED' }),
    }))
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(5)
  })

  it('rejects generation before verified contract readiness', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockResolvedValue({ ...readyProfile(), contractReadinessStatus: 'UNDER_REVIEW' }),
    } as unknown as Payload

    await expect(generateCandidateContract({
      administratorId: 3, now: new Date(), payload, sensitiveProfileId: 11,
    })).rejects.toBeInstanceOf(GeneratedContractError)
  })

  it('returns the existing contract without generating another version', async () => {
    const existing = { contractNumber: 'AA-SWT-2026-000001', id: 91 }
    const payload = { find: vi.fn().mockResolvedValue({ docs: [existing] }), findByID: vi.fn() } as unknown as Payload
    await expect(generateCandidateContract({ administratorId: 3, now: new Date(), payload, sensitiveProfileId: 11 }))
      .resolves.toEqual({ contract: existing, created: false })
    expect(payload.findByID).not.toHaveBeenCalled()
  })
})
