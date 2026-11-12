import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { questionnaireFields } from '../../src/modules/visa-questionnaires/schema.ts'
import { swtVisaDocumentRequirements } from '../../src/modules/visa-documents/requirements.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

const pdf = (label: string) => Buffer.from(`%PDF-1.4\nSynthetic ${label}\n%%EOF`)

test('visa checklist enforces its gate, encrypts replacements, and reports completion', async ({ request, visaPayload: payload }) => {
    const email = `visa-doc-admin-${randomUUID()}@example.test`
    const password = 'Synthetic-admin-password-2026!'
    const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Visa document administrator' } })
    const login = await payload.login({ collection: 'users', data: { email, password } })
    const adminHeaders = { Authorization: `Bearer ${login.token}` }
    const candidate = await seedVisaCandidate(payload, admin.id)
    const other = await seedVisaCandidate(payload, admin.id)
    const uploadURL = '/api/candidate/visa-documents/VISA_DS160_CONFIRMATION'

    expect((await request.post(uploadURL, { multipart: { document: { name: 'locked.pdf', mimeType: 'application/pdf', buffer: pdf('locked') } } })).status()).toBe(401)
    expect((await request.get(`/api/admin/visa-documents/${candidate.process.id}`, { headers: candidate.headers })).status()).toBe(401)
    expect((await request.post(uploadURL, { headers: candidate.headers, multipart: { document: { name: 'locked.pdf', mimeType: 'application/pdf', buffer: pdf('locked') } } })).status()).toBe(403)

    const passport = await request.post('/api/candidate/contract-readiness/passport', {
      headers: candidate.headers,
      multipart: { passport: { name: 'synthetic-passport.pdf', mimeType: 'application/pdf', buffer: pdf('passport') } },
    })
    expect(passport.status()).toBe(201)
    const passportId = (await passport.json()).documentId as number
    expect((await request.post(`/api/admin/private-documents/${passportId}/review`, { headers: adminHeaders, data: { action: 'VERIFY' } })).status()).toBe(200)

    const answers = Object.fromEntries(questionnaireFields.map((field) => [field.key, `Synthetic ${field.key}`]))
    expect((await request.post('/api/candidate/visa-questionnaire', { headers: candidate.headers, data: { action: 'SUBMIT', answers, expectedRevision: 0 } })).status()).toBe(200)
    expect((await request.post(`/api/admin/visa-questionnaires/${candidate.process.id}`, { headers: adminHeaders, data: { action: 'APPROVE', expectedRevision: 1, note: '' } })).status()).toBe(200)

    const initial = await (await request.get(`/api/admin/visa-documents/${candidate.process.id}`, { headers: adminHeaders })).json()
    expect(initial).toMatchObject({ available: true, checklistVersion: 1, complete: false })
    expect(initial.items).toHaveLength(5)
    expect(initial.items.find((item: { documentType: string }) => item.documentType === 'PASSPORT').document.status).toBe('VERIFIED')

    let rejectedId: number | undefined
    for (const requirement of swtVisaDocumentRequirements.filter((item) => item.uploadable)) {
      const response = await request.post(`/api/candidate/visa-documents/${requirement.documentType}`, {
        headers: candidate.headers,
        multipart: { document: { name: `${requirement.documentType}.pdf`, mimeType: 'application/pdf', buffer: pdf(`secret-${requirement.documentType}`) } },
      })
      if (requirement.documentType === 'VISA_PHOTO') {
        expect(response.status()).toBe(400)
        const image = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00])
        const photo = await request.post(`/api/candidate/visa-documents/${requirement.documentType}`, {
          headers: candidate.headers,
          multipart: { document: { name: 'visa-photo.jpg', mimeType: 'image/jpeg', buffer: image } },
        })
        expect(photo.status()).toBe(201)
        const id = (await photo.json()).documentId as number
        expect((await request.post(`/api/admin/private-documents/${id}/review`, { headers: adminHeaders, data: { action: 'VERIFY' } })).status()).toBe(200)
        continue
      }
      expect(response.status()).toBe(201)
      const id = (await response.json()).documentId as number
      const raw = await payload.findByID({ collection: 'candidate-private-documents', id, depth: 0, overrideAccess: true })
      expect(raw.ciphertext).not.toContain(`secret-${requirement.documentType}`)
      if (requirement.documentType === 'VISA_DS160_CONFIRMATION') {
        rejectedId = id
        expect((await request.post(`/api/admin/private-documents/${id}/review`, { headers: adminHeaders, data: { action: 'REJECT', rejectionReason: 'Synthetic replacement required.' } })).status()).toBe(200)
        const replacement = await request.post(uploadURL, { headers: candidate.headers, multipart: { document: { name: 'replacement.pdf', mimeType: 'application/pdf', buffer: pdf('replacement') } } })
        expect(replacement.status()).toBe(201)
        const replacementId = (await replacement.json()).documentId as number
        expect((await request.post(`/api/admin/private-documents/${replacementId}/review`, { headers: adminHeaders, data: { action: 'VERIFY' } })).status()).toBe(200)
      } else {
        expect((await request.post(`/api/admin/private-documents/${id}/review`, { headers: adminHeaders, data: { action: 'VERIFY' } })).status()).toBe(200)
      }
    }

    expect(rejectedId).toBeDefined()
    expect((await payload.findByID({ collection: 'candidate-private-documents', id: rejectedId!, depth: 0, overrideAccess: true })).status).toBe('SUPERSEDED')
    const completed = await (await request.get(`/api/admin/visa-documents/${candidate.process.id}`, { headers: adminHeaders })).json()
    expect(completed).toMatchObject({ available: true, complete: true })
    expect(completed.items.every((item: { document?: { status?: string } }) => item.document?.status === 'VERIFIED')).toBe(true)
    const process = await payload.findByID({ collection: 'candidate-processes', id: candidate.process.id, depth: 0, overrideAccess: true })
    expect(process).toMatchObject({ currentStep: 'VISA', nextActionTitle: 'Sačekajte informacije o terminu u ambasadi' })
    expect((await request.get(`/api/private-documents/${completed.items[1].document.id}/download`, { headers: other.headers })).status()).toBe(404)
})
