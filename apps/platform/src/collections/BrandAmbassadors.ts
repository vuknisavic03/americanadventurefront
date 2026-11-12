import type { Access, CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

const authenticatedUserOrCandidate: Access = ({ req }) => {
  return req.user?.collection === 'users' || req.user?.collection === 'candidate-accounts'
}

export const BrandAmbassadors: CollectionConfig = {
  slug: 'brand-ambassadors',
  access: {
    create: authenticated,
    delete: denyAccess,
    read: authenticatedUserOrCandidate,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['referralCode', 'fullName', 'season', 'defaultDiscountCents', 'rewardPerReferralCents', 'status'],
    description: 'Evidencija brend ambasadora i njihovih promotivnih kodova (FR-032).',
    group: 'Finansije',
    useAsTitle: 'referralCode',
  },
  fields: [
    {
      name: 'referralCode',
      type: 'text',
      index: true,
      label: 'Referral kod',
      required: true,
      unique: true,
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Ime i prezime ambasadora',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email adresa',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Broj telefona',
    },
    {
      name: 'season',
      type: 'text',
      defaultValue: '2026',
      label: 'Sezona',
      required: true,
    },
    {
      name: 'defaultDiscountCents',
      type: 'number',
      defaultValue: 5000,
      label: 'Popust za kandidata (centi)',
      min: 0,
      required: true,
    },
    {
      name: 'rewardPerReferralCents',
      type: 'number',
      defaultValue: 2500,
      label: 'Nagrada ambasadoru po prijavi (centi)',
      min: 0,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ACTIVE',
      label: 'Status',
      options: [
        { label: 'Aktivan', value: 'ACTIVE' },
        { label: 'Neaktivan', value: 'INACTIVE' },
      ],
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Interne napomene',
    },
  ],
  labels: { plural: 'Brend ambasadori', singular: 'Brend ambasador' },
}
