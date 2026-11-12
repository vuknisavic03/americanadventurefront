import type { Access, CollectionConfig } from 'payload'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false

export const FlightTicketOfferResponses: CollectionConfig = {
  slug: 'flight-ticket-offer-responses',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['responseReference', 'candidateAccount', 'flightTicketOffer', 'action', 'respondedAt'],
    description: 'Nepromenljivi dokaz odgovora kandidata na tačno određenu verziju ponude.',
    group: 'Putovanje',
    useAsTitle: 'responseReference',
  },
  fields: [
    { name: 'flightTicketOffer', type: 'relationship', admin: { readOnly: true }, label: 'Ponuda', relationTo: 'flight-ticket-offers', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'responseReference', type: 'text', admin: { readOnly: true }, index: true, label: 'Referenca odgovora', required: true, unique: true },
    { name: 'action', type: 'select', admin: { readOnly: true }, label: 'Odgovor', options: [{ label: 'Prihvaćena opcija', value: 'ACCEPT' }, { label: 'Ponuda odbijena', value: 'REJECT' }], required: true },
    { name: 'selectedOptionCode', type: 'text', admin: { readOnly: true }, label: 'Izabrana opcija' },
    { name: 'rejectionReason', type: 'textarea', admin: { readOnly: true }, label: 'Razlog odbijanja', maxLength: 500 },
    { name: 'respondedAt', type: 'date', admin: { readOnly: true }, label: 'Odgovoreno', required: true },
    { name: 'statementVersion', type: 'text', admin: { readOnly: true }, label: 'Verzija izjave', required: true },
    { name: 'statementText', type: 'textarea', admin: { readOnly: true }, label: 'Potvrđena izjava', maxLength: 1_000, required: true },
    { name: 'statementChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak izjave', required: true },
    { name: 'offerSnapshotChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak ponude', required: true },
    { name: 'evidenceChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak dokaza', required: true },
  ],
  labels: { plural: 'Odgovori na ponude avionskih karata', singular: 'Odgovor na ponudu avionske karte' },
}
