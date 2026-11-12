import type { CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

export const MessageDeliveries: CollectionConfig = {
  slug: 'message-deliveries',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: authenticated,
    update: denyAccess,
  },
  admin: {
    defaultColumns: ['category', 'status', 'recipientEmail', 'attemptCount', 'deliveredAt'],
    group: 'Automatizacija',
    useAsTitle: 'idempotencyKey',
  },
  fields: [
    {
      name: 'preApplication',
      type: 'relationship',
      relationTo: 'pre-applications',
      required: true,
    },
    { name: 'idempotencyKey', type: 'text', index: true, required: true, unique: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Paket informacija', value: 'MATERIAL_BUNDLE' },
        { label: 'Poziv za konsultacije', value: 'CONSULTATION_INVITATION' },
        { label: 'Aktivacija kandidatskog naloga', value: 'ACCOUNT_ACTIVATION' },
        { label: 'Radna ponuda', value: 'EMPLOYMENT_OFFER' },
        { label: 'Lista opcija poslova', value: 'JOB_SHORTLIST' },
        { label: 'Zahtev za avionsku kartu', value: 'FLIGHT_TICKET_REQUEST' },
        { label: 'Ponuda avionske karte', value: 'FLIGHT_TICKET_OFFER' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Na čekanju', value: 'PENDING' },
        { label: 'Slanje u toku', value: 'PROCESSING' },
        { label: 'Isporučeno provajderu', value: 'DELIVERED' },
        { label: 'Neuspešno', value: 'FAILED' },
      ],
      required: true,
    },
    { name: 'recipientEmail', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'templateKey', type: 'text', required: true },
    { name: 'templateVersion', type: 'text', required: true },
    {
      name: 'contentHash',
      type: 'text',
      admin: { description: 'SHA-256 otisak tačno renderovanog sadržaja.' },
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      options: [
        { label: 'Lokalno razvojno hvatanje', value: 'capture' },
        { label: 'Resend', value: 'resend' },
      ],
      required: true,
    },
    { name: 'providerMessageId', type: 'text' },
    { name: 'attemptCount', type: 'number', defaultValue: 0, min: 0, required: true },
    { name: 'lastAttemptAt', type: 'date' },
    { name: 'deliveredAt', type: 'date' },
    { name: 'nextRetryAt', type: 'date' },
    { name: 'lastErrorCode', type: 'text' },
  ],
  labels: {
    plural: 'Isporuke poruka',
    singular: 'Isporuka poruke',
  },
}
