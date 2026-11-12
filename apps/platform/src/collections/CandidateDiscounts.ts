import type { Access, CollectionConfig } from 'payload'

import { denyAccess } from '../access/collectionAccess.ts'

const administratorOrOwnDiscount: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection !== 'candidate-accounts') return false
  return { candidateAccount: { equals: req.user.id } }
}

export const CandidateDiscounts: CollectionConfig = {
  slug: 'candidate-discounts',
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: administratorOrOwnDiscount,
    update: denyAccess,
  },
  admin: {
    defaultColumns: ['candidateAccount', 'discountType', 'amountCents', 'status', 'createdAt'],
    description: 'Evidencija prijavljenih, verifikovanih i primenjenih komercijalnih popusta (FR-031–034).',
    group: 'Finansije',
    useAsTitle: 'label',
  },
  fields: [
    {
      name: 'candidateAccount',
      type: 'relationship',
      admin: { readOnly: true },
      index: true,
      relationTo: 'candidate-accounts',
      required: true,
    },
    {
      name: 'candidateProcess',
      type: 'relationship',
      admin: { readOnly: true },
      index: true,
      relationTo: 'candidate-processes',
      required: true,
    },
    {
      name: 'preApplication',
      type: 'relationship',
      admin: { readOnly: true },
      relationTo: 'pre-applications',
      required: true,
    },
    {
      name: 'discountType',
      type: 'select',
      admin: { readOnly: true },
      options: [
        { label: 'Grupni popust', value: 'GROUP' },
        { label: 'Brand Ambassador', value: 'BRAND_AMBASSADOR' },
        { label: 'Porodični popust', value: 'FAMILY' },
        { label: 'Povratnik (Returnee)', value: 'RETURNEE' },
        { label: 'Spasilac (Lifeguard)', value: 'LIFEGUARD' },
        { label: 'Prilagođeni (Custom)', value: 'CUSTOM' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Na čekanju', value: 'PENDING' },
        { label: 'Verifikovan', value: 'VERIFIED' },
        { label: 'Odbijen', value: 'REJECTED' },
        { label: 'Primenjen', value: 'APPLIED' },
      ],
      required: true,
    },
    {
      name: 'amountCents',
      type: 'number',
      label: 'Iznos popusta u centima',
      min: 0,
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      label: 'Naziv popusta',
      required: true,
    },
    // FR-031: Group discount
    {
      name: 'discountGroup',
      type: 'relationship',
      relationTo: 'discount-groups',
    },
    {
      name: 'groupCode',
      type: 'text',
    },
    {
      name: 'groupMemberRole',
      type: 'select',
      options: [
        { label: 'Vođa grupe', value: 'LEADER' },
        { label: 'Član grupe', value: 'MEMBER' },
      ],
    },
    // FR-032: Brand Ambassador discount
    {
      name: 'brandAmbassador',
      type: 'relationship',
      relationTo: 'brand-ambassadors',
    },
    {
      name: 'ambassadorCode',
      type: 'text',
    },
    // FR-033: Family discount
    {
      name: 'kinshipType',
      type: 'select',
      options: [
        { label: 'Brat/Sestra', value: 'SIBLING' },
        { label: 'Blizanac', value: 'TWIN' },
        { label: 'Roditelj/Dete', value: 'PARENT_CHILD' },
        { label: 'Bračni drug', value: 'SPOUSE' },
        { label: 'Ostalo', value: 'OTHER' },
      ],
    },
    {
      name: 'relativeFullName',
      type: 'text',
      label: 'Ime i prezime srodnika',
    },
    {
      name: 'relativeCandidateAccount',
      type: 'relationship',
      relationTo: 'candidate-accounts',
    },
    {
      name: 'kinshipNotes',
      type: 'textarea',
      label: 'Napomena o srodstvu',
    },
    // FR-034: Returnee & Lifeguard discount
    {
      name: 'returneePreviousYear',
      type: 'number',
      label: 'Godina prethodnog učešća',
    },
    {
      name: 'returneePreviousEmployer',
      type: 'text',
      label: 'Prethodni poslodavac',
    },
    {
      name: 'returneePreviousSponsor',
      type: 'text',
      label: 'Prethodni sponzor',
    },
    {
      name: 'lifeguardCertifyingBody',
      type: 'select',
      options: [
        { label: 'Crveni krst', value: 'RED_CROSS' },
        { label: 'Ellis & Associates', value: 'ELLIS' },
        { label: 'YMCA', value: 'YMCA' },
        { label: 'StarGuard ELITE', value: 'STARGUARD' },
        { label: 'Ostalo', value: 'OTHER' },
      ],
    },
    {
      name: 'lifeguardCertificateNumber',
      type: 'text',
      label: 'Broj licence / sertifikata',
    },
    {
      name: 'lifeguardValidUntil',
      type: 'date',
      label: 'Važi do',
    },
    // Verification & Admin fields
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Administratorske beleške',
    },
    {
      name: 'verificationNote',
      type: 'text',
      label: 'Razlog verifikacije / odbijanja',
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'verifiedAt',
      type: 'date',
    },
  ],
  labels: { plural: 'Popusti kandidata', singular: 'Popust kandidata' },
}
