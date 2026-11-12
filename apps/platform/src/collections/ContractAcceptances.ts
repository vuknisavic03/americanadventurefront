import type { Access, CollectionConfig } from 'payload'

import { MAX_GENERATED_CONTRACT_PDF_CIPHERTEXT_CHARS } from '../modules/generated-contracts/storage.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false
const neverExpose = { read: deny, update: deny }

export const ContractAcceptances: CollectionConfig = {
  slug: 'contract-acceptances',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['acceptanceReference', 'candidateAccount', 'contract', 'acceptedAt'],
    description: 'Nepromenljivi dokazi da je kandidat prihvatio tačno određenu verziju ugovora.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'acceptanceReference',
  },
  fields: [
    { name: 'contract', type: 'relationship', admin: { readOnly: true }, relationTo: 'generated-contracts', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'acceptanceReference', type: 'text', admin: { readOnly: true }, index: true, label: 'Referenca prihvatanja', required: true, unique: true },
    { name: 'acceptedAt', type: 'date', admin: { readOnly: true }, label: 'Prihvaćen', required: true },
    { name: 'statementVersion', type: 'text', admin: { readOnly: true }, label: 'Verzija izjave', required: true },
    { name: 'statementText', type: 'textarea', admin: { readOnly: true }, label: 'Prihvaćena izjava', maxLength: 1_000, required: true },
    { name: 'statementChecksum', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak izjave', required: true },
    { name: 'sourcePdfSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak nacrta', required: true },
    { name: 'evidenceSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak dokaza', required: true },
    { name: 'finalPdfFileName', type: 'text', admin: { readOnly: true }, label: 'Naziv konačnog PDF-a', required: true },
    { name: 'finalPdfSizeBytes', type: 'number', admin: { readOnly: true }, label: 'Veličina konačnog PDF-a', min: 1, required: true },
    { name: 'finalPdfSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak konačnog PDF-a', required: true },
    { name: 'finalPdfCiphertext', type: 'textarea', access: neverExpose, admin: { hidden: true }, maxLength: MAX_GENERATED_CONTRACT_PDF_CIPHERTEXT_CHARS, required: true },
    { name: 'finalPdfIv', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'finalPdfAuthTag', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'finalPdfKeyId', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'retentionReviewAt', type: 'date', admin: { readOnly: true }, label: 'Datum revizije zadržavanja', required: true },
    { name: 'acceptedContractDownload', type: 'ui', admin: { components: { Field: './components/admin/AcceptedContractDownloadPanel#AcceptedContractDownloadPanel' } } },
  ],
  labels: { plural: 'Prihvatanja ugovora', singular: 'Prihvatanje ugovora' },
}

