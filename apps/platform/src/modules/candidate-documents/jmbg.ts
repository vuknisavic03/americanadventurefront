export type JmbgValidationResult =
  | { dateOfBirth: string; normalized: string; valid: true }
  | { message: string; valid: false }

function checksum(digits: number[]) {
  const weighted =
    7 * (digits[0] + digits[6]) +
    6 * (digits[1] + digits[7]) +
    5 * (digits[2] + digits[8]) +
    4 * (digits[3] + digits[9]) +
    3 * (digits[4] + digits[10]) +
    2 * (digits[5] + digits[11])
  const remainder = 11 - (weighted % 11)
  return remainder > 9 ? 0 : remainder
}

export function validateJmbg(value: string, expectedDateOfBirth: string | Date): JmbgValidationResult {
  const normalized = value.replace(/\s/g, '')
  if (!/^\d{13}$/.test(normalized)) {
    return { message: 'JMBG mora imati tačno 13 cifara.', valid: false }
  }
  const digits = [...normalized].map(Number)
  if (checksum(digits) !== digits[12]) {
    return { message: 'Kontrolna cifra JMBG-a nije ispravna.', valid: false }
  }

  const expected = new Date(expectedDateOfBirth)
  if (Number.isNaN(expected.getTime())) {
    return { message: 'Datum rođenja na profilu nije ispravan.', valid: false }
  }
  const day = Number(normalized.slice(0, 2))
  const month = Number(normalized.slice(2, 4))
  const yearWithinMillennium = Number(normalized.slice(4, 7))
  if (
    day !== expected.getUTCDate() ||
    month !== expected.getUTCMonth() + 1 ||
    yearWithinMillennium !== expected.getUTCFullYear() % 1000
  ) {
    return { message: 'Datum rođenja u JMBG-u se ne poklapa sa podacima kandidata.', valid: false }
  }

  return {
    dateOfBirth: expected.toISOString().slice(0, 10),
    normalized,
    valid: true,
  }
}
