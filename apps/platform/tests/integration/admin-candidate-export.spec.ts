import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import ExcelJS from 'exceljs'
import type { Payload } from 'payload'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

async function createAcceptedOffer({
  adminId,
  candidate,
  employerName,
  payload,
  workCity,
  workState,
}: {
  adminId: number
  candidate: { account: { id: number }; process: { applicant: unknown; id: number; preApplication: unknown } }
  employerName: string
  payload: Payload
  workCity: string
  workState: string
}) {
  const applicantId =
    typeof candidate.process.applicant === 'object' && candidate.process.applicant !== null
      ? (candidate.process.applicant as { id: number }).id
      : Number(candidate.process.applicant)

  const preApplicationId =
    typeof candidate.process.preApplication === 'object' && candidate.process.preApplication !== null
      ? (candidate.process.preApplication as { id: number }).id
      : Number(candidate.process.preApplication)

  return payload.create({
    collection: 'employment-offers',
    data: {
      applicant: applicantId,
      candidateAccount: candidate.account.id,
      candidateInstructions: 'Detaljne instrukcije za radnu poziciju.',
      candidateProcess: candidate.process.id,
      currency: 'USD',
      employerName,
      endDate: '2026-09-15',
      expectedWeeklyHours: 40,
      hourlyWageCents: 1600,
      housingProvided: true,
      jobTitle: 'Server Assistant',
      notificationStatus: 'DELIVERED',
      offerVersion: 1,
      preApplication: preApplicationId,
      programCode: 'SWT',
      publishedAt: new Date().toISOString(),
      publishedBy: adminId,
      snapshotChecksum: 'e'.repeat(64),
      startDate: '2026-06-01',
      status: 'ACCEPTED',
      statusVersion: 1,
      workCity,
      workState,
    },
    overrideAccess: true,
  })
}

