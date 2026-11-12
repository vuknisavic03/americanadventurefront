import { createHash } from 'node:crypto'

export const jobCategoryOptions = [
  { label: 'Ugostiteljstvo', value: 'HOSPITALITY' },
  { label: 'Hrana i piće', value: 'FOOD_SERVICE' },
  { label: 'Prodaja', value: 'RETAIL' },
  { label: 'Spasilac na bazenu ili plaži', value: 'LIFEGUARD' },
  { label: 'Održavanje i domaćinstvo', value: 'HOUSEKEEPING' },
  { label: 'Zabavni park i rekreacija', value: 'RECREATION' },
  { label: 'Ostalo', value: 'OTHER' },
] as const

export type JobCategory = (typeof jobCategoryOptions)[number]['value']

export type JobOpeningSnapshot = {
  candidateInstructions: string
  employerName: string
  endDate: string
  expectedWeeklyHours: number
  hourlyWageCents: number
  housingCostCents?: number
  housingDescription?: string
  housingProvided: boolean
  jobCategory: JobCategory
  jobTitle: string
  openingCode: string
  openingRevision: number
  startDate: string
  workCity: string
  workState: string
}

export function jobOptionSnapshot(snapshot: JobOpeningSnapshot) {
  return JSON.stringify({
    ...snapshot,
    housingCostCents: snapshot.housingCostCents ?? null,
    housingDescription: snapshot.housingDescription ?? null,
  })
}

export function jobOptionChecksum(snapshot: JobOpeningSnapshot) {
  return createHash('sha256').update(jobOptionSnapshot(snapshot)).digest('hex')
}
