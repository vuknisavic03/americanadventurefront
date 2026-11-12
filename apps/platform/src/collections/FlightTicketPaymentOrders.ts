import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnOrder: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const deny = () => false
const immutable = { update: deny }

export const FlightTicketPaymentOrders: CollectionConfig = {
  slug: 'flight-ticket-payment-orders',
  access: { create: deny, delete: deny, read: administratorOrOwnOrder, update: deny },
  admin: {
    defaultColumns: ['orderNumber', 'candidateAccount', 'settlementAmountMinor', 'dueAt', 'status'],
    description: 'Verzionisani nalozi za uplatu prihvaćene avionske karte sa zaključanim kursom i podacima iz ponude.',
    group: 'Putovanje',
    useAsTitle: 'orderNumber',
  },
  fields: [
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'flightTicketOffer', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'flight-ticket-offers', required: true },
    { name: 'flightTicketOfferResponse', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'flight-ticket-offer-responses', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'orderNumber', type: 'text', access: immutable, admin: { readOnly: true }, index: true, required: true, unique: true },
    { name: 'orderVersion', type: 'number', access: immutable, admin: { readOnly: true }, min: 1, required: true },
    { name: 'statusVersion', type: 'number', admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, index: true, options: [
      { label: 'Izdat - čeka uplatu', value: 'ISSUED' }, { label: 'Plaćen', value: 'PAID' }, { label: 'Otkazan', value: 'CANCELLED' },
    ], required: true },
    { name: 'selectedOptionCode', type: 'text', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'airlineName', type: 'text', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'outboundRoute', type: 'text', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'outboundDepartureAt', type: 'date', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'returnRoute', type: 'text', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'returnDepartureAt', type: 'date', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'originalAmountMinor', type: 'number', access: immutable, admin: { readOnly: true }, min: 1, required: true },
    { name: 'originalCurrency', type: 'select', access: immutable, admin: { readOnly: true }, options: ['EUR', 'RSD', 'USD'], required: true },
    { name: 'settlementAmountMinor', type: 'number', access: immutable, admin: { readOnly: true }, min: 1, required: true },
    { name: 'settlementCurrency', type: 'select', access: immutable, admin: { readOnly: true }, options: ['RSD'], required: true },
    { name: 'exchangeRateScaled', type: 'number', access: immutable, admin: { readOnly: true, description: 'RSD za jednu jedinicu strane valute, pomnoženo sa 1.000.000.' }, min: 1, required: true },
    { name: 'exchangeRateDate', type: 'date', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'exchangeRateSource', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 200, required: true },
    { name: 'exchangeRateReference', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 500 },
    { name: 'beneficiaryName', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 200, required: true },
    { name: 'beneficiaryAddress', type: 'textarea', access: immutable, admin: { readOnly: true }, maxLength: 300, required: true },
    { name: 'beneficiaryTaxId', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 32 },
    { name: 'beneficiaryRegistrationNumber', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 32 },
    { name: 'bankAccount', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 100, required: true },
    { name: 'paymentModel', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 20 },
    { name: 'paymentReference', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 100, required: true },
    { name: 'paymentPurpose', type: 'textarea', access: immutable, admin: { readOnly: true }, maxLength: 500, required: true },
    { name: 'candidateInstructions', type: 'textarea', access: immutable, admin: { readOnly: true }, maxLength: 2_000, required: true },
    { name: 'includeAdvanceInvoice', type: 'checkbox', access: immutable, admin: { readOnly: true }, defaultValue: false },
    { name: 'advanceInvoiceNumber', type: 'text', access: immutable, admin: { readOnly: true }, maxLength: 100 },
    { name: 'candidateNameSnapshot', type: 'text', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'candidateAddressSnapshot', type: 'textarea', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'dueAt', type: 'date', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'snapshotChecksum', type: 'text', access: immutable, admin: { hidden: true }, required: true },
    { name: 'pdfSha256', type: 'text', access: immutable, admin: { hidden: true }, required: true },
    { name: 'issuedAt', type: 'date', access: immutable, admin: { readOnly: true }, required: true },
    { name: 'issuedBy', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'paidAt', type: 'date', admin: { readOnly: true } },
    { name: 'paymentRecordedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users' },
    { name: 'externalPaymentReference', type: 'text', admin: { readOnly: true }, maxLength: 160 },
    { name: 'paymentNote', type: 'textarea', admin: { readOnly: true }, maxLength: 1_000 },
    { name: 'cancelledAt', type: 'date', admin: { readOnly: true } },
    { name: 'cancelledBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users' },
    { name: 'cancellationReason', type: 'textarea', admin: { readOnly: true }, maxLength: 1_000 },
    { name: 'idempotencyKey', type: 'text', access: { read: deny }, admin: { hidden: true }, index: true, required: true, unique: true },
  ],
  indexes: [
    { fields: ['candidateProcess', 'orderVersion'], unique: true },
    { fields: ['candidateAccount', 'status'] },
  ],
  labels: { plural: 'Nalozi za avionske karte', singular: 'Nalog za avionsku kartu' },
}
