import { describe, expect, it } from 'vitest'

import {
  inspectVisaDocument,
  requiredVisaDocumentsVerified,
  swtVisaDocumentRequirements,
} from './requirements.ts'

describe('SWT visa document checklist', () => {
  it('has unique versioned requirements and reports missing documents', () => {
    const types = swtVisaDocumentRequirements.map((item) => item.documentType)
    expect(new Set(types).size).toBe(types.length)
    expect(requiredVisaDocumentsVerified(types)).toBe(true)
    expect(requiredVisaDocumentsVerified(types.slice(1))).toBe(false)
  })

  it('accepts PDF evidence but requires an image for the visa photo', () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])
    expect(inspectVisaDocument('VISA_DS160_CONFIRMATION', 'confirmation.pdf', pdf).mimeType).toBe('application/pdf')
    expect(() => inspectVisaDocument('VISA_PHOTO', 'photo.pdf', pdf)).toThrow('Format nije dozvoljen')
  })
})
