import type { CollectionConfig } from 'payload'

const deny = () => false

export const VisaQuestionnaires: CollectionConfig = {
  slug: 'visa-questionnaires',
  access: { create: deny, delete: deny, update: deny, read: ({ req }) => req.user?.collection === 'users' },
  admin: {
    group: 'Viziranje',
    useAsTitle: 'candidateAccount',
    defaultColumns: ['candidateAccount', 'status', 'revision', 'submittedAt'],
    description: 'Odgovori su šifrovani. Pregled i obrada dostupni su u procesu kandidata, u odeljku Vizni upitnik.',
  },
  labels: { singular: 'Vizni upitnik', plural: 'Vizni upitnici' },
  fields: [
    { name: 'candidateProcess', type: 'relationship', relationTo: 'candidate-processes', required: true, unique: true, admin: { readOnly: true } },
    { name: 'candidateAccount', type: 'relationship', relationTo: 'candidate-accounts', required: true, admin: { readOnly: true } },
    { name: 'paymentOrder', type: 'relationship', relationTo: 'visa-payment-orders', required: true, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true }, min: 1 },
    { name: 'revision', type: 'number', required: true, admin: { readOnly: true }, min: 1 },
    { name: 'status', type: 'select', required: true, admin: { readOnly: true }, options: [
      { label: 'Nacrt', value: 'DRAFT' },
      { label: 'Predato agenciji', value: 'SUBMITTED' },
      { label: 'Potrebna dopuna', value: 'CHANGES_REQUESTED' },
      { label: 'Pregled završen', value: 'REVIEWED' },
    ] },
    { name: 'encryptedContent', type: 'json', required: true, access: { read: deny }, admin: { hidden: true } },
    { name: 'submittedAt', type: 'date', admin: { readOnly: true } },
    { name: 'reviewedAt', type: 'date', admin: { readOnly: true } },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
