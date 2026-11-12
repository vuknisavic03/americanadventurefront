import type { Access, CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const administrator = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'users'

const administratorOrOwnCommunication: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

export const CommunicationLogs: CollectionConfig = {
  slug: 'communication-logs',
  access: {
    create: administrator,
    delete: denyAccess,
    read: administratorOrOwnCommunication,
    update: administrator,
  },
  admin: {
    defaultColumns: ['channel', 'recipient', 'templateKey', 'status', 'sentAt'],
    group: 'Komunikacija',
    useAsTitle: 'recipient',
  },
  fields: [
    {
      name: 'channel',
      type: 'select',
      options: [
        { label: 'Email', value: 'EMAIL' },
        { label: 'SMS', value: 'SMS' },
        { label: 'Obaveštenje na portalu', value: 'IN_APP' },
      ],
      required: true,
    },
    {
      name: 'candidateProcess',
      type: 'relationship',
      relationTo: 'candidate-processes',
    },
    {
      name: 'candidateAccount',
      type: 'relationship',
      relationTo: 'candidate-accounts',
    },
    {
      name: 'recipient',
      type: 'text',
      required: true,
    },
    {
      name: 'recipientName',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'templateKey',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'DELIVERED',
      options: [
        { label: 'Isporučeno', value: 'DELIVERED' },
        { label: 'Neuspešno', value: 'FAILED' },
        { label: 'Na čekanju', value: 'PENDING' },
      ],
      required: true,
    },
    {
      name: 'provider',
      type: 'text',
    },
    {
      name: 'providerMessageId',
      type: 'text',
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      index: true,
    },
    {
      name: 'actionRequiredTitle',
      type: 'text',
    },
    {
      name: 'actionRequiredDueAt',
      type: 'date',
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'sentAt',
      type: 'date',
      required: true,
    },
    {
      name: 'errorMessage',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  labels: {
    plural: 'Evidencija komunikacije',
    singular: 'Zapis komunikacije',
  },
}
