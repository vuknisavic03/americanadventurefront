import { describe, expect, it } from 'vitest'

import { jobOptionChecksum, jobOptionSnapshot, type JobOpeningSnapshot } from './rules.ts'

const opening: JobOpeningSnapshot = {
  candidateInstructions: 'Sintetička opcija za test.',
  employerName: 'Synthetic Harbor LLC',
  endDate: '2030-09-01T00:00:00.000Z',
  expectedWeeklyHours: 32,
  hourlyWageCents: 1_650,
  housingCostCents: 14_000,
  housingDescription: 'Sintetički smeštaj.',
  housingProvided: true,
  jobCategory: 'HOSPITALITY',
  jobTitle: 'Guest Services Associate',
  openingCode: 'JOB-SYNTH001',
  openingRevision: 1,
  startDate: '2030-06-01T00:00:00.000Z',
  workCity: 'Ocean City',
  workState: 'Maryland',
}

describe('job option rules', () => {
  it('creates a deterministic fingerprint of the exact terms shown to a candidate', () => {
    expect(jobOptionChecksum(opening)).toHaveLength(64)
    expect(jobOptionSnapshot(opening)).toBe(jobOptionSnapshot({ ...opening }))
  })

  it('changes the fingerprint when a catalog revision changes', () => {
    expect(jobOptionChecksum(opening)).not.toBe(jobOptionChecksum({ ...opening, openingRevision: 2 }))
  })
})
