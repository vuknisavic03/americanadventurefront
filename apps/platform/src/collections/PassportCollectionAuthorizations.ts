import type { Access, CollectionConfig } from 'payload'

import {
  MAX_PASSPORT_AUTHORIZATION_PDF_CIPHERTEXT_CHARS,
  MAX_PASSPORT_AUTHORIZATION_SNAPSHOT_CIPHERTEXT_CHARS,
} from '../modules/passport-authorizations/storage.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false
const hidden = { read: deny, update: deny }

export const PassportCollectionAuthorizations: CollectionConfig = {
  slug: 'passport-collection-authorizations',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['authorizationNumber', 'candidateAccount', 'status', 'generatedAt', 'acceptedAt'],
    description: 'Generisana i elektronski prihvaćena punomoćja čuvaju se šifrovano sa dokazom integriteta.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'authorizationNumber',
  },
  fields: [
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-processes', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', admin: { readOnly: true }, relationTo: 'applicants', required: true },
    { name: 'sensitiveProfile', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-sensitive-profiles', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'template', type: 'relationship', admin: { readOnly: true }, relationTo: 'passport-authorization-templates', required: true },
    { name: 'generatedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'programCode', type: 'select', admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, defaultValue: 'GENERATED', options: [
      { label: 'Čeka prihvatanje', value: 'GENERATED' }, { label: 'Elektronski prihvaćeno', value: 'ACCEPTED' },
    ], required: true },
    { name: 'authorizationNumber', type: 'text', admin: { readOnly: true }, index: true, label: 'Broj punomoćja', required: true, unique: true },
    { name: 'generationKey', type: 'text', access: hidden, admin: { hidden: true }, index: true, required: true, unique: true },
    { name: 'templateVersion', type: 'number', admin: { readOnly: true }, label: 'Verzija šablona', min: 1, required: true },
    { name: 'templateChecksum', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak šablona', required: true },
    { name: 'snapshotSha256', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak podataka', required: true },
    { name: 'snapshotCiphertext', type: 'textarea', access: hidden, admin: { hidden: true }, maxLength: MAX_PASSPORT_AUTHORIZATION_SNAPSHOT_CIPHERTEXT_CHARS, required: true },
    { name: 'snapshotIv', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'snapshotAuthTag', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'snapshotKeyId', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'pdfFileName', type: 'text', admin: { readOnly: true }, label: 'Naziv nacrta', required: true },
    { name: 'pdfSizeBytes', type: 'number', admin: { readOnly: true }, min: 1, required: true },
    { name: 'pdfSha256', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'pdfCiphertext', type: 'textarea', access: hidden, admin: { hidden: true }, maxLength: MAX_PASSPORT_AUTHORIZATION_PDF_CIPHERTEXT_CHARS, required: true },
    { name: 'pdfIv', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'pdfAuthTag', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'pdfKeyId', type: 'text', access: hidden, admin: { hidden: true }, required: true },
    { name: 'generatedAt', type: 'date', admin: { readOnly: true }, label: 'Generisano', required: true },
    { name: 'acceptedAt', type: 'date', admin: { readOnly: true }, label: 'Prihvaćeno' },
    { name: 'acceptanceReference', type: 'text', admin: { readOnly: true }, index: true, label: 'Referenca prihvatanja', unique: true },
    { name: 'statementVersion', type: 'text', admin: { readOnly: true }, label: 'Verzija izjave' },
    { name: 'statementText', type: 'textarea', admin: { readOnly: true }, maxLength: 1_000, label: 'Prihvaćena izjava' },
    { name: 'statementChecksum', type: 'text', admin: { readOnly: true } },
    { name: 'evidenceSha256', type: 'text', admin: { readOnly: true } },
    { name: 'finalPdfFileName', type: 'text', admin: { readOnly: true }, label: 'Naziv prihvaćenog PDF-a' },
    { name: 'finalPdfSizeBytes', type: 'number', admin: { readOnly: true }, min: 1 },
    { name: 'finalPdfSha256', type: 'text', admin: { readOnly: true } },
    { name: 'finalPdfCiphertext', type: 'textarea', access: hidden, admin: { hidden: true }, maxLength: MAX_PASSPORT_AUTHORIZATION_PDF_CIPHERTEXT_CHARS },
    { name: 'finalPdfIv', type: 'text', access: hidden, admin: { hidden: true } },
    { name: 'finalPdfAuthTag', type: 'text', access: hidden, admin: { hidden: true } },
    { name: 'finalPdfKeyId', type: 'text', access: hidden, admin: { hidden: true } },
    { name: 'retentionReviewAt', type: 'date', admin: { readOnly: true }, label: 'Datum revizije zadržavanja', required: true },
    { name: 'authorizationDownload', type: 'ui', admin: { components: { Field: './components/admin/PassportAuthorizationDownloadPanel#PassportAuthorizationDownloadPanel' } } },
  ],
  labels: { plural: 'Punomoćja za pasoš', singular: 'Punomoćje za pasoš' },
}
