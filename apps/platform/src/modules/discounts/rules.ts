import type {
  AppliedDiscountItem,
  DiscountType,
  KinshipType,
  LifeguardCertifyingBody,
} from './types.ts'

export const DEFAULT_DISCOUNT_AMOUNTS: Record<DiscountType, number> = {
  BRAND_AMBASSADOR: 10000, // 100 USD (Cashback / Brand Ambassador)
  CUSTOM: 0,
  FAMILY: 5000, // 50 USD (Family popust - Prilog 1)
  GROUP: 10000, // 100 USD (Grupni popust za 5+ kandidata - Prilog 1)
  LIFEGUARD: 30000, // 300 USD (Lifeguard popust / Opcija B - Prilog 1)
  RETURNEE: 10000, // 100 USD (Povratnik)
}

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

export function isValidDiscountCode(code: string): boolean {
  const normalized = normalizeDiscountCode(code)
  return normalized.length >= 3 && normalized.length <= 32
}

export function calculateTotalDiscounts(discounts: { amountCents: number }[]): number {
  return discounts.reduce((acc, curr) => acc + Math.max(0, curr.amountCents), 0)
}

export function calculateEffectiveBasePrice(
  basePriceCents: number,
  discounts: { amountCents: number }[],
): number {
  if (basePriceCents <= 0) return 0
  const totalDiscounts = calculateTotalDiscounts(discounts)
  return Math.max(0, basePriceCents - totalDiscounts)
}

export function validateDiscountsAgainstBasePrice(
  basePriceCents: number,
  discounts: { amountCents: number; label?: string }[],
): { valid: boolean; error?: string } {
  if (basePriceCents <= 0) {
    return { error: 'Osnovna cena mora biti veća od nule.', valid: false }
  }
  for (const d of discounts) {
    if (d.amountCents <= 0 || !Number.isSafeInteger(d.amountCents)) {
      return { error: `Iznos popusta mora biti pozitivan ceo broj centi (${d.label ?? 'popust'}).`, valid: false }
    }
  }
  const total = calculateTotalDiscounts(discounts)
  if (total > basePriceCents) {
    return { error: 'Ukupan iznos popusta ne može biti veći od osnovne cene programa.', valid: false }
  }
  return { valid: true }
}

export function validateFamilyKinshipData(data: {
  kinshipType?: KinshipType | null
  relativeFullName?: string | null
}): { valid: boolean; error?: string } {
  if (!data.relativeFullName || data.relativeFullName.trim().length < 2) {
    return { error: 'Ime i prezime srodnika je obavezno.', valid: false }
  }
  if (!data.kinshipType) {
    return { error: 'Vrsta srodstva je obavezna.', valid: false }
  }
  return { valid: true }
}

export function validateReturneeData(data: {
  returneePreviousYear?: number | null
}): { valid: boolean; error?: string } {
  const currentYear = new Date().getFullYear()
  if (
    !data.returneePreviousYear ||
    !Number.isInteger(data.returneePreviousYear) ||
    data.returneePreviousYear < 2010 ||
    data.returneePreviousYear > currentYear
  ) {
    return { error: `Godina prethodnog učešća mora biti između 2010. i ${currentYear}.`, valid: false }
  }
  return { valid: true }
}

export function validateLifeguardData(data: {
  lifeguardCertificateNumber?: string | null
  lifeguardCertifyingBody?: LifeguardCertifyingBody | null
  lifeguardValidUntil?: string | null
}): { valid: boolean; error?: string } {
  if (!data.lifeguardCertifyingBody) {
    return { error: 'Sertifikaciono telo (Crveni krst, Ellis itd.) je obavezno.', valid: false }
  }
  if (!data.lifeguardCertificateNumber || data.lifeguardCertificateNumber.trim().length < 3) {
    return { error: 'Broj sertifikata/licence je obavezan.', valid: false }
  }
  if (data.lifeguardValidUntil) {
    const validUntil = Date.parse(data.lifeguardValidUntil)
    if (!Number.isFinite(validUntil)) {
      return { error: 'Datum važenja sertifikata nije ispravan.', valid: false }
    }
  }
  return { valid: true }
}

export function adjustInstallmentsForDiscount(
  items: { amountCents: number; dueAt: string; label: string }[],
  effectiveTotalCents: number,
): { amountCents: number; dueAt: string; label: string }[] {
  if (items.length === 0 || effectiveTotalCents <= 0) return []
  const oldTotal = items.reduce((sum, item) => sum + item.amountCents, 0)
  if (oldTotal === 0) return items

  let remaining = effectiveTotalCents
  return items.map((item, index) => {
    if (index === items.length - 1) {
      return { ...item, amountCents: remaining }
    }
    const scaled = Math.round((item.amountCents / oldTotal) * effectiveTotalCents)
    remaining -= scaled
    return { ...item, amountCents: scaled }
  })
}

export function buildDiscountLineItem(
  type: DiscountType,
  customLabel?: string | null,
  customAmountCents?: number | null,
  candidateDiscountId?: number,
): AppliedDiscountItem {
  const amountCents = customAmountCents ?? DEFAULT_DISCOUNT_AMOUNTS[type]
  let defaultLabel: string
  switch (type) {
    case 'GROUP':
      defaultLabel = 'Popust na grupu'
      break
    case 'BRAND_AMBASSADOR':
      defaultLabel = 'Brand Ambassador popust'
      break
    case 'FAMILY':
      defaultLabel = 'Porodični popust (Family discount)'
      break
    case 'RETURNEE':
      defaultLabel = 'Popust za povratnika (Returnee discount)'
      break
    case 'LIFEGUARD':
      defaultLabel = 'Lifeguard sertifikacija popust'
      break
    default:
      defaultLabel = 'Komercijalni popust'
  }

  return {
    amountCents,
    candidateDiscountId,
    discountType: type,
    label: customLabel?.trim() ? customLabel.trim() : defaultLabel,
  }
}
