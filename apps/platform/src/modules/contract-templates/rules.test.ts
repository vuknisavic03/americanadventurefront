import { describe, expect, it } from 'vitest'

import {
  contractTemplateChecksum,
  FULL_PLACEMENT_2027_SAMPLE_BODY,
  renderContractTemplate,
  SELF_PLACEMENT_2027_SAMPLE_BODY,
  validateContractTemplateBody,
} from './rules.ts'

describe('contract template rules', () => {
  it('accepts only the explicit placeholder allowlist', () => {
    expect(validateContractTemplateBody('Ugovor {{ contract.number }} za {{ candidate.fullName }}')).toBeUndefined()
    expect(validateContractTemplateBody('Token: {{ candidate.password }}')).toContain('candidate.password')
  })

  it('creates a stable checksum for the immutable snapshot', () => {
    expect(contractTemplateChecksum('template')).toBe(contractTemplateChecksum('template'))
    expect(contractTemplateChecksum('template')).not.toBe(contractTemplateChecksum('changed'))
  })

  it('renders only allowlisted placeholders with exact values', () => {
    expect(renderContractTemplate(
      'Ugovor {{ contract.number }} za {{ candidate.fullName }}',
      { 'candidate.fullName': 'Ana Anić', 'contract.number': 'AA-SWT-2026-000001' },
    )).toBe('Ugovor AA-SWT-2026-000001 za Ana Anić')
  })

  it('validates 2027 FULL and SELF placement sample contract bodies cleanly', () => {
    expect(validateContractTemplateBody(FULL_PLACEMENT_2027_SAMPLE_BODY)).toBeUndefined()
    expect(validateContractTemplateBody(SELF_PLACEMENT_2027_SAMPLE_BODY)).toBeUndefined()
  })
})

