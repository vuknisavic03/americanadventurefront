import { describe, expect, it } from 'vitest'

import {
  inspectProgramDocument,
  programDocumentRequirement,
  requiredProgramDocumentsVerified,
  swtProgramDocumentRequirements,
} from './requirements'

describe('SWT program document requirements', () => {
  it('keeps one unique, required MVP item per document type', () => {
    expect(swtProgramDocumentRequirements).toHaveLength(3)
    expect(new Set(swtProgramDocumentRequirements.map((item) => item.documentType)).size).toBe(3)
    expect(swtProgramDocumentRequirements.every((item) => item.required)).toBe(true)
  })

  it('accepts file signatures only when allowed for the selected item', () => {
    expect(inspectProgramDocument('CV', 'cv.pdf', Buffer.from('%PDF-1.7 synthetic')).mimeType)
      .toBe('application/pdf')
    expect(() => inspectProgramDocument(
      'PROFILE_PHOTO',
      'photo.pdf',
      Buffer.from('%PDF-1.7 synthetic'),
    )).toThrow('Format nije dozvoljen')
  })

  it('rejects unknown requirement keys', () => {
    expect(programDocumentRequirement('INTRODUCTION_VIDEO')).toBeUndefined()
  })

  it('completes the checklist only when every required type is verified', () => {
    expect(requiredProgramDocumentsVerified(['PROFILE_PHOTO', 'ENROLLMENT_CERTIFICATE'])).toBe(false)
    expect(requiredProgramDocumentsVerified(['PROFILE_PHOTO', 'ENROLLMENT_CERTIFICATE', 'CV'])).toBe(true)
  })
})
