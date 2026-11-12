import type { Access, CollectionConfig } from 'payload'

import {
  MAX_GENERATED_CONTRACT_PDF_CIPHERTEXT_CHARS,
  MAX_GENERATED_CONTRACT_SNAPSHOT_CIPHERTEXT_CHARS,
} from '../modules/generated-contracts/storage.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false
const neverExpose = { read: deny, update: deny }

export const GeneratedContracts: CollectionConfig = {
  slug: 'generated-contracts',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['contractNumber', 'candidateAccount', 'templateType', 'status', 'generatedAt'],
    description: 'Nepromenljivi, šifrovani ugovori generisani iz verifikovanih podataka i aktivnog šablona.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'contractNumber',
  },
  fields: [
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'sensitiveProfile', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-sensitive-profiles', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'programOfferSelection', type: 'relationship', admin: { readOnly: true }, relationTo: 'program-offer-selections', required: true, unique: true },
    { name: 'contractTemplate', type: 'relationship', admin: { readOnly: true }, relationTo: 'contract-templates', required: true },
    { name: 'generatedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'programCode', type: 'select', admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'templateType', type: 'select', admin: { readOnly: true }, label: 'Model ugovora', options: [
      { label: 'Standardni ugovor', value: 'STANDARD' },
      { label: 'Platiš kad zaradiš', value: 'PAY_WHEN_YOU_EARN' },
    ], required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, defaultValue: 'GENERATED', label: 'Status', options: [{ label: 'Generisan', value: 'GENERATED' }], required: true },
    { name: 'contractNumber', type: 'text', admin: { readOnly: true }, index: true, label: 'Broj ugovora', required: true, unique: true },
    { name: 'generationKey', type: 'text', access: neverExpose, admin: { hidden: true }, index: true, required: true, unique: true },
    { name: 'templateVersion', type: 'number', admin: { readOnly: true }, label: 'Verzija šablona', min: 1, required: true },
    { name: 'templateChecksum', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak šablona', required: true },
    { name: 'snapshotSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak podataka', required: true },
    { name: 'snapshotCiphertext', type: 'textarea', access: neverExpose, admin: { hidden: true }, maxLength: MAX_GENERATED_CONTRACT_SNAPSHOT_CIPHERTEXT_CHARS, required: true },
    { name: 'snapshotIv', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'snapshotAuthTag', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'snapshotKeyId', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'pdfFileName', type: 'text', admin: { readOnly: true }, label: 'Naziv PDF-a', required: true },
    { name: 'pdfSizeBytes', type: 'number', admin: { readOnly: true }, label: 'Veličina PDF-a', min: 1, required: true },
    { name: 'pdfSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak PDF-a', required: true },
    { name: 'pdfCiphertext', type: 'textarea', access: neverExpose, admin: { hidden: true }, maxLength: MAX_GENERATED_CONTRACT_PDF_CIPHERTEXT_CHARS, required: true },
    { name: 'pdfIv', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'pdfAuthTag', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'pdfKeyId', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'generatedAt', type: 'date', admin: { readOnly: true }, label: 'Generisan', required: true },
    { name: 'retentionReviewAt', type: 'date', admin: { readOnly: true }, label: 'Datum revizije zadržavanja', required: true },
    { name: 'contractDownload', type: 'ui', admin: { components: { Field: './components/admin/GeneratedContractDownloadPanel#GeneratedContractDownloadPanel' } } },
  ],
  labels: { plural: 'Generisani ugovori', singular: 'Generisani ugovor' },
}

