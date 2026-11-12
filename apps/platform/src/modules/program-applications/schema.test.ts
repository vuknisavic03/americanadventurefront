import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  applicationSchemaChecksum,
  normalizeTemplateFields,
  type ProgramApplicationSchemaSnapshot,
  validateProgramApplicationAnswers,
} from './schema.ts'

const fields = normalizeTemplateFields([
  { fieldType: 'TEXT', key: 'emergencyContactName', label: 'Kontakt za hitne slučajeve', required: true },
  { fieldType: 'NUMBER', key: 'previousUsaSeasons', label: 'Broj prethodnih sezona', required: false },
  { fieldType: 'DATE', key: 'preferredDepartureDate', label: 'Željeni datum polaska', required: true },
  { fieldType: 'TEXTAREA', key: 'workExperience', label: 'Radno iskustvo', maxLength: 1_000, required: false },
])

describe('program application schema', () => {
  it('keeps the schema checksum stable after a JSONB key reorder', () => {
    const canonicalSnapshot: ProgramApplicationSchemaSnapshot = {
      fields: [
        { fieldType: 'TEXT', key: 'emergencyContactName', label: 'Kontakt za hitne slučajeve', maxLength: 160, required: true },
        { fieldType: 'DATE', key: 'preferredDepartureDate', label: 'Željeni datum polaska', required: true },
      ],
      instructions: 'Popunite sva obavezna polja.',
      name: 'Work & Travel aplikacija',
      programCode: 'SWT',
      version: 1,
    }
    const jsonbOrderedSnapshot = {
      name: canonicalSnapshot.name,
      fields: canonicalSnapshot.fields.map((field) => ({
        key: field.key,
        label: field.label,
        required: field.required,
        fieldType: field.fieldType,
        ...(field.maxLength ? { maxLength: field.maxLength } : {}),
      })),
      version: canonicalSnapshot.version,
      programCode: canonicalSnapshot.programCode,
      instructions: canonicalSnapshot.instructions,
    } as ProgramApplicationSchemaSnapshot

    const legacyChecksum = createHash('sha256').update(JSON.stringify(canonicalSnapshot)).digest('hex')
    expect(applicationSchemaChecksum(canonicalSnapshot)).toBe(legacyChecksum)
    expect(applicationSchemaChecksum(jsonbOrderedSnapshot)).toBe(legacyChecksum)
  })

  it('normalizes supported template fields and applies safe length limits', () => {
    expect(fields).toEqual([
      expect.objectContaining({ key: 'emergencyContactName', maxLength: 500 }),
      expect.objectContaining({ key: 'previousUsaSeasons', maxLength: undefined }),
      expect.objectContaining({ key: 'preferredDepartureDate', maxLength: undefined }),
      expect.objectContaining({ key: 'workExperience', maxLength: 1_000 }),
    ])
  })

  it('rejects duplicate or unsafe template keys', () => {
    expect(() => normalizeTemplateFields([
      { fieldType: 'TEXT', key: 'sameKey', label: 'Prvo polje', required: true },
      { fieldType: 'TEXT', key: 'sameKey', label: 'Drugo polje', required: true },
    ])).toThrow('jedinstveni ključ')
    expect(() => normalizeTemplateFields([
      { fieldType: 'TEXT', key: '__proto__', label: 'Nedozvoljeno polje', required: true },
    ])).toThrow('nije ispravno definisano')
    expect(() => normalizeTemplateFields([
      { fieldType: 'TEXT', key: 'constructor', label: 'Nedozvoljeno polje', required: true },
    ])).toThrow('nije dozvoljen')
  })

  it('allows an incomplete draft and normalizes values that are present', () => {
    const result = validateProgramApplicationAnswers({
      answers: {
        preferredDepartureDate: '2027-06-10',
        previousUsaSeasons: '2',
        workExperience: '  Sezonski posao u hotelu.  ',
      },
      fields,
      requireComplete: false,
    })
    expect(result).toEqual({
      completionPercent: 50,
      fieldErrors: {},
      normalizedAnswers: {
        preferredDepartureDate: '2027-06-10',
        previousUsaSeasons: 2,
        workExperience: 'Sezonski posao u hotelu.',
      },
    })
  })

  it('requires every mandatory field for final submission', () => {
    const result = validateProgramApplicationAnswers({
      answers: { emergencyContactName: 'Ana Petrović' },
      fields,
      requireComplete: true,
    })
    expect(result.completionPercent).toBe(50)
    expect(result.fieldErrors).toEqual({ preferredDepartureDate: 'Ovo polje je obavezno.' })
  })

  it('validates calendar dates, numbers, length limits, and unknown fields', () => {
    expect(validateProgramApplicationAnswers({
      answers: {
        emergencyContactName: 'Ana Petrović',
        preferredDepartureDate: '2027-02-31',
        previousUsaSeasons: 'nije broj',
        workExperience: 'x'.repeat(1_001),
      },
      fields,
      requireComplete: true,
    }).fieldErrors).toEqual({
      preferredDepartureDate: 'Unesite ispravan datum.',
      previousUsaSeasons: 'Unesite ispravan broj.',
      workExperience: 'Dozvoljeno je najviše 1000 znakova.',
    })
    expect(() => validateProgramApplicationAnswers({
      answers: { administratorOnly: 'ne' },
      fields,
      requireComplete: false,
    })).toThrow('ne pripadaju ovom šablonu')
  })
})
