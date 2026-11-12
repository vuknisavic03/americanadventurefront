import type { Access, CollectionConfig } from 'payload'

const isAdministrator: Access = ({ req }) => req.user?.collection === 'users'

export const CandidateInvitations: CollectionConfig = {
  slug: 'candidate-invitations',
  access: {
    create: isAdministrator,
    delete: isAdministrator,
    read: isAdministrator,
    update: isAdministrator,
  },
  admin: {
    defaultColumns: ['code', 'email', 'candidateName', 'packageName', 'finalPrice', 'status', 'createdAt'],
    description: 'Pozivnice i verifikacioni kodovi za registraciju kandidata. Svaki kod je striktno vezan za definisanu email adresu.',
    group: 'Kandidati i prijave',
    useAsTitle: 'code',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      index: true,
      label: 'Verifikacioni kod',
      required: true,
      unique: true,
    },
    {
      name: 'email',
      type: 'email',
      index: true,
      label: 'Email adresa kandidata',
      required: true,
    },
    {
      name: 'candidateName',
      type: 'text',
      label: 'Ime i prezime kandidata',
    },
    {
      name: 'packageId',
      type: 'select',
      defaultValue: 'swt-full',
      label: 'Paket programa',
      options: [
        { label: 'Work & Travel USA — Full Placement', value: 'swt-full' },
        { label: 'Work & Travel USA — Self Placement', value: 'swt-self' },
        { label: 'Lifeguards SWT Summer 2026', value: 'swt-lifeguard' },
        { label: 'Camp Counselor USA 2026', value: 'camp-usa' },
        { label: 'Drugi program / Prilagođeno', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'packageName',
      type: 'text',
      defaultValue: 'Work & Travel USA — Full Placement',
      label: 'Naziv paketa',
      required: true,
    },
    {
      name: 'basePrice',
      type: 'number',
      defaultValue: 1850,
      label: 'Osnovna cena (€)',
      min: 0,
      required: true,
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
      label: 'Odobreni popust (€)',
      min: 0,
    },
    {
      name: 'discountNote',
      type: 'text',
      label: 'Razlog / napomena popusta',
    },
    {
      name: 'finalPrice',
      type: 'number',
      defaultValue: 1850,
      label: 'Konačna cena (€)',
      min: 0,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      label: 'Status pozivnice',
      options: [
        { label: 'Čeka registraciju', value: 'pending' },
        { label: 'Aktiviran nalog', value: 'registered' },
      ],
      required: true,
    },
    {
      name: 'registeredAt',
      type: 'date',
      label: 'Datum registracije',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) {
          if (data.code) data.code = String(data.code).trim().toUpperCase()
          if (data.email) data.email = String(data.email).trim().toLowerCase()
          const base = Number(data.basePrice) || 0
          const disc = Number(data.discount) || 0
          data.finalPrice = Math.max(0, base - disc)
        }
        return data
      },
    ],
  },
  labels: {
    plural: 'Pozivnice i verifikacioni kodovi',
    singular: 'Pozivnica kandidatu',
  },
}
