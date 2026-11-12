import type { Access, CollectionConfig } from 'payload'

const isAdministrator: Access = ({ req }) => req.user?.collection === 'users'

const administratorOrOwnAccount: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection === 'candidate-accounts') {
    return {
      email: { equals: req.user.email },
    }
  }
  return false
}

export const CandidateApplications: CollectionConfig = {
  slug: 'candidate-applications',
  access: {
    create: () => true, // Omogućava kreiranje pri registraciji i od strane administratora
    delete: isAdministrator,
    read: administratorOrOwnAccount,
    update: isAdministrator, // Administrator ima punu mogućnost izmene podataka sa aplikacije
  },
  admin: {
    defaultColumns: ['fullName', 'email', 'packageName', 'status', 'progress', 'createdAt'],
    description: 'Aplikacije kandidata sa svim podacima, statusom, plaćanjem, preferencijama i priloženim dokumentima.',
    group: 'Kandidati i prijave',
    useAsTitle: 'fullName',
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ data, siblingData }) => {
            const first = siblingData?.firstName || data?.firstName || ''
            const last = siblingData?.lastName || data?.lastName || ''
            return `${first} ${last}`.trim() || data?.email || 'Kandidat'
          },
        ],
      },
      label: 'Ime i prezime',
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'Ime',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Prezime',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      index: true,
      label: 'Email adresa',
      required: true,
      unique: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Broj telefona',
    },
    {
      name: 'jmbg',
      type: 'text',
      label: 'JMBG',
      maxLength: 13,
    },
    {
      name: 'idCardNumber',
      type: 'text',
      label: 'Broj lične karte / pasoša',
    },
    {
      name: 'packageId',
      type: 'select',
      defaultValue: 'swt-full',
      label: 'Paket programa',
      options: [
        { label: 'Work & Travel USA — Full Placement', value: 'swt-full' },
        { label: 'Work & Travel USA — Self Placement', value: 'swt-self' },
        { label: 'Lifeguards SWT Summer 2026', value: 'swt-lifeguard' },
        { label: 'Camp Counselor USA 2026', value: 'camp-usa' },
        { label: 'Drugi program / Prilagođeno', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'packageName',
      type: 'text',
      defaultValue: 'Work & Travel USA — Full Placement',
      label: 'Naziv paketa',
      required: true,
    },
    {
      name: 'basePrice',
      type: 'number',
      defaultValue: 1850,
      label: 'Osnovna cena (€)',
      min: 0,
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
      label: 'Popust (€)',
      min: 0,
    },
    {
      name: 'discountNote',
      type: 'text',
      label: 'Napomena za popust',
    },
    {
      name: 'finalPrice',
      type: 'number',
      defaultValue: 1850,
      label: 'Konačna cena (€)',
      min: 0,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      defaultValue: 'now',
      label: 'Model plaćanja',
      options: [
        { label: 'U celosti (100%)', value: 'now' },
        { label: 'U ratama', value: 'installments' },
        { label: 'Plati kad se vratiš (uz jemca i menice)', value: 'later' },
      ],
      required: true,
    },
    {
      name: 'guarantor',
      type: 'group',
      label: 'Podaci o jemcu (Plati kad se vratiš)',
      fields: [
        { name: 'name', type: 'text', label: 'Ime i prezime jemca' },
        { name: 'idCardNumber', type: 'text', label: 'Broj lične karte jemca' },
        { name: 'jmbg', type: 'text', label: 'JMBG jemca', maxLength: 13 },
        { name: 'promissoryNotesCount', type: 'number', defaultValue: 2, label: 'Broj potpisanih menica' },
      ],
    },
    {
      name: 'preferences',
      type: 'group',
      label: 'Preferencije posla i intervjua',
      fields: [
        { name: 'location', type: 'text', label: 'Željena lokacija u SAD' },
        { name: 'position', type: 'text', label: 'Željena radna pozicija' },
        {
          name: 'englishLevel',
          type: 'select',
          defaultValue: 'B2',
          label: 'Nivo engleskog jezika',
          options: [
            { label: 'A1 — Početni', value: 'A1' },
            { label: 'A2 — Elementarni', value: 'A2' },
            { label: 'B1 — Srednji', value: 'B1' },
            { label: 'B2 — Viši srednji', value: 'B2' },
            { label: 'C1 — Napredni', value: 'C1' },
            { label: 'C2 — Tečni', value: 'C2' },
          ],
        },
        { name: 'testLink', type: 'text', label: 'Link do rezultata testa engleskog' },
      ],
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      label: 'YouTube video predstavljanje (URL)',
    },
    {
      name: 'cvFileName',
      type: 'text',
      label: 'Naziv CV fajla',
    },
    {
      name: 'facultyCertFileName',
      type: 'text',
      label: 'Naziv fajla uverenja sa fakulteta',
    },
    {
      name: 'facultyCertAiTranslation',
      type: 'checkbox',
      defaultValue: false,
      label: 'AI prevod uverenja je verifikovan i odobren',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'review',
      index: true,
      label: 'Status procesa kandidata',
      options: [
        { label: 'Prijava u toku', value: 'applying' },
        { label: 'Pregled dokumentacije', value: 'review' },
        { label: 'Dokumentacija', value: 'docs' },
        { label: 'Izbor posla & intervju', value: 'job' },
        { label: 'Priprema za vizu & polazak', value: 'departure' },
        { label: 'Spreman / Viza odobrena', value: 'ready' },
      ],
      required: true,
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 30,
      label: 'Napredak u procesu (%)',
      max: 100,
      min: 0,
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Interne beleške i napomene koordinatora',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) {
          if (data.email) data.email = String(data.email).trim().toLowerCase()
          if (data.firstName) data.firstName = String(data.firstName).trim()
          if (data.lastName) data.lastName = String(data.lastName).trim()
          const base = Number(data.basePrice) || 0
          const disc = Number(data.discount) || 0
          data.finalPrice = Math.max(0, base - disc)
        }
        return data
      },
    ],
  },
  labels: {
    plural: 'Aplikacije kandidata',
    singular: 'Aplikacija kandidata',
  },
}
