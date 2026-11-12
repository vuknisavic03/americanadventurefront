import type { CollectionConfig } from 'payload'

const administrator = ({ req }: { req: { user?: { collection?: string } | null } }) =>
  req.user?.collection === 'users'
const deny = () => false
const immutable = { update: deny }

export const InterviewPreparationAppointments: CollectionConfig = {
  slug: 'interview-preparation-appointments',
  access: {
    create: deny,
    delete: deny,
    read: administrator,
    update: deny,
  },
  admin: {
    hidden: true,
    defaultColumns: ['candidateAccount', 'purpose', 'attemptNumber', 'status', 'startsAt', 'deliveryMode'],
    description: 'Termini pripreme i orijentacije zakazuju se i zaključuju iz procesa kandidata; kolekcija čuva kontrolisanu istoriju.',
    group: 'Kandidatski portal',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'purpose', type: 'select', access: immutable, admin: { readOnly: true }, defaultValue: 'JOB_INTERVIEW', label: 'Vrsta pripreme', options: [
      { label: 'Razgovor za posao', value: 'JOB_INTERVIEW' },
      { label: 'Razgovor u ambasadi', value: 'EMBASSY' },
      { label: 'Orijentacioni sastanak pred putovanje', value: 'ORIENTATION' },
    ], required: true },
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidat', relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'attemptNumber', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Redni broj termina', min: 1, required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, label: 'Status', options: [
      { label: 'Zakazan', value: 'SCHEDULED' },
      { label: 'Održan — kandidat prisustvovao', value: 'COMPLETED' },
      { label: 'Kandidat se nije pojavio', value: 'NO_SHOW' },
      { label: 'Otkazan', value: 'CANCELLED' },
    ], required: true },
    { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true }, label: 'Početak', required: true },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true }, label: 'Kraj' },
    { name: 'timeZone', type: 'text', admin: { readOnly: true }, label: 'Vremenska zona', required: true },
    { name: 'deliveryMode', type: 'select', admin: { readOnly: true }, label: 'Način održavanja', options: [
      { label: 'U prostorijama agencije', value: 'IN_PERSON' },
      { label: 'Onlajn', value: 'ONLINE' },
    ], required: true },
    { name: 'locationDetails', type: 'textarea', admin: { readOnly: true }, label: 'Lokacija ili link', maxLength: 500, required: true },
    { name: 'candidateInstructions', type: 'textarea', admin: { readOnly: true }, label: 'Instrukcije za kandidata', maxLength: 1_000 },
    { name: 'internalNotes', type: 'textarea', admin: { readOnly: true }, label: 'Interne napomene', maxLength: 2_000 },
    { name: 'version', type: 'number', admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'scheduledAt', type: 'date', admin: { readOnly: true }, label: 'Zakazano', required: true },
    { name: 'scheduledBy', type: 'relationship', admin: { readOnly: true }, label: 'Zakazao/la', relationTo: 'users', required: true },
    { name: 'outcomeRecordedAt', type: 'date', admin: { readOnly: true }, label: 'Ishod evidentiran' },
    { name: 'outcomeRecordedBy', type: 'relationship', admin: { readOnly: true }, label: 'Ishod evidentirao/la', relationTo: 'users' },
  ],
  indexes: [
    { fields: ['candidateProcess', 'status'] },
    { fields: ['candidateAccount', 'startsAt'] },
    { fields: ['candidateProcess', 'purpose', 'attemptNumber'], unique: true },
  ],
  labels: {
    plural: 'Kandidatski sastanci',
    singular: 'Kandidatski sastanak',
  },
}
