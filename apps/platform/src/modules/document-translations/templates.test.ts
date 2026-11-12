import { describe, expect, it } from 'vitest'

import {
  translateCity,
  translateEnrollmentStatus,
  translateFaculty,
  translateStudyYear,
  translateUniversity,
} from './templates.ts'

describe('document-translations templates & dictionaries', () => {
  it('translates known university names correctly', () => {
    expect(translateUniversity('Univerzitet u Beogradu')).toBe('University of Belgrade')
    expect(translateUniversity('Univerzitet u Novom Sadu')).toBe('University of Novi Sad')
    expect(translateUniversity('Univerzitet u Nišu')).toBe('University of Niš')
    expect(translateUniversity('Univerzitet u Kragujevcu')).toBe('University of Kragujevac')
    expect(translateUniversity('Univerzitet Singidunum')).toBe('Singidunum University')
  })

  it('falls back gracefully for unknown university names', () => {
    expect(translateUniversity('Nepoznati Univerzitet')).toBe('Nepoznati Univerzitet')
  })

  it('translates common faculties correctly', () => {
    expect(translateFaculty('Fakultet organizacionih nauka')).toBe('Faculty of Organizational Sciences')
    expect(translateFaculty('FON')).toBe('Faculty of Organizational Sciences')
    expect(translateFaculty('Elektrotehnički fakultet')).toBe('School of Electrical Engineering')
    expect(translateFaculty('Ekonomski fakultet')).toBe('Faculty of Economics and Business')
    expect(translateFaculty('Pravni fakultet')).toBe('Faculty of Law')
    expect(translateFaculty('Filozofski fakultet')).toBe('Faculty of Philosophy')
    expect(translateFaculty('Prirodno-matematički fakultet')).toBe('Faculty of Sciences')
  })

  it('translates study years and levels', () => {
    expect(translateStudyYear('1')).toBe('1st Year (Freshman)')
    expect(translateStudyYear('2')).toBe('2nd Year (Sophomore)')
    expect(translateStudyYear('3')).toBe('3rd Year (Junior)')
    expect(translateStudyYear('4')).toBe('4th Year (Senior)')
    expect(translateStudyYear('Master')).toBe('Master Academic Studies')
    expect(translateStudyYear('Apsolvent')).toBe('Final Year / Graduation Status')
  })

  it('translates enrollment and study status', () => {
    expect(translateEnrollmentStatus('Redovan student')).toBe('Full-time enrolled student')
    expect(translateEnrollmentStatus('Redovan')).toBe('Full-time enrolled student')
    expect(translateEnrollmentStatus('Budžet')).toBe('Full-time / State-funded student')
    expect(translateEnrollmentStatus('Samofinansiranje')).toBe('Full-time / Self-funded student')
  })

  it('translates cities correctly', () => {
    expect(translateCity('Beograd')).toBe('Belgrade')
    expect(translateCity('Novi Sad')).toBe('Novi Sad')
    expect(translateCity('Niš')).toBe('Niš')
    expect(translateCity('Nepoznati Grad')).toBe('Nepoznati Grad')
  })
})
