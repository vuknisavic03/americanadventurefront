import {
  guarantorEmploymentStatusKeys,
  guarantorRelationshipKeys,
  type GuarantorEmploymentStatus,
  type GuarantorRelationship,
  type GuarantorSubmissionInput,
  type GuarantorValidationError,
  type GuarantorValidationResult,
  type SanitizedGuarantorInput,
} from './types.ts'

function jmbgChecksum(digits: number[]) {
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

export type GuarantorJmbgValidation =
  | {
      age: number
      dateOfBirth: string
      normalized: string
      valid: true
    }
  | {
      message: string
      valid: false
    }

export function validateGuarantorJmbg(
  value: string,
  referenceDate: Date = new Date(),
): GuarantorJmbgValidation {
  const normalized = value.replace(/\s/g, '')
  if (!/^\d{13}$/.test(normalized)) {
    return { message: 'JMBG jemca mora imati tačno 13 cifara.', valid: false }
  }
  const day = Number(normalized.slice(0, 2))
  const month = Number(normalized.slice(2, 4))
  const rawYear = Number(normalized.slice(4, 7))
  const fullYear = rawYear >= 900 ? 1000 + rawYear : 2000 + rawYear

  if (month < 1 || month > 12) {
    return { message: 'Mesec rođenja u JMBG-u jemca nije ispravan.', valid: false }
  }

  const birthDate = new Date(Date.UTC(fullYear, month - 1, day))
  if (
    birthDate.getUTCFullYear() !== fullYear ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return { message: 'Datum rođenja u JMBG-u jemca nije validan kalendarski datum.', valid: false }
  }

  const digits = [...normalized].map(Number)
  if (jmbgChecksum(digits) !== digits[12]) {
    return { message: 'Kontrolna cifra JMBG-a jemca nije ispravna.', valid: false }
  }

  // Calculate age at reference date
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDiff = referenceDate.getUTCMonth() - birthDate.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1
  }

  if (age < 30 || age > 65) {
    return {
      message: `Jemac mora imati između 30 i 65 godina prema uslovima ugovora (ima ${age} godina).`,
      valid: false,
    }
  }

  return {
    age,
    dateOfBirth: birthDate.toISOString().slice(0, 10),
    normalized,
    valid: true,
  }
}

export function formatGuarantorRelationship(relationship: GuarantorRelationship): string {
  switch (relationship) {
    case 'PARENT':
      return 'Roditelj'
    case 'SIBLING':
      return 'Brat / Sestra'
    case 'SPOUSE':
      return 'Supružnik'
    case 'RELATIVE':
      return 'Srodnik'
    case 'OTHER':
      return 'Ostalo treće lice'
    default:
      return relationship
  }
}

export function formatGuarantorEmployment(status: GuarantorEmploymentStatus): string {
  switch (status) {
    case 'EMPLOYED':
      return 'Zaposlen/a na neodređeno/određeno vreme'
    case 'RETIRED':
      return 'Penzioner'
    case 'SELF_EMPLOYED':
      return 'Preduzetnik / Samostalna delatnost'
    default:
      return status
  }
}

export function maskJmbg(jmbg: string): string {
  const clean = jmbg.replace(/\s/g, '')
  if (clean.length !== 13) return clean
  return `${clean.slice(0, 7)}******`
}

export function validateGuarantorInput(
  input: GuarantorSubmissionInput,
  referenceDate: Date = new Date(),
): GuarantorValidationResult {
  const errors: GuarantorValidationError[] = []

  const fullName = input.fullName?.trim() ?? ''
  if (fullName.length < 3) {
    errors.push({ message: 'Ime i prezime jemca mora imati najmanje 3 karaktera.', path: 'fullName' })
  } else if (!fullName.includes(' ')) {
    errors.push({ message: 'Unesite i ime i prezime jemca.', path: 'fullName' })
  }

  const jmbgVal = validateGuarantorJmbg(input.jmbg ?? '', referenceDate)
  if (!jmbgVal.valid) {
    errors.push({ message: jmbgVal.message, path: 'jmbg' })
  }

  const idCardNumber = input.idCardNumber?.trim() ?? ''
  if (!/^[a-zA-Z0-9]{6,15}$/.test(idCardNumber)) {
    errors.push({ message: 'Broj lične karte jemca mora sadržati između 6 i 15 alfanumeričkih znakova.', path: 'idCardNumber' })
  }

  const idCardIssuer = input.idCardIssuer?.trim() ?? ''
  if (idCardIssuer.length < 2) {
    errors.push({ message: 'Unesite organ koji je izdao ličnu kartu (npr. PU Beograd, PS Voždovac).', path: 'idCardIssuer' })
  }

  const residentialAddress = input.residentialAddress?.trim() ?? ''
  if (residentialAddress.length < 5) {
    errors.push({ message: 'Adresa prebivališta jemca mora imati najmanje 5 karaktera.', path: 'residentialAddress' })
  }

  const phone = input.phone?.trim() ?? ''
  if (!/^[+0-9\s/()-]{6,30}$/.test(phone)) {
    errors.push({ message: 'Unesite ispravan broj telefona jemca.', path: 'phone' })
  }

  const email = input.email?.trim() ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ message: 'Unesite ispravnu email adresu jemca.', path: 'email' })
  }

  if (!guarantorRelationshipKeys.includes(input.relationship)) {
    errors.push({ message: 'Izaberite važeći tip srodstva/odnosa jemca sa kandidatom.', path: 'relationship' })
  }

  if (!guarantorEmploymentStatusKeys.includes(input.employmentStatus)) {
    errors.push({ message: 'Izaberite radni status jemca.', path: 'employmentStatus' })
  }

  const employerName = input.employerName?.trim() ?? ''
  if (employerName.length < 2) {
    errors.push({ message: 'Unesite naziv poslodavca ili institucije jemca.', path: 'employerName' })
  }

  const jobTitle = input.jobTitle?.trim() ?? ''
  if (jobTitle.length < 2) {
    errors.push({ message: 'Unesite radno mesto ili zanimanje jemca.', path: 'jobTitle' })
  }

  const monthlyIncomeRsd = input.monthlyIncomeRsd
  if (
    typeof monthlyIncomeRsd !== 'number' ||
    !Number.isSafeInteger(monthlyIncomeRsd) ||
    monthlyIncomeRsd < 70_000
  ) {
    errors.push({
      message: 'Mesečna primanja jemca moraju iznositi najmanje 70.000 RSD prema uslovima ugovora.',
      path: 'monthlyIncomeRsd',
    })
  }

  const promissoryNotesCount = input.promissoryNotesCount ?? 2
  if (
    typeof promissoryNotesCount !== 'number' ||
    !Number.isSafeInteger(promissoryNotesCount) ||
    promissoryNotesCount < 2 ||
    promissoryNotesCount > 10
  ) {
    errors.push({ message: 'Broj potpisanih menica mora biti između 2 i 10 (standardno 2).', path: 'promissoryNotesCount' })
  }

  if (errors.length > 0) {
    return { errors, valid: false }
  }

  const sanitized: SanitizedGuarantorInput = {
    email,
    employerName,
    employmentStatus: input.employmentStatus,
    fullName,
    idCardIssuer,
    idCardNumber,
    jobTitle,
    jmbg: jmbgVal.valid ? jmbgVal.normalized : '',
    monthlyIncomeRsd,
    phone,
    promissoryNotesCount,
    relationship: input.relationship,
    residentialAddress,
  }

  return { data: sanitized, valid: true }
}
