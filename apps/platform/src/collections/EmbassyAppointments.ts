import type { CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const immutable = { update: () => false }
const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) => req.user?.collection === 'users'

export const EmbassyAppointments: CollectionConfig = {
  slug: 'embassy-appointments',
  access: { create: denyAccess, delete: denyAccess, read: administrator, update: denyAccess },
  admin: {
    hidden: true,
    defaultColumns: ['candidateAccount', 'status', 'appointmentAt', 'reminderAt', 'version'],
    description: 'Termin unosi kandidat u portalu. Svaka izmena se beleži, a zastareli podsetnici se automatski preskaču.',
    group: 'Viza',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-processes', required: true, unique: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true, unique: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, options: [{ label: 'Zakazan', value: 'SCHEDULED' }, { label: 'Otkazan', value: 'CANCELLED' }], required: true },
    { name: 'appointmentDate', type: 'text', admin: { readOnly: true }, label: 'Datum u Beogradu', required: true },
    { name: 'appointmentTime', type: 'text', admin: { readOnly: true }, label: 'Vreme u Beogradu', required: true },
    { name: 'appointmentAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true }, index: true, label: 'Termin', required: true },
    { name: 'timeZone', type: 'text', admin: { readOnly: true }, defaultValue: 'Europe/Belgrade', required: true },
    { name: 'reminderAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true }, index: true, label: 'Podsetnik zakazan za', required: true },
    { name: 'version', type: 'number', admin: { readOnly: true }, defaultValue: 1, min: 1, required: true },
    { name: 'scheduledAt', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'cancelledAt', type: 'date', admin: { readOnly: true } },
  ],
  indexes: [{ fields: ['status', 'reminderAt'] }],
  labels: { plural: 'Termini u ambasadi', singular: 'Termin u ambasadi' },
}
