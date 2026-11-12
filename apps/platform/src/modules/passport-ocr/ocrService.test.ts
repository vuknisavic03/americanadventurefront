import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { formatMrzDate, isPassportExpired, isPassportValidForSwtSeason } from './dateUtils.ts'
import { findCandidateMrzLines, normalizeMrzTd3Line1, normalizeMrzTd3Line2 } from './mrzNormalizer.ts'
import { evaluateCandidateMatch, processPassportOcr } from './ocrService.ts'
import { parseVisualZone } from './visualParser.ts'

describe('Passport OCR - Date Utilities', () => {
  it('converts MRZ birth date to ISO format', () => {
    // 980101 -> 1998-01-01
    expect(formatMrzDate('980101', false)).toBe('1998-01-01')
    // 040512 -> 2004-05-12
    expect(formatMrzDate('040512', false)).toBe('2004-05-12')
  })

  it('converts MRZ expiry date to ISO format in 2000s', () => {
    // 301231 -> 2030-12-31
    expect(formatMrzDate('301231', true)).toBe('2030-12-31')
    // 350815 -> 2035-08-15
    expect(formatMrzDate('350815', true)).toBe('2035-08-15')
  })

  it('detects expired passport', () => {
    expect(isPassportExpired('2020-01-01', new Date('2026-10-15'))).toBe(true)
    expect(isPassportExpired('2030-12-31', new Date('2026-10-15'))).toBe(false)
  })

  it('checks 6-month validity for SWT season', () => {
    // For 2027 season, required until 2028-04-15
    const valid = isPassportValidForSwtSeason('2029-01-01', 2027)
    expect(valid.valid).toBe(true)

    const invalid = isPassportValidForSwtSeason('2027-11-01', 2027)
    expect(invalid.valid).toBe(false)
  })
})

describe('Passport OCR - MRZ Normalizer', () => {
  it('normalizes TD3 line 1 with OCR noise', () => {
    const raw = 'P<SRBSTOJADINOVIC<<NEMANJA<K<K<<<KLLLLLLLLLLLL'
    const normalized = normalizeMrzTd3Line1(raw)
    expect(normalized).toHaveLength(44)
    expect(normalized.startsWith('P<SRBSTOJADINOVIC<<NEMANJA')).toBe(true)
    expect(normalized.endsWith('<<<<')).toBe(true)
  })

  it('normalizes TD3 line 2 digits and sex', () => {
    const raw = '0109481232SRB9801015M30123160101998710012<14'
    const normalized = normalizeMrzTd3Line2(raw)
    expect(normalized).toHaveLength(44)
    expect(normalized).toBe('0109481232SRB9801015M30123160101998710012<14')
  })

  it('normalizes TD3 line 2 with copyright symbol OCR glitch', () => {
    const raw = '©109481232SRB9801015M30123160101998710012<14'
    const normalized = normalizeMrzTd3Line2(raw)
    expect(normalized).toHaveLength(44)
    expect(normalized).toBe('0109481232SRB9801015M30123160101998710012<14')
  })

  it('finds candidate MRZ lines in OCR text output', () => {
    const lines = [
      'REPUBLIKA SRBIJA / PASSPORT',
      'Prezime: STOJADINOVIC',
      'P<SRBSTOJADINOVIC<<NEMANJA<<<<<<<<<<<<<<<<<<',
      '0109481232SRB9801015M30123160101998710012<14',
    ]
    const candidates = findCandidateMrzLines(lines)
    expect(candidates).toHaveLength(2)
    expect(candidates[0].startsWith('P<SRB')).toBe(true)
  })
})

describe('Passport OCR - Visual Zone Parser', () => {
  it('extracts fields from text labels', () => {
    const text = `
      REPUBLIKA SRBIJA
      PASOS / PASSPORT
      Prezime / Surname: STOJADINOVIC
      Ime / Given names: NEMANJA
      Datum rodjenja / Date of birth: 01.01.1998
      Broj pasosa / Passport No: 010948123
      Vazi do / Date of expiry: 31.12.2030
      0101998710012
    `
    const parsed = parseVisualZone(text)
    expect(parsed.passportNumber).toBe('010948123')
    expect(parsed.lastName).toBe('STOJADINOVIC')
    expect(parsed.firstName).toBe('NEMANJA')
    expect(parsed.birthDate).toBe('1998-01-01')
    expect(parsed.expirationDate).toBe('2030-12-31')
    expect(parsed.jmbg).toBe('0101998710012')
  })
})

