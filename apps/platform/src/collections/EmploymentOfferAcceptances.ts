import type { Access, CollectionConfig } from 'payload'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false

export const EmploymentOfferAcceptances: CollectionConfig = {
  slug: 'employment-offer-acceptances',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['acceptanceReference', 'candidateAccount', 'employmentOffer', 'acceptedAt'],
    description: 'Nepromenljivi dokaz da je kandidat prihvatio tačno određenu verziju radne ponude.',
    group: 'Posao i intervju',
    useAsTitle: 'acceptanceReference',
  },
  fields: [
    { name: 'employmentOffer', type: 'relationship', admin: { readOnly: true }, label: 'Radna ponuda', relationTo: 'employment-offers', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'acceptanceReference', type: 'text', admin: { readOnly: true }, index: true, label: 'Referenca prihvatanja', required: true, unique: true },
    { name: 'acceptedAt', type: 'date', admin: { readOnly: true }, label: 'Prihvaćena', required: true },
    { name: 'statementVersion', type: 'text', admin: { readOnly: true }, label: 'Verzija izjave', required: true },
    { name: 'statementText', type: 'textarea', admin: { readOnly: true }, label: 'Prihvaćena izjava', maxLength: 1_000, required: true },
    { name: 'statementChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak izjave', required: true },
    { name: 'offerSnapshotChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak prihvaćene ponude', required: true },
    { name: 'evidenceChecksum', type: 'text', admin: { readOnly: true }, label: 'Otisak dokaza', required: true },
  ],
  labels: { plural: 'Prihvatanja radnih ponuda', singular: 'Prihvatanje radne ponude' },
}
