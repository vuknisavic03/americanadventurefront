import {
  inspectPrivateDocument,
  type PrivateDocumentType,
  type SupportedDocumentMimeType,
} from '../candidate-documents/privateDocument.ts'

export type ProgramDocumentType = Exclude<PrivateDocumentType, 'PASSPORT'>

export type ProgramDocumentRequirement = {
  acceptedMimeTypes: readonly SupportedDocumentMimeType[]
  description: string
  documentType: ProgramDocumentType
  label: string
  required: true
}

export const SWT_PROGRAM_DOCUMENT_CHECKLIST_VERSION = 1

export const swtProgramDocumentRequirements: readonly ProgramDocumentRequirement[] = [
  {
    acceptedMimeTypes: ['image/jpeg', 'image/png'],
    description: 'Jasna fotografija lica na neutralnoj pozadini, bez fotografije ličnog dokumenta.',
    documentType: 'PROFILE_PHOTO',
    label: 'Profilna fotografija',
    required: true,
  },
  {
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Aktuelna potvrda fakulteta da imate status studenta.',
    documentType: 'ENROLLMENT_CERTIFICATE',
    label: 'Potvrda o studiranju',
    required: true,
  },
  {
    acceptedMimeTypes: ['application/pdf'],
    description: 'Biografija na engleskom jeziku u PDF formatu.',
    documentType: 'CV',
    label: 'CV na engleskom',
    required: true,
  },
] as const

export function programDocumentRequirement(value: string) {
  return swtProgramDocumentRequirements.find((requirement) => requirement.documentType === value)
}

export function requiredProgramDocumentsVerified(documentTypes: Iterable<string>) {
  const verified = new Set(documentTypes)
  return swtProgramDocumentRequirements.every(
    (requirement) => verified.has(requirement.documentType),
  )
}

export function inspectProgramDocument(
  documentType: ProgramDocumentType,
  fileName: string,
  bytes: Uint8Array,
) {
  const requirement = programDocumentRequirement(documentType)
  if (!requirement) throw new Error('Vrsta programskog dokumenta nije podržana.')
  const inspected = inspectPrivateDocument(fileName, bytes)
  if (!requirement.acceptedMimeTypes.includes(inspected.mimeType)) {
    throw new Error(`Format nije dozvoljen za dokument „${requirement.label}“.`)
  }
  return inspected
}
