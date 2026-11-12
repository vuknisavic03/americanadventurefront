import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-075 and BR-010 automated translation, administrative review, and certified PDF generation', async ({
  request,
  visaPayload: payload,
}) => {
  const email = `translation-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-admin-password-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Translation Administrator', email, password },
  })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }

  const candidate = await seedVisaCandidate(payload, admin.id)
  const otherCandidate = await seedVisaCandidate(payload, admin.id)

  // 1. Unauthenticated request rejected
  const unauthReq = await request.post('/api/candidate/translations/request', {
    data: { documentType: 'STUDENT_STATUS_CERTIFICATE' },
  })
  expect(unauthReq.status()).toBe(401)

  // 2. Candidate requests a translation of student status certificate
  const createRes = await request.post('/api/candidate/translations/request', {
    data: {
      candidateProcessId: candidate.process.id,
      documentType: 'STUDENT_STATUS_CERTIFICATE',
      title: 'Potvrda o statusu studenta',
    },
    headers: candidate.headers,
  })
  expect(createRes.status()).toBe(201)
  const createdBody = await createRes.json()
  expect(createdBody.item.id).toBeGreaterThan(0)
  expect(createdBody.item.status).toBe('PENDING_REVIEW')
  const translationId = createdBody.item.id as number

  // 3. Candidate views their own translations list
  const candListRes = await request.get('/api/candidate/translations', {
    headers: candidate.headers,
  })
  expect(candListRes.status()).toBe(200)
  const candList = await candListRes.json()
  expect(candList.items.some((item: { id: number }) => item.id === translationId)).toBe(true)

  // 4. Download blocked before approval
  const earlyDownloadRes = await request.get(`/api/translations/${translationId}/download`, {
    headers: candidate.headers,
  })
  expect(earlyDownloadRes.status()).toBe(400)

  // 5. Admin lists translations with filters
  const adminListRes = await request.get('/api/admin/translations?status=PENDING_REVIEW', {
    headers: adminHeaders,
  })
  expect(adminListRes.status()).toBe(200)
  const adminList = await adminListRes.json()
  expect(adminList.docs.some((doc: { id: number }) => doc.id === translationId)).toBe(true)

  // 6. Admin inspects details and updates draft translated fields
  const detailRes = await request.get(`/api/admin/translations/${translationId}`, {
    headers: adminHeaders,
  })
  expect(detailRes.status()).toBe(200)
  const detailDoc = (await detailRes.json()).item

  const patchRes = await request.patch(`/api/admin/translations/${translationId}`, {
    data: {
      adminNotes: 'Proverene ocene i tačan naziv smera u studentskoj službi.',
      translatedData: {
        ...detailDoc.translatedData,
        studyProgramEn: 'Software Engineering & Information Systems',
      },
    },
    headers: adminHeaders,
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json()
  expect(patched.item.translatedData.studyProgramEn).toBe('Software Engineering & Information Systems')
  expect(patched.item.version).toBe(2)

  // 7. Non-admin cannot review/approve (BR-010 security check)
  const forbiddenReview = await request.post(`/api/admin/translations/${translationId}/review`, {
    data: { action: 'APPROVE' },
    headers: candidate.headers,
  })
  expect(forbiddenReview.status()).toBe(401)

  // 8. Admin reviews and approves the translation (BR-010 Human Verification)
  const approveRes = await request.post(`/api/admin/translations/${translationId}/review`, {
    data: {
      action: 'APPROVE',
      adminNotes: 'Zvanično odobreno za predaju ambasadi.',
    },
    headers: adminHeaders,
  })
  expect(approveRes.status()).toBe(200)
  const approvedBody = await approveRes.json()
  expect(approvedBody.status).toBe('APPROVED')
  expect(approvedBody.pdfChecksum).toMatch(/^[a-f0-9]{64}$/u)

  // 9. Other candidate cannot download this candidate's certified PDF
  const unauthorizedCandDownload = await request.get(`/api/translations/${translationId}/download`, {
    headers: otherCandidate.headers,
  })
  expect(unauthorizedCandDownload.status()).toBe(403)

  // 10. Owning candidate downloads certified English PDF
  const downloadRes = await request.get(`/api/translations/${translationId}/download`, {
    headers: candidate.headers,
  })
  expect(downloadRes.status()).toBe(200)
  expect(downloadRes.headers()['content-type']).toContain('application/pdf')
  expect(downloadRes.headers()['etag']).toBe(`"${approvedBody.pdfChecksum}"`)
  const pdfBytes = Buffer.from(await downloadRes.body())
  expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF')
  expect(pdfBytes.length).toBeGreaterThan(1000)

  // 11. Admin can also download certified PDF
  const adminDownloadRes = await request.get(`/api/translations/${translationId}/download`, {
    headers: adminHeaders,
  })
  expect(adminDownloadRes.status()).toBe(200)
  expect(adminDownloadRes.headers()['content-type']).toContain('application/pdf')

  // 12. Check audit trail in database
  const auditEvents = await payload.find({
    collection: 'audit-events',
    where: {
      and: [
        { 'metadata.translatedDocumentId': { equals: translationId } },
      ],
    },
  })
  const eventTypes = auditEvents.docs.map((e) => e.eventType)
  expect(eventTypes).toContain('DOCUMENT_TRANSLATION_REQUESTED')
  expect(eventTypes).toContain('DOCUMENT_TRANSLATION_UPDATED')
  expect(eventTypes).toContain('DOCUMENT_TRANSLATION_APPROVED')
})
