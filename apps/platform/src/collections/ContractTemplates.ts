import { ValidationError, type Access, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { contractTemplateChecksum, validateContractTemplateBody } from '../modules/contract-templates/rules.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const draftOnly: Access = ({ req }) => req.user?.collection === 'users' ? { status: { equals: 'DRAFT' } } : false
const deny = () => false

const enforceTemplateRules: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const now = new Date().toISOString()
  const previousStatus = originalDoc?.status as string | undefined
  const nextStatus = String(data.status ?? previousStatus ?? 'DRAFT')

  if (operation === 'create' && nextStatus !== 'DRAFT') {
    throw new ValidationError({ collection: 'contract-templates', errors: [{ message: 'Novi šablon se prvo čuva kao nacrt.', path: 'status' }], req })
  }
  if (operation === 'update' && previousStatus === 'RETIRED') {
    throw new ValidationError({ collection: 'contract-templates', errors: [{ message: 'Povučena verzija šablona je nepromenljiva.', path: 'status' }], id: originalDoc.id, req })
  }
  if (operation === 'update' && previousStatus === 'ACTIVE' && nextStatus !== 'RETIRED') {
    throw new ValidationError({ collection: 'contract-templates', errors: [{ message: 'Aktivna verzija može samo da se povuče.', path: 'status' }], id: originalDoc.id, req })
  }
  if (operation === 'update' && previousStatus === 'ACTIVE') {
    const immutableFields = ['body', 'name', 'programCode', 'templateType', 'version'] as const
    const changed = immutableFields.some((field) =>
      field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field]),
    )
    if (changed) {
      throw new ValidationError({ collection: 'contract-templates', errors: [{ message: 'Sadržaj aktivne verzije ne može da se menja. Kreirajte novi nacrt.', path: 'body' }], id: originalDoc.id, req })
    }
  }
  if (!['DRAFT', 'ACTIVE', 'RETIRED'].includes(nextStatus)) {
    throw new ValidationError({ collection: 'contract-templates', errors: [{ message: 'Nedozvoljen status šablona.', path: 'status' }], req })
  }

  const body = String(data.body ?? originalDoc?.body ?? '')
  const bodyError = validateContractTemplateBody(body)
  if (bodyError) {
    throw new ValidationError({ collection: 'contract-templates', errors: [{ message: bodyError, path: 'body' }], req })
  }
  data.contentChecksum = contractTemplateChecksum(body)
  if (previousStatus !== 'ACTIVE' && nextStatus === 'ACTIVE') {
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

export const ContractTemplates: CollectionConfig = {
  slug: 'contract-templates',
  access: { create: administrator, delete: draftOnly, read: administrator, update: administrator },
  admin: {
    defaultColumns: ['name', 'programCode', 'templateType', 'version', 'status', 'updatedAt'],
    description: 'Svaka izmena se radi u novom nacrtu. Aktivne i povučene verzije ostaju nepromenljive.',
    group: 'Ugovori i dokumentacija',
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', label: 'Naziv šablona', maxLength: 160, required: true },
    { name: 'programCode', type: 'select', label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'templateType', type: 'select', label: 'Model ugovora', options: [
      { label: 'Standardni ugovor', value: 'STANDARD' },
      { label: 'Platiš kad zaradiš', value: 'PAY_WHEN_YOU_EARN' },
    ], required: true },
    { name: 'version', type: 'number', label: 'Verzija', min: 1, required: true },
    { name: 'status', type: 'select', defaultValue: 'DRAFT', label: 'Status', options: [
      { label: 'Nacrt', value: 'DRAFT' },
      { label: 'Aktivan', value: 'ACTIVE' },
      { label: 'Povučen', value: 'RETIRED' },
    ], required: true },
    {
      name: 'body',
      type: 'textarea',
      admin: { description: 'Dozvoljena polja: {{ candidate.fullName }}, {{ candidate.personalId }}, {{ candidate.address }}, {{ candidate.passportFileName }}, {{ offer.total }}, {{ payment.method }}, {{ contract.number }}, {{ contract.date }}.' },
      label: 'Tekst šablona',
      required: true,
    },
    { name: 'contentChecksum', type: 'text', access: { update: deny }, admin: { readOnly: true }, label: 'Kontrolni otisak sadržaja', required: true },
    { name: 'createdBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Kreirao/la', relationTo: 'users' },
    { name: 'activatedAt', type: 'date', access: { update: deny }, admin: { readOnly: true }, label: 'Aktiviran' },
    { name: 'activatedBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Aktivirao/la', relationTo: 'users' },
    { name: 'retiredAt', type: 'date', access: { update: deny }, admin: { readOnly: true }, label: 'Povučen' },
    { name: 'retiredBy', type: 'relationship', access: { update: deny }, admin: { readOnly: true }, label: 'Povukao/la', relationTo: 'users' },
  ],
  hooks: {
    beforeChange: [enforceTemplateRules],
    afterChange: [async ({ doc, operation, previousDoc, req }) => {
      const previousStatus = previousDoc?.status
      const eventType = operation === 'create'
        ? 'CONTRACT_TEMPLATE_DRAFTED'
        : doc.status === 'ACTIVE' && previousStatus !== 'ACTIVE'
          ? 'CONTRACT_TEMPLATE_ACTIVATED'
          : doc.status === 'RETIRED' && previousStatus !== 'RETIRED'
            ? 'CONTRACT_TEMPLATE_RETIRED'
            : undefined
      if (!eventType) return doc
      await req.payload.create({
        collection: 'audit-events',
        data: {
          actor: req.user?.collection === 'users' ? req.user.id : undefined,
          actorType: 'ADMIN',
          correlationId: `contract-template:${doc.id}`,
          eventType,
          metadata: { programCode: doc.programCode, templateId: doc.id, templateType: doc.templateType, version: doc.version },
          occurredAt: new Date().toISOString(),
        },
        overrideAccess: true,
        req,
      })
      return doc
    }],
  },
  labels: { plural: 'Šabloni ugovora', singular: 'Šablon ugovora' },
}
