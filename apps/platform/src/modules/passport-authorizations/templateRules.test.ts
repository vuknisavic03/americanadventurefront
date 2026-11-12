import { describe, expect, it } from 'vitest'

import {
  passportAuthorizationTemplateChecksum,
  renderPassportAuthorizationTemplate,
  validatePassportAuthorizationTemplate,
} from './templateRules.ts'

describe('passport authorization template rules', () => {
  it('accepts only the explicit placeholder allowlist', () => {
    expect(validatePassportAuthorizationTemplate(
      'Punomoćje {{ authorization.number }} za {{ candidate.fullName }}',
    )).toBeUndefined()
    expect(validatePassportAuthorizationTemplate('Lozinka: {{ candidate.password }}')).toContain('candidate.password')
  })

  it('creates a stable checksum for an immutable template version', () => {
    expect(passportAuthorizationTemplateChecksum('template')).toBe(passportAuthorizationTemplateChecksum('template'))
    expect(passportAuthorizationTemplateChecksum('template')).not.toBe(passportAuthorizationTemplateChecksum('changed'))
  })

  it('renders every supported value without leaving unresolved placeholders', () => {
    const rendered = renderPassportAuthorizationTemplate(
      '{{ candidate.fullName }}, JMBG {{ candidate.personalId }}, {{ candidate.address }} — {{ authorization.number }}, {{ authorization.date }}',
      {
        'authorization.date': '14. septembar 2026.',
        'authorization.number': 'AA-PUN-2026-000051',
        'candidate.address': 'Sintetička 1, Beograd',
        'candidate.fullName': 'Ana Anić',
        'candidate.personalId': '1504002710006',
      },
    )
    expect(rendered).toBe('Ana Anić, JMBG 1504002710006, Sintetička 1, Beograd — AA-PUN-2026-000051, 14. septembar 2026.')
    expect(rendered).not.toContain('{{')
  })
})
