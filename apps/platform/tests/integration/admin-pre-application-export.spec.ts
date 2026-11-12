import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import ExcelJS from 'exceljs'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-005: Admin pre-application Excel export with filters, field projection, and audit logging', async ({
  request,
  visaPayload: payload,
}) => {
  const suffix = randomUUID().slice(0, 8)
  const exportPath = '/api/admin/pre-applications/export'

  // 1. Kreiraj administratora
  const adminEmail = `admin-preapp-export-${suffix}@americanadventure.test`
  const adminPassword = 'Password123!'
  const admin = await payload.create({
    collection: 'users',
    data: {
      displayName: 'Admin Za Pre-Prijave',
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

  // 2. Kreiraj 2 kandidata sa njihovim pre-prijavama
  const c1 = await seedVisaCandidate(payload, admin.id)
  const c2 = await seedVisaCandidate(payload, admin.id)

  const c1PreAppId = typeof c1.process.preApplication === 'object' && c1.process.preApplication !== null
    ? (c1.process.preApplication as { id: number }).id
    : Number(c1.process.preApplication)

  const c2PreAppId = typeof c2.process.preApplication === 'object' && c2.process.preApplication !== null
    ? (c2.process.preApplication as { id: number }).id
    : Number(c2.process.preApplication)

  // Postavi različite statuse i podatke za testiranje filtera
  await payload.update({
    collection: 'pre-applications',
    data: {
      status: 'SUBMITTED',
      submission: {
        applicantNote: 'Želim posao u Čikagu.',
        currentStudyYear: 'YEAR_2',
        dateOfBirth: '2003-01-15',
        email: `marko-${suffix}@test.com`,
        espbPoints: 60,
        facultyName: 'FON Beograd',
        firstName: 'Marko',
        lastName: 'Jovanović',
        phone: '+38160111222',
        residentialAddress: 'Nemanjina 1, Beograd',
        studyCity: 'Beograd',
        studyInterruptionStatus: 'NONE',
      },
    },
    id: c1PreAppId,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'pre-applications',
    data: {
      status: 'QUALIFIED',
      submission: {
        applicantNote: 'Zainteresovana za poziciju spasioca.',
        currentStudyYear: 'YEAR_4',
        dateOfBirth: '2001-09-20',
        email: `ana-${suffix}@test.com`,
        espbPoints: 180,
        facultyName: 'Medicinski fakultet Novi Sad',
        firstName: 'Ana',
        lastName: 'Popović',
        phone: '+38162333444',
        residentialAddress: 'Zmaj Jovina 10, Novi Sad',
        studyCity: 'Novi Sad',
        studyInterruptionStatus: 'NONE',
      },
    },
    id: c2PreAppId,
    overrideAccess: true,
  })

  // 3. Sigurnosna provera: 401 za neautorizovan zahtev i za običnog kandidata
  const unauthRes = await request.get(exportPath)
  expect(unauthRes.status()).toBe(401)

  const candidateRes = await request.get(exportPath, { headers: c1.headers })
  expect(candidateRes.status()).toBe(401)

  // 4. Kompletan izvoz svih pre-prijava (FR-005)
  const fullExportRes = await request.get(exportPath, { headers: adminHeaders })
  expect(fullExportRes.status()).toBe(200)
  expect(fullExportRes.headers()['content-type']).toContain(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  expect(fullExportRes.headers()['content-disposition']).toMatch(/attachment;\s*filename="pre-prijave-.*\.xlsx"/)

  const fullBuffer = await fullExportRes.body()
  expect(fullBuffer.length).toBeGreaterThan(1000)

  const fullWorkbook = new ExcelJS.Workbook()
  await fullWorkbook.xlsx.load(fullBuffer as unknown as ArrayBuffer)
  const fullSheet = fullWorkbook.getWorksheet('Pre-prijave')
  expect(fullSheet).toBeDefined()
  expect(fullSheet?.rowCount).toBeGreaterThanOrEqual(3) // 1 zaglavlje + min 2 prijave

  // Proveri da su oba kandidata u izvozu
  const exportedEmails: string[] = []
  for (let r = 2; r <= (fullSheet?.rowCount || 0); r++) {
    const emailVal = fullSheet?.getRow(r).getCell(8).value // Email je kolona #8
    if (typeof emailVal === 'string') exportedEmails.push(emailVal)
  }
  expect(exportedEmails).toContain(`marko-${suffix}@test.com`)
  expect(exportedEmails).toContain(`ana-${suffix}@test.com`)

  // 5. Izvoz sa filterom po statusu (samo QUALIFIED)
  const qualifiedRes = await request.get(`${exportPath}?status=QUALIFIED`, { headers: adminHeaders })
  expect(qualifiedRes.status()).toBe(200)

  const qualifiedWorkbook = new ExcelJS.Workbook()
  await qualifiedWorkbook.xlsx.load((await qualifiedRes.body()) as unknown as ArrayBuffer)
  const qualifiedSheet = qualifiedWorkbook.getWorksheet('Pre-prijave')

  const qualifiedEmails: string[] = []
  for (let r = 2; r <= (qualifiedSheet?.rowCount || 0); r++) {
    const emailVal = qualifiedSheet?.getRow(r).getCell(8).value
    if (typeof emailVal === 'string') qualifiedEmails.push(emailVal)
  }
  expect(qualifiedEmails).toContain(`ana-${suffix}@test.com`)
  expect(qualifiedEmails).not.toContain(`marko-${suffix}@test.com`)

  // 6. Izvoz sa pretragom po imenu
  const searchRes = await request.get(`${exportPath}?search=Marko`, { headers: adminHeaders })
  expect(searchRes.status()).toBe(200)

  const searchWorkbook = new ExcelJS.Workbook()
  await searchWorkbook.xlsx.load((await searchRes.body()) as unknown as ArrayBuffer)
  const searchSheet = searchWorkbook.getWorksheet('Pre-prijave')

  const searchEmails: string[] = []
  for (let r = 2; r <= (searchSheet?.rowCount || 0); r++) {
    const emailVal = searchSheet?.getRow(r).getCell(8).value
    if (typeof emailVal === 'string') searchEmails.push(emailVal)
  }
  expect(searchEmails).toContain(`marko-${suffix}@test.com`)
  expect(searchEmails).not.toContain(`ana-${suffix}@test.com`)

  // 7. Provera audit loga u audit-events kolekciji
  const audits = await payload.find({
    collection: 'audit-events',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { actor: { equals: admin.id } },
        { eventType: { equals: 'CANDIDATE_DATA_EXPORTED' } },
      ],
    },
  })
  expect(audits.docs.length).toBeGreaterThanOrEqual(1)
  const preAppAudits = audits.docs.filter(
    (a) => (a.metadata as { exportType?: string })?.exportType === 'PRE_APPLICATIONS',
  )
  expect(preAppAudits.length).toBeGreaterThanOrEqual(1)
})
