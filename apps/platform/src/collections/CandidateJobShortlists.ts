import type { Access, CollectionConfig } from 'payload'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false

export const CandidateJobShortlists: CollectionConfig = {
  slug: 'candidate-job-shortlists',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: { hidden: true, defaultColumns: ['candidateAccount', 'shortlistVersion', 'optionCount', 'status', 'notificationStatus', 'sentAt'], group: 'Posao i intervju', useAsTitle: 'shortlistReference' },
  fields: [
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', admin: { readOnly: true }, relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'shortlistReference', type: 'text', admin: { readOnly: true }, index: true, required: true, unique: true },
    { name: 'shortlistVersion', type: 'number', admin: { readOnly: true }, min: 1, required: true },
    { name: 'optionCount', type: 'number', admin: { readOnly: true }, min: 1, required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, options: [{ label: 'Otvorena', value: 'OPEN' }, { label: 'Zaključena izborom', value: 'COMPLETED' }], required: true },
    { name: 'sentAt', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'sentBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'notificationStatus', type: 'select', admin: { readOnly: true }, options: [{ label: 'Čeka slanje', value: 'PENDING' }, { label: 'Poslato', value: 'DELIVERED' }, { label: 'Slanje nije uspelo', value: 'FAILED' }], required: true },
    { name: 'notificationDeliveredAt', type: 'date', admin: { readOnly: true } },
    { name: 'messageDelivery', type: 'relationship', admin: { readOnly: true }, relationTo: 'message-deliveries' },
  ],
  indexes: [{ fields: ['candidateProcess', 'shortlistVersion'], unique: true }, { fields: ['candidateAccount', 'status'] }],
  labels: { plural: 'Liste poslova kandidata', singular: 'Lista poslova kandidata' },
}
