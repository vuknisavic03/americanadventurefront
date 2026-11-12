import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnInvoice: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const deny = () => false

export const CandidateInvoices: CollectionConfig = {
  slug: 'candidate-invoices',
  access: {
    create: deny,
    delete: deny,
    read: administratorOrOwnInvoice,
    update: deny,
  },
  admin: {
    defaultColumns: ['invoiceNumber', 'buyerName', 'settlementAmountRsdCents', 'issueDate', 'candidateAccount'],
    description: 'Baza izdatih faktura kandidatima i evidencija za KIR knjigu.',
    group: 'Finansije',
    useAsTitle: 'invoiceNumber',
  },
  fields: [
    { name: 'invoiceNumber', type: 'text', admin: { readOnly: true }, index: true, required: true, unique: true },
    { name: 'sequenceNumber', type: 'number', admin: { readOnly: true }, index: true, required: true },
    { name: 'year', type: 'number', admin: { readOnly: true }, index: true, required: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-processes', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'candidatePayment', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-payments', required: true, unique: true },
    { name: 'issuedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'buyerName', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'buyerAddress', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'buyerTaxId', type: 'text', admin: { readOnly: true } },
    { name: 'originalAmountCents', type: 'number', admin: { readOnly: true }, required: true },
    {
      name: 'originalCurrency',
      type: 'select',
      admin: { readOnly: true },
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'RSD', value: 'RSD' },
      ],
      required: true,
    },
    { name: 'exchangeRateScaled', type: 'number', admin: { readOnly: true }, required: true },
    { name: 'exchangeRateDate', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'exchangeRateSource', type: 'text', admin: { readOnly: true } },
    { name: 'settlementAmountRsdCents', type: 'number', admin: { readOnly: true }, required: true },
    { name: 'amountInWords', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'issueDate', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'accountingDate', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'note', type: 'textarea', admin: { readOnly: true } },
    { name: 'pdfSha256', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'pdfBase64', type: 'textarea', access: { read: deny }, admin: { hidden: true } },
  ],
  labels: { plural: 'Fakture i računi (KIR)', singular: 'Faktura' },
}
