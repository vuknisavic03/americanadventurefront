import { describe, expect, it } from 'vitest'

import { createPreApplicationSchema, normalizePreApplicationInput } from './schema.ts'

const validInput = {
  currentStudyYear: 'YEAR_3',
  dateOfBirth: '2002-04-15',
  email: ' Kandidat@example.com ',
  espbPoints: 132,
  facultyName: 'Univerzitet u Beogradu',
  firstName: ' Ana ',
  lastName: ' Jovanović ',
  newsletterConsent: false,
  phone: ' +381 64 123 4567 ',
  privacyConsent: true,
  residentialAddress: 'Bulevar oslobođenja 1, Novi Sad',
  studyCity: 'Beograd',
  studyInterruptionStatus: 'NONE',
}

describe('pre-application validation', () => {
  it('accepts and normalizes a valid submission', () => {
    const parsed = createPreApplicationSchema(new Date('2026-08-27T12:00:00.000Z')).parse(validInput)

    expect(normalizePreApplicationInput(parsed)).toMatchObject({
      email: 'Kandidat@example.com',
      emailNormalized: 'kandidat@example.com',
      firstName: 'Ana',
      firstNameNormalized: 'ana',
      phoneNormalized: '+381641234567',
    })
  })

  it('rejects a submission without privacy consent', () => {
    const result = createPreApplicationSchema().safeParse({ ...validInput, privacyConsent: false })

    expect(result.success).toBe(false)
  })

  it('rejects a future or impossible birth date', () => {
    const schema = createPreApplicationSchema(new Date('2026-08-27T12:00:00.000Z'))

    expect(schema.safeParse({ ...validInput, dateOfBirth: '2027-01-01' }).success).toBe(false)
    expect(schema.safeParse({ ...validInput, dateOfBirth: '2002-02-31' }).success).toBe(false)
  })

  it('requires an explanation for the OTHER interruption option', () => {
    const result = createPreApplicationSchema().safeParse({
      ...validInput,
      studyInterruptionStatus: 'OTHER',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['studyInterruptionExplanation'])
    }
  })

  it('rejects unknown fields and malformed contact data', () => {
    const schema = createPreApplicationSchema()

    expect(schema.safeParse({ ...validInput, internalStatus: 'APPROVED' }).success).toBe(false)
    expect(schema.safeParse({ ...validInput, email: 'not-an-email' }).success).toBe(false)
    expect(schema.safeParse({ ...validInput, phone: '123' }).success).toBe(false)
  })
})
