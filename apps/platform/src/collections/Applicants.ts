import type { CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

export const Applicants: CollectionConfig = {
  slug: 'applicants',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['fullName', 'email', 'phone', 'updatedAt'],
    group: 'Kandidatski portal',
    useAsTitle: 'fullName',
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      admin: { readOnly: true },
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: { date: { displayFormat: 'dd.MM.yyyy', pickerAppearance: 'dayOnly' } },
      required: true,
    },
    {
      name: 'residentialAddress',
      type: 'textarea',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'emailNormalized',
      type: 'text',
      admin: { hidden: true },
      index: true,
      required: true,
    },
    {
      name: 'phoneNormalized',
      type: 'text',
      admin: { hidden: true },
      index: true,
      required: true,
    },
    {
      name: 'firstNameNormalized',
      type: 'text',
      admin: { hidden: true },
      required: true,
    },
    {
      name: 'lastNameNormalized',
      type: 'text',
      admin: { hidden: true },
      required: true,
    },
  ],
  labels: {
    plural: 'Kandidati',
    singular: 'Kandidat',
  },
}
