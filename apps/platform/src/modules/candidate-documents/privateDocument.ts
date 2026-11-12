import { createHash } from 'node:crypto'

export const MAX_PRIVATE_DOCUMENT_BYTES = 5 * 1_024 * 1_024
export const MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS = Math.ceil(MAX_PRIVATE_DOCUMENT_BYTES / 3) * 4

export type SupportedDocumentMimeType = 'application/pdf' | 'image/jpeg' | 'image/png'
export type PrivateDocumentType =
  | 'CV'
  | 'ENROLLMENT_CERTIFICATE'
  | 'GUARANTOR_ID_CARD'
  | 'PASSPORT'
  | 'PROFILE_PHOTO'
  | 'VISA_DS160_CONFIRMATION'
  | 'VISA_DS2019'
  | 'VISA_FEE_RECEIPT'
  | 'VISA_PHOTO'

const signatures: Array<{ mimeType: SupportedDocumentMimeType; prefix: number[] }> = [
  { mimeType: 'application/pdf', prefix: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mimeType: 'image/jpeg', prefix: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
]

export function inspectPrivateDocument(fileName: string, bytes: Uint8Array) {
  if (bytes.length === 0) throw new Error('Izabrani dokument je prazan.')
  if (bytes.length > MAX_PRIVATE_DOCUMENT_BYTES) throw new Error('Dokument može imati najviše 5 MB.')
  const signature = signatures.find(({ prefix }) => prefix.every((value, index) => bytes[index] === value))
  if (!signature) throw new Error('Dozvoljeni su samo ispravni PDF, JPEG i PNG dokumenti.')
  const sanitizedFileName = fileName
    .replace(/[\\/]/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 180)
  return {
    fileName: sanitizedFileName || `pasos.${signature.mimeType === 'application/pdf' ? 'pdf' : signature.mimeType === 'image/png' ? 'png' : 'jpg'}`,
    mimeType: signature.mimeType,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
  }
}

export function retentionReviewDate(now: Date, retentionDays = 365) {
  const result = new Date(now)
  result.setUTCDate(result.getUTCDate() + retentionDays)
  return result
}

export function privateDocumentEncryptionContext(
  documentType: PrivateDocumentType,
  candidateAccountId: number,
) {
  // Preserve contexts used by documents encrypted before the visa checklist existed.
  if (documentType === 'PASSPORT') return `passport:${candidateAccountId}`
  if (documentType === 'GUARANTOR_ID_CARD') return `guarantor-id-card:${candidateAccountId}`
  if (documentType.startsWith('VISA_')) return `visa-document:${documentType}:${candidateAccountId}`
  return `program-document:${documentType}:${candidateAccountId}`
}

