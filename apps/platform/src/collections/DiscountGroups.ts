import type { Access, CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

const authenticatedUserOrCandidate: Access = ({ req }) => {
  return req.user?.collection === 'users' || req.user?.collection === 'candidate-accounts'
}

export const DiscountGroups: CollectionConfig = {
  slug: 'discount-groups',
  access: {
    create: authenticated,
    delete: denyAccess,
    read: authenticatedUserOrCandidate,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['groupCode', 'name', 'discountPerMemberCents', 'minMembers', 'status'],
    description: 'Evidencija grupa za grupne popuste (FR-031).',
    group: 'Finansije',
    useAsTitle: 'groupCode',
  },
  fields: [
    {
      name: 'groupCode',
      type: 'text',
      index: true,
      label: 'Kod grupe',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Naziv grupe',
      required: true,
    },
    {
      name: 'discountPerMemberCents',
      type: 'number',
      defaultValue: 5000,
      label: 'Iznos popusta po članu (centi)',
      min: 0,
      required: true,
    },
    {
      name: 'minMembers',
      type: 'number',
      defaultValue: 3,
      label: 'Minimalan broj članova',
      min: 2,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ACTIVE',
      label: 'Status',
      options: [
        { label: 'Aktivna', value: 'ACTIVE' },
        { label: 'Zatvorena', value: 'CLOSED' },
      ],
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Interne napomene',
    },
  ],
  labels: { plural: 'Grupe za popust', singular: 'Grupa za popust' },
}
