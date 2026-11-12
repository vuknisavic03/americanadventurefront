import ExcelJS from 'exceljs'
import { describe, expect, it, vi } from 'vitest'

import { generatePreApplicationsExcelBuffer } from './export.ts'
import {
  resolvePreApplicationExportColumns,
  type PreApplicationExportItem,
} from './exportRules.ts'
import { exportPreApplicationsOverview } from './exportService.ts'

describe('Pre-applications Excel Export (FR-005)', () => {
  const sampleItems: PreApplicationExportItem[] = [
    {
      applicantNote: 'Zanima me opcija posla u hotelijerstvu.',
      campaignCode: 'SWT_MVP',
      consultationNotes: 'Odličan nivo engleskog jezika, motivisan.',
      consultationStartsAt: '2026-03-20T14:00:00.000Z',
      consultationStatus: 'ATTENDED',
      contactStatus: 'REACHED',
      correlationId: 'corr-uuid-1',
      createdAt: '2026-02-15T10:30:00.000Z',
      currentStudyYear: 'YEAR_3',
      dateOfBirth: '2003-05-12T00:00:00.000Z',
      decisionNote: 'Ispunjava sve zakonske i akademske uslove.',
      email: 'marko.jovanovic@example.com',
      espbPoints: 120,
      facultyName: 'Ekonomski fakultet Beograd',
      firstName: 'Marko',
      fullName: 'Marko Jovanović',
      id: 101,
      lastName: 'Jovanović',
      latestContactAt: '2026-02-16T11:00:00.000Z',
      latestContactOutcome: 'REACHED',
      phone: '+381601234567',
      profileReadinessNote: 'Odobreno za kreiranje profila.',
      programCode: 'SWT',
      residentialAddress: 'Bulevar kralja Aleksandra 73, Beograd',
      source: 'PUBLIC_WEB',
      status: 'READY_FOR_PROFILE',
      studyCity: 'Beograd',
      studyInterruptionExplanation: null,
      studyInterruptionStatus: 'NONE',
    },
    {
      applicantNote: '=HYPERLINK("http://malicious.site")',
      campaignCode: 'SWT_MVP',
      consultationNotes: null,
      consultationStartsAt: null,
      consultationStatus: 'NOT_SCHEDULED',
      contactStatus: 'NOT_ATTEMPTED',
      correlationId: 'corr-uuid-2',
      createdAt: '2026-02-18T16:45:00.000Z',
      currentStudyYear: 'MASTER',
      dateOfBirth: '2001-08-22T00:00:00.000Z',
      decisionNote: null,
      email: 'jelena.petrovic@example.com',
      espbPoints: 240,
      facultyName: 'Pravni fakultet Niš',
      firstName: 'Jelena',
      fullName: 'Jelena Petrović',
      id: 102,
      lastName: 'Petrović',
      latestContactAt: null,
      latestContactOutcome: null,
      phone: '+381657654321',
      profileReadinessNote: null,
      programCode: 'SWT',
      residentialAddress: 'Kneza Miloša 14, Niš',
      source: 'PUBLIC_WEB',
      status: 'SUBMITTED',
      studyCity: 'Niš',
      studyInterruptionExplanation: 'Obnovljena 2. godina zbog bolesti',
      studyInterruptionStatus: 'RENEWED_YEAR',
    },
  ]

  it('generates valid XLSX buffer with correct sheet name and column count', async () => {
    const buffer = await generatePreApplicationsExcelBuffer(sampleItems)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Pre-prijave')
    expect(worksheet).toBeDefined()
    expect(worksheet?.rowCount).toBe(3) // 1 zaglavlje + 2 reda

    const headerRow = worksheet?.getRow(1)
    expect(headerRow?.getCell(1).value).toBe('ID')
    expect(headerRow?.getCell(2).value).toBe('Kod prijave (Correlation ID)')
    expect(headerRow?.getCell(4).value).toBe('Status prijave')
    expect(headerRow?.getCell(5).value).toBe('Ime')
    expect(headerRow?.getCell(6).value).toBe('Prezime')

    // Provera mapiranih vrednosti prvog reda
    const row1 = worksheet?.getRow(2)
    expect(row1?.getCell(1).value).toBe(101)
    expect(row1?.getCell(2).value).toBe('corr-uuid-1')
    expect(row1?.getCell(4).value).toBe('Spreman za kreiranje profila')
    expect(row1?.getCell(5).value).toBe('Marko')
    expect(row1?.getCell(6).value).toBe('Jovanović')
    expect(row1?.getCell(13).value).toBe('3. godina')
    expect(row1?.getCell(14).value).toBe('Nisam obnavljao/la niti pauzirao/la godinu')
    expect(row1?.getCell(18).value).toBe('Work & Travel USA (SWT)')
    expect(row1?.getCell(21).value).toBe('Razgovor je obavljen')
    expect(row1?.getCell(24).value).toBe('Prisustvovao/la')

    // Provera bezbednosti od formula injection-a u drugom redu
    const row2 = worksheet?.getRow(3)
    const applicantNoteCell = row2?.getCell(17).value
    expect(applicantNoteCell).toBe('\'=HYPERLINK("http://malicious.site")')
  })

  it('supports custom field projections (e.g. only contact and academic info)', async () => {
    const columns = resolvePreApplicationExportColumns('id,firstName,lastName,email,phone,studyCity,facultyName')
    expect(columns).toHaveLength(7)
    expect(columns.map((c) => c.key)).toEqual([
      'id',
      'firstName',
      'lastName',
      'email',
      'phone',
      'facultyName',
      'studyCity',
    ])

    const buffer = await generatePreApplicationsExcelBuffer(sampleItems, 'id,firstName,lastName,email,phone')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Pre-prijave')
    expect(worksheet?.columnCount).toBe(5)
  })

  it('handles empty pre-applications list gracefully with just headers', async () => {
    const buffer = await generatePreApplicationsExcelBuffer([])
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet('Pre-prijave')
    expect(worksheet).toBeDefined()
    expect(worksheet?.rowCount).toBe(1)
  })

  it('executes export service, filters records and logs audit event', async () => {
    const mockCreateAudit = vi.fn().mockResolvedValue({ id: 1 })
    const mockFind = vi.fn().mockResolvedValue({
      docs: [
        {
          campaignCode: 'SWT_MVP',
          consultationStatus: 'ATTENDED',
          contactStatus: 'REACHED',
          correlationId: 'test-corr-1',
          createdAt: '2026-03-01T12:00:00.000Z',
          id: 50,
          programCode: 'SWT',
          source: 'PUBLIC_WEB',
          status: 'READY_FOR_PROFILE',
          submission: {
            currentStudyYear: 'YEAR_2',
            dateOfBirth: '2002-04-10',
            email: 'petar@example.com',
            espbPoints: 60,
            facultyName: 'FON',
            firstName: 'Petar',
            lastName: 'Petrović',
            phone: '061111222',
            residentialAddress: 'Beograd',
            studyCity: 'Beograd',
            studyInterruptionStatus: 'NONE',
          },
        },
        {
          campaignCode: 'SWT_MVP',
          consultationStatus: 'NOT_SCHEDULED',
          contactStatus: 'NOT_ATTEMPTED',
          correlationId: 'test-corr-2',
          createdAt: '2026-03-02T12:00:00.000Z',
          id: 51,
          programCode: 'SWT',
          source: 'PUBLIC_WEB',
          status: 'SUBMITTED',
          submission: {
            currentStudyYear: 'YEAR_1',
            dateOfBirth: '2004-01-15',
            email: 'ana@example.com',
            espbPoints: 30,
            facultyName: 'FTN',
            firstName: 'Ana',
            lastName: 'Anić',
            phone: '062333444',
            residentialAddress: 'Novi Sad',
            studyCity: 'Novi Sad',
            studyInterruptionStatus: 'NONE',
          },
        },
      ],
    })

    const payloadMock = {
      create: mockCreateAudit,
      find: mockFind,
    } as unknown as Parameters<typeof exportPreApplicationsOverview>[0]['payload']

    // Test bez filtera (vraća 2)
    const resultAll = await exportPreApplicationsOverview({
      adminId: 42,
      filters: {},
      payload: payloadMock,
    })
    expect(resultAll.count).toBe(2)
    expect(resultAll.buffer).toBeInstanceOf(Buffer)
    expect(resultAll.filename).toMatch(/^pre-prijave-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(mockCreateAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-events',
        data: expect.objectContaining({
          actor: 42,
          actorType: 'ADMIN',
          eventType: 'CANDIDATE_DATA_EXPORTED',
          metadata: expect.objectContaining({
            exportType: 'PRE_APPLICATIONS',
            exportedCount: 2,
          }),
        }),
      }),
    )

    // Test sa filterom po statusu
    const resultFiltered = await exportPreApplicationsOverview({
      adminId: 42,
      filters: { status: 'READY_FOR_PROFILE' },
      payload: payloadMock,
    })
    expect(resultFiltered.count).toBe(1)

    // Test sa pretragom po imenu
    const resultSearch = await exportPreApplicationsOverview({
      adminId: 42,
      filters: { search: 'ana' },
      payload: payloadMock,
    })
    expect(resultSearch.count).toBe(1)
  })
})
