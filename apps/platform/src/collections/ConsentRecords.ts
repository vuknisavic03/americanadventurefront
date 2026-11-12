import type { CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

export const ConsentRecords: CollectionConfig = {
  slug: 'consent-records',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: authenticated,
    update: denyAccess,
  },
  admin: {
    hidden: true,
    useAsTitle: 'consentType',
  },
  fields: [
    {
      name: 'preApplication',
      type: 'relationship',
      relationTo: 'pre-applications',
      required: true,
    },
    {
      name: 'consentType',
      type: 'select',
      options: [
        { label: 'Politika privatnosti', value: 'PRIVACY' },
        { label: 'Newsletter', value: 'NEWSLETTER' },
      ],
      required: true,
    },
    { name: 'accepted', type: 'checkbox', required: true },
    { name: 'textVersion', type: 'text', required: true },
    { name: 'consentText', type: 'textarea', required: true },
    { name: 'recordedAt', type: 'date', required: true },
    { name: 'sourcePage', type: 'text', required: true },
    { name: 'correlationId', type: 'text', index: true, required: true },
  ],
  labels: {
    plural: 'Evidencija saglasnosti',
    singular: 'Evidencija saglasnosti',
  },
}
