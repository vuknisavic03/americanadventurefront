import { describe, expect, it } from 'vitest'

import { paymentSelectionSchema } from './schema.ts'

describe('payment selection request schema', () => {
  it('accepts an explicit confirmation and a supported method', () => {
    expect(paymentSelectionSchema.safeParse({ confirmed: true, method: 'INSTALLMENTS' }).success).toBe(true)
  })

  it('rejects missing confirmation, unsupported methods and extra fields', () => {
    expect(paymentSelectionSchema.safeParse({ confirmed: false, method: 'ONE_TIME' }).success).toBe(false)
    expect(paymentSelectionSchema.safeParse({ confirmed: true, method: 'CARD' }).success).toBe(false)
    expect(paymentSelectionSchema.safeParse({ confirmed: true, method: 'ONE_TIME', offerId: 2 }).success).toBe(false)
  })
})
