import type { CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) => req.user?.collection === 'users'
const immutable = { update: () => false }

export const FlightTicketRequests: CollectionConfig = {
  slug: 'flight-ticket-requests',
  access: { create: denyAccess, delete: denyAccess, read: administrator, update: denyAccess },
  admin: {
    defaultColumns: ['candidateAccount', 'departureDate', 'usaDestination', 'returnDate', 'notificationStatus'],
    description: 'Zahtevi kandidata za pripremu ponude avionske karte. Kandidat podatke menja isključivo kroz svoj portal.',
    group: 'Putovanje',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-processes', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true, unique: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'departureDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, readOnly: true }, label: 'Datum odlaska', required: true },
    { name: 'usaDestination', type: 'text', admin: { readOnly: true }, label: 'Destinacija u SAD', maxLength: 200, required: true },
    { name: 'returnDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, readOnly: true }, label: 'Datum povratka', required: true },
    { name: 'returnDestination', type: 'text', admin: { readOnly: true }, label: 'Povratna destinacija', maxLength: 200, required: true },
    { name: 'version', type: 'number', admin: { readOnly: true }, defaultValue: 1, min: 1, required: true },
    { name: 'submittedAt', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'notificationStatus', type: 'select', admin: { readOnly: true }, options: [
      { label: 'Čeka slanje', value: 'PENDING' },
      { label: 'Obaveštenje isporučeno', value: 'DELIVERED' },
      { label: 'Slanje nije uspelo', value: 'FAILED' },
    ], required: true },
    { name: 'notificationDeliveredAt', type: 'date', admin: { readOnly: true }, label: 'Obaveštenje isporučeno' },
    { name: 'messageDelivery', type: 'relationship', admin: { readOnly: true }, relationTo: 'message-deliveries' },
  ],
  indexes: [{ fields: ['notificationStatus', 'submittedAt'] }],
  labels: { plural: 'Zahtevi za avionsku kartu', singular: 'Zahtev za avionsku kartu' },
}
