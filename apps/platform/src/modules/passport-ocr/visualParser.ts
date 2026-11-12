/**
 * Regex parser for the Visual Inspection Zone (VIZ) of Serbian and international passports.
 * Provides fallback and complementary extraction when MRZ is obscured, cut off, or damaged.
 */

export type VisualExtractedFields = {
  passportNumber?: string
  birthDate?: string // YYYY-MM-DD
  expirationDate?: string // YYYY-MM-DD
  firstName?: string
  lastName?: string
  jmbg?: string
}

function parseDateString(dateStr: string): string | null {
  // Matches DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY or DD MMM YYYY
  const dotMatch = dateStr.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/)
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0')
    const month = dotMatch[2].padStart(2, '0')
    const year = dotMatch[3]
    return `${year}-${month}-${day}`
  }
  return null
}

export function parseVisualZone(text: string): VisualExtractedFields {
  const result: VisualExtractedFields = {}
  const sanitizedText = text.replace(/[©®]/g, '0')
  const lines = sanitizedText.split('\n').map((l) => l.trim())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 1. Passport number: typically 9 digits for Serbian passports
    if (/paso[sš]|passport/i.test(line)) {
      const match = line.match(/\b([0-9]{8,9})\b/) || (lines[i + 1] && lines[i + 1].match(/\b([0-9]{8,9})\b/))
      if (match && !result.passportNumber) {
        result.passportNumber = match[1]
      }
    }

    // 2. Surname / Prezime
    if (/prezime|surname/i.test(line)) {
      const match = line.match(/(?:prezime|surname)[:\s]+([A-Za-zČĆŽŠĐčćžšđ]+)/i) ||
        (lines[i + 1] && lines[i + 1].match(/^([A-Za-zČĆŽŠĐčćžšđ]+)$/))
      if (match && !result.lastName) {
        result.lastName = match[1].toUpperCase()
      }
    }

    // 3. Given name / Ime
    if (/\bime\b|given\s*name/i.test(line)) {
      const match = line.match(/(?:ime|given\s*names?)[:\s]+([A-Za-zČĆŽŠĐčćžšđ\s]+)/i) ||
        (lines[i + 1] && lines[i + 1].match(/^([A-Za-zČĆŽŠĐčćžšđ\s]+)$/))
      if (match && !result.firstName) {
        result.firstName = match[1].trim().toUpperCase()
      }
    }

    // 4. Date of birth / Datum rodjenja
    if (/ro[dđ]en|birth/i.test(line)) {
      const match = line.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/) ||
        (lines[i + 1] && lines[i + 1].match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/))
      if (match && !result.birthDate) {
        result.birthDate = parseDateString(match[1]) ?? undefined
      }
    }

    // 5. Date of expiry / Vazi do / Expiry
    if (/va[zž]i\s*do|expiry|expiration/i.test(line)) {
      const match = line.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/) ||
        (lines[i + 1] && lines[i + 1].match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/))
      if (match && !result.expirationDate) {
        result.expirationDate = parseDateString(match[1]) ?? undefined
      }
    }

    // 6. JMBG (13 consecutive digits)
    const jmbgMatch = line.match(/\b(\d{13})\b/)
    if (jmbgMatch && !result.jmbg) {
      result.jmbg = jmbgMatch[1]
    }
  }

  // Standalone 9-digit passport number fallback if not caught by label
  if (!result.passportNumber) {
    const any9Digits = text.match(/\b([0-9]{9})\b/)
    if (any9Digits) {
      result.passportNumber = any9Digits[1]
    }
  }

  return result
}
