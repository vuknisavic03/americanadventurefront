import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
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
  const applicantId = typeof candidate.process.applicant === 'object' && candidate.process.applicant !== null
    ? (candidate.process.applicant as { id: number }).id
    : Number(candidate.process.applicant)

  const preApplicationId = typeof candidate.process.preApplication === 'object' && candidate.process.preApplication !== null
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
      jobTitle: 'Resort Staff',
      notificationStatus: 'DELIVERED',
      offerVersion: 1,
      preApplication: preApplicationId,
      programCode: 'SWT',
      publishedAt: new Date().toISOString(),
      publishedBy: adminId,
      snapshotChecksum: 'c'.repeat(64),
      startDate: '2026-06-01',
      status: 'ACCEPTED',
      statusVersion: 1,
      workCity,
      workState,
    },
    overrideAccess: true,
  })
}

test('FR-064..FR-068, FR-074: Admin candidate central overview, search, filters, profile editing, and audit', async ({
  request,
  visaPayload: payload,
}) => {
  const adminEmail = `admin-overview-${randomUUID()}@example.test`
  const adminPassword = 'Synthetic-admin-pass-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Overview Administrator', email: adminEmail, password: adminPassword },
  })

  const login = await payload.login({ collection: 'users', data: { email: adminEmail, password: adminPassword } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }

  // Seed dva kandidata
  const c1 = await seedVisaCandidate(payload, admin.id) // Candidate 1 (Petar)
  const c2 = await seedVisaCandidate(payload, admin.id) // Candidate 2 (Ana)

  const c1ApplicantId = typeof c1.process.applicant === 'object' && c1.process.applicant !== null
    ? (c1.process.applicant as { id: number }).id
    : Number(c1.process.applicant)

  const c2ApplicantId = typeof c2.process.applicant === 'object' && c2.process.applicant !== null
    ? (c2.process.applicant as { id: number }).id
    : Number(c2.process.applicant)

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Petar',
      firstNameNormalized: 'petar',
      fullName: 'Petar Petrović',
      lastName: 'Petrović',
      lastNameNormalized: 'petrovic',
    },
    id: c1ApplicantId,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Ana',
      firstNameNormalized: 'ana',
      fullName: 'Ana Anić',
      lastName: 'Anić',
      lastNameNormalized: 'anic',
    },
    id: c2ApplicantId,
    overrideAccess: true,
  })

  const basePath = '/api/admin/candidates'

  // -------------------------------------------------------------
  // 1. Bezbednosne provere i autorizacija (NFR-003)
  // -------------------------------------------------------------
  expect((await request.get(basePath)).status()).toBe(401)
  expect((await request.get(basePath, { headers: c1.headers })).status()).toBe(401)
  expect((await request.get(`${basePath}/${c1.process.id}`)).status()).toBe(401)
  expect((await request.patch(`${basePath}/${c1.process.id}`, { data: { adminNotes: 'test' } })).status()).toBe(401)
  expect(
    (
      await request.patch(`${basePath}/${c1.process.id}`, {
        data: { adminNotes: 'test' },
        headers: { ...adminHeaders, Origin: 'https://untrusted.invalid' },
      })
    ).status(),
  ).toBe(403)

  // -------------------------------------------------------------
  // 2. FR-064: Centralni pregled kandidata
  // -------------------------------------------------------------
  const allResponse = await request.get(basePath, { headers: adminHeaders })
  expect(allResponse.status()).toBe(200)
  const allData = await allResponse.json()
  expect(allData.total).toBeGreaterThanOrEqual(2)
  expect(Array.isArray(allData.candidates)).toBe(true)

  const emails = allData.candidates.map((c: { email: string }) => c.email)
  expect(emails).toContain(c1.email)
  expect(emails).toContain(c2.email)

  // -------------------------------------------------------------
  // 3. FR-068: Filter kandidata bez radne ponude
  // -------------------------------------------------------------
  // c2 dobija prihvaćenu radnu ponudu, c1 ostaje bez ponude
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c2,
    employerName: 'Cedar Point Amusement Park',
    payload,
    workCity: 'Sandusky',
    workState: 'OH',
  })

  // Filter: samo kandidati BEZ radne ponude
  const noJobResponse = await request.get(`${basePath}?withoutJobOffer=true`, { headers: adminHeaders })
  expect(noJobResponse.status()).toBe(200)
  const noJobData = await noJobResponse.json()
  const noJobEmails = noJobData.candidates.map((c: { email: string }) => c.email)
  expect(noJobEmails).toContain(c1.email)
  expect(noJobEmails).not.toContain(c2.email)

  // Filter: samo kandidati SA radnom ponudom
  const hasJobResponse = await request.get(`${basePath}?hasJobOffer=true`, { headers: adminHeaders })
  expect(hasJobResponse.status()).toBe(200)
  const hasJobData = await hasJobResponse.json()
  const hasJobEmails = hasJobData.candidates.map((c: { email: string }) => c.email)
  expect(hasJobEmails).toContain(c2.email)
  expect(hasJobEmails).not.toContain(c1.email)

  // -------------------------------------------------------------
  // 4. FR-074: Pretraga po imenu / emailu
  // -------------------------------------------------------------
  const searchResponse = await request.get(`${basePath}?search=Petar`, { headers: adminHeaders })
  expect(searchResponse.status()).toBe(200)
  const searchData = await searchResponse.json()
  const searchEmails = searchData.candidates.map((c: { email: string }) => c.email)
  expect(searchEmails).toContain(c1.email)
  expect(searchEmails).not.toContain(c2.email)

  // -------------------------------------------------------------
  // 5. FR-066: Filteri po koraku procesa
  // -------------------------------------------------------------
  await payload.update({
    collection: 'candidate-processes',
    data: { currentStep: 'JOB_PLACEMENT' },
    id: c1.process.id,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'candidate-processes',
    data: { currentStep: 'VISA' },
    id: c2.process.id,
    overrideAccess: true,
  })

  const visaStepResponse = await request.get(`${basePath}?currentStep=VISA`, { headers: adminHeaders })
  expect(visaStepResponse.status()).toBe(200)
  const visaData = await visaStepResponse.json()
  const visaEmails = visaData.candidates.map((c: { email: string }) => c.email)
  expect(visaEmails).toContain(c2.email)
  expect(visaEmails).not.toContain(c1.email)

  // -------------------------------------------------------------
  // 6. FR-067: Filter po broju pasoša / poljima
  // -------------------------------------------------------------
  await payload.create({
    collection: 'candidate-applications',
    data: {
      email: c1.email,
      firstName: 'Petar',
      idCardNumber: 'P010948212',
      lastName: 'Petrović',
      packageId: 'swt-full',
      packageName: 'Work & Travel USA — Full Placement',
      paymentMethod: 'now',
      progress: 60,
      status: 'docs',
    },
    overrideAccess: true,
  })

  const passportResponse = await request.get(`${basePath}?passportNumber=010948`, { headers: adminHeaders })
  expect(passportResponse.status()).toBe(200)
  const passportData = await passportResponse.json()
  const passportEmails = passportData.candidates.map((c: { email: string }) => c.email)
  expect(passportEmails).toContain(c1.email)

  // Projekcija samo izabranih polja
  const fieldsResponse = await request.get(`${basePath}?fields=fullName,idCardOrPassportNumber`, { headers: adminHeaders })
  expect(fieldsResponse.status()).toBe(200)
  const fieldsData = await fieldsResponse.json()
  const firstSample = fieldsData.candidates.find((c: { id: number }) => c.id === c1.process.id)
  expect(firstSample).toBeDefined()
  expect(firstSample.fullName).toBe('Petar Petrović')
  expect(firstSample.idCardOrPassportNumber).toBe('P010948212')
  expect(firstSample.email).toBeUndefined() // Nije traženo u fields parametru

  // -------------------------------------------------------------
  // 7. FR-065 & FR-070: Pristup, izmena profila i revizijski trag
  // -------------------------------------------------------------
  const detailResponse = await request.get(`${basePath}/${c1.process.id}`, { headers: adminHeaders })
  expect(detailResponse.status()).toBe(200)
  const detailData = (await detailResponse.json()).candidate
  expect(detailData.id).toBe(c1.process.id)
  expect(detailData.fullName).toBe('Petar Petrović')

  // Izmena od strane administratora
  const updateResponse = await request.patch(`${basePath}/${c1.process.id}`, {
    data: {
      adminNotes: 'Intervju sa poslodavcem je uspešno prošao.',
      currentStep: 'VISA',
      phone: '+38169999888',
      processStatus: 'ACTIVE',
    },
    headers: adminHeaders,
  })
  expect(updateResponse.status()).toBe(200)
  const updateData = (await updateResponse.json()).candidate
  expect(updateData.currentStep).toBe('VISA')
  expect(updateData.adminNotes).toBe('Intervju sa poslodavcem je uspešno prošao.')

  // Provera audit loga u audit-events kolekciji
  const auditEvents = await payload.find({
    collection: 'audit-events',
    limit: 10,
    overrideAccess: true,
    where: {
      eventType: { equals: 'CANDIDATE_PROCESS_UPDATED' },
    },
  })
  expect(auditEvents.totalDocs).toBeGreaterThanOrEqual(1)
  const relevantEvent = auditEvents.docs.find((e) => {
    const actorId = typeof e.actor === 'object' && e.actor !== null
      ? (e.actor as { id: number }).id
      : Number(e.actor)
    return actorId === admin.id
  })
  expect(relevantEvent).toBeDefined()
  expect(relevantEvent?.actorType).toBe('ADMIN')
})
