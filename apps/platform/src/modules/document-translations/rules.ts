import type { DocumentTranslationType } from './templates.ts'

export class DocumentTranslationError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 400) {
    super(message)
    this.name = 'DocumentTranslationError'
  }
}

export interface ReviewTranslationActionInput {
  action: 'APPROVE' | 'REJECT'
  adminId: number
  adminNotes?: string
  rejectionReason?: string
}

export function validateTranslationReview(
  currentStatus: string,
  input: ReviewTranslationActionInput,
): { error?: string; valid: boolean } {
  if (currentStatus === 'APPROVED') {
    return {
      error: 'Dokument je već odobren i overen. Nije moguće menjati status.',
      valid: false,
    }
  }

  if (input.action === 'APPROVE') {
    if (!input.adminId || input.adminId <= 0) {
      return {
        error: 'Pravilo BR-010: Neophodna je administratorska identifikacija za odobrenje prevoda.',
        valid: false,
      }
    }
    return { valid: true }
  }

  if (input.action === 'REJECT') {
    if (!input.rejectionReason || !input.rejectionReason.trim()) {
      return {
        error: 'Razlog odbijanja prevoda je obavezan.',
        valid: false,
      }
    }
    return { valid: true }
  }

  return { error: 'Nepoznata akcija revizije.', valid: false }
}

export function canDownloadTranslationPdf(doc: {
  pdfChecksum?: string | null
  status: string
}): boolean {
  return doc.status === 'APPROVED' && Boolean(doc.pdfChecksum)
}

export function getDocumentTypeDefaultTitle(type: DocumentTranslationType): string {
  switch (type) {
    case 'STUDENT_STATUS_CERTIFICATE':
      return 'Potvrda o statusu studenta (Certificate of University Enrollment)'
    case 'GUARANTOR_STATEMENT':
      return 'Izjava jemca / finansijska podrška (Financial Guarantor Declaration)'
    case 'GENERAL_DOCUMENT':
      return 'Prevedeni dokument kandidata (Certified English Translation)'
  }
}
