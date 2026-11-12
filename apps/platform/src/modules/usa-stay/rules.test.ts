import { describe, expect, it } from 'vitest'

import { usaMaterialCategories, usaTipCategories } from './rules.ts'
import { updatePeerConsentSchema } from './schema.ts'

describe('usa-stay rules and schemas', () => {
  it('defines the required material categories for FR-060', () => {
    const categories = usaMaterialCategories.map((c) => c.value)
    expect(categories).toContain('HANDBOOK')
    expect(categories).toContain('INSURANCE')
    expect(categories).toContain('SEVIS')
    expect(categories).toContain('EMERGENCY')
    expect(categories).toContain('TAXES')
    expect(categories).toContain('OTHER')
  })

  it('defines the required tip categories for FR-062', () => {
    const categories = usaTipCategories.map((c) => c.value)
    expect(categories).toContain('SSN')
    expect(categories).toContain('BANKING')
    expect(categories).toContain('HOUSING')
    expect(categories).toContain('TRANSPORT')
    expect(categories).toContain('WORK_CULTURE')
    expect(categories).toContain('HEALTH_SAFETY')
    expect(categories).toContain('GENERAL')
  })

  it('validates peer consent boolean input for FR-061', () => {
    const validTrue = updatePeerConsentSchema.safeParse({ consent: true })
    expect(validTrue.success).toBe(true)
    if (validTrue.success) {
      expect(validTrue.data.consent).toBe(true)
    }

    const validFalse = updatePeerConsentSchema.safeParse({ consent: false })
    expect(validFalse.success).toBe(true)
    if (validFalse.success) {
      expect(validFalse.data.consent).toBe(false)
    }

    const invalid = updatePeerConsentSchema.safeParse({ consent: 'yes' })
    expect(invalid.success).toBe(false)
  })
})
