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
      hourlyWageCents: 1550,
      housingProvided: true,
      jobTitle: 'Resort Staff',
      notificationStatus: 'DELIVERED',
      offerVersion: 1,
      preApplication: preApplicationId,
      programCode: 'SWT',
      publishedAt: new Date().toISOString(),
      publishedBy: adminId,
      snapshotChecksum: 'b'.repeat(64),
      startDate: '2026-06-01',
      status: 'ACCEPTED',
      statusVersion: 1,
      workCity,
      workState,
    },
    overrideAccess: true,
  })
}

test('FR-060, FR-061, FR-062: USA stay materials, tips, and privacy-preserving peer networking', async ({
  request,
  visaPayload: payload,
}) => {
  const adminEmail = `usa-stay-admin-${randomUUID()}@example.test`
  const adminPassword = 'Synthetic-admin-stay-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'USA Stay Administrator', email: adminEmail, password: adminPassword },
  })

  // 1. Seed candidates
  const c1 = await seedVisaCandidate(payload, admin.id) // Candidate 1 (active viewer)
  const c2 = await seedVisaCandidate(payload, admin.id) // Candidate 2 (same employer, consented)
  const c3 = await seedVisaCandidate(payload, admin.id) // Candidate 3 (same state, consented)
  const c4 = await seedVisaCandidate(payload, admin.id) // Candidate 4 (different state, consented)
  const c5 = await seedVisaCandidate(payload, admin.id) // Candidate 5 (same employer, NO consent)

  // Move them to TRAVEL_PREPARATION stage
  for (const c of [c1, c2, c3, c4, c5]) {
    await payload.update({
      collection: 'candidate-processes',
      data: { currentStep: 'TRAVEL_PREPARATION' },
      id: c.process.id,
      overrideAccess: true,
    })
  }

  // -------------------------------------------------------------
  // FR-060: Materijali za boravak u USA
  // -------------------------------------------------------------
  const materialsUrl = '/api/candidate/usa-stay/materials'

  // Unauthorized access check
  expect((await request.get(materialsUrl)).status()).toBe(401)

  // Seed materials
  const matHandbook = await payload.create({
    collection: 'usa-stay-materials',
    data: {
      category: 'HANDBOOK',
      description: 'Zvanični priručnik za SWT 2026',
      fileName: 'swt-handbook-2026.pdf',
      fileSize: '2.4 MB',
      fileUrl: 'https://example.test/materials/swt-handbook-2026.pdf',
      programCode: 'SWT',
      published: true,
      sortOrder: 1,
      title: 'SWT Studentski Priručnik',
    },
    overrideAccess: true,
  })

  const matEmergency = await payload.create({
    collection: 'usa-stay-materials',
    data: {
      category: 'EMERGENCY',
      description: 'Hitni telefoni i kontakti sponzora',
      fileName: 'sos-kontakti.pdf',
      fileSize: '512 KB',
      fileUrl: 'https://example.test/materials/sos-kontakti.pdf',
      programCode: 'ALL',
      published: true,
      sortOrder: 2,
      title: 'Hitni SOS Kontakti i Podrška',
    },
    overrideAccess: true,
  })

  // Unpublished material
  await payload.create({
    collection: 'usa-stay-materials',
    data: {
      category: 'HANDBOOK',
      description: 'Draft priručnik koji još nije odobren',
      fileName: 'draft.pdf',
      fileUrl: 'https://example.test/materials/draft.pdf',
      programCode: 'SWT',
      published: false,
      title: 'Nacrt Priručnika',
    },
    overrideAccess: true,
  })

  const matResponse = await request.get(materialsUrl, { headers: c1.headers })
  expect(matResponse.status()).toBe(200)
  const matBody = await matResponse.json()
  expect(Array.isArray(matBody.materials)).toBe(true)
  const returnedMaterialTitles = matBody.materials.map((m: { title: string }) => m.title)
  expect(returnedMaterialTitles).toContain(matHandbook.title)
  expect(returnedMaterialTitles).toContain(matEmergency.title)
  expect(returnedMaterialTitles).not.toContain('Nacrt Priručnika')

  // -------------------------------------------------------------
  // FR-062: Korisni saveti za boravak u USA
  // -------------------------------------------------------------
  const tipsUrl = '/api/candidate/usa-stay/tips'

  // Unauthorized check
  expect((await request.get(tipsUrl)).status()).toBe(401)

  // Seed tips
  const tipSsn = await payload.create({
    collection: 'usa-stay-tips',
    data: {
      category: 'SSN',
      content: 'Nakon ulaska u SAD, sačekajte minimum 10 dana pre posete Social Security Administration...',
      pinned: true,
      published: true,
      sortOrder: 1,
      summary: 'Koraci za izdavanje Social Security broja (SSN).',
      title: 'Kako i kada podneti zahtev za SSN',
    },
    overrideAccess: true,
  })

  const tipBanking = await payload.create({
    collection: 'usa-stay-tips',
    data: {
      category: 'BANKING',
      content: 'Za otvaranje računa potrebni su vam pasoš sa J-1 vizom, DS-2019 i dokaz o adresi...',
      pinned: false,
      published: true,
      sortOrder: 2,
      summary: 'Otvaranje računa u američkoj banci bez provizije.',
      title: 'Otvaranje bankovnog računa u SAD',
    },
    overrideAccess: true,
  })

  // Unpublished tip
  await payload.create({
    collection: 'usa-stay-tips',
    data: {
      category: 'HOUSING',
      content: 'Interni tekst za smeštaj...',
      published: false,
      summary: 'Draft sažetak',
      title: 'Draft savet za smeštaj',
    },
    overrideAccess: true,
  })

  const tipsResponse = await request.get(tipsUrl, { headers: c1.headers })
  expect(tipsResponse.status()).toBe(200)
  const tipsBody = await tipsResponse.json()
  const returnedTipTitles = tipsBody.tips.map((t: { title: string }) => t.title)
  expect(returnedTipTitles).toContain(tipSsn.title)
  expect(returnedTipTitles).toContain(tipBanking.title)
  expect(returnedTipTitles).not.toContain('Draft savet za smeštaj')
  // Pinned tip should be first
  expect(tipsBody.tips[0].title).toBe(tipSsn.title)

  // Category filtering
  const ssnOnlyResponse = await request.get(`${tipsUrl}?category=SSN`, { headers: c1.headers })
  expect(ssnOnlyResponse.status()).toBe(200)
  const ssnOnlyBody = await ssnOnlyResponse.json()
  expect(ssnOnlyBody.tips.every((t: { category: string }) => t.category === 'SSN')).toBe(true)

  // -------------------------------------------------------------
  // FR-061: Povezivanje studenata po poslodavcu i saveznoj državi
  // -------------------------------------------------------------
  const peersUrl = '/api/candidate/usa-stay/peers'
  const consentUrl = '/api/candidate/usa-stay/peers/consent'

  // Security checks
  expect((await request.get(peersUrl)).status()).toBe(401)
  expect((await request.post(consentUrl, { data: { consent: true } })).status()).toBe(401)
  expect((await request.post(consentUrl, {
    data: { consent: true },
    headers: { ...c1.headers, Origin: 'https://untrusted.invalid' },
  })).status()).toBe(403)
  expect((await request.post(consentUrl, {
    data: { consent: 'invalid-type' },
    headers: c1.headers,
  })).status()).toBe(400)

  // Create accepted job offers
  // c1: Cedar Point, OH
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c1,
    employerName: 'Cedar Point Amusement Park',
    payload,
    workCity: 'Sandusky',
    workState: 'OH',
  })

  // c2: Cedar Point, OH (has consent)
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c2,
    employerName: 'Cedar Point Amusement Park',
    payload,
    workCity: 'Sandusky',
    workState: 'OH',
  })
  await payload.update({
    collection: 'candidate-processes',
    data: { peerSharingConsent: true },
    id: c2.process.id,
    overrideAccess: true,
  })

  // c3: Kalahari Resorts, OH (same state, different employer, has consent)
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c3,
    employerName: 'Kalahari Resorts',
    payload,
    workCity: 'Sandusky',
    workState: 'OH',
  })
  await payload.update({
    collection: 'candidate-processes',
    data: { peerSharingConsent: true },
    id: c3.process.id,
    overrideAccess: true,
  })

  // c4: Grand Canyon Lodges, AZ (different state, has consent)
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c4,
    employerName: 'Grand Canyon Lodges',
    payload,
    workCity: 'Grand Canyon',
    workState: 'AZ',
  })
  await payload.update({
    collection: 'candidate-processes',
    data: { peerSharingConsent: true },
    id: c4.process.id,
    overrideAccess: true,
  })

  // c5: Cedar Point, OH (same employer, NO consent)
  await createAcceptedOffer({
    adminId: admin.id,
    candidate: c5,
    employerName: 'Cedar Point Amusement Park',
    payload,
    workCity: 'Sandusky',
    workState: 'OH',
  })
  await payload.update({
    collection: 'candidate-processes',
    data: { peerSharingConsent: false },
    id: c5.process.id,
    overrideAccess: true,
  })

  // Phase 1: Candidate 1 has not consented yet.
  // Privacy verification: Contacts MUST be withheld even though eligible peers exist.
  const peersInitial = await request.get(peersUrl, { headers: c1.headers })
  expect(peersInitial.status()).toBe(200)
  const initialBody = await peersInitial.json()
  expect(initialBody.hasConsent).toBe(false)
  expect(initialBody.myPlacement).toMatchObject({
    city: 'Sandusky',
    employerName: 'Cedar Point Amusement Park',
    state: 'OH',
  })
  expect(initialBody.totalEligiblePeers).toBe(2) // c2 (same employer) and c3 (same state)
  expect(initialBody.peersSameEmployer).toHaveLength(0)
  expect(initialBody.peersSameState).toHaveLength(0)

  // Verify raw response body does NOT contain candidate emails
  const rawTextBeforeConsent = await peersInitial.text()
  expect(rawTextBeforeConsent).not.toContain(c2.email)
  expect(rawTextBeforeConsent).not.toContain(c3.email)

  // Phase 2: Candidate 1 grants consent
  const consentPost = await request.post(consentUrl, {
    data: { consent: true },
    headers: c1.headers,
  })
  expect(consentPost.status()).toBe(200)
  expect((await consentPost.json()).consent).toBe(true)

  // Phase 3: Candidate 1 queries peers with consent active
  const peersAfterConsent = await request.get(peersUrl, { headers: c1.headers })
  expect(peersAfterConsent.status()).toBe(200)
  const afterBody = await peersAfterConsent.json()
  expect(afterBody.hasConsent).toBe(true)
  expect(afterBody.totalEligiblePeers).toBe(2)

  // Same employer list should have c2
  expect(afterBody.peersSameEmployer).toHaveLength(1)
  expect(afterBody.peersSameEmployer[0]).toMatchObject({
    city: 'Sandusky',
    email: c2.email,
    employerName: 'Cedar Point Amusement Park',
    state: 'OH',
  })

  // Candidate 5 (same employer but NO consent) MUST NOT appear in the list!
  expect(afterBody.peersSameEmployer.map((p: { email: string }) => p.email)).not.toContain(c5.email)

  // Same state list should have c3 (different employer, same state)
  expect(afterBody.peersSameState).toHaveLength(1)
  expect(afterBody.peersSameState[0]).toMatchObject({
    city: 'Sandusky',
    email: c3.email,
    employerName: 'Kalahari Resorts',
    state: 'OH',
  })

  // Candidate 4 (different state AZ) MUST NOT appear in either list!
  const allReturnedEmails = [
    ...afterBody.peersSameEmployer.map((p: { email: string }) => p.email),
    ...afterBody.peersSameState.map((p: { email: string }) => p.email),
  ]
  expect(allReturnedEmails).not.toContain(c4.email)

  // Phase 4: Candidate 1 revokes consent
  const revokePost = await request.post(consentUrl, {
    data: { consent: false },
    headers: c1.headers,
  })
  expect(revokePost.status()).toBe(200)
  expect((await revokePost.json()).consent).toBe(false)

  // Phase 5: Querying after revoking consent hides contact list again
  const peersAfterRevocation = await request.get(peersUrl, { headers: c1.headers })
  expect(peersAfterRevocation.status()).toBe(200)
  const revokedBody = await peersAfterRevocation.json()
  expect(revokedBody.hasConsent).toBe(false)
  expect(revokedBody.peersSameEmployer).toHaveLength(0)
  expect(revokedBody.peersSameState).toHaveLength(0)
  expect(revokedBody.totalEligiblePeers).toBe(2)
})
