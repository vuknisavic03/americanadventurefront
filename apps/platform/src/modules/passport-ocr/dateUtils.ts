/**
 * Convert MRZ 6-digit date (YYMMDD) to ISO format (YYYY-MM-DD)
 */
export function formatMrzDate(yymmdd: string | null | undefined, isExpiry = false): string | null {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) {
    return null
  }

  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)

  const currentYear = new Date().getUTCFullYear()
  const currentShortYear = currentYear % 100

  let century: number
  if (isExpiry) {
    // Expiration dates: almost universally in 2000s unless historical
    century = yy <= currentShortYear + 50 ? 2000 : 1900
  } else {
    // Birth dates: if year is greater than current 2-digit year, it's 1900s
    century = yy > currentShortYear ? 1900 : 2000
  }

  const fullYear = century + yy
  return `${fullYear}-${mm}-${dd}`
}

/**
 * Check if passport expiration date is in the past
 */
export function isPassportExpired(expiryDateIso: string | null | undefined, referenceDate = new Date()): boolean {
  if (!expiryDateIso) return false
  const expiry = new Date(expiryDateIso)
  if (isNaN(expiry.getTime())) return false
  return expiry.getTime() < referenceDate.getTime()
}

/**
 * Check if passport is valid for US travel (at least 6 months after planned program return)
 * For SWT, return is typically October/November. Rule of thumb: valid at least until May 1 of following year.
 */
export function isPassportValidForSwtSeason(
  expiryDateIso: string | null | undefined,
  seasonYear = new Date().getUTCFullYear(),
): { valid: boolean; requiredUntil: string } {
  // Required: 6 months past October 12 = April 12 of following year
  const requiredDate = new Date(Date.UTC(seasonYear + 1, 3, 15)) // April 15 of seasonYear + 1
  const requiredUntil = requiredDate.toISOString().slice(0, 10)

  if (!expiryDateIso) {
    return { valid: false, requiredUntil }
  }

  const expiry = new Date(expiryDateIso)
  if (isNaN(expiry.getTime())) {
    return { valid: false, requiredUntil }
  }

  return {
    valid: expiry.getTime() >= requiredDate.getTime(),
    requiredUntil,
  }
}
