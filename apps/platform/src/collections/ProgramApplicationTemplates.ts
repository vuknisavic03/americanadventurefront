import { ValidationError, type Access, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import {
  applicationSchemaChecksum,
  normalizeTemplateFields,
  type ProgramApplicationSchemaSnapshot,
} from '../modules/program-applications/schema.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const draftOnly: Access = ({ req }) => req.user?.collection === 'users' ? { status: { equals: 'DRAFT' } } : false
const deny = () => false

function validationError(message: string, path: string, req: Parameters<CollectionBeforeChangeHook>[0]['req'], id?: number) {
  throw new ValidationError({
    collection: 'program-application-templates',
    errors: [{ message, path }],
    id,
    req,
  })
}

const enforceTemplateRules: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const now = new Date().toISOString()
  const previousStatus = originalDoc?.status as string | undefined
  const nextStatus = String(data.status ?? previousStatus ?? 'DRAFT')

  if (operation === 'create' && nextStatus !== 'DRAFT') {
    validationError('Novi šablon se prvo čuva kao nacrt.', 'status', req)
  }
  if (operation === 'update' && previousStatus === 'RETIRED') {
    validationError('Povučeni šablon je nepromenljiv.', 'status', req, originalDoc.id)
  }
  if (operation === 'update' && previousStatus === 'ACTIVE' && nextStatus !== 'RETIRED') {
    validationError('Aktivan šablon može samo da se povuče.', 'status', req, originalDoc.id)
  }
  if (!['ACTIVE', 'DRAFT', 'RETIRED'].includes(nextStatus)) {
    validationError('Status šablona nije dozvoljen.', 'status', req, originalDoc?.id)
  }

  const immutableFields = ['fields', 'instructions', 'name', 'programCode', 'version'] as const
  if (operation === 'update' && previousStatus === 'ACTIVE') {
    const changed = immutableFields.some((field) =>
      field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field]),
    )
    if (changed) {
      validationError('Sadržaj aktivne verzije ne može da se menja. Kreirajte novi nacrt.', 'fields', req, originalDoc.id)
    }
  }

  let fields
  try {
    fields = normalizeTemplateFields(data.fields ?? originalDoc?.fields)
  } catch (error) {
    validationError(error instanceof Error ? error.message : 'Polja šablona nisu ispravna.', 'fields', req, originalDoc?.id)
  }
  const snapshot: ProgramApplicationSchemaSnapshot = {
    fields: fields!,
    instructions: String(data.instructions ?? originalDoc?.instructions ?? '').trim() || undefined,
    name: String(data.name ?? originalDoc?.name ?? '').trim(),
    programCode: String(data.programCode ?? originalDoc?.programCode) as 'SWT',
    version: Number(data.version ?? originalDoc?.version),
  }
  data.schemaChecksum = applicationSchemaChecksum(snapshot)

  if (previousStatus !== 'ACTIVE' && nextStatus === 'ACTIVE') {
    const existing = await req.payload.find({
      collection: 'program-application-templates',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [
          { programCode: { equals: snapshot.programCode } },
          { status: { equals: 'ACTIVE' } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    })
    if (existing.docs[0]) {
      validationError('Program već ima aktivan šablon. Prvo povucite postojeću verziju.', 'status', req, originalDoc?.id)
    }
    data.activatedAt = now
    data.activatedBy = req.user?.collection === 'users' ? req.user.id : undefined
  }
  if (previousStatus === 'ACTIVE' && nextStatus === 'RETIRED') {
    data.retiredAt = now
    data.retiredBy = req.user?.collection === 'users' ? req.user.id : undefined
  }
  if (operation === 'create') data.createdBy = req.user?.collection === 'users' ? req.user.id : undefined
  return data
}

export const ProgramApplicationTemplates: CollectionConfig = {
  slug: 'program-application-templates',
  access: { create: administrator, delete: draftOnly, read: administrator, update: administrator },
  admin: {
    defaultColumns: ['name', 'programCode', 'version', 'status', 'updatedAt'],
    description: 'Pitanja se uređuju u nacrtu. Aktivne verzije ostaju nepromenljive zbog već otvorenih prijava.',
    group: 'Programske aplikacije',
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', label: 'Naziv šablona', maxLength: 160, required: true },
    { name: 'programCode', type: 'select', label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'version', type: 'number', label: 'Verzija', min: 1, required: true },
    { name: 'status', type: 'select', defaultValue: 'DRAFT', label: 'Status', options: [
      { label: 'Nacrt', value: 'DRAFT' },
      { label: 'Aktivan', value: 'ACTIVE' },
      { label: 'Povučen', value: 'RETIRED' },
    ], required: true },
    {
      name: 'instructions',
      type: 'textarea',
      label: 'Uputstvo kandidatu',
      maxLength: 2_000,
    },
    {
      name: 'fields',
      type: 'array',
      labels: { plural: 'Polja formulara', singular: 'Polje formulara' },
      maxRows: 40,
      minRows: 1,
      required: true,
      fields: [
        { name: 'key', type: 'text', admin: { description: 'Stabilan tehnički ključ, npr. emergencyContactName. Ne menjati nakon aktivacije.' }, label: 'Ključ', maxLength: 64, required: true },
        { name: 'label', type: 'text', label: 'Naziv polja', maxLength: 160, required: true },
        { name: 'fieldType', type: 'select', label: 'Tip polja', options: [
          { label: 'Kratak tekst', value: 'TEXT' },
          { label: 'Duži tekst', value: 'TEXTAREA' },
          { label: 'Broj', value: 'NUMBER' },
          { label: 'Datum', value: 'DATE' },
        ], required: true },
        { name: 'required', type: 'checkbox', defaultValue: false, label: 'Obavezno polje' },
        { name: 'helpText', type: 'textarea', label: 'Dodatno objašnjenje', maxLength: 500 },
        { name: 'maxLength', type: 'number', admin: { description: 'Samo za tekstualna polja. Podrazumevano 500, odnosno 5000 za duži tekst.' }, label: 'Najveći broj znakova', max: 5_000, min: 1 },
      ],
    },
    { name: 'schemaChecksum', type: 'text', access: { update: deny }, admin: { readOnly: true }, label: 'Kontrolni otisak šeme', required: true },
    { name: 'createdBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Kreirao/la', relationTo: 'users' },
    { name: 'activatedAt', type: 'date', access: { update: deny }, admin: { readOnly: true }, label: 'Aktiviran' },
    { name: 'activatedBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Aktivirao/la', relationTo: 'users' },
    { name: 'retiredAt', type: 'date', access: { update: deny }, admin: { readOnly: true }, label: 'Povučen' },
    { name: 'retiredBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Povukao/la', relationTo: 'users' },
  ],
  hooks: {
    beforeChange: [enforceTemplateRules],
    afterChange: [async ({ doc, operation, previousDoc, req }) => {
      const eventType = operation === 'create'
        ? 'PROGRAM_APPLICATION_TEMPLATE_DRAFTED'
        : doc.status === 'ACTIVE' && previousDoc?.status !== 'ACTIVE'
          ? 'PROGRAM_APPLICATION_TEMPLATE_ACTIVATED'
          : doc.status === 'RETIRED' && previousDoc?.status !== 'RETIRED'
            ? 'PROGRAM_APPLICATION_TEMPLATE_RETIRED'
            : undefined
      if (!eventType) return doc
      await req.payload.create({
        collection: 'audit-events',
        data: {
          actor: req.user?.collection === 'users' ? req.user.id : undefined,
          actorType: 'ADMIN',
          correlationId: `program-application-template:${doc.id}`,
          eventType,
          metadata: { programCode: doc.programCode, templateId: doc.id, version: doc.version },
          occurredAt: new Date().toISOString(),
        },
        overrideAccess: true,
        req,
      })
      return doc
    }],
  },
  indexes: [{ fields: ['programCode', 'version'], unique: true }],
  labels: { plural: 'Šabloni programskih aplikacija', singular: 'Šablon programske aplikacije' },
}
