import type { Access, CollectionConfig } from 'payload'

import { jobCategoryOptions } from '../modules/job-options/rules.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false

export const CandidateJobOptions: CollectionConfig = {
  slug: 'candidate-job-options',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: { hidden: true, defaultColumns: ['candidateAccount', 'employerName', 'jobTitle', 'workCity', 'workState', 'status'], group: 'Posao i intervju', useAsTitle: 'jobTitle' },
  fields: [
    { name: 'shortlist', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-job-shortlists', required: true },
    { name: 'jobOpening', type: 'relationship', admin: { readOnly: true }, relationTo: 'job-openings', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, relationTo: 'candidate-accounts', required: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, relationTo: 'pre-applications', required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, options: [
      { label: 'Dostupna kandidatu', value: 'AVAILABLE' },
      { label: 'Kandidat je zainteresovan', value: 'INTERESTED' },
      { label: 'Trenutno nije zainteresovan', value: 'NOT_INTERESTED' },
      { label: 'Poslodavac je potvrdio', value: 'EMPLOYER_CONFIRMED' },
      { label: 'Izabrana', value: 'SELECTED' },
      { label: 'Nije izabrana', value: 'NOT_SELECTED' },
      { label: 'Povučena', value: 'WITHDRAWN' },
    ], required: true },
    { name: 'statusVersion', type: 'number', admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'openingCode', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'openingRevision', type: 'number', admin: { readOnly: true }, min: 1, required: true },
    { name: 'employerName', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'jobTitle', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'jobCategory', type: 'select', admin: { readOnly: true }, options: [...jobCategoryOptions], required: true },
    { name: 'workCity', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'workState', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'startDate', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'endDate', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'hourlyWageCents', type: 'number', admin: { readOnly: true }, required: true },
    { name: 'currency', type: 'select', admin: { readOnly: true }, options: [{ label: 'USD', value: 'USD' }], required: true },
    { name: 'expectedWeeklyHours', type: 'number', admin: { readOnly: true }, required: true },
    { name: 'housingProvided', type: 'checkbox', admin: { readOnly: true }, required: true },
    { name: 'housingCostCents', type: 'number', admin: { readOnly: true } },
    { name: 'housingDescription', type: 'textarea', admin: { readOnly: true } },
    { name: 'candidateInstructions', type: 'textarea', admin: { readOnly: true }, required: true },
    { name: 'snapshotChecksum', type: 'text', admin: { readOnly: true }, required: true },
    { name: 'assignedAt', type: 'date', admin: { readOnly: true }, required: true },
    { name: 'assignedBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users', required: true },
    { name: 'candidatePreferenceUpdatedAt', type: 'date', admin: { readOnly: true } },
    { name: 'withdrawnAt', type: 'date', admin: { readOnly: true } },
    { name: 'withdrawnBy', type: 'relationship', admin: { readOnly: true }, relationTo: 'users' },
    { name: 'withdrawalReason', type: 'textarea', admin: { readOnly: true }, maxLength: 1_000 },
  ],
  indexes: [{ fields: ['candidateProcess', 'jobOpening'], unique: true }, { fields: ['candidateAccount', 'status'] }, { fields: ['shortlist', 'status'] }],
  labels: { plural: 'Opcije poslova kandidata', singular: 'Opcija posla kandidata' },
}
