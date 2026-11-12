/**
 * Normalizes MRZ candidate lines extracted from raw OCR text.
 * Resolves common character confusion in OCR (e.g. < read as K or L, 0 vs O).
 */

export function findCandidateMrzLines(lines: string[]): string[] {
  const cleaned = lines
    .map((line) => line.trim().replace(/\s+/g, ''))
    .filter((line) => line.length >= 25)

  // Look for 2 consecutive lines matching TD3 (or lines starting with P<)
  for (let i = 0; i < cleaned.length - 1; i++) {
    const l1 = cleaned[i]
    const l2 = cleaned[i + 1]

    if (
      (l1.startsWith('P<') || l1.startsWith('P') || l1.includes('<<')) &&
      (l2.length >= 35 || /\d{6}/.test(l2))
    ) {
      return [l1, l2]
    }
  }

  // Fallback: search for any lines containing double fillers '<<' or high '<' count
  const withFillers = cleaned.filter((l) => l.includes('<<') || (l.match(/</g) || []).length >= 3)
  if (withFillers.length >= 2) {
    return withFillers.slice(-2)
  }

  return []
}

/**
 * Normalizes TD3 Line 1 (P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<)
 * Length: exactly 44 characters
 */
export function normalizeMrzTd3Line1(
  rawLine: string,
  hintNames?: { firstName?: string; lastName?: string },
): string {
  let line = rawLine.toUpperCase().trim()

  // Fix P< start
  if (/^P[<KL(]/.test(line)) {
    line = 'P<' + line.slice(2)
  } else if (line.startsWith('P') && !line.startsWith('P<')) {
    line = 'P<' + line.slice(1)
  }

function toAsciiUpper(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'DJ')
    .replace(/[^A-Z]/g, '')
}

  // If hint names or visual names are available and present in the line
  if (hintNames?.lastName && hintNames?.firstName) {
    const cleanLast = toAsciiUpper(hintNames.lastName)
    const cleanFirst = toAsciiUpper(hintNames.firstName)
    if (cleanLast && cleanFirst && line.includes(cleanLast)) {
      const issuingState = line.slice(2, 5).replace(/[^A-Z]/g, 'X').padEnd(3, 'X')
      const combined = `P<${issuingState}${cleanLast}<<${cleanFirst}`
      return combined.slice(0, 44).padEnd(44, '<')
    }
  }

  // Remove whitespace but detect word boundaries
  line = line.replace(/\s+/g, '<')

  // If << exists
  if (line.includes('<<')) {
    const parts = line.split('<<')
    const headerAndSurname = parts[0]
    const rest = parts.slice(1).join('<<')
    const nameMatch = rest.match(/^([A-Z<]+?)(?:[KL«<C]{3,}|$)/)
    const givenNames = nameMatch ? nameMatch[1].replace(/[^A-Z<]/g, '<') : rest.replace(/[^A-Z<]/g, '<')
    const combined = `${headerAndSurname}<<${givenNames}`
    return combined.slice(0, 44).padEnd(44, '<')
  }

  // If << was misread as <K or <C or K< or single < between two long words
  // e.g. P<SRBSTOJADINOVIC<K<NEMANJA...
  const wordSeparationMatch = line.match(/^P<([A-Z]{3})([A-Z]+)[<KCL«\s]{1,4}([A-Z]+)/)
  if (wordSeparationMatch) {
    const state = wordSeparationMatch[1]
    const surname = wordSeparationMatch[2]
    const givenName = wordSeparationMatch[3]
    const combined = `P<${state}${surname}<<${givenName}`
    return combined.slice(0, 44).padEnd(44, '<')
  }

  // Basic cleanup: replace trailing noise with '<'
  line = line.replace(/[^A-Z0-9<]/g, '<')
  return line.slice(0, 44).padEnd(44, '<')
}

/**
 * Normalizes TD3 Line 2
 * Format:
 * [0..8]   Passport number (9 alphanumeric)
 * [9]      Check digit (1 digit)
 * [10..12] Nationality (3 alpha)
 * [13..18] Date of birth (6 digits YYMMDD)
 * [19]     Check digit (1 digit)
 * [20]     Sex (M, F, <)
 * [21..26] Expiry date (6 digits YYMMDD)
 * [27]     Check digit (1 digit)
 * [28..41] Optional/Personal number (14 alphanumeric/filler)
 * [42]     Check digit (1 digit)
 * [43]     Composite check digit (1 digit)
 */
export function normalizeMrzTd3Line2(rawLine: string): string {
  let line = rawLine
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[«]/g, '<')
    .replace(/[©®]/g, '0')

  // Length ensure
  if (line.length > 44) line = line.slice(0, 44)
  if (line.length < 44) line = line.padEnd(44, '<')

  const chars = line.split('')

  // Document number (index 0..8): if predominantly digits, replace common OCR errors
  const docChars = chars.slice(0, 9)
  const digitCount = docChars.filter((c) => /\d/.test(c)).length
  if (digitCount >= 4) {
    for (let i = 0; i <= 8; i++) {
      if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0'
      if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1'
      if (chars[i] === 'B') chars[i] = '8'
      if (chars[i] === 'S') chars[i] = '5'
    }
  }

  // Document number check digit (index 9)
  if (chars[9] === 'O' || chars[9] === 'Q' || chars[9] === 'D') chars[9] = '0'
  if (chars[9] === 'I' || chars[9] === 'L') chars[9] = '1'
  if (chars[9] === 'B') chars[9] = '8'
  if (chars[9] === 'S') chars[9] = '5'

  // Digits corrections in numeric regions:
  // Dob: 13..18
  for (let i = 13; i <= 18; i++) {
    if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0'
    if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1'
    if (chars[i] === 'B') chars[i] = '8'
    if (chars[i] === 'S') chars[i] = '5'
  }

  // Expiry: 21..26
  for (let i = 21; i <= 26; i++) {
    if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0'
    if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1'
    if (chars[i] === 'B') chars[i] = '8'
    if (chars[i] === 'S') chars[i] = '5'
  }

  // Sex at index 20: M, F, or <
  if (chars[20] !== 'M' && chars[20] !== 'F' && chars[20] !== '<') {
    if (chars[20] === 'H' || chars[20] === 'N') chars[20] = 'M'
    else if (chars[20] === 'P') chars[20] = 'F'
    else chars[20] = '<'
  }

  // Nationality: 10..12 should be letters
  for (let i = 10; i <= 12; i++) {
    if (chars[i] === '0') chars[i] = 'O'
    if (chars[i] === '1') chars[i] = 'I'
    if (chars[i] === '5') chars[i] = 'S'
    if (chars[i] === '8') chars[i] = 'B'
  }

  return chars.join('')
}
