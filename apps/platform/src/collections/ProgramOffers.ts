import { ValidationError, type Access, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { validateProgramOfferTerms } from '../modules/program-offers/pricing.ts'

const administrator = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'users'
const denyAccess = () => false

const administratorOrOwnOffer: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return {
    candidateAccount: { equals: req.user.id },
    status: { in: ['PUBLISHED', 'ACCEPTED'] },
  }
}

const deleteDraftOnly: Access = ({ req }) => {
  if (req.user?.collection !== 'users') return false
  return { status: { equals: 'DRAFT' } }
}

const immutableRelationship = { update: () => false }

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

const commercialFields = [
  'basePriceCents',
  'currency',
  'installments',
  'oneTime',
  'payWhenYouEarn',
  'programCode',
  'validUntil',
] as const

function commercialTermsChanged(data: Record<string, unknown>, originalDoc: Record<string, unknown>) {
  return commercialFields.some((field) => field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field]))
}

const enforceOfferRules: CollectionBeforeChangeHook = async ({ context, data, operation, originalDoc, req }) => {
  const internalAcceptance = context.acceptProgramOffer === true
  const now = new Date()

  if (operation === 'create' && data.status && !['DRAFT', 'PUBLISHED'].includes(String(data.status))) {
    throw new ValidationError({
      collection: 'program-offers',
      errors: [{ message: 'Nova ponuda može biti samo nacrt ili odmah objavljena.', path: 'status' }],
      req,
    })
  }

  if (operation === 'update') {
    const previousStatus = originalDoc.status as string
    const nextStatus = (data.status ?? previousStatus) as string

    if (internalAcceptance) {
      if (previousStatus !== 'PUBLISHED' || nextStatus !== 'ACCEPTED') {
        throw new ValidationError({
          collection: 'program-offers',
          errors: [{ message: 'Ponudu je moguće prihvatiti samo iz objavljenog statusa.', path: 'status' }],
          id: originalDoc.id,
          req,
        })
      }
      return data
    }

    if (previousStatus === 'ACCEPTED' || previousStatus === 'WITHDRAWN') {
      throw new ValidationError({
        collection: 'program-offers',
        errors: [{ message: 'Prihvaćena ili povučena ponuda je zaključana.', path: 'status' }],
        id: originalDoc.id,
        req,
      })
    }
    if (previousStatus === 'PUBLISHED') {
      if (nextStatus !== 'WITHDRAWN' || commercialTermsChanged(data, originalDoc)) {
        throw new ValidationError({
          collection: 'program-offers',
          errors: [{ message: 'Objavljena ponuda može samo da se povuče; komercijalni uslovi se ne menjaju.', path: 'status' }],
          id: originalDoc.id,
          req,
        })
      }
      data.withdrawnAt = now.toISOString()
      data.withdrawnBy = req.user?.collection === 'users' ? req.user.id : undefined
      return data
    }
    if (!['DRAFT', 'PUBLISHED', 'WITHDRAWN'].includes(nextStatus)) {
      throw new ValidationError({
        collection: 'program-offers',
        errors: [{ message: 'Nedozvoljena promena statusa ponude.', path: 'status' }],
        id: originalDoc.id,
        req,
      })
    }
  }

  const merged = { ...(originalDoc ?? {}), ...data }
  const validationErrors = validateProgramOfferTerms(merged)
  if (validationErrors.length > 0) {
    throw new ValidationError({ collection: 'program-offers', errors: validationErrors, req })
  }

  const process = await req.payload.findByID({
    collection: 'candidate-processes',
    depth: 0,
    id: relationId(merged.candidateProcess),
    overrideAccess: true,
    req,
  })
  if (
    relationId(process.candidateAccount) !== relationId(merged.candidateAccount) ||
    relationId(process.preApplication) !== relationId(merged.preApplication) ||
    process.programCode !== merged.programCode
  ) {
    throw new ValidationError({
      collection: 'program-offers',
      errors: [{ message: 'Nalog, proces, prijava i program moraju pripadati istom kandidatu.', path: 'candidateProcess' }],
      req,
    })
  }

  const nextStatus = (data.status ?? originalDoc?.status ?? 'DRAFT') as string
  if (nextStatus === 'PUBLISHED') {
    const validUntil = Date.parse(String(merged.validUntil ?? ''))
    if (!Number.isFinite(validUntil) || validUntil <= now.getTime()) {
      throw new ValidationError({
        collection: 'program-offers',
        errors: [{ message: 'Objavljena ponuda mora imati budući rok važenja.', path: 'validUntil' }],
        req,
      })
    }
    const active = await req.payload.find({
      collection: 'program-offers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [
          { candidateProcess: { equals: process.id } },
          { status: { in: ['PUBLISHED', 'ACCEPTED'] } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    })
    if (active.docs[0]) {
      throw new ValidationError({
        collection: 'program-offers',
        errors: [{ message: 'Ovaj kandidat već ima aktivnu ili prihvaćenu ponudu.', path: 'status' }],
        req,
      })
    }
    data.publishedAt ??= now.toISOString()
    data.publishedBy ??= req.user?.collection === 'users' ? req.user.id : undefined
  }
  if (operation === 'create') {
    data.commercialVersion = 1
    data.createdBy = req.user?.collection === 'users' ? req.user.id : undefined
  }
  if (nextStatus === 'WITHDRAWN') {
    data.withdrawnAt ??= now.toISOString()
    data.withdrawnBy ??= req.user?.collection === 'users' ? req.user.id : undefined
  }
  return data
}

export const ProgramOffers: CollectionConfig = {
  slug: 'program-offers',
  access: {
    create: administrator,
    delete: deleteDraftOnly,
    read: administratorOrOwnOffer,
    update: administrator,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'status', 'basePriceCents', 'validUntil', 'updatedAt'],
    description: 'Ponuda se uređuje kao nacrt. Posle objavljivanja uslovi se zaključavaju.',
    group: 'Kandidatski portal',
    useAsTitle: 'candidateAccount',
  },
  fields: [
    {
      name: 'candidateAccount',
      type: 'relationship',
      access: immutableRelationship,
      label: 'Kandidatski nalog',
      relationTo: 'candidate-accounts',
      required: true,
    },
    {
      name: 'candidateProcess',
      type: 'relationship',
      access: immutableRelationship,
      label: 'Proces kandidata',
      relationTo: 'candidate-processes',
      required: true,
    },
    {
      name: 'preApplication',
      type: 'relationship',
      access: immutableRelationship,
      label: 'Izvorna prijava',
      relationTo: 'pre-applications',
      required: true,
    },
    {
      name: 'programCode',
      type: 'select',
      access: immutableRelationship,
      defaultValue: 'SWT',
      label: 'Program',
      options: [{ label: 'Work & Travel', value: 'SWT' }],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'DRAFT',
      label: 'Status ponude',
      options: [
        { label: 'Nacrt', value: 'DRAFT' },
        { label: 'Objavljena kandidatu', value: 'PUBLISHED' },
        { label: 'Prihvaćena', value: 'ACCEPTED' },
        { label: 'Povučena', value: 'WITHDRAWN' },
      ],
      required: true,
    },
    {
      name: 'currency',
      type: 'select',
      access: immutableRelationship,
      defaultValue: 'USD',
      label: 'Valuta',
      options: [{ label: 'Američki dolar (USD)', value: 'USD' }],
      required: true,
    },
    {
      name: 'basePriceCents',
      type: 'number',
      admin: { description: 'Unosi se u centima: 2500 USD = 250000.' },
      label: 'Osnovna cena u centima',
      min: 1,
      required: true,
    },
    {
      name: 'oneTime',
      type: 'group',
      label: 'Jednokratno plaćanje',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Ponudi jednokratno plaćanje' },
        { name: 'discountLabel', type: 'text', label: 'Naziv aktivnog popusta', maxLength: 120 },
        { name: 'discountCents', type: 'number', defaultValue: 0, label: 'Popust u centima', min: 0 },
      ],
    },
    {
      name: 'installments',
      type: 'group',
      label: 'Plaćanje na rate',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Ponudi plaćanje na rate' },
        {
          name: 'items',
          type: 'array',
          admin: { description: 'Kada je opcija uključena, unesite najmanje tri rate čiji zbir odgovara ceni.' },
          fields: [
            { name: 'label', type: 'text', label: 'Naziv rate', maxLength: 80, required: true },
            { name: 'amountCents', type: 'number', label: 'Iznos u centima', min: 1, required: true },
            { name: 'dueAt', type: 'date', label: 'Datum dospeća', required: true },
          ],
          label: 'Dinamika rata',
          maxRows: 12,
        },
      ],
    },
    {
      name: 'payWhenYouEarn',
      type: 'group',
      label: 'Platiš kad zaradiš (PKZ)',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Ponudi PKZ model' },
        { name: 'depositCents', type: 'number', label: 'Početni iznos u centima', min: 0 },
        { name: 'deferredAmountCents', type: 'number', label: 'Odloženi iznos u centima', min: 0 },
        { name: 'description', type: 'textarea', label: 'Objašnjenje modela', maxLength: 600 },
      ],
    },
    { name: 'validUntil', type: 'date', label: 'Ponuda važi do', required: true },
    { name: 'commercialVersion', type: 'number', access: { update: denyAccess }, admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'createdBy', type: 'relationship', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Ponudu kreirao/la', relationTo: 'users' },
    { name: 'publishedAt', type: 'date', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Objavljena' },
    { name: 'publishedBy', type: 'relationship', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Objavio/la', relationTo: 'users' },
    { name: 'withdrawnAt', type: 'date', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Povučena' },
    { name: 'withdrawnBy', type: 'relationship', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Povukao/la', relationTo: 'users' },
    { name: 'acceptedAt', type: 'date', access: { update: denyAccess }, admin: { readOnly: true }, label: 'Prihvaćena' },
  ],
  hooks: {
    afterChange: [
      async ({ context, doc, operation, previousDoc, req }) => {
        if (context.acceptProgramOffer === true) return doc
        const previousStatus = previousDoc?.status
        const eventType =
          operation === 'create' && doc.status === 'DRAFT'
            ? 'PROGRAM_OFFER_DRAFTED'
            : doc.status === 'PUBLISHED' && previousStatus !== 'PUBLISHED'
              ? 'PROGRAM_OFFER_PUBLISHED'
              : doc.status === 'WITHDRAWN' && previousStatus !== 'WITHDRAWN'
                ? 'PROGRAM_OFFER_WITHDRAWN'
                : undefined
        if (!eventType) return doc

        const application = await req.payload.findByID({
          collection: 'pre-applications',
          depth: 0,
          id: relationId(doc.preApplication),
          overrideAccess: true,
          req,
        })
        await req.payload.create({
          collection: 'audit-events',
          data: {
            actor: req.user?.collection === 'users' ? req.user.id : undefined,
            actorType: req.user?.collection === 'users' ? 'ADMIN' : 'SYSTEM',
            correlationId: application.correlationId,
            eventType,
            metadata: { offerId: doc.id, offerStatus: doc.status },
            newStatus: application.status,
            occurredAt: new Date().toISOString(),
            preApplication: application.id,
            previousStatus: application.status,
            workflowVersion: application.workflowVersion,
          },
          overrideAccess: true,
          req,
        })
        return doc
      },
    ],
    beforeChange: [enforceOfferRules],
  },
  labels: { plural: 'Programske ponude', singular: 'Programska ponuda' },
}
