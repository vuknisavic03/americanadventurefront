import type { Access, CollectionConfig } from 'payload'

const administratorOrOwnSelection: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const denyAccess = () => false
const immutable = { update: denyAccess }

export const ProgramOfferSelections: CollectionConfig = {
  slug: 'program-offer-selections',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: administratorOrOwnSelection,
    update: denyAccess,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'selectedMethod', 'totalCents', 'acceptedAt'],
    description: 'Nepromenljiv zapis načina plaćanja koji je kandidat izabrao.',
    group: 'Kandidatski portal',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'offer', type: 'relationship', access: immutable, label: 'Ponuda', relationTo: 'program-offers', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', access: immutable, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true, unique: true },
    {
      name: 'selectedMethod',
      type: 'select',
      access: immutable,
      label: 'Izabrani način',
      options: [
        { label: 'Jednokratno', value: 'ONE_TIME' },
        { label: 'Na rate', value: 'INSTALLMENTS' },
        { label: 'Platiš kad zaradiš', value: 'PAY_WHEN_YOU_EARN' },
      ],
      required: true,
    },
    { name: 'currency', type: 'select', access: immutable, options: [{ label: 'USD', value: 'USD' }], required: true },
    { name: 'basePriceCents', type: 'number', access: immutable, label: 'Osnovna cena u centima', min: 1, required: true },
    { name: 'discountCents', type: 'number', access: immutable, label: 'Popust u centima', min: 0, required: true },
    { name: 'totalCents', type: 'number', access: immutable, label: 'Konačan iznos u centima', min: 0, required: true },
    { name: 'installmentSchedule', type: 'json', access: immutable, label: 'Sačuvana dinamika rata' },
    { name: 'payWhenYouEarnSnapshot', type: 'json', access: immutable, label: 'Sačuvani PKZ uslovi' },
    { name: 'offerSnapshot', type: 'json', access: immutable, label: 'Sačuvana verzija ponude', required: true },
    { name: 'acceptedAt', type: 'date', access: immutable, label: 'Izabrano', required: true },
  ],
  labels: { plural: 'Izbori načina plaćanja', singular: 'Izbor načina plaćanja' },
}
