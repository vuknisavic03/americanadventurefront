import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnOrder: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const deny = () => false
const immutable = { update: deny }

export const VisaPaymentOrders: CollectionConfig = {
  slug: 'visa-payment-orders',
  access: { create: deny, delete: deny, read: administratorOrOwnOrder, update: deny },
  admin: {
    defaultColumns: ['orderNumber', 'candidateAccount', 'amountMinor', 'currency', 'dueAt', 'status'],
    description: 'Verzionisani nalozi za uplatu troškova viziranja. Izdati podaci se ne menjaju; korekcija zahteva otkazivanje i novu verziju.',
    group: 'Viziranje',
    useAsTitle: 'orderNumber',
  },
  fields: [
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidat', relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'orderNumber', type: 'text', access: immutable, admin: { readOnly: true }, index: true, label: 'Broj naloga', required: true, unique: true },
    { name: 'orderVersion', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Verzija', min: 1, required: true },
    { name: 'statusVersion', type: 'number', admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, index: true, label: 'Status', options: [
      { label: 'Izdat - čeka uplatu', value: 'ISSUED' },
      { label: 'Plaćen', value: 'PAID' },
      { label: 'Otkazan', value: 'CANCELLED' },
    ], required: true },
    { name: 'amountMinor', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Iznos u najmanjoj jedinici valute', min: 1, required: true },
    { name: 'currency', type: 'select', access: immutable, admin: { readOnly: true }, label: 'Valuta', options: [{ label: 'RSD', value: 'RSD' }, { label: 'USD', value: 'USD' }], required: true },
    { name: 'beneficiaryName', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Primalac', maxLength: 200, required: true },
    { name: 'beneficiaryAddress', type: 'textarea', access: immutable, admin: { readOnly: true }, label: 'Adresa primaoca', maxLength: 300 },
    { name: 'bankAccount', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Račun primaoca', maxLength: 100, required: true },
    { name: 'paymentModel', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Model', maxLength: 20 },
    { name: 'paymentReference', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Poziv na broj', maxLength: 100, required: true },
    { name: 'paymentPurpose', type: 'textarea', access: immutable, admin: { readOnly: true }, label: 'Svrha uplate', maxLength: 500, required: true },
    { name: 'candidateInstructions', type: 'textarea', access: immutable, admin: { readOnly: true }, label: 'Uputstvo kandidatu', maxLength: 2_000, required: true },
    { name: 'dueAt', type: 'date', access: immutable, admin: { readOnly: true }, label: 'Rok za uplatu', required: true },
    { name: 'snapshotChecksum', type: 'text', access: immutable, admin: { hidden: true }, label: 'Kontrolni otisak', required: true },
    { name: 'issuedAt', type: 'date', access: immutable, admin: { readOnly: true }, label: 'Izdat', required: true },
    { name: 'issuedBy', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Izdao/la', relationTo: 'users', required: true },
    { name: 'paidAt', type: 'date', admin: { readOnly: true }, label: 'Uplata primljena' },
    { name: 'paymentRecordedBy', type: 'relationship', admin: { readOnly: true }, label: 'Uplatu evidentirao/la', relationTo: 'users' },
    { name: 'externalPaymentReference', type: 'text', admin: { readOnly: true }, label: 'Referenca izvoda / potvrde', maxLength: 160 },
    { name: 'paymentNote', type: 'textarea', admin: { readOnly: true }, label: 'Napomena o uplati', maxLength: 1_000 },
    { name: 'cancelledAt', type: 'date', admin: { readOnly: true }, label: 'Otkazan' },
    { name: 'cancelledBy', type: 'relationship', admin: { readOnly: true }, label: 'Otkazao/la', relationTo: 'users' },
    { name: 'cancellationReason', type: 'textarea', admin: { readOnly: true }, label: 'Razlog otkazivanja', maxLength: 1_000 },
    { name: 'idempotencyKey', type: 'text', access: { read: deny }, admin: { hidden: true }, index: true, required: true, unique: true },
  ],
  indexes: [
    { fields: ['candidateProcess', 'orderVersion'], unique: true },
    { fields: ['candidateAccount', 'status'] },
  ],
  labels: { plural: 'Nalozi za vizne troškove', singular: 'Nalog za vizne troškove' },
}
