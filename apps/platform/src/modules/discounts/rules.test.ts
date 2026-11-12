import { describe, expect, it } from 'vitest'

import {
  adjustInstallmentsForDiscount,
  buildDiscountLineItem,
  calculateEffectiveBasePrice,
  calculateTotalDiscounts,
  DEFAULT_DISCOUNT_AMOUNTS,
  isValidDiscountCode,
  normalizeDiscountCode,
  validateDiscountsAgainstBasePrice,
  validateFamilyKinshipData,
  validateLifeguardData,
  validateReturneeData,
} from './rules.ts'

describe('discounts rules', () => {
  describe('code normalization and validation', () => {
    it('normalizes codes to uppercase and strips invalid characters', () => {
      expect(normalizeDiscountCode('  grp-fon_26! ')).toBe('GRP-FON_26')
      expect(normalizeDiscountCode('ambassador 2026')).toBe('AMBASSADOR2026')
    })

    it('validates discount code lengths', () => {
      expect(isValidDiscountCode('AB')).toBe(false)
      expect(isValidDiscountCode('GRP')).toBe(true)
      expect(isValidDiscountCode('AMBASSADOR_2026_CODE')).toBe(true)
      expect(isValidDiscountCode('A'.repeat(33))).toBe(false)
    })
  })

  describe('price and discount calculations', () => {
    it('calculates total discounts correctly', () => {
      expect(calculateTotalDiscounts([])).toBe(0)
      expect(
        calculateTotalDiscounts([
          { amountCents: 5000 },
          { amountCents: 10000 },
          { amountCents: -500 }, // negative guarded to 0
        ]),
      ).toBe(15000)
    })

    it('calculates effective base price without dipping below zero', () => {
      expect(calculateEffectiveBasePrice(250000, [{ amountCents: 5000 }, { amountCents: 10000 }])).toBe(235000)
      expect(calculateEffectiveBasePrice(5000, [{ amountCents: 10000 }])).toBe(0)
      expect(calculateEffectiveBasePrice(0, [{ amountCents: 10000 }])).toBe(0)
    })

    it('validates discounts against base price', () => {
      expect(validateDiscountsAgainstBasePrice(0, [{ amountCents: 5000 }])).toEqual({
        error: 'Osnovna cena mora biti veća od nule.',
        valid: false,
      })

      expect(validateDiscountsAgainstBasePrice(10000, [{ amountCents: 0, label: 'Neispravan' }])).toEqual({
        error: 'Iznos popusta mora biti pozitivan ceo broj centi (Neispravan).',
        valid: false,
      })

      expect(validateDiscountsAgainstBasePrice(5000, [{ amountCents: 6000 }])).toEqual({
        error: 'Ukupan iznos popusta ne može biti veći od osnovne cene programa.',
        valid: false,
      })

      expect(validateDiscountsAgainstBasePrice(250000, [{ amountCents: 5000 }, { amountCents: 10000 }])).toEqual({
        valid: true,
      })
    })
  })

  describe('discount-specific data validation', () => {
    it('validates family kinship data', () => {
      expect(validateFamilyKinshipData({ kinshipType: null, relativeFullName: '' })).toEqual({
        error: 'Ime i prezime srodnika je obavezno.',
        valid: false,
      })
      expect(validateFamilyKinshipData({ kinshipType: null, relativeFullName: 'Petar Petrović' })).toEqual({
        error: 'Vrsta srodstva je obavezna.',
        valid: false,
      })
      expect(validateFamilyKinshipData({ kinshipType: 'SIBLING', relativeFullName: 'Petar Petrović' })).toEqual({
        valid: true,
      })
    })

    it('validates returnee previous season data', () => {
      expect(validateReturneeData({ returneePreviousYear: null })).toEqual({
        error: expect.stringContaining('Godina prethodnog učešća mora biti'),
        valid: false,
      })
      expect(validateReturneeData({ returneePreviousYear: 2005 })).toEqual({
        error: expect.stringContaining('Godina prethodnog učešća mora biti'),
        valid: false,
      })
      expect(validateReturneeData({ returneePreviousYear: 2025 })).toEqual({
        valid: true,
      })
    })

    it('validates lifeguard certification data', () => {
      expect(validateLifeguardData({ lifeguardCertificateNumber: '', lifeguardCertifyingBody: null })).toEqual({
        error: 'Sertifikaciono telo (Crveni krst, Ellis itd.) je obavezno.',
        valid: false,
      })
      expect(validateLifeguardData({ lifeguardCertificateNumber: '', lifeguardCertifyingBody: 'RED_CROSS' })).toEqual({
        error: 'Broj sertifikata/licence je obavezan.',
        valid: false,
      })
      expect(
        validateLifeguardData({
          lifeguardCertificateNumber: 'LG-12345',
          lifeguardCertifyingBody: 'RED_CROSS',
          lifeguardValidUntil: 'invalid-date',
        }),
      ).toEqual({
        error: 'Datum važenja sertifikata nije ispravan.',
        valid: false,
      })
      expect(
        validateLifeguardData({
          lifeguardCertificateNumber: 'LG-12345',
          lifeguardCertifyingBody: 'RED_CROSS',
          lifeguardValidUntil: '2027-05-31',
        }),
      ).toEqual({
        valid: true,
      })
    })
  })

  describe('installment scaling for discounts', () => {
    it('adjusts installment items proportionally to the discounted base price', () => {
      const originalInstallments = [
        { amountCents: 100000, dueAt: '2026-11-01', label: 'Rata 1' },
        { amountCents: 100000, dueAt: '2026-12-01', label: 'Rata 2' },
        { amountCents: 50000, dueAt: '2027-01-01', label: 'Rata 3' },
      ]
      // original total 250000. Discount 15000 -> effective total 235000
      const adjusted = adjustInstallmentsForDiscount(originalInstallments, 235000)
      expect(adjusted).toHaveLength(3)
      const sum = adjusted.reduce((acc, curr) => acc + curr.amountCents, 0)
      expect(sum).toBe(235000)
    })
  })

  describe('buildDiscountLineItem', () => {
    it('constructs line items with default amounts and labels', () => {
      const groupItem = buildDiscountLineItem('GROUP')
      expect(groupItem).toEqual({
        amountCents: DEFAULT_DISCOUNT_AMOUNTS.GROUP,
        candidateDiscountId: undefined,
        discountType: 'GROUP',
        label: 'Popust na grupu',
      })

      const customItem = buildDiscountLineItem('FAMILY', 'Poseban porodični popust', 7500, 42)
      expect(customItem).toEqual({
        amountCents: 7500,
        candidateDiscountId: 42,
        discountType: 'FAMILY',
        label: 'Poseban porodični popust',
      })
    })
  })
})
