import type { CollectionConfig } from 'payload'

import { authenticated, denyAccess } from '../access/collectionAccess.ts'

export const OutboxEvents: CollectionConfig = {
  slug: 'outbox-events',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: authenticated,
    update: denyAccess,
  },
  admin: {
    hidden: true,
    useAsTitle: 'eventKey',
  },
  fields: [
    { name: 'eventKey', type: 'text', index: true, required: true, unique: true },
    {
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Potrebno slanje materijala', value: 'MATERIAL_DELIVERY_REQUESTED' },
        {
          label: 'Potreban poziv za konsultacije',
          value: 'CONSULTATION_INVITATION_REQUESTED',
        },
        {
          label: 'Potrebna aktivacija kandidatskog naloga',
          value: 'CANDIDATE_ACCOUNT_ACTIVATION_REQUESTED',
        },
        {
          label: 'Potrebno obaveštenje o radnoj ponudi',
          value: 'EMPLOYMENT_OFFER_NOTIFICATION_REQUESTED',
        },
        {
          label: 'Potrebno obaveštenje o listi poslova',
          value: 'JOB_SHORTLIST_NOTIFICATION_REQUESTED',
        },
        {
          label: 'Potrebno obaveštenje o zahtevu za avionsku kartu',
          value: 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED',
        },
        {
          label: 'Potrebno obaveštenje o ponudi avionske karte',
          value: 'FLIGHT_TICKET_OFFER_NOTIFICATION_REQUESTED',
        },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Na čekanju', value: 'PENDING' },
        { label: 'Obrađuje se', value: 'PROCESSING' },
        { label: 'Završeno', value: 'COMPLETED' },
        { label: 'Neuspešno', value: 'FAILED' },
      ],
      required: true,
    },
    {
      name: 'aggregateType',
      type: 'select',
      options: [{ label: 'Prijava kandidata', value: 'PRE_APPLICATION' }],
      required: true,
    },
    { name: 'aggregateId', type: 'text', index: true, required: true },
    { name: 'occurredAt', type: 'date', required: true },
    { name: 'availableAt', type: 'date', index: true, required: true },
    { name: 'attemptCount', type: 'number', defaultValue: 0, min: 0, required: true },
    { name: 'completedAt', type: 'date' },
    { name: 'lastErrorCode', type: 'text' },
    { name: 'payload', type: 'json', required: true },
  ],
  labels: {
    plural: 'Sistemski događaji na čekanju',
    singular: 'Sistemski događaj na čekanju',
  },
}
