import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'
import { generateInvoiceForPayment } from '../../src/modules/invoices/service.ts'

test('Section 17: Candidate payment slips, invoice generation with NBS rates and words, KIR book, and Excel reporting', async ({
  request,
  visaPayload: payload,
}) => {
  const email = `invoice-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-invoice-admin-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Invoice Administrator', email, password },
  })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }

  const candidate = await seedVisaCandidate(payload, admin.id)
  const otherCandidate = await seedVisaCandidate(payload, admin.id)

  // 1. Candidate downloads payment slip PDF
  const slipPdfRes = await request.get('/api/candidate/payment-slips/INITIAL', {
    headers: candidate.headers,
  })
  expect(slipPdfRes.status()).toBe(200)
  expect(slipPdfRes.headers()['content-type']).toBe('application/pdf')
  const slipPdfBytes = await slipPdfRes.body()
  expect(slipPdfBytes.subarray(0, 4).toString()).toBe('%PDF')

  // 1b. Candidate requests payment slip JSON data (for instant mobile view / IPS QR)
  const slipJsonRes = await request.get('/api/candidate/payment-slips/INITIAL?format=json', {
    headers: candidate.headers,
  })
  expect(slipJsonRes.status()).toBe(200)
  const slipJson = await slipJsonRes.json()
  expect(slipJson.slip).toBeDefined()
  expect(slipJson.slip.currency).toBe('RSD')
  expect(slipJson.slip.paymentModel).toBe('97')
  expect(slipJson.slip.ipsQrPayload).toContain('K:PR|V:01')

  const preAppId = typeof candidate.process.preApplication === 'number'
    ? candidate.process.preApplication
    : candidate.process.preApplication.id

  const applicantId = typeof candidate.account.applicant === 'number'
    ? candidate.account.applicant
    : candidate.account.applicant.id

  const offer = await payload.create({
    collection: 'program-offers',
    data: {
      basePriceCents: 35000,
      candidateAccount: candidate.account.id,
      candidateProcess: candidate.process.id,
      commercialVersion: 1,
      currency: 'USD',
      preApplication: preAppId,
      programCode: 'SWT',
      status: 'DRAFT',
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    overrideAccess: true,
  })

  const selection = await payload.create({
    collection: 'program-offer-selections',
    data: {
      acceptedAt: new Date().toISOString(),
      basePriceCents: 35000,
      candidateAccount: candidate.account.id,
      candidateProcess: candidate.process.id,
      currency: 'USD',
      discountCents: 0,
      offer: offer.id,
      offerSnapshot: { snapshot: true },
      selectedMethod: 'ONE_TIME',
      totalCents: 35000,
    },
    overrideAccess: true,
  })

  const sensitiveProfile = await payload.create({
    collection: 'candidate-sensitive-profiles',
    data: {
      applicant: applicantId,
      candidateAccount: candidate.account.id,
      contractReadinessStatus: 'INCOMPLETE',
      personalIdStatus: 'MISSING',
      preApplication: preAppId,
      programCode: 'SWT',
    },
    overrideAccess: true,
  })

  const template = await payload.create({
    collection: 'contract-templates',
    data: {
      body: 'Ugovor za {{ candidate.fullName }}, iznos: {{ offer.total }}.',
      contentChecksum: 'a'.repeat(64),
      name: 'Standardni ugovor',
      programCode: 'SWT',
      status: 'DRAFT',
      templateType: 'STANDARD',
      version: 1,
    },
    overrideAccess: true,
  })

  const contract = await payload.create({
    collection: 'generated-contracts',
    data: {
      candidateAccount: candidate.account.id,
      contractNumber: `AA-SWT-${randomUUID().slice(0, 8).toUpperCase()}`,
      contractTemplate: template.id,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.id,
      generationKey: randomUUID(),
      pdfAuthTag: 'auth',
      pdfCiphertext: 'encrypted-pdf',
      pdfFileName: 'ugovor.pdf',
      pdfIv: 'iv',
      pdfKeyId: 'key-1',
      pdfSha256: 'a'.repeat(64),
      pdfSizeBytes: 100,
      preApplication: preAppId,
      programCode: 'SWT',
      programOfferSelection: selection.id,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sensitiveProfile: sensitiveProfile.id,
      snapshotAuthTag: 'auth',
      snapshotCiphertext: 'encrypted-snapshot',
      snapshotIv: 'iv',
      snapshotKeyId: 'key-1',
      snapshotSha256: 'a'.repeat(64),
      status: 'GENERATED',
      templateChecksum: 'a'.repeat(64),
      templateType: 'STANDARD',
      templateVersion: 1,
    },
    overrideAccess: true,
  })

  const acceptance = await payload.create({
    collection: 'contract-acceptances',
    data: {
      acceptanceReference: `AA-ACC-${randomUUID().slice(0, 8).toUpperCase()}`,
      acceptedAt: new Date().toISOString(),
      candidateAccount: candidate.account.id,
      contract: contract.id,
      evidenceSha256: 'a'.repeat(64),
      finalPdfAuthTag: 'auth',
      finalPdfCiphertext: 'encrypted-final',
      finalPdfFileName: 'ugovor-prihvacen.pdf',
      finalPdfIv: 'iv',
      finalPdfKeyId: 'key-1',
      finalPdfSha256: 'a'.repeat(64),
      finalPdfSizeBytes: 100,
      preApplication: preAppId,
      retentionReviewAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      sourcePdfSha256: 'a'.repeat(64),
      statementChecksum: 'a'.repeat(64),
      statementText: 'Prihvatam uslove ugovora.',
      statementVersion: '1.0',
    },
    overrideAccess: true,
  })

  // 2. Create a candidate payment plan and record a payment
  const plan = await payload.create({
    collection: 'candidate-payment-plans',
    data: {
      candidateAccount: candidate.account.id,
      candidateProcess: candidate.process.id,
      contractAcceptance: acceptance.id,
      currency: 'USD',
      firstPaymentRequiredCents: 35000,
      firstPaymentStatus: 'PENDING',
      obligations: [
        { amountCents: 35000, dueAt: new Date().toISOString(), key: 'INITIAL', kind: 'INITIAL', label: 'I rata programa' },
      ],
      paidCents: 0,
      preApplication: preAppId,
      programOfferSelection: selection.id,
      remainingCents: 35000,
      selectedMethod: 'ONE_TIME',
      status: 'ACTIVE',
      totalCents: 35000,
    },
    overrideAccess: true,
  })

  const payment = await payload.create({
    collection: 'candidate-payments',
    data: {
      amountCents: 35000,
      candidateAccount: candidate.account.id,
      currency: 'USD',
      entryType: 'PAYMENT',
      idempotencyKey: randomUUID(),
      note: 'Uplata prve rate programa Work and Travel',
      paymentPlan: plan.id,
      paymentReference: `AA-PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
      preApplication: preAppId,
      receivedAt: new Date().toISOString(),
      recordedBy: admin.id,
    },
    overrideAccess: true,
  })

  // 3. Generate invoice for the payment (with 6-decimal NBS rate)
  const invoiceRes = await generateInvoiceForPayment({
    administratorId: admin.id,
    candidatePaymentId: payment.id,
    exchangeRateDate: new Date().toISOString(),
    exchangeRateScaled: 108_500_000, // 108.500000 RSD/USD
    payload,
  })

  expect(invoiceRes.created).toBe(true)
  expect(invoiceRes.invoice.invoiceNumber).toMatch(/^FAKT-\d{4}-\d{4}$/)
  expect(invoiceRes.invoice.settlementAmountRsdCents).toBe(3797500) // 37,975.00 RSD
  expect(invoiceRes.invoice.amountInWords).toContain('trideset sedam hiljada')
  const invoiceId = invoiceRes.invoice.id

  // 4. Candidate lists own invoices
  const candInvoicesRes = await request.get('/api/candidate/invoices', {
    headers: candidate.headers,
  })
  expect(candInvoicesRes.status()).toBe(200)
  const candInvoices = await candInvoicesRes.json()
  expect(candInvoices.invoices.some((inv: { id: number }) => inv.id === invoiceId)).toBe(true)

  // 5. Candidate downloads own invoice PDF
  const candDownloadRes = await request.get(`/api/candidate/invoices/${invoiceId}/download`, {
    headers: candidate.headers,
  })
  expect(candDownloadRes.status()).toBe(200)
  expect(candDownloadRes.headers()['content-type']).toBe('application/pdf')
  const candPdfBytes = await candDownloadRes.body()
  expect(candPdfBytes.subarray(0, 4).toString()).toBe('%PDF')

  // 6. Security boundary: Other candidate cannot download another candidate's invoice
  const otherDownloadRes = await request.get(`/api/candidate/invoices/${invoiceId}/download`, {
    headers: otherCandidate.headers,
  })
  expect(otherDownloadRes.status()).toBe(403)

  // 7. Admin lists invoices
  const adminInvoicesRes = await request.get('/api/admin/invoices', {
    headers: adminHeaders,
  })
  expect(adminInvoicesRes.status()).toBe(200)
  const adminInvoices = await adminInvoicesRes.json()
  expect(adminInvoices.invoices.some((inv: { id: number }) => inv.id === invoiceId)).toBe(true)

  // 8. Admin queries KIR book
  const kirRes = await request.get('/api/admin/kir', {
    headers: adminHeaders,
  })
  expect(kirRes.status()).toBe(200)
  const kirData = await kirRes.json()
  expect(kirData.entries.length).toBeGreaterThanOrEqual(1)
  const entry = kirData.entries.find((e: { invoiceNumber: string }) => e.invoiceNumber === invoiceRes.invoice.invoiceNumber)
  expect(entry).toBeDefined()
  expect(entry.sequenceNumber).toBeGreaterThanOrEqual(1)
  expect(entry.invoiceAmountRsdFormatted).toContain('37.975,00 RSD')

  // 9. Admin exports KIR book to Excel
  const kirExcelRes = await request.get('/api/admin/kir/export', {
    headers: adminHeaders,
  })
  expect(kirExcelRes.status()).toBe(200)
  expect(kirExcelRes.headers()['content-type']).toContain('spreadsheetml.sheet')
  const kirExcelBuffer = await kirExcelRes.body()
  expect(kirExcelBuffer.subarray(0, 2).toString()).toBe('PK') // Zip magic bytes for XLSX

  // 10. Admin exports single candidate financial ledger to Excel
  const candidateLedgerExcelRes = await request.get(`/api/admin/candidates/${candidate.account.id}/financial-report`, {
    headers: adminHeaders,
  })
  expect(candidateLedgerExcelRes.status()).toBe(200)
  expect(candidateLedgerExcelRes.headers()['content-type']).toContain('spreadsheetml.sheet')
  const candLedgerBuffer = await candidateLedgerExcelRes.body()
  expect(candLedgerBuffer.subarray(0, 2).toString()).toBe('PK')
})
