import {
  inspectPrivateDocument,
  type PrivateDocumentType,
  type SupportedDocumentMimeType,
} from '../candidate-documents/privateDocument.ts'

export type VisaDocumentType = Extract<
  PrivateDocumentType,
  'PASSPORT' | 'VISA_DS160_CONFIRMATION' | 'VISA_DS2019' | 'VISA_FEE_RECEIPT' | 'VISA_PHOTO'
>
export type UploadableVisaDocumentType = Exclude<VisaDocumentType, 'PASSPORT'>

export type VisaDocumentRequirement = {
  acceptedMimeTypes: readonly SupportedDocumentMimeType[]
  description: string
  documentType: VisaDocumentType
  label: string
  required: true
  uploadable: boolean
}

export const SWT_VISA_DOCUMENT_CHECKLIST_VERSION = 1

export const swtVisaDocumentRequirements: readonly VisaDocumentRequirement[] = [
  {
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Važeći pasoš koji je ranije dostavljen i verifikovan u portalu.',
    documentType: 'PASSPORT',
    label: 'Važeći pasoš',
    required: true,
    uploadable: false,
  },
  {
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Stranica potvrde nakon elektronskog popunjavanja obrasca DS-160.',
    documentType: 'VISA_DS160_CONFIRMATION',
    label: 'Potvrda obrasca DS-160',
    required: true,
    uploadable: true,
  },
  {
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Potvrda o podobnosti za J-1 program koju izdaje programski sponzor.',
    documentType: 'VISA_DS2019',
    label: 'Obrazac DS-2019',
    required: true,
    uploadable: true,
  },
  {
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Potvrda o uplati konzularne ili druge vizne takse kada je primenljiva.',
    documentType: 'VISA_FEE_RECEIPT',
    label: 'Potvrda o uplati vizne takse',
    required: true,
    uploadable: true,
  },
  {
    acceptedMimeTypes: ['image/jpeg', 'image/png'],
    description: 'Fotografija pripremljena prema važećim zahtevima mesta na kojem podnosite zahtev.',
    documentType: 'VISA_PHOTO',
    label: 'Fotografija za vizu',
    required: true,
    uploadable: true,
  },
] as const

export function visaDocumentRequirement(value: string) {
  return swtVisaDocumentRequirements.find((requirement) => requirement.documentType === value)
}

export function uploadableVisaDocumentRequirement(value: string) {
  const requirement = visaDocumentRequirement(value)
  return requirement?.uploadable ? requirement : undefined
}

export function requiredVisaDocumentsVerified(documentTypes: Iterable<string>) {
  const verified = new Set(documentTypes)
  return swtVisaDocumentRequirements.every((requirement) => verified.has(requirement.documentType))
}

export function inspectVisaDocument(
  documentType: UploadableVisaDocumentType,
  fileName: string,
  bytes: Uint8Array,
) {
  const requirement = uploadableVisaDocumentRequirement(documentType)
  if (!requirement) throw new Error('Vrsta viznog dokumenta nije podržana za postavljanje.')
  const inspected = inspectPrivateDocument(fileName, bytes)
  if (!requirement.acceptedMimeTypes.includes(inspected.mimeType)) {
    throw new Error(`Format nije dozvoljen za dokument „${requirement.label}“.`)
  }
  return inspected
}
