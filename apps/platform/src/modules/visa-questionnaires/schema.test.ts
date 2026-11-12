import { describe, expect, it } from 'vitest'
import {
  adminMutation,
  candidateMutation,
  questionnaireFields,
  questionnaireSections,
  questionnaireVersion,
  validateAnswers,
} from './schema.ts'

describe('visa questionnaire validation', () => {
  it('defines 11 official sections covering DS-160 requirements', () => {
    expect(questionnaireVersion).toBe(2)
    expect(questionnaireSections).toHaveLength(11)
    for (const section of questionnaireSections) {
      const sectionFields = questionnaireFields.filter((f) => f.section === section.id)
      expect(sectionFields.length).toBeGreaterThan(0)
    }
  })

  it('allows incomplete drafts but rejects whitespace-only required answers on submission', () => {
    expect(validateAnswers({ birthPlace: '  ' }, false).errors).toEqual({})
    expect(validateAnswers({ birthPlace: '  ' }, true).errors.birthPlace).toBeTruthy()
    const answers = Object.fromEntries(questionnaireFields.map((field) => [field.key, ' Synthetic ']))
    expect(validateAnswers(answers, true).errors).toEqual({})
    expect(validateAnswers(answers, true).answers.birthPlace).toBe('Synthetic')
  })

  it('rejects foreign fields, overlong answers and ownership injection', () => {
    expect(() => validateAnswers({ completelyUnknownField: 'not-collected-here' }, false)).toThrow('Upitnik sadrži nepoznata polja.')
    expect(validateAnswers({ birthPlace: 'x'.repeat(161) }, false).errors.birthPlace).toBeTruthy()
    expect(candidateMutation.safeParse({ action: 'SAVE_DRAFT', answers: {}, expectedRevision: 0, candidateAccountId: 99 }).success).toBe(false)
    expect(adminMutation.safeParse({ action: 'APPROVE', expectedRevision: 0 }).success).toBe(false)
  })
})
