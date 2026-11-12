import { describe, expect, it } from 'vitest'
import { calculateMod97, generatePaymentReference, preparePaymentSlip } from './paymentSlips.ts'

describe('paymentSlips domain', () => {
  it('calculates ISO 7064 Modulo 97 control digits', () => {
    const ref = calculateMod97('12345678')
    expect(ref).toMatch(/^\d{10}$/)
    // Must start with 2 control digits
    expect(Number(ref.slice(0, 2))).toBeGreaterThanOrEqual(1)
    expect(Number(ref.slice(0, 2))).toBeLessThanOrEqual(98)
  })

  it('generates consistent reference numbers for a candidate account and obligation', () => {
    const ref1 = generatePaymentReference(42, 'INITIAL')
    const ref2 = generatePaymentReference(42, 'INITIAL')
    expect(ref1).toBe(ref2)
    expect(ref1.length).toBeGreaterThanOrEqual(8)
  })

  it('prepares complete payment slip data with NBS IPS string', () => {
    const slip = preparePaymentSlip({
      candidateAddress: 'Knez Mihailova 10, Beograd',
      candidateName: 'Nikola Tesla',
      currency: 'RSD',
      obligationKey: 'INITIAL',
      obligationLabel: 'I rata programa',
      paymentAmountRsd: 35000,
    }, 42)

    expect(slip.candidateName).toBe('Nikola Tesla')
    expect(slip.paymentAmountFormatted).toBe('35.000,00 RSD')
    expect(slip.recipientAccount).toContain('160-')
    expect(slip.paymentModel).toBe('97')
    expect(slip.paymentCode).toBe('289')
    expect(slip.ipsQrPayload).toContain('K:PR|V:01')
    expect(slip.ipsQrPayload).toContain('American Adventure DOO')
  })
})
