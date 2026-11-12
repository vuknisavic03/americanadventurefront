import type { CollectionConfig } from 'payload'

const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) =>
  req.user?.collection === 'users'
const deny = () => false
const neverExpose = { read: deny, update: deny }

export const CandidateSensitiveProfiles: CollectionConfig = {
  slug: 'candidate-sensitive-profiles',
  access: {
    create: deny,
    delete: deny,
    read: administrator,
    update: deny,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'personalIdStatus', 'contractReadinessStatus', 'updatedAt'],
    description: 'Bezbedni status identiteta. JMBG se nikada ne prikazuje u otvorenom obliku.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true, unique: true },
    { name: 'applicant', type: 'relationship', admin: { readOnly: true }, relationTo: 'applicants', required: true, unique: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true, unique: true },
    { name: 'programCode', type: 'select', admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    {
      name: 'personalIdStatus',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: 'MISSING',
      label: 'Status JMBG-a',
      options: [
        { label: 'Nije unet', value: 'MISSING' },
        { label: 'Validiran', value: 'VALIDATED' },
      ],
      required: true,
    },
    { name: 'personalIdUpdatedAt', type: 'date', admin: { readOnly: true }, label: 'JMBG ažuriran' },
    { name: 'personalIdCiphertext', type: 'textarea', access: neverExpose, admin: { hidden: true } },
    { name: 'personalIdIv', type: 'text', access: neverExpose, admin: { hidden: true } },
    { name: 'personalIdAuthTag', type: 'text', access: neverExpose, admin: { hidden: true } },
    { name: 'personalIdKeyId', type: 'text', access: neverExpose, admin: { hidden: true } },
    { name: 'personalIdFingerprint', type: 'text', access: neverExpose, admin: { hidden: true }, index: true, unique: true },
    { name: 'activePassportDocument', type: 'relationship', admin: { readOnly: true }, label: 'Aktivni pasoš', relationTo: 'candidate-private-documents' },
    {
      name: 'contractReadinessStatus',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: 'INCOMPLETE',
      label: 'Spremnost za ugovor',
      options: [
        { label: 'Nedostaju podaci', value: 'INCOMPLETE' },
        { label: 'Čeka proveru dokumenta', value: 'UNDER_REVIEW' },
        { label: 'Spreman za ugovor', value: 'READY' },
      ],
      required: true,
    },
    { name: 'readinessUpdatedAt', type: 'date', admin: { readOnly: true }, label: 'Status spremnosti ažuriran' },
    { name: 'retentionReviewAt', type: 'date', admin: { readOnly: true }, label: 'Datum revizije zadržavanja' },
    {
      name: 'contractGeneration',
      type: 'ui',
      admin: { components: { Field: './components/admin/ContractGenerationPanel#ContractGenerationPanel' } },
    },
  ],
  labels: { plural: 'Bezbedni profili kandidata', singular: 'Bezbedni profil kandidata' },
}

