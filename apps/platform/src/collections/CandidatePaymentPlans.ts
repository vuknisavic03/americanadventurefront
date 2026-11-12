import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnPlan: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const deny = () => false

export const CandidatePaymentPlans: CollectionConfig = {
  slug: 'candidate-payment-plans',
  access: { create: deny, delete: deny, read: administratorOrOwnPlan, update: deny },
  admin: {
    defaultColumns: ['candidateAccount', 'selectedMethod', 'totalCents', 'paidCents', 'firstPaymentStatus', 'status'],
    description: 'Finansijska kartica kandidata formirana iz prihvaćenog ugovora. Saldo se menja isključivo evidentiranjem ili poništavanjem uplata.',
    group: 'Finansije',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-processes', required: true, unique: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'programOfferSelection', type: 'relationship', admin: { readOnly: true }, relationTo: 'program-offer-selections', required: true, unique: true },
    { name: 'contractAcceptance', type: 'relationship', admin: { readOnly: true }, relationTo: 'contract-acceptances', required: true, unique: true },
    {
      name: 'selectedMethod',
      type: 'select',
      admin: { readOnly: true },
      label: 'Način plaćanja',
      options: [
        { label: 'Jednokratno', value: 'ONE_TIME' },
        { label: 'Na rate', value: 'INSTALLMENTS' },
        { label: 'Platiš kad zaradiš', value: 'PAY_WHEN_YOU_EARN' },
      ],
      required: true,
    },
    { name: 'currency', type: 'select', admin: { readOnly: true }, options: [{ label: 'USD', value: 'USD' }], required: true },
    { name: 'totalCents', type: 'number', admin: { readOnly: true }, label: 'Ukupno u centima', min: 0, required: true },
    { name: 'firstPaymentRequiredCents', type: 'number', admin: { readOnly: true }, label: 'Prva uplata u centima', min: 0, required: true },
    {
      name: 'obligations',
      type: 'json',
      admin: {
        components: { Field: './components/admin/PaymentObligationsField#PaymentObligationsField' },
        readOnly: true,
      },
      label: 'Nepromenljivi plan obaveza',
      required: true,
    },
    { name: 'paidCents', type: 'number', admin: { readOnly: true }, label: 'Plaćeno u centima', min: 0, required: true },
    { name: 'remainingCents', type: 'number', admin: { readOnly: true }, label: 'Preostalo u centima', min: 0, required: true },
    {
      name: 'firstPaymentStatus',
      type: 'select',
      admin: { readOnly: true },
      label: 'Status prve uplate',
      options: [
        { label: 'Čeka uplatu', value: 'PENDING' },
        { label: 'Potvrđena', value: 'CONFIRMED' },
        { label: 'Nije potrebna', value: 'NOT_REQUIRED' },
      ],
      required: true,
    },
    { name: 'firstPaymentConfirmedAt', type: 'date', admin: { readOnly: true }, label: 'Prva uplata potvrđena' },
    {
      name: 'status',
      type: 'select',
      admin: { readOnly: true },
      options: [
        { label: 'Aktivan plan', value: 'ACTIVE' },
        { label: 'U celosti plaćeno', value: 'PAID' },
      ],
      required: true,
    },
    { name: 'paymentRecording', type: 'ui', admin: { components: { Field: './components/admin/PaymentRecordingPanel#PaymentRecordingPanel' } } },
  ],
  labels: { plural: 'Planovi plaćanja', singular: 'Plan plaćanja' },
}
