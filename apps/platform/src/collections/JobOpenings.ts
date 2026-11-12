import { randomUUID } from 'node:crypto'
import { ValidationError, type Access, type CollectionConfig } from 'payload'

import { jobCategoryOptions } from '../modules/job-options/rules.ts'

const administrator: Access = ({ req }) => req.user?.collection === 'users'

export const JobOpenings: CollectionConfig = {
  slug: 'job-openings',
  access: { create: administrator, delete: administrator, read: administrator, update: administrator },
  admin: {
    hidden: true,
    defaultColumns: ['openingCode', 'employerName', 'jobTitle', 'workCity', 'workState', 'jobCategory', 'status', 'availablePositions'],
    description: 'Centralni katalog poslova. Kandidat dobija nepromenljivi snimak uslova, pa kasnija izmena kataloga ne menja ono što mu je poslato.',
    group: 'Posao i intervju',
    useAsTitle: 'openingCode',
  },
  fields: [
    { name: 'openingCode', type: 'text', admin: { readOnly: true }, index: true, label: 'Šifra posla', required: true, unique: true },
    { name: 'campaignCode', type: 'text', index: true, label: 'Sezona / kampanja', maxLength: 80, required: true },
    { name: 'programCode', type: 'select', defaultValue: 'SWT', label: 'Program', options: [{ label: 'Work & Travel', value: 'SWT' }], required: true },
    { name: 'status', type: 'select', defaultValue: 'DRAFT', index: true, label: 'Dostupnost', options: [
      { label: 'Nacrt', value: 'DRAFT' },
      { label: 'Otvoren', value: 'OPEN' },
      { label: 'Privremeno pauziran', value: 'PAUSED' },
      { label: 'Zatvoren', value: 'CLOSED' },
    ], required: true },
    { name: 'employerName', type: 'text', label: 'Poslodavac', maxLength: 200, required: true },
    { name: 'jobTitle', type: 'text', label: 'Radna pozicija', maxLength: 160, required: true },
    { name: 'jobCategory', type: 'select', index: true, label: 'Vrsta posla', options: [...jobCategoryOptions], required: true },
    { name: 'workCity', type: 'text', index: true, label: 'Grad', maxLength: 120, required: true },
    { name: 'workState', type: 'text', index: true, label: 'Savezna država', maxLength: 100, required: true },
    { name: 'startDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } }, label: 'Početak rada', required: true },
    { name: 'endDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } }, label: 'Kraj rada', required: true },
    { name: 'hourlyWageCents', type: 'number', label: 'Satnica u centima (USD)', min: 1, required: true },
    { name: 'expectedWeeklyHours', type: 'number', label: 'Očekivani sati nedeljno', max: 80, min: 1, required: true },
    { name: 'housingProvided', type: 'checkbox', defaultValue: false, label: 'Poslodavac obezbeđuje smeštaj', required: true },
    { name: 'housingCostCents', type: 'number', label: 'Nedeljni trošak smeštaja u centima (USD)', min: 0 },
    { name: 'housingDescription', type: 'textarea', label: 'Informacije o smeštaju', maxLength: 1_000 },
    { name: 'candidateInstructions', type: 'textarea', label: 'Opis i uputstvo koje kandidat vidi', maxLength: 2_000, required: true },
    { name: 'eligibilityNotes', type: 'textarea', label: 'Interni uslovi i napomena', maxLength: 2_000 },
    { name: 'availablePositions', type: 'number', label: 'Broj poznatih slobodnih mesta (opciono)', min: 0 },
    { name: 'revision', type: 'number', admin: { readOnly: true }, defaultValue: 1, label: 'Revizija kataloga', min: 1, required: true },
  ],
  hooks: {
    beforeValidate: [({ data, operation }) => {
      if (operation === 'create' && data && !data.openingCode) data.openingCode = `JOB-${randomUUID().slice(0, 8).toUpperCase()}`
      return data
    }],
    beforeChange: [({ data, operation, originalDoc, req }) => {
      const merged = { ...originalDoc, ...data }
      if (new Date(merged.endDate).getTime() <= new Date(merged.startDate).getTime()) {
        throw new ValidationError({ collection: 'job-openings', errors: [{ message: 'Kraj rada mora biti posle početka rada.', path: 'endDate' }], id: originalDoc?.id, req })
      }
      if (!merged.housingProvided && merged.housingCostCents !== undefined && merged.housingCostCents !== null) {
        throw new ValidationError({ collection: 'job-openings', errors: [{ message: 'Trošak se unosi samo ako poslodavac obezbeđuje smeštaj.', path: 'housingCostCents' }], id: originalDoc?.id, req })
      }
      data.revision = operation === 'create' ? 1 : (originalDoc.revision ?? 1) + 1
      return data
    }],
  },
  indexes: [{ fields: ['campaignCode', 'status'] }, { fields: ['workState', 'workCity', 'jobCategory'] }],
  labels: { plural: 'Katalog poslova', singular: 'Posao iz kataloga' },
}
