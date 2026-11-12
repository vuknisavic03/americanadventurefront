import type { CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) => req.user?.collection === 'users'

export const EmbassyReminderDeliveries: CollectionConfig = {
  slug: 'embassy-reminder-deliveries',
  access: { create: denyAccess, delete: denyAccess, read: administrator, update: denyAccess },
  admin: {
    hidden: true,
    defaultColumns: ['embassyAppointment', 'appointmentVersion', 'channel', 'status', 'deliveredAt'],
    description: 'Kontrolisani trag pokušaja automatskog slanja podsetnika za termin u ambasadi.',
    group: 'Automatizacija',
    useAsTitle: 'idempotencyKey',
  },
  fields: [
    { name: 'embassyAppointment', type: 'relationship', relationTo: 'embassy-appointments', required: true },
    { name: 'preApplication', type: 'relationship', relationTo: 'pre-applications', required: true },
    { name: 'appointmentVersion', type: 'number', min: 1, required: true },
    { name: 'idempotencyKey', type: 'text', index: true, required: true, unique: true },
    { name: 'channel', type: 'select', options: [{ label: 'Email', value: 'EMAIL' }, { label: 'SMS', value: 'SMS' }], required: true },
    { name: 'status', type: 'select', options: [{ label: 'Slanje u toku', value: 'PROCESSING' }, { label: 'Isporučeno provajderu', value: 'DELIVERED' }, { label: 'Neuspešno', value: 'FAILED' }, { label: 'Preskočeno kao zastarelo', value: 'SKIPPED' }], required: true },
    { name: 'recipient', type: 'text', required: true },
    { name: 'subject', type: 'text' },
    { name: 'templateKey', type: 'text', required: true },
    { name: 'templateVersion', type: 'text', required: true },
    { name: 'contentHash', type: 'text', required: true },
    { name: 'provider', type: 'select', options: [{ label: 'Lokalno razvojno hvatanje', value: 'capture' }, { label: 'Resend', value: 'resend' }, { label: 'SMS webhook', value: 'webhook' }], required: true },
    { name: 'providerMessageId', type: 'text' },
    { name: 'attemptCount', type: 'number', defaultValue: 1, min: 1, required: true },
    { name: 'lastAttemptAt', type: 'date', required: true },
    { name: 'deliveredAt', type: 'date' },
    { name: 'lastErrorCode', type: 'text' },
  ],
  indexes: [{ fields: ['embassyAppointment', 'appointmentVersion', 'channel'], unique: true }],
  labels: { plural: 'Isporuke ambasadnih podsetnika', singular: 'Isporuka ambasadnog podsetnika' },
}
