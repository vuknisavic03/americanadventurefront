import type { Access, CollectionConfig } from 'payload'

const administrator: Access = ({ req }) => req.user?.collection === 'users'
const deny = () => false
const immutable = { update: deny }

export const EmploymentOffers: CollectionConfig = {
  slug: 'employment-offers',
  access: { create: deny, delete: deny, read: administrator, update: deny },
  admin: {
    defaultColumns: ['candidateAccount', 'offerVersion', 'employerName', 'jobTitle', 'status', 'notificationStatus'],
    description: 'Objavljene ponude su nepromenljive; ispravka se radi povlačenjem i izdavanjem nove verzije.',
    group: 'Posao i intervju',
    useAsTitle: 'employerName',
  },
  fields: [
    { name: 'candidateJobOption', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Izabrana opcija posla', relationTo: 'candidate-job-options' },
    { name: 'candidateProcess', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Proces kandidata', relationTo: 'candidate-processes', required: true },
    { name: 'candidateAccount', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidatski nalog', relationTo: 'candidate-accounts', required: true },
    { name: 'applicant', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Kandidat', relationTo: 'applicants', required: true },
    { name: 'preApplication', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Izvorna prijava', relationTo: 'pre-applications', required: true },
    { name: 'programCode', type: 'select', access: immutable, admin: { readOnly: true }, label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'offerVersion', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Verzija ponude', min: 1, required: true },
    { name: 'statusVersion', type: 'number', admin: { hidden: true }, defaultValue: 1, min: 1, required: true },
    { name: 'status', type: 'select', admin: { readOnly: true }, label: 'Status', options: [
      { label: 'Objavljena - čeka prihvatanje', value: 'PUBLISHED' },
      { label: 'Elektronski prihvaćena', value: 'ACCEPTED' },
      { label: 'Povučena', value: 'WITHDRAWN' },
    ], required: true },
    { name: 'employerName', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Poslodavac', maxLength: 200, required: true },
    { name: 'jobTitle', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Radna pozicija', maxLength: 160, required: true },
    { name: 'workCity', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Grad', maxLength: 120, required: true },
    { name: 'workState', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Savezna država', maxLength: 100, required: true },
    { name: 'startDate', type: 'date', access: immutable, admin: { date: { pickerAppearance: 'dayOnly' }, readOnly: true }, label: 'Početak rada', required: true },
    { name: 'endDate', type: 'date', access: immutable, admin: { date: { pickerAppearance: 'dayOnly' }, readOnly: true }, label: 'Kraj rada', required: true },
    { name: 'hourlyWageCents', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Satnica u centima (USD)', min: 1, required: true },
    { name: 'currency', type: 'select', access: immutable, admin: { readOnly: true }, label: 'Valuta', options: [{ label: 'USD', value: 'USD' }], required: true },
    { name: 'expectedWeeklyHours', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Očekivani sati nedeljno', min: 1, max: 80, required: true },
    { name: 'housingProvided', type: 'checkbox', access: immutable, admin: { readOnly: true }, label: 'Poslodavac obezbeđuje smeštaj', required: true },
    { name: 'housingCostCents', type: 'number', access: immutable, admin: { readOnly: true }, label: 'Trošak smeštaja nedeljno u centima (USD)', min: 0 },
    { name: 'housingDescription', type: 'textarea', access: immutable, admin: { readOnly: true }, label: 'Informacije o smeštaju', maxLength: 1_000 },
    { name: 'candidateInstructions', type: 'textarea', access: immutable, admin: { readOnly: true }, label: 'Uputstvo za kandidata', maxLength: 2_000, required: true },
    { name: 'internalNotes', type: 'textarea', admin: { readOnly: true }, label: 'Interna napomena', maxLength: 2_000 },
    { name: 'responseDueAt', type: 'date', access: immutable, admin: { readOnly: true }, label: 'Rok za prihvatanje' },
    { name: 'snapshotChecksum', type: 'text', access: immutable, admin: { readOnly: true }, label: 'Kontrolni otisak ponude', required: true },
    { name: 'publishedAt', type: 'date', access: immutable, admin: { readOnly: true }, label: 'Objavljena', required: true },
    { name: 'publishedBy', type: 'relationship', access: immutable, admin: { readOnly: true }, label: 'Objavio/la', relationTo: 'users', required: true },
    { name: 'notificationStatus', type: 'select', admin: { readOnly: true }, label: 'Obaveštenje', options: [
      { label: 'Čeka slanje', value: 'PENDING' },
      { label: 'Poslato', value: 'DELIVERED' },
      { label: 'Slanje nije uspelo', value: 'FAILED' },
    ], required: true },
    { name: 'notificationDeliveredAt', type: 'date', admin: { readOnly: true }, label: 'Obaveštenje poslato' },
    { name: 'messageDelivery', type: 'relationship', admin: { readOnly: true }, label: 'Evidencija poruke', relationTo: 'message-deliveries' },
    { name: 'withdrawnAt', type: 'date', admin: { readOnly: true }, label: 'Povučena' },
    { name: 'withdrawnBy', type: 'relationship', admin: { readOnly: true }, label: 'Povukao/la', relationTo: 'users' },
    { name: 'withdrawalReason', type: 'textarea', admin: { readOnly: true }, label: 'Razlog povlačenja', maxLength: 1_000 },
  ],
  indexes: [
    { fields: ['candidateProcess', 'offerVersion'], unique: true },
    { fields: ['candidateAccount', 'status'] },
    { fields: ['employerName', 'workState'] },
  ],
  labels: { plural: 'Radne ponude', singular: 'Radna ponuda' },
}
