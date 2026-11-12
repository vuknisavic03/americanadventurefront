import type { CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

export const RequestRateLimits: CollectionConfig = {
  slug: 'request-rate-limits',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: denyAccess,
    update: denyAccess,
  },
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [
    { name: 'scope', type: 'text', required: true },
    { name: 'keyHash', type: 'text', maxLength: 64, required: true },
    { name: 'attempts', type: 'number', min: 1, required: true },
    { name: 'windowStartedAt', type: 'date', required: true },
    { name: 'expiresAt', type: 'date', index: true, required: true },
    { name: 'updatedAt', type: 'date', required: true },
  ],
  graphQL: false,
  indexes: [{ fields: ['scope', 'keyHash'], unique: true }],
  lockDocuments: false,
  timestamps: false,
}
