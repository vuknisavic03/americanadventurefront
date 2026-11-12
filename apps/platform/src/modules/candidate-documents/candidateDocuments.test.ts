import { describe, expect, it } from 'vitest'

import { CandidatePrivateDocuments } from '../../collections/CandidatePrivateDocuments.ts'
import { validateJmbg } from './jmbg.ts'
import {
  inspectPrivateDocument,
  MAX_PRIVATE_DOCUMENT_BYTES,
  MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS,
  privateDocumentEncryptionContext,
} from './privateDocument.ts'
import { payloadValidationIssues } from './service.ts'
import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
  readSensitiveDataKeyring,
  sensitiveFingerprint,
} from './sensitiveDataCrypto.ts'

const keyring = readSensitiveDataKeyring({
  SENSITIVE_DATA_ACTIVE_KEY_ID: 'test-v1',
  SENSITIVE_DATA_ENCRYPTION_KEYS: `test-v1:${Buffer.alloc(32, 7).toString('base64')}`,
  SENSITIVE_DATA_FINGERPRINT_KEY: Buffer.alloc(32, 9).toString('base64'),
})
const validJmbg = ['01', '01', '000', '71', '000', '9'].join('')

describe('sensitive data crypto', () => {
  it('encrypts with authenticated context and decrypts with the configured key ID', () => {
    const encrypted = encryptSensitiveBytes(Buffer.from(validJmbg), keyring, 'jmbg:12')
    expect(encrypted.ciphertext).not.toContain(validJmbg)
    expect(decryptSensitiveBytes(encrypted, keyring, 'jmbg:12').toString()).toBe(validJmbg)
    expect(() => decryptSensitiveBytes(encrypted, keyring, 'jmbg:13')).toThrow()
  })

  it('produces a deterministic, purpose-bound fingerprint', () => {
    expect(sensitiveFingerprint(validJmbg, keyring, 'jmbg')).toBe(
      sensitiveFingerprint(validJmbg, keyring, 'jmbg'),
    )
    expect(sensitiveFingerprint(validJmbg, keyring, 'other')).not.toBe(
      sensitiveFingerprint(validJmbg, keyring, 'jmbg'),
    )
  })
})

describe('JMBG validation', () => {
  it('accepts a valid checksum and matching date', () => {
    expect(validateJmbg(validJmbg, '2000-01-01')).toMatchObject({ valid: true })
  })

  it('rejects a mismatched date and invalid checksum', () => {
    expect(validateJmbg(validJmbg, '2001-01-01')).toMatchObject({ valid: false })
    expect(validateJmbg(`${validJmbg.slice(0, -1)}7`, '2000-01-01')).toMatchObject({ valid: false })
  })
})

describe('private document inspection', () => {
  it('uses file signatures and sanitizes the displayed name', () => {
    const result = inspectPrivateDocument('../passport.pdf', Buffer.from('%PDF-1.7 example'))
    expect(result).toMatchObject({ fileName: '.._passport.pdf', mimeType: 'application/pdf' })
  })

  it('rejects renamed unsupported content', () => {
    expect(() => inspectPrivateDocument('passport.pdf', Buffer.from('not a PDF'))).toThrow(/PDF/)
  })

  it('allows the full encrypted representation of a five-megabyte document', () => {
    expect(MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS).toBe(
      Math.ceil(MAX_PRIVATE_DOCUMENT_BYTES / 3) * 4,
    )
    const ciphertextField = CandidatePrivateDocuments.fields.find(
      (field) => 'name' in field && field.name === 'ciphertext',
    )
    expect(ciphertextField).toMatchObject({
      maxLength: MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS,
      type: 'textarea',
    })
  })

  it('preserves existing contexts while isolating program and visa document purposes', () => {
    expect(privateDocumentEncryptionContext('PASSPORT', 12)).toBe('passport:12')
    expect(privateDocumentEncryptionContext('CV', 12)).toBe('program-document:CV:12')
    expect(privateDocumentEncryptionContext('CV', 12)).not.toBe(
      privateDocumentEncryptionContext('PROFILE_PHOTO', 12),
    )
    expect(privateDocumentEncryptionContext('VISA_DS2019', 12)).toBe(
      'visa-document:VISA_DS2019:12',
    )
    expect(privateDocumentEncryptionContext('VISA_DS2019', 12)).not.toBe(
      privateDocumentEncryptionContext('CV', 12),
    )
  })
})

describe('Payload validation diagnostics', () => {
  it('recognizes validation errors across bundled module boundaries', () => {
    expect(payloadValidationIssues({
      data: { errors: [{ message: 'This field is required.', path: 'candidateAccount' }] },
      name: 'ValidationError',
    })).toEqual([{ message: 'This field is required.', path: 'candidateAccount' }])
  })

  it('ignores unrelated errors and malformed validation details', () => {
    expect(payloadValidationIssues(new Error('database unavailable'))).toBeUndefined()
    expect(payloadValidationIssues({ data: { errors: [{ value: 'secret' }] }, name: 'ValidationError' })).toEqual([])
  })
})

