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

export const UsaStayTips: CollectionConfig = {
  slug: 'usa-stay-tips',
  access: {
    create: isAdministrator,
    delete: isAdministrator,
    read: authenticatedUsersOrAdmin,
    update: isAdministrator,
  },
  admin: {
    defaultColumns: ['title', 'category', 'pinned', 'published', 'sortOrder', 'createdAt'],
    description: 'Korisni saveti i smernice za život i rad u SAD (FR-062).',
    group: 'Boravak u SAD i podrška',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Naslov saveta',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'GENERAL',
      label: 'Kategorija saveta',
      options: [
        { label: 'Social Security Number (SSN)', value: 'SSN' },
        { label: 'Bankovni račun i kartice', value: 'BANKING' },
        { label: 'Smeštaj i depozit', value: 'HOUSING' },
        { label: 'Prevoz i transport', value: 'TRANSPORT' },
        { label: 'Kultura rada i bakšiš', value: 'WORK_CULTURE' },
        { label: 'Zdravlje i bezbednost', value: 'HEALTH_SAFETY' },
        { label: 'Opšti saveti i preporuke', value: 'GENERAL' },
      ],
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Kratak sažetak saveta',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Detaljan tekst i instrukcije',
      required: true,
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      label: 'Istaknut savet (prikazuje se na vrhu)',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Redosled prikaza',
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
    plural: 'Korisni saveti za SAD',
    singular: 'Korisni savet za SAD',
  },
}
