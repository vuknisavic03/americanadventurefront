import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { generateCandidatesExcelBuffer, generateEmbassyExcelBuffer } from './export.ts'
import type { AdminCandidateOverviewItem } from './rules.ts'

describe('Admin Candidates Excel Export', () => {
  const sampleCandidates: AdminCandidateOverviewItem[] = [
    {
      citizenship: 'SRB',
      createdAt: '2026-01-15T10:00:00.000Z',
      currentStep: 'JOB_PLACEMENT',
      currentStepLabel: 'Posao i intervju',
      dateOfBirth: '2000-01-01',
      email: 'nikola@example.com',
      employerName: 'Grand Canyon Lodge',
      finalPrice: 1850,
      firstName: 'Nikola',
      fullName: 'Nikola Tesla',
      hasJobOffer: true,
      id: 1,
      idCardOrPassportNumber: 'P12345678',
      jobTitle: 'Server Assistant',
      lastName: 'Tesla',
      paymentMethod: 'installments',
      phone: '+38164111222',
      processStatus: 'ACTIVE',
      programCode: 'WAT',
      progressPercent: 75,
      updatedAt: '2026-02-01T12:00:00.000Z',
      workCity: 'Grand Canyon',
      workState: 'AZ',
    },
    {
      adminNotes: '=DANGEROUS_FORMULA()',
      createdAt: '2026-02-10T11:00:00.000Z',
      currentStep: 'PROFILE_SETUP',
      currentStepLabel: 'Profil kandidata',
      email: 'mihajlo@example.com',
      firstName: 'Mihajlo',
      fullName: 'Mihajlo Pupin',
      hasJobOffer: false,
      id: 2,
      idCardOrPassportNumber: 'P87654321',
      lastName: 'Pupin',
      phone: '+38164333444',
      processStatus: 'ACTIVE',
      programCode: 'WAT',
      progressPercent: 10,
      updatedAt: '2026-02-10T11:00:00.000Z',
    },
  ]

  it('generates valid XLSX buffer with correct sheet, headers and data (FR-069)', async () => {
    const buffer = await generateCandidatesExcelBuffer(sampleCandidates)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Kandidati')
    expect(worksheet).toBeDefined()
    expect(worksheet?.rowCount).toBe(3) // 1 zaglavlje + 2 reda podataka

    // Provera zaglavlja
    const headerRow = worksheet?.getRow(1)
    expect(headerRow?.getCell(1).value).toBe('ID')
    expect(headerRow?.getCell(2).value).toBe('Ime')
    expect(headerRow?.getCell(3).value).toBe('Prezime')

    // Provera podataka prvog kandidata
    const row1 = worksheet?.getRow(2)
    expect(row1?.getCell(1).value).toBe(1)
    expect(row1?.getCell(2).value).toBe('Nikola')
    expect(row1?.getCell(3).value).toBe('Tesla')
    expect(row1?.getCell(18).value).toBe('Da') // hasJobOffer formatirano kao 'Da'

    // Provera zaštite od formula injection-a
    const row2 = worksheet?.getRow(3)
    const adminNotesCell = row2?.getCell(25).value
    expect(adminNotesCell).toBe("'=DANGEROUS_FORMULA()")
  })

  it('respects column projection and field aliases (FR-067, FR-069)', async () => {
    const buffer = await generateCandidatesExcelBuffer(
      sampleCandidates,
      'name,surname,passport,job',
    )
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Kandidati')
    expect(worksheet?.columnCount).toBe(4)

    const headerRow = worksheet?.getRow(1)
    expect(headerRow?.getCell(1).value).toBe('Ime')
    expect(headerRow?.getCell(2).value).toBe('Prezime')
    expect(headerRow?.getCell(3).value).toBe('Broj pasoša / LK')
    expect(headerRow?.getCell(4).value).toBe('Radna pozicija')

    const row1 = worksheet?.getRow(2)
    expect(row1?.getCell(1).value).toBe('Nikola')
    expect(row1?.getCell(2).value).toBe('Tesla')
    expect(row1?.getCell(3).value).toBe('P12345678')
    expect(row1?.getCell(4).value).toBe('Server Assistant')
  })

  it('creates valid workbook for empty candidates list (FR-069)', async () => {
    const buffer = await generateCandidatesExcelBuffer([])
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Kandidati')
    expect(worksheet).toBeDefined()
    expect(worksheet?.rowCount).toBe(1) // Samo zaglavlje
  })

  it('generates official US Embassy format workbook with 16 columns and grouped headers', async () => {
    const buffer = await generateEmbassyExcelBuffer(sampleCandidates)
    expect(buffer).toBeInstanceOf(Buffer)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Sheet1')
    expect(worksheet).toBeDefined()
    expect(worksheet?.rowCount).toBe(4) // Row 1: Groups, Row 2: Headers, Rows 3-4: Candidates

    // Row 1 checks
    expect(worksheet?.getCell('B1').value).toBe('BIOGRAPHIC DATA')
    expect(worksheet?.getCell('G1').value).toBe('EDUCATION')
    expect(worksheet?.getCell('P1').value).toBe('PARTICIPATION')

    // Row 2 checks
    expect(worksheet?.getCell('B2').value).toBe('Surname')
    expect(worksheet?.getCell('C2').value).toBe('Given Name')
    expect(worksheet?.getCell('E2').value).toBe('Passport Number')

    // Row 3 checks (First candidate: Nikola Tesla)
    expect(worksheet?.getCell('B3').value).toBe('TESLA')
    expect(worksheet?.getCell('C3').value).toBe('NIKOLA')
    expect(worksheet?.getCell('E3').value).toBe('P12345678')
  })
})
