import { ValidationError, type Access, type CollectionConfig } from 'payload'

import { applicationSchemaChecksum, type ProgramApplicationSchemaSnapshot } from '../modules/program-applications/schema.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false

export const CandidateProgramApplications: CollectionConfig = {
  slug: 'candidate-program-applications',
  access: { create: deny, delete: deny, read: administrator, update: administrator },
  admin: {
    defaultColumns: ['candidateAccount', 'programCode', 'status', 'completionPercent', 'lastSavedAt', 'submittedAt'],
    description: 'Prijave kandidata. Administrator ima ovlašćenje da samostalno pregleda i ažurira podatke.',
    group: 'Programske aplikacije',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    { name: 'candidateAccount', type: 'relationship', admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'candidateProcess', type: 'relationship', admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true, unique: true },
    { name: 'preApplication', type: 'relationship', admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'template', type: 'relationship', admin: { readOnly: true }, label: 'Izvorni šablon', relationTo: 'program-application-templates', required: true },
    { name: 'programCode', type: 'select', admin: { readOnly: true }, label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'templateName', type: 'text', admin: { readOnly: true }, label: 'Naziv šablona', required: true },
    { name: 'templateVersion', type: 'number', admin: { readOnly: true }, label: 'Verzija šablona', min: 1, required: true },
    { name: 'instructionsSnapshot', type: 'textarea', admin: { readOnly: true }, label: 'Uputstvo kandidatu', maxLength: 2_000 },
    { name: 'schemaSnapshot', type: 'json', admin: { hidden: true }, required: true },
    { name: 'schemaChecksum', type: 'text', admin: { readOnly: true }, label: 'Kontrolni otisak šeme', required: true },
    { name: 'answers', type: 'json', admin: { hidden: true }, required: true },
    { name: 'status', type: 'select', defaultValue: 'DRAFT', label: 'Status', options: [
      { label: 'Nacrt', value: 'DRAFT' },
      { label: 'Predato', value: 'SUBMITTED' },
    ], required: true },
    { name: 'completionPercent', type: 'number', label: 'Popunjeno (%)', max: 100, min: 0, required: true },
    { name: 'revision', type: 'number', admin: { readOnly: true }, label: 'Revizija nacrta', min: 1, required: true },
    { name: 'lastSavedAt', type: 'date', admin: { readOnly: true }, label: 'Poslednji put sačuvano', required: true },
    { name: 'submittedAt', type: 'date', admin: { readOnly: true }, label: 'Predato' },
    { name: 'applicationReview', type: 'ui', admin: { components: { Field: './components/admin/ProgramApplicationReviewPanel#ProgramApplicationReviewPanel' } } },
  ],
  hooks: {
    beforeChange: [({ data, operation, originalDoc, req }) => {
      const isUserAdmin = req.user?.collection === 'users'
      if (operation === 'create') {
        if (data.status !== 'DRAFT' || data.revision !== 1) {
          throw new ValidationError({ collection: 'candidate-program-applications', errors: [{ message: 'Nova prijava mora početi kao prva revizija nacrta.', path: 'status' }], req })
        }
      } else {
        if (originalDoc.status === 'SUBMITTED' && !isUserAdmin) {
          throw new ValidationError({ collection: 'candidate-program-applications', errors: [{ message: 'Predate prijave su nepromenljive.', path: 'status' }], id: originalDoc.id, req })
        }
        const immutableFields = ['candidateAccount', 'candidateProcess', 'preApplication', 'programCode', 'schemaSnapshot', 'schemaChecksum', 'template', 'templateName', 'templateVersion']
        if (immutableFields.some((field) => field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field]))) {
          throw new ValidationError({ collection: 'candidate-program-applications', errors: [{ message: 'Veze i snimak šablona ne mogu da se menjaju.', path: 'schemaSnapshot' }], id: originalDoc.id, req })
        }
        if (data.status && !['DRAFT', 'SUBMITTED'].includes(String(data.status))) {
          throw new ValidationError({ collection: 'candidate-program-applications', errors: [{ message: 'Status prijave nije dozvoljen.', path: 'status' }], id: originalDoc.id, req })
        }
      }

      const snapshot = (data.schemaSnapshot ?? originalDoc?.schemaSnapshot) as ProgramApplicationSchemaSnapshot
      const expectedChecksum = applicationSchemaChecksum(snapshot)
      const storedChecksum = String(data.schemaChecksum ?? originalDoc?.schemaChecksum ?? '')
      if (storedChecksum !== expectedChecksum) {
        throw new ValidationError({ collection: 'candidate-program-applications', errors: [{ message: 'Kontrolni otisak šablona nije ispravan.', path: 'schemaChecksum' }], id: originalDoc?.id, req })
      }
      return data
    }],
  },
  labels: { plural: 'Prijave kandidata', singular: 'Programska prijava kandidata' },
}
