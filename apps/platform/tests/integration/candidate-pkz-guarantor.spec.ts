import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-029–030: Pay-when-you-earn (PKZ) guarantor data, encrypted ID card upload, admin verification, and contract generation lifecycle', async ({
  request,
  visaPayload: payload,
}) => {
  const adminEmail = `guarantor-admin-${randomUUID()}@example.test`
  const adminPassword = 'Synthetic-guarantor-admin-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Guarantor Administrator', email: adminEmail, password: adminPassword },
  })
  const adminLogin = await payload.login({ collection: 'users', data: { email: adminEmail, password: adminPassword } })
  const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` }

  const candidate = await seedVisaCandidate(payload, admin.id)
  const candidateHeaders = candidate.headers

  // 1. Unauthenticated candidate request is rejected
  const unauthRes = await request.get('/api/candidate/guarantor')
  expect(unauthRes.status()).toBe(401)

  const preApplicationId = typeof candidate.process.preApplication === 'number'
    ? candidate.process.preApplication
    : candidate.process.preApplication.id

  const applicantId = typeof candidate.account.applicant === 'number'
    ? candidate.account.applicant
    : candidate.account.applicant.id

  await payload.create({
    collection: 'candidate-sensitive-profiles',
    data: {
      applicant: applicantId,
      candidateAccount: candidate.account.id,
      contractReadinessStatus: 'INCOMPLETE',
      personalIdStatus: 'MISSING',
      preApplication: preApplicationId,
      programCode: 'SWT',
    },
    overrideAccess: true,
  })

  const offer = await payload.create({
    collection: 'program-offers',
    data: {
      basePriceCents: 200_000,
      candidateAccount: candidate.account.id,
      candidateProcess: candidate.process.id,
      commercialVersion: 1,
      currency: 'USD',
      payWhenYouEarn: {
        deferredAmountCents: 150_000,
        depositCents: 50_000,
        description: 'Platiš kad zaradiš - odloženo plaćanje uz jemca i menice',
        enabled: true,
      },
      preApplication: preApplicationId,
      programCode: 'SWT',
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    overrideAccess: true,
  })

  // 2. Set up program offer selection with PKZ (PAY_WHEN_YOU_EARN)
  await payload.create({
    collection: 'program-offer-selections',
    data: {
      acceptedAt: new Date().toISOString(),
      basePriceCents: 200_000,
      candidateAccount: candidate.account.id,
      candidateProcess: candidate.process.id,
      currency: 'USD',
      discountCents: 0,
      installmentSchedule: [],
      offer: offer.id,
      offerSnapshot: {
        commercialVersion: 1,
        payWhenYouEarn: offer.payWhenYouEarn,
        publishedAt: offer.publishedAt,
        validUntil: offer.validUntil,
      },
      payWhenYouEarnSnapshot: {
        deferredAmountCents: 150_000,
        depositCents: 50_000,
        description: 'Platiš kad zaradiš - odloženo plaćanje uz jemca i menice',
      },
      selectedMethod: 'PAY_WHEN_YOU_EARN',
      totalCents: 200_000,
    },
    overrideAccess: true,
  })

  // 3. Candidate submits guarantor data
  const submitRes = await request.post('/api/candidate/guarantor', {
    data: {
      email: 'goran.petrovic@example.test',
      employerName: 'NIS a.d. Novi Sad',
      employmentStatus: 'EMPLOYED',
      fullName: 'Goran Petrović',
      idCardIssuer: 'PU Novi Sad',
      idCardNumber: '998877665',
      jobTitle: 'Rukovodilac postrojenja',
      jmbg: '1505975710120',
      monthlyIncomeRsd: 145_000,
      phone: '+381641122334',
      promissoryNotesCount: 2,
      relationship: 'PARENT',
      residentialAddress: 'Bulevar oslobođenja 45, 21000 Novi Sad',
    },
    headers: candidateHeaders,
  })
  expect(submitRes.status()).toBe(201)
  const submitJson = await submitRes.json()
  expect(submitJson.guarantor.fullName).toBe('Goran Petrović')
  expect(submitJson.guarantor.status).toBe('PENDING_REVIEW')
  expect(submitJson.guarantor.jmbgMasked).toBe('1505975******')
  const guarantorId = submitJson.guarantor.id

  // 4. Candidate checks their guarantor overview
  const overviewRes = await request.get('/api/candidate/guarantor', {
    headers: candidateHeaders,
  })
  expect(overviewRes.status()).toBe(200)
  const overviewJson = await overviewRes.json()
  expect(overviewJson.guarantor).not.toBeNull()
  expect(overviewJson.guarantor.fullName).toBe('Goran Petrović')
  expect(overviewJson.guarantor.hasIdCardDocument).toBe(false)

  // 5. Candidate uploads guarantor ID card
  const mockIdCardPdf = Buffer.from('%PDF-1.7 synthetic electronic id card copy')
  const uploadRes = await request.post('/api/candidate/guarantor/id-card', {
    headers: candidateHeaders,
    multipart: {
      idCard: {
        buffer: mockIdCardPdf,
        mimeType: 'application/pdf',
        name: 'ocitana_licna_karta_jemca.pdf',
      },
    },
  })
  expect(uploadRes.status()).toBe(201)
  const uploadJson = await uploadRes.json()
  expect(uploadJson.documentId).toBeGreaterThan(0)
  expect(uploadJson.fileName).toBe('ocitana_licna_karta_jemca.pdf')

  // 6. Admin lists guarantors
  const adminListRes = await request.get('/api/admin/guarantor?status=PENDING_REVIEW', {
    headers: adminHeaders,
  })
  expect(adminListRes.status()).toBe(200)
  const adminListJson = await adminListRes.json()
  const foundGuarantor = adminListJson.docs.find((g: { id: number; idCardDocument?: unknown; status: string }) => g.id === guarantorId)
  expect(foundGuarantor).toBeDefined()
  expect(foundGuarantor.status).toBe('PENDING_REVIEW')
  expect(foundGuarantor.idCardDocument).toBeDefined()

  // 7. Admin inspects decrypted guarantor ID card
  const inspectDocRes = await request.get(`/api/admin/guarantor/${guarantorId}/id-card`, {
    headers: adminHeaders,
  })
  expect(inspectDocRes.status()).toBe(200)
  expect(inspectDocRes.headers()['content-type']).toBe('application/pdf')
  const downloadedIdBytes = await inspectDocRes.body()
  expect(downloadedIdBytes.toString('utf8')).toContain('%PDF-1.7')

  // 8. Admin verifies the guarantor
  const verifyRes = await request.post(`/api/admin/guarantor/${guarantorId}/verify`, {
    headers: adminHeaders,
  })
  expect(verifyRes.status()).toBe(200)
  const verifyJson = await verifyRes.json()
  expect(verifyJson.guarantor.status).toBe('VERIFIED')

  // 9. Candidate downloads the generated guarantor contract PDF
  const contractPdfRes = await request.get('/api/candidate/guarantor/contract-pdf', {
    headers: candidateHeaders,
  })
  expect(contractPdfRes.status()).toBe(200)
  expect(contractPdfRes.headers()['content-type']).toBe('application/pdf')
  const contractPdfBytes = await contractPdfRes.body()
  expect(contractPdfBytes.slice(0, 5).toString('utf8')).toBe('%PDF-')
})
