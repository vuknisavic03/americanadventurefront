import type { CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

export const ContactAttempts: CollectionConfig = {
  slug: 'contact-attempts',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: authenticated,
    update: denyAccess,
  },
  admin: {
    hidden: true,
    useAsTitle: 'correlationId',
  },
  fields: [
    {
      name: 'preApplication',
      type: 'relationship',
      relationTo: 'pre-applications',
      required: true,
    },
    {
      name: 'channel',
      type: 'select',
      options: [{ label: 'Telefon', value: 'PHONE' }],
      required: true,
    },
    { name: 'attemptedAt', type: 'date', index: true, required: true },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'outcome',
      type: 'select',
      options: [
        { label: 'Bez odgovora', value: 'NO_ANSWER' },
        { label: 'Razgovor obavljen', value: 'REACHED' },
        { label: 'Tražen ponovni poziv', value: 'CALLBACK_REQUESTED' },
        { label: 'Neispravan kontakt', value: 'INVALID_CONTACT' },
      ],
      required: true,
    },
    { name: 'nextContactAt', type: 'date' },
    { name: 'note', type: 'textarea', maxLength: 2_000 },
    { name: 'correlationId', type: 'text', index: true, required: true },
  ],
  labels: {
    plural: 'Pokušaji kontakta',
    singular: 'Pokušaj kontakta',
  },
}

