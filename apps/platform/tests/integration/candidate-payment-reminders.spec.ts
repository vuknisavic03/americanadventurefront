import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-039: Candidate payment reminders, overdue notices, multi-channel dispatch, idempotency, and audit logging', async ({
  request,
  visaPayload: payload,
}) => {
  const email = `reminder-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-reminder-admin-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Payment Reminder Admin', email, password },
  })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }

  // 1. Unauthenticated boundary check
  const unauthRes = await request.get('/api/admin/payments/reminders')
  expect(unauthRes.status()).toBe(401)

  // 2. Seed 2 candidates with payment plans
  const candidate1 = await seedVisaCandidate(payload, admin.id)
  const candidate2 = await seedVisaCandidate(payload, admin.id)

  const preApp1Id =
    typeof candidate1.process.preApplication === 'number'
      ? candidate1.process.preApplication
      : candidate1.process.preApplication.id

  const preApp2Id =
    typeof candidate2.process.preApplication === 'number'
      ? candidate2.process.preApplication
      : candidate2.process.preApplication.id

  const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString()
  const fortyFiveDaysFromNow = new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString()
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()

  // Create contract and acceptance for candidate 1
  const template1 = await payload.create({
    collection: 'contract-templates',
    data: {
      body: 'Ugovor za kandidata 1.',
      contentChecksum: 'b'.repeat(64),
      name: 'Standardni ugovor',
      programCode: 'SWT',
      status: 'DRAFT',
      templateType: 'STANDARD',
      version: 1,
    },
    overrideAccess: true,
  })

  const offer1 = await payload.create({
    collection: 'program-offers',
    data: {
      basePriceCents: 185000,
      candidateAccount: candidate1.account.id,
      candidateProcess: candidate1.process.id,
      commercialVersion: 1,
      currency: 'USD',
      preApplication: preApp1Id,
      programCode: 'SWT',
      status: 'DRAFT',
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    overrideAccess: true,
  })

  const selection1 = await payload.create({
    collection: 'program-offer-selections',
    data: {
      acceptedAt: new Date().toISOString(),
      basePriceCents: 185000,
      candidateAccount: candidate1.account.id,
      candidateProcess: candidate1.process.id,
      currency: 'USD',
      discountCents: 0,
      offer: offer1.id,
      offerSnapshot: { snapshot: true },
      selectedMethod: 'INSTALLMENTS',
      totalCents: 185000,
    },
    overrideAccess: true,
  })

  const sensitiveProfile1 = await payload.create({
    collection: 'candidate-sensitive-profiles',
    data: {
      applicant: typeof candidate1.account.applicant === 'number' ? candidate1.account.applicant : candidate1.account.applicant.id,
      candidateAccount: candidate1.account.id,
      contractReadinessStatus: 'INCOMPLETE',
      personalIdStatus: 'MISSING',
      preApplication: preApp1Id,
      programCode: 'SWT',
    },
    overrideAccess: true,
  })

  const contract1 = await payload.create({
    collection: 'generated-contracts',
    data: {
      candidateAccount: candidate1.account.id,
      contractNumber: `AA-SWT-${randomUUID().slice(0, 8).toUpperCase()}`,
      contractTemplate: template1.id,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.id,
      generationKey: randomUUID(),
      pdfAuthTag: 'auth',
      pdfCiphertext: 'encrypted-pdf',
      pdfFileName: 'ugovor.pdf',
      pdfIv: 'iv',
      pdfKeyId: 'key-1',
      pdfSha256: 'b'.repeat(64),
      pdfSizeBytes: 100,
      preApplication: preApp1Id,
      programCode: 'SWT',
      programOfferSelection: selection1.id,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sensitiveProfile: sensitiveProfile1.id,
      snapshotAuthTag: 'auth',
      snapshotCiphertext: 'encrypted-snapshot',
      snapshotIv: 'iv',
      snapshotKeyId: 'key-1',
      snapshotSha256: 'b'.repeat(64),
      status: 'GENERATED',
      templateChecksum: 'b'.repeat(64),
      templateType: 'STANDARD',
      templateVersion: 1,
    },
    overrideAccess: true,
  })

  const acceptance1 = await payload.create({
    collection: 'contract-acceptances',
    data: {
      acceptanceReference: `AA-ACC-${randomUUID().slice(0, 8).toUpperCase()}`,
      acceptedAt: new Date().toISOString(),
      candidateAccount: candidate1.account.id,
      contract: contract1.id,
      evidenceSha256: 'b'.repeat(64),
      finalPdfAuthTag: 'auth',
      finalPdfCiphertext: 'encrypted-final',
      finalPdfFileName: 'ugovor-prihvacen.pdf',
      finalPdfIv: 'iv',
      finalPdfKeyId: 'key-1',
      finalPdfSha256: 'b'.repeat(64),
      finalPdfSizeBytes: 100,
      preApplication: preApp1Id,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sourcePdfSha256: 'b'.repeat(64),
      statementChecksum: 'b'.repeat(64),
      statementText: 'Prihvatam uslove.',
      statementVersion: '1.0',
    },
    overrideAccess: true,
  })

  // Plan 1: I rata 350 (paid), II rata 700 (due in 4 days -> PRE_DUE), III rata 800 (due in 45 days)
  await payload.create({
    collection: 'candidate-payment-plans',
    data: {
      candidateAccount: candidate1.account.id,
      candidateProcess: candidate1.process.id,
      contractAcceptance: acceptance1.id,
      currency: 'USD',
      firstPaymentRequiredCents: 35000,
      firstPaymentStatus: 'CONFIRMED',
      obligations: [
        { amountCents: 35000, dueAt: new Date(Date.now() - 30 * 86400000).toISOString(), key: 'INITIAL', kind: 'INITIAL', label: 'I rata programa' },
        { amountCents: 70000, dueAt: fourDaysFromNow, key: 'INSTALLMENT_2', kind: 'INSTALLMENT', label: 'II rata programa' },
        { amountCents: 80000, dueAt: fortyFiveDaysFromNow, key: 'INSTALLMENT_3', kind: 'INSTALLMENT', label: 'III rata programa' },
      ],
      paidCents: 35000,
      preApplication: preApp1Id,
      programOfferSelection: selection1.id,
      remainingCents: 150000,
      selectedMethod: 'INSTALLMENTS',
      status: 'ACTIVE',
      totalCents: 185000,
    },
    overrideAccess: true,
  })

  // Plan 2 for candidate 2: I rata 500 (due 5 days ago -> OVERDUE)
  const offer2 = await payload.create({
    collection: 'program-offers',
    data: {
      basePriceCents: 100000,
      candidateAccount: candidate2.account.id,
      candidateProcess: candidate2.process.id,
      commercialVersion: 1,
      currency: 'USD',
      preApplication: preApp2Id,
      programCode: 'SWT',
      status: 'DRAFT',
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    overrideAccess: true,
  })

  const selection2 = await payload.create({
    collection: 'program-offer-selections',
    data: {
      acceptedAt: new Date().toISOString(),
      basePriceCents: 100000,
      candidateAccount: candidate2.account.id,
      candidateProcess: candidate2.process.id,
      currency: 'USD',
      discountCents: 0,
      offer: offer2.id,
      offerSnapshot: { snapshot: true },
      selectedMethod: 'INSTALLMENTS',
      totalCents: 100000,
    },
    overrideAccess: true,
  })

  const sensitiveProfile2 = await payload.create({
    collection: 'candidate-sensitive-profiles',
    data: {
      applicant: typeof candidate2.account.applicant === 'number' ? candidate2.account.applicant : candidate2.account.applicant.id,
      candidateAccount: candidate2.account.id,
      contractReadinessStatus: 'INCOMPLETE',
      personalIdStatus: 'MISSING',
      preApplication: preApp2Id,
      programCode: 'SWT',
    },
    overrideAccess: true,
  })

  const contract2 = await payload.create({
    collection: 'generated-contracts',
    data: {
      candidateAccount: candidate2.account.id,
      contractNumber: `AA-SWT-${randomUUID().slice(0, 8).toUpperCase()}`,
      contractTemplate: template1.id,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.id,
      generationKey: randomUUID(),
      pdfAuthTag: 'auth',
      pdfCiphertext: 'encrypted-pdf',
      pdfFileName: 'ugovor.pdf',
      pdfIv: 'iv',
      pdfKeyId: 'key-1',
      pdfSha256: 'c'.repeat(64),
      pdfSizeBytes: 100,
      preApplication: preApp2Id,
      programCode: 'SWT',
      programOfferSelection: selection2.id,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sensitiveProfile: sensitiveProfile2.id,
      snapshotAuthTag: 'auth',
      snapshotCiphertext: 'encrypted-snapshot',
      snapshotIv: 'iv',
      snapshotKeyId: 'key-1',
      snapshotSha256: 'c'.repeat(64),
      status: 'GENERATED',
      templateChecksum: 'c'.repeat(64),
      templateType: 'STANDARD',
      templateVersion: 1,
    },
    overrideAccess: true,
  })

  const acceptance2 = await payload.create({
    collection: 'contract-acceptances',
    data: {
      acceptanceReference: `AA-ACC-${randomUUID().slice(0, 8).toUpperCase()}`,
      acceptedAt: new Date().toISOString(),
      candidateAccount: candidate2.account.id,
      contract: contract2.id,
      evidenceSha256: 'c'.repeat(64),
      finalPdfAuthTag: 'auth',
      finalPdfCiphertext: 'encrypted-final',
      finalPdfFileName: 'ugovor-prihvacen.pdf',
      finalPdfIv: 'iv',
      finalPdfKeyId: 'key-1',
      finalPdfSha256: 'c'.repeat(64),
      finalPdfSizeBytes: 100,
      preApplication: preApp2Id,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sourcePdfSha256: 'c'.repeat(64),
      statementChecksum: 'c'.repeat(64),
      statementText: 'Prihvatam uslove.',
      statementVersion: '1.0',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'candidate-payment-plans',
    data: {
      candidateAccount: candidate2.account.id,
      candidateProcess: candidate2.process.id,
      contractAcceptance: acceptance2.id,
      currency: 'USD',
      firstPaymentRequiredCents: 50000,
      firstPaymentStatus: 'PENDING',
      obligations: [
        { amountCents: 50000, dueAt: fiveDaysAgo, key: 'INITIAL', kind: 'INITIAL', label: 'I rata programa' },
        { amountCents: 50000, dueAt: fortyFiveDaysFromNow, key: 'INSTALLMENT_2', kind: 'INSTALLMENT', label: 'II rata programa' },
      ],
      paidCents: 0,
      preApplication: preApp2Id,
      programOfferSelection: selection2.id,
      remainingCents: 100000,
      selectedMethod: 'INSTALLMENTS',
      status: 'ACTIVE',
      totalCents: 100000,
    },
    overrideAccess: true,
  })

  // 3. GET /api/admin/payments/reminders
  const listRes = await request.get('/api/admin/payments/reminders', {
    headers: adminHeaders,
  })
  expect(listRes.status()).toBe(200)
  const listData = await listRes.json()
  expect(listData.items.length).toBeGreaterThanOrEqual(2)
  expect(listData.stats.totalActivePlans).toBeGreaterThanOrEqual(2)
  expect(listData.stats.preDueCount).toBeGreaterThanOrEqual(1)
  expect(listData.stats.overdueCount).toBeGreaterThanOrEqual(1)

  // Filter by OVERDUE
  const overdueRes = await request.get('/api/admin/payments/reminders?triggerFilter=OVERDUE', {
    headers: adminHeaders,
  })
  expect(overdueRes.status()).toBe(200)
  const overdueData = await overdueRes.json()
  const candidate2InOverdue = overdueData.items.find(
    (i: { candidateProcessId: number }) => i.candidateProcessId === candidate2.process.id,
  )
  expect(candidate2InOverdue).toBeDefined()
  expect(candidate2InOverdue.activeObligation.trigger).toBe('OVERDUE')

  // 4. Send single reminder for Candidate 1 (PRE_DUE, II rata)
  const sendRes1 = await request.post('/api/admin/payments/reminders', {
    data: {
      candidateProcessId: candidate1.process.id,
      channel: 'EMAIL',
      obligationKey: 'INSTALLMENT_2',
    },
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
  })
  expect(sendRes1.status()).toBe(200)
  const sendData1 = await sendRes1.json()
  expect(sendData1.results).toHaveLength(1)
  expect(sendData1.results[0].status).toBe('DELIVERED')
  expect(sendData1.results[0].channel).toBe('EMAIL')

  // Verify communication-log entry
  const commLogs1 = await payload.find({
    collection: 'communication-logs',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    where: {
      and: [
        { candidateProcess: { equals: candidate1.process.id } },
        { channel: { equals: 'EMAIL' } },
      ],
    },
  })
  expect(commLogs1.docs.length).toBeGreaterThanOrEqual(1)
  const logDoc = commLogs1.docs[0]
  expect(logDoc.templateKey).toBe('EMAIL_PAYMENT_REMINDER')
  expect(logDoc.status).toBe('DELIVERED')
  expect(logDoc.subject).toContain('Podsetnik za dospeće rate')
  expect(logDoc.body).toContain('700.00 USD')

  // Verify audit event
  const auditLogs1 = await payload.find({
    collection: 'audit-events',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    where: {
      and: [
        { eventType: { equals: 'PAYMENT_REMINDER_SENT' } },
        { actor: { equals: admin.id } },
      ],
    },
  })
  expect(auditLogs1.docs.length).toBeGreaterThanOrEqual(1)

  // 5. Test idempotency protection: send same reminder again without force
  const repeatSendRes = await request.post('/api/admin/payments/reminders', {
    data: {
      candidateProcessId: candidate1.process.id,
      channel: 'EMAIL',
      obligationKey: 'INSTALLMENT_2',
    },
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
  })
  expect(repeatSendRes.status()).toBe(200)
  const repeatData = await repeatSendRes.json()
  expect(repeatData.results[0].status).toBe('SKIPPED')
  expect(repeatData.results[0].reason).toBe('ALREADY_DELIVERED')

  // 6. Multichannel dispatch for Candidate 2 (OVERDUE) across ALL channels
  const sendRes2 = await request.post('/api/admin/payments/reminders', {
    data: {
      candidateProcessId: candidate2.process.id,
      channel: 'ALL',
      obligationKey: 'INITIAL',
    },
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
  })
  expect(sendRes2.status()).toBe(200)
  const sendData2 = await sendRes2.json()
  expect(sendData2.results).toHaveLength(3) // EMAIL, SMS, IN_APP
  const deliveredChannels = sendData2.results
    .filter((r: { status: string }) => r.status === 'DELIVERED')
    .map((r: { channel: string }) => r.channel)
  expect(deliveredChannels).toContain('EMAIL')
  expect(deliveredChannels).toContain('SMS')
  expect(deliveredChannels).toContain('IN_APP')

  // 7. Automated job runner evaluation endpoint
  const evalRes = await request.post('/api/admin/payments/reminders/evaluate', {
    data: { dryRun: true },
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
  })
  expect(evalRes.status()).toBe(200)
  const evalData = await evalRes.json()
  expect(evalData.totalEvaluated).toBeGreaterThanOrEqual(2)
})
