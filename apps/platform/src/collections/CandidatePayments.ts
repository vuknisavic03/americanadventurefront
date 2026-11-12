import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnPayment: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const deny = () => false

export const CandidatePayments: CollectionConfig = {
  slug: 'candidate-payments',
  access: { create: deny, delete: deny, read: administratorOrOwnPayment, update: deny },
  admin: {
    defaultColumns: ['paymentReference', 'candidateAccount', 'entryType', 'amountCents', 'receivedAt', 'recordedBy'],
    description: 'Nepromenljivi dnevnik uplata i njihovih poništenja. Postojeći finansijski zapis se nikada ne prepravlja niti briše.',
    group: 'Finansije',
    useAsTitle: 'paymentReference',
  },
  fields: [
    { name: 'paymentPlan', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-payment-plans', required: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'recordedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    {
      name: 'entryType',
      type: 'select',
      admin: { readOnly: true },
      label: 'Vrsta zapisa',
      options: [
        { label: 'Primljena uplata', value: 'PAYMENT' },
        { label: 'Poništenje uplate', value: 'REVERSAL' },
      ],
      required: true,
    },
    { name: 'amountCents', type: 'number', admin: { readOnly: true }, label: 'Iznos u centima', min: 1, required: true },
    { name: 'currency', type: 'select', admin: { readOnly: true }, options: [{ label: 'USD', value: 'USD' }], required: true },
    { name: 'receivedAt', type: 'date', admin: { readOnly: true }, label: 'Datum prijema', required: true },
    { name: 'paymentReference', type: 'text', admin: { readOnly: true }, index: true, label: 'Interna referenca', required: true, unique: true },
    { name: 'externalReference', type: 'text', admin: { readOnly: true }, label: 'Poziv na broj / izvod', maxLength: 160 },
    { name: 'note', type: 'textarea', admin: { readOnly: true }, label: 'Napomena', maxLength: 1_000 },
    { name: 'idempotencyKey', type: 'text', access: { read: deny }, admin: { hidden: true }, index: true, required: true, unique: true },
    { name: 'reversesPayment', type: 'relationship', admin: { readOnly: true }, label: 'Poništava uplatu', relationTo: 'candidate-payments', unique: true },
    { name: 'reversalReason', type: 'textarea', admin: { readOnly: true }, label: 'Razlog poništenja', maxLength: 1_000 },
    { name: 'paymentReversal', type: 'ui', admin: { components: { Field: './components/admin/PaymentReversalPanel#PaymentReversalPanel' } } },
  ],
  labels: { plural: 'Evidentirane uplate', singular: 'Evidentirana uplata' },
}
