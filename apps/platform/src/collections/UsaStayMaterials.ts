import type { Access, CollectionConfig } from 'payload'

const isAdministrator: Access = ({ req }) => req.user?.collection === 'users'

const authenticatedUsersOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection === 'candidate-accounts') {
    return {
      published: { equals: true },
    }
  }
  return false
}

export const UsaStayMaterials: CollectionConfig = {
  slug: 'usa-stay-materials',
  access: {
    create: isAdministrator,
    delete: isAdministrator,
    read: authenticatedUsersOrAdmin,
    update: isAdministrator,
  },
  admin: {
    defaultColumns: ['title', 'category', 'programCode', 'published', 'sortOrder', 'createdAt'],
    description: 'Zvanični materijali, priručnici i dokumentacija za boravak u SAD (FR-060).',
    group: 'Boravak u SAD i podrška',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Naziv materijala',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Kratak opis sadržaja',
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'HANDBOOK',
      label: 'Kategorija',
      options: [
        { label: 'Zvanični priručnik (Handbook)', value: 'HANDBOOK' },
        { label: 'Zdravstveno osiguranje i prava', value: 'INSURANCE' },
        { label: 'SEVIS prijava i status', value: 'SEVIS' },
        { label: 'SOS i hitni kontakti', value: 'EMERGENCY' },
        { label: 'Porezi i obrasci (W-2 / W-4)', value: 'TAXES' },
        { label: 'Ostali materijali i vodiči', value: 'OTHER' },
      ],
      required: true,
    },
    {
      name: 'programCode',
      type: 'select',
      defaultValue: 'SWT',
      label: 'Ciljni program',
      options: [
        { label: 'Work & Travel USA (SWT)', value: 'SWT' },
        { label: 'Svi programi', value: 'ALL' },
      ],
      required: true,
    },
    {
      name: 'fileUrl',
      type: 'text',
      label: 'URL ili putanja do fajla/dokumenta',
      required: true,
    },
    {
      name: 'fileName',
      type: 'text',
      label: 'Naziv fajla za preuzimanje (npr. SWT_Prirucnik_2026.pdf)',
      required: true,
    },
    {
      name: 'fileSize',
      type: 'text',
      label: 'Veličina fajla (npr. 2.4 MB)',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Redosled prikaza (manji broj = prikazuje se prvi)',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      label: 'Objavljeno i vidljivo kandidatima',
    },
  ],
  labels: {
    plural: 'Materijali za boravak u SAD',
    singular: 'Materijal za boravak u SAD',
  },
}
