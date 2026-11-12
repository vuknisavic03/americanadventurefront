import { describe, expect, it } from 'vitest'

import {
  calculateProgressPercent,
  getStepLabel,
  matchesSearchQuery,
  projectFields,
  resolveExportColumns,
  sanitizeExcelCellValue,
} from './rules.ts'

describe('Admin Candidates Rules', () => {
  it('returns Serbian step labels for defined steps and fallback for unknown', () => {
    expect(getStepLabel('PROFILE_SETUP')).toBe('Profil kandidata')
    expect(getStepLabel('JOB_PLACEMENT')).toBe('Posao i intervju')
    expect(getStepLabel('TRAVEL_PREPARATION')).toBe('Putovanje i orijentacija')
    expect(getStepLabel('UNKNOWN_STEP')).toBe('UNKNOWN_STEP')
  })

  it('calculates progress percent from step or explicit value', () => {
    expect(calculateProgressPercent('PROFILE_SETUP')).toBe(10)
    expect(calculateProgressPercent('JOB_PLACEMENT')).toBe(75)
    expect(calculateProgressPercent('USA_STAY')).toBe(100)
    expect(calculateProgressPercent('PROFILE_SETUP', 42)).toBe(42)
    expect(calculateProgressPercent('PROFILE_SETUP', null)).toBe(10)
  })

  it('matches search query across multiple fields (FR-074)', () => {
    const candidate = {
      email: 'student@example.test',
      firstName: 'Nikola',
      fullName: 'Nikola Tesla',
      idCardOrPassportNumber: 'P12345678',
      lastName: 'Tesla',
      phone: '+38164111222',
    }

    expect(matchesSearchQuery(candidate, '')).toBe(true)
    expect(matchesSearchQuery(candidate, 'nikola')).toBe(true)
    expect(matchesSearchQuery(candidate, 'TESLA')).toBe(true)
    expect(matchesSearchQuery(candidate, 'student@example')).toBe(true)
    expect(matchesSearchQuery(candidate, '111222')).toBe(true)
    expect(matchesSearchQuery(candidate, '123456')).toBe(true)
    expect(matchesSearchQuery(candidate, 'nonexistent')).toBe(false)
  })

  it('projects selected fields while preserving identifier (FR-067)', () => {
    const candidate = {
      email: 'student@example.test',
      fullName: 'Marko Marković',
      hasJobOffer: false,
      id: 42,
      idCardOrPassportNumber: '00987654',
      processStatus: 'ACTIVE',
    }

    const projected = projectFields(candidate, 'fullName,idCardOrPassportNumber')
    expect(projected).toEqual({
      fullName: 'Marko Marković',
      id: 42,
      idCardOrPassportNumber: '00987654',
    })

    // When empty, returns all
    expect(projectFields(candidate, '')).toEqual(candidate)
  })

  it('sanitizes formula-leading cell values to prevent CSV/formula injection (FR-069)', () => {
    expect(sanitizeExcelCellValue('Normal Text')).toBe('Normal Text')
    expect(sanitizeExcelCellValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
    expect(sanitizeExcelCellValue('+123456789')).toBe("'+123456789")
    expect(sanitizeExcelCellValue('-100')).toBe("'-100")
    expect(sanitizeExcelCellValue('@cmd|calc')).toBe("'@cmd|calc")
    expect(sanitizeExcelCellValue('  =FORMULA()')).toBe("'  =FORMULA()")
    expect(sanitizeExcelCellValue(100)).toBe(100)
    expect(sanitizeExcelCellValue(null)).toBe('')
    expect(sanitizeExcelCellValue(undefined)).toBe('')
  })

  it('resolves export columns and handles field aliases (FR-067, FR-069)', () => {
    // Bez filtera polja vraća sve kolone
    const allCols = resolveExportColumns()
    expect(allCols.length).toBeGreaterThanOrEqual(15)
    expect(allCols.some((c) => c.key === 'firstName')).toBe(true)

    // Sa specifičnim poljima i alijasima
    const projected = resolveExportColumns('name,surname,passport,status')
    const keys = projected.map((c) => c.key)
    expect(keys).toEqual(['firstName', 'lastName', 'idCardOrPassportNumber', 'processStatus'])
  })
})
