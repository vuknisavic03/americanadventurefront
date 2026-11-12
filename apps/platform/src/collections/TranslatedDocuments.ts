import type { Access, CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const administrator = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'users'

const administratorOrOwnTranslation: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

const administratorOrCandidateCreate: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection === 'candidate-accounts') return true
  return false
}

export const TranslatedDocuments: CollectionConfig = {
  slug: 'translated-documents',
  access: {
    create: administratorOrCandidateCreate,
    delete: denyAccess,
    read: administratorOrOwnTranslation,
    update: administrator,
  },
  admin: {
    defaultColumns: ['title', 'documentType', 'status', 'reviewedAt', 'createdAt'],
    group: 'Dokumenti',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'candidateProcess',
      type: 'relationship',
      relationTo: 'candidate-processes',
      required: true,
    },
    {
      name: 'candidateAccount',
      type: 'relationship',
      relationTo: 'candidate-accounts',
    },
    {
      name: 'documentType',
      type: 'select',
      defaultValue: 'STUDENT_STATUS_CERTIFICATE',
      options: [
        { label: 'Uverenje o statusu studenta', value: 'STUDENT_STATUS_CERTIFICATE' },
        { label: 'Izjava jemca / finansijska podrška', value: 'GUARANTOR_STATEMENT' },
        { label: 'Opšti prevedeni dokument', value: 'GENERAL_DOCUMENT' },
      ],
      required: true,
    },
    {
      name: 'sourceLanguage',
      type: 'select',
      defaultValue: 'sr',
      options: [
        { label: 'Srpski (sr)', value: 'sr' },
      ],
      required: true,
    },
    {
      name: 'targetLanguage',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'Engleski (en)', value: 'en' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING_REVIEW',
      options: [
        { label: 'Nacrt', value: 'DRAFT' },
        { label: 'Na pregledu administratora', value: 'PENDING_REVIEW' },
        { label: 'Odobreno i overeno', value: 'APPROVED' },
        { label: 'Odbijeno', value: 'REJECTED' },
      ],
      required: true,
    },
    {
      name: 'sourceData',
      type: 'json',
      required: true,
    },
    {
      name: 'translatedData',
      type: 'json',
      required: true,
    },
    {
      name: 'adminNotes',
      type: 'textarea',
    },
    {
      name: 'rejectionReason',
      type: 'text',
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'reviewedAt',
      type: 'date',
    },
    {
      name: 'pdfChecksum',
      type: 'text',
    },
    {
      name: 'pdfGeneratedAt',
      type: 'date',
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      min: 1,
    },
  ],
  labels: {
    plural: 'Prevedeni dokumenti',
    singular: 'Prevedeni dokument',
  },
}