test('FR-069: Admin candidate Excel export with filters, field projection, and audit logging', async ({
  request,
  visaPayload: payload,
}) => {
  const suffix = randomUUID().slice(0, 8)
  const exportPath = '/api/admin/candidates/export'

  // 1. Kreiraj administratora
  const adminEmail = `admin-export-${suffix}@americanadventure.test`
  const adminPassword = 'Password123!'
  const admin = await payload.create({
    collection: 'users',
    data: {
      displayName: 'Admin Za Izvoz',
      email: adminEmail,
      password: adminPassword,
    },
  })

  const adminLogin = await payload.login({
    collection: 'users',
    data: { email: adminEmail, password: adminPassword },
  })
  const adminHeaders = {
    Authorization: `Bearer ${adminLogin.token}`,
  }

  // 2. Pripremi dva kandidata
  const c1 = await seedVisaCandidate(payload, admin.id)
  const c2 = await seedVisaCandidate(payload, admin.id)

  const c1ApplicantId =
    typeof c1.process.applicant === 'object' && c1.process.applicant !== null
      ? (c1.process.applicant as { id: number }).id
      : Number(c1.process.applicant)

  const c2ApplicantId =
    typeof c2.process.applicant === 'object' && c2.process.applicant !== null
      ? (c2.process.applicant as { id: number }).id
      : Number(c2.process.applicant)

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Marko',
      firstNameNormalized: 'marko',
      fullName: 'Marko Marković',
      lastName: 'Marković',
      lastNameNormalized: 'markovic',
    },
    id: c1ApplicantId,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Jelena',
      firstNameNormalized: 'jelena',
      fullName: 'Jelena Janković',
      lastName: 'Janković',
      lastNameNormalized: 'jankovic',
    },
    id: c2ApplicantId,
    overrideAccess: true,
  })

  // Dodaj kandidatu c2 prihvaćenu radnu ponudu (ima posao), dok c1 nema
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c2,
    employerName: 'Yellowstone Hospitality Group',
    payload,
    workCity: 'Gardiner',
    workState: 'MT',
  })

  // -------------------------------------------------------------
  // Sigurnosne provere (401 i 403)
  // -------------------------------------------------------------
  const unauthResponse = await request.get(exportPath)
  expect(unauthResponse.status()).toBe(401)

  const candidateForbiddenResponse = await request.get(exportPath, {
    headers: c1.headers,
  })
  expect(candidateForbiddenResponse.status()).toBe(401)

  // -------------------------------------------------------------
  // Kompletan izvoz svih kandidata u XLSX (FR-069)
  // -------------------------------------------------------------
  const fullExportResponse = await request.get(exportPath, {
    headers: adminHeaders,
  })
  expect(fullExportResponse.status()).toBe(200)
  expect(fullExportResponse.headers()['content-type']).toContain(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  expect(fullExportResponse.headers()['content-disposition']).toMatch(/attachment;\s*filename="kandidati-.*\.xlsx"/)

  const fullExportBuffer = await fullExportResponse.body()
  expect(fullExportBuffer.length).toBeGreaterThan(1000)

  const fullWorkbook = new ExcelJS.Workbook()
  await fullWorkbook.xlsx.load(fullExportBuffer as unknown as ArrayBuffer)

  const fullSheet = fullWorkbook.getWorksheet('Kandidati')
  expect(fullSheet).toBeDefined()
  expect(fullSheet?.rowCount).toBeGreaterThanOrEqual(3) // 1 header + min 2 kandidata

  const fullHeaderRow = fullSheet?.getRow(1)
  expect(fullHeaderRow?.getCell(1).value).toBe('ID')
  expect(fullHeaderRow?.getCell(2).value).toBe('Ime')
  expect(fullHeaderRow?.getCell(3).value).toBe('Prezime')

  // Proveri da su oba kandidata prisutna u izvozu
  const exportedEmails: string[] = []
  for (let r = 2; r <= (fullSheet?.rowCount || 0); r++) {
    const emailVal = fullSheet?.getRow(r).getCell(5).value // Email kolona je #5
    if (typeof emailVal === 'string') exportedEmails.push(emailVal)
  }
  expect(exportedEmails).toContain(c1.email)
  expect(exportedEmails).toContain(c2.email)

  // -------------------------------------------------------------
  // Izvoz sa filterom kandidata bez radne ponude (FR-068 + FR-069)
  // -------------------------------------------------------------
  const withoutJobOfferResponse = await request.get(`${exportPath}?withoutJobOffer=true`, {
    headers: adminHeaders,
  })
  expect(withoutJobOfferResponse.status()).toBe(200)

  const noJobWorkbook = new ExcelJS.Workbook()
  await noJobWorkbook.xlsx.load((await withoutJobOfferResponse.body()) as unknown as ArrayBuffer)
  const noJobSheet = noJobWorkbook.getWorksheet('Kandidati')

  const noJobEmails: string[] = []
  for (let r = 2; r <= (noJobSheet?.rowCount || 0); r++) {
    const emailVal = noJobSheet?.getRow(r).getCell(5).value
    if (typeof emailVal === 'string') noJobEmails.push(emailVal)
  }
  expect(noJobEmails).toContain(c1.email)
  expect(noJobEmails).not.toContain(c2.email) // c2 ima radnu ponudu, ne sme biti u izvozu

  // -------------------------------------------------------------
  // Projekcija traženih kolona u Excelu (FR-067 + FR-069)
  // -------------------------------------------------------------
  const projectionResponse = await request.get(
    `${exportPath}?fields=name,surname,passport,job`,
    { headers: adminHeaders },
  )
  expect(projectionResponse.status()).toBe(200)

  const projWorkbook = new ExcelJS.Workbook()
  await projWorkbook.xlsx.load((await projectionResponse.body()) as unknown as ArrayBuffer)
  const projSheet = projWorkbook.getWorksheet('Kandidati')

  expect(projSheet?.columnCount).toBe(4)
  const projHeaderRow = projSheet?.getRow(1)
  expect(projHeaderRow?.getCell(1).value).toBe('Ime')
  expect(projHeaderRow?.getCell(2).value).toBe('Prezime')
  expect(projHeaderRow?.getCell(3).value).toBe('Broj pasoša / LK')
  expect(projHeaderRow?.getCell(4).value).toBe('Radna pozicija')

  // -------------------------------------------------------------
  // Revizijski trag u audit-events (FR-070)
  // -------------------------------------------------------------
  const auditEvents = await payload.find({
    collection: 'audit-events',
    depth: 1,
    limit: 20,
    overrideAccess: true,
    where: {
      eventType: { equals: 'CANDIDATE_DATA_EXPORTED' },
    },
  })

  expect(auditEvents.totalDocs).toBeGreaterThanOrEqual(1)
  const relevantExportEvent = auditEvents.docs.find((e) => {
    const actorId =
      typeof e.actor === 'object' && e.actor !== null
        ? (e.actor as { id: number }).id
        : Number(e.actor)
    return actorId === admin.id
  })

  expect(relevantExportEvent).toBeDefined()
  expect(relevantExportEvent?.actorType).toBe('ADMIN')
  const metadata = relevantExportEvent?.metadata as {
    exportedCount?: number
    format?: string
  }
  expect(metadata?.format).toBe('XLSX')
  expect(metadata?.exportedCount).toBeGreaterThanOrEqual(1)
})