describe('Passport OCR - Candidate Match Evaluation', () => {
  it('evaluates match when all fields correspond', () => {
    const match = evaluateCandidateMatch(
      {
        birthDate: '1998-01-01',
        documentCode: 'P',
        documentNumber: '010948123',
        expirationDate: '2030-12-31',
        firstName: 'NEMANJA',
        issuingState: 'SRB',
        lastName: 'STOJADINOVIC',
        mrzFormat: 'TD3',
        mrzValid: true,
        nationality: 'SRB',
        personalNumber: '0101998710012',
        rawMrzLines: [],
        sex: 'M',
      },
      {
        dateOfBirth: '1998-01-01T00:00:00.000Z',
        firstName: 'Nemanja',
        jmbg: '0101998710012',
        lastName: 'Stojadinović',
        seasonYear: 2027,
      },
    )

    expect(match.overallMatch).toBe('MATCH')
    expect(match.nameMatch).toBe(true)
    expect(match.birthDateMatch).toBe(true)
    expect(match.jmbgMatch).toBe(true)
    expect(match.isExpired).toBe(false)
    expect(match.expiresWithinSeason).toBe(false)
  })

  it('flags mismatch when name differs', () => {
    const match = evaluateCandidateMatch(
      {
        birthDate: '1998-01-01',
        documentCode: 'P',
        documentNumber: '010948123',
        expirationDate: '2030-12-31',
        firstName: 'MARKO',
        issuingState: 'SRB',
        lastName: 'PETROVIC',
        mrzFormat: 'TD3',
        mrzValid: true,
        nationality: 'SRB',
        personalNumber: '0101998710012',
        rawMrzLines: [],
        sex: 'M',
      },
      {
        dateOfBirth: '1998-01-01',
        firstName: 'Nemanja',
        lastName: 'Stojadinović',
      },
    )

    expect(match.overallMatch).toBe('MISMATCH')
    expect(match.nameMatch).toBe(false)
  })
})

describe('Passport OCR - End-to-end synthetic image OCR', () => {
  it('processes synthetic passport image successfully', async () => {
    const mrzLine1 = 'P<SRBSTOJADINOVIC<<NEMANJA<<<<<<<<<<<<<<<<<<'
    const mrzLine2 = '0109481232SRB9801015M30123160101998710012<14'

    const svg = `
    <svg width="800" height="500">
      <rect width="100%" height="100%" fill="white"/>
      <text x="50" y="80" font-family="Arial" font-size="24" font-weight="bold" fill="black">REPUBLIKA SRBIJA / PASOS</text>
      <text x="50" y="130" font-family="Arial" font-size="16" fill="black">Prezime / Surname: STOJADINOVIC</text>
      <text x="50" y="170" font-family="Arial" font-size="16" fill="black">Ime / Given names: NEMANJA</text>
      <text x="50" y="210" font-family="Arial" font-size="16" fill="black">Datum rodjenja / Date of birth: 01.01.1998</text>
      <text x="50" y="250" font-family="Arial" font-size="16" fill="black">Broj pasosa / Passport No: 010948123</text>
      <text x="50" y="290" font-family="Arial" font-size="16" fill="black">Vazi do / Date of expiry: 31.12.2030</text>
      
      <text x="30" y="420" font-family="Courier New, monospace" font-size="22" letter-spacing="2" font-weight="normal" fill="black">${mrzLine1.replace(/</g, '&lt;')}</text>
      <text x="30" y="460" font-family="Courier New, monospace" font-size="22" letter-spacing="2" font-weight="normal" fill="black">${mrzLine2.replace(/</g, '&lt;')}</text>
    </svg>
    `

    const imgBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

    const result = await processPassportOcr(new Uint8Array(imgBuffer), 'image/png', {
      dateOfBirth: '1998-01-01',
      firstName: 'Nemanja',
      jmbg: '0101998710012',
      lastName: 'Stojadinović',
      seasonYear: 2027,
    })

    expect(result.success).toBe(true)
    expect(result.extracted?.documentNumber).toBe('010948123')
    expect(result.extracted?.lastName).toBe('STOJADINOVIC')
    expect(result.extracted?.firstName).toBe('NEMANJA')
    expect(result.extracted?.birthDate).toBe('1998-01-01')
    expect(result.match?.nameMatch).toBe(true)
    expect(result.match?.birthDateMatch).toBe(true)
  }, 35000)
})
