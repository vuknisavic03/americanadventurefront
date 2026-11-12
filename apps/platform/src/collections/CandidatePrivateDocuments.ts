import type { CollectionConfig } from 'payload'

import { MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS } from '../modules/candidate-documents/privateDocument.ts'

const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) =>
  req.user?.collection === 'users'
const deny = () => false
const neverExpose = { read: deny, update: deny }

export const CandidatePrivateDocuments: CollectionConfig = {
  slug: 'candidate-private-documents',
  access: {
    create: deny,
    delete: deny,
    read: administrator,
    update: deny,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'documentType', 'status', 'originalFileName', 'uploadedAt'],
    description: 'Privatni dokumenti su šifrovani i preuzimaju se samo kroz evidentirani kontrolisani pristup.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'originalFileName',
  },
  fields: [
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'sensitiveProfile', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-sensitive-profiles', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'documentType', type: 'select', admin: { readOnly: true }, defaultValue: 'PASSPORT', label: 'Vrsta dokumenta', options: [
      { label: 'Pasoš', value: 'PASSPORT' },
      { label: 'Profilna fotografija', value: 'PROFILE_PHOTO' },
      { label: 'Potvrda o studiranju', value: 'ENROLLMENT_CERTIFICATE' },
      { label: 'CV na engleskom', value: 'CV' },
      { label: 'Očitana lična karta jemca', value: 'GUARANTOR_ID_CARD' },
      { label: 'Potvrda obrasca DS-160', value: 'VISA_DS160_CONFIRMATION' },
      { label: 'Obrazac DS-2019', value: 'VISA_DS2019' },
      { label: 'Potvrda o uplati vizne takse', value: 'VISA_FEE_RECEIPT' },
      { label: 'Fotografija za vizu', value: 'VISA_PHOTO' },
    ], required: true },
    {
      name: 'status',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: 'UPLOADED',
      label: 'Status provere',
      options: [
        { label: 'Čeka proveru', value: 'UPLOADED' },
        { label: 'Verifikovan', value: 'VERIFIED' },
        { label: 'Odbijen', value: 'REJECTED' },
        { label: 'Zamenjen novijim dokumentom', value: 'SUPERSEDED' },
      ],
      required: true,
    },
    { name: 'originalFileName', type: 'text', admin: { readOnly: true }, label: 'Naziv fajla', required: true },
    { name: 'mimeType', type: 'select', admin: { readOnly: true }, label: 'Format', options: [
      { label: 'PDF', value: 'application/pdf' },
      { label: 'JPEG', value: 'image/jpeg' },
      { label: 'PNG', value: 'image/png' },
    ], required: true },
    { name: 'sizeBytes', type: 'number', admin: { readOnly: true }, label: 'Veličina u bajtovima', min: 1, required: true },
    { name: 'sha256', type: 'text', access: { update: deny }, admin: { hidden: true }, required: true },
    {
      name: 'ciphertext',
      type: 'textarea',
      access: neverExpose,
      admin: { hidden: true },
      maxLength: MAX_PRIVATE_DOCUMENT_CIPHERTEXT_CHARS,
      required: true,
    },
    { name: 'iv', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'authTag', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'keyId', type: 'text', access: neverExpose, admin: { hidden: true }, required: true },
    { name: 'uploadedAt', type: 'date', admin: { readOnly: true }, label: 'Dokument postavljen', required: true },
    { name: 'verifiedAt', type: 'date', admin: { readOnly: true }, label: 'Dokument proveren' },
    { name: 'verifiedBy', type: 'relationship', admin: { readOnly: true }, label: 'Dokument proverio/la', relationTo: 'users' },
    { name: 'rejectionReason', type: 'textarea', admin: { readOnly: true }, label: 'Razlog odbijanja' },
    { name: 'supersededAt', type: 'date', admin: { readOnly: true }, label: 'Dokument zamenjen' },
    { name: 'retentionReviewAt', type: 'date', admin: { readOnly: true }, label: 'Datum revizije zadržavanja', required: true },
    {
      name: 'ocrStatus',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: 'NOT_APPLICABLE',
      label: 'Status OCR očitavanja',
      options: [
        { label: 'Nije primenjivo', value: 'NOT_APPLICABLE' },
        { label: 'U obradi', value: 'PENDING' },
        { label: 'Uspešno očitano', value: 'COMPLETED' },
        { label: 'Nije prepoznato', value: 'NO_MRZ_DETECTED' },
        { label: 'Greška', value: 'FAILED' },
      ],
    },
    { name: 'ocrPassportNumber', type: 'text', admin: { readOnly: true }, label: 'Očitani broj pasoša' },
    { name: 'ocrExpirationDate', type: 'date', admin: { readOnly: true }, label: 'Očitani datum isteka pasoša' },
    { name: 'ocrData', type: 'json', admin: { hidden: true }, label: 'Detaljni OCR podaci' },
    {
      name: 'documentReview',
      type: 'ui',
      admin: { components: { Field: './components/admin/PrivateDocumentReviewPanel#PrivateDocumentReviewPanel' } },
    },
  ],
  indexes: [{ fields: ['candidateAccount', 'documentType', 'status'] }],
  labels: { plural: 'Privatni dokumenti kandidata', singular: 'Privatni dokument kandidata' },
}

