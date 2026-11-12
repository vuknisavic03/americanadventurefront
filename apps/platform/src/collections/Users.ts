import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/collectionAccess.ts'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => req.user?.collection === 'users',
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    unlock: authenticated,
    update: authenticated,
  },
  admin: {
    group: 'Administration',
    useAsTitle: 'email',
  },
  auth: {
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    tokenExpiration: 2 * 60 * 60,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: 'Display name',
      required: true,
    },
  ],
}

