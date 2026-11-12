import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { questionnaireFields } from '../../src/modules/visa-questionnaires/schema.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('visa questionnaire enforces payment, ownership, revision locking, encryption and review history', async ({ request, visaPayload: payload }) => {
    const email = `visa-admin-${randomUUID()}@example.test`
    const password = 'Synthetic-admin-password-2026!'
    const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Visa test administrator' } })
    const login = await payload.login({ collection: 'users', data: { email, password } })
    const adminHeaders = { Authorization: `Bearer ${login.token}` }
    const owner = await seedVisaCandidate(payload, admin.id)
    const other = await seedVisaCandidate(payload, admin.id)
    const unpaid = await seedVisaCandidate(payload, admin.id, false)
    const candidateURL = '/api/candidate/visa-questionnaire'
    const adminURL = `/api/admin/visa-questionnaires/${owner.process.id}`
    const data = { action: 'SAVE_DRAFT', answers: { birthPlace: 'Synthetic secret city' }, expectedRevision: 0 }
    expect((await request.get(candidateURL)).status()).toBe(401)
    expect((await request.post(candidateURL, { data })).status()).toBe(401)
    expect((await request.get(adminURL, { headers: owner.headers })).status()).toBe(401)
    expect((await request.post(adminURL, { headers: owner.headers, data: { action: 'APPROVE', expectedRevision: 1 } })).status()).toBe(401)
    expect((await request.post(candidateURL, { headers: unpaid.headers, data })).status()).toBe(403)
    expect([401, 403]).toContain((await request.post(candidateURL, { headers: { ...owner.headers, Origin: 'https://example.invalid' }, data })).status())
    const parallel = await Promise.all([request.post(candidateURL, { headers: owner.headers, data }), request.post(candidateURL, { headers: owner.headers, data })])
    expect(parallel.map((response) => response.status()).sort()).toEqual([200, 409])
    const saved = await request.get(candidateURL, { headers: owner.headers })
    expect(saved.headers()['cache-control']).toBe('no-store')
    expect((await saved.json()).questionnaire).toMatchObject({ revision: 1, answers: data.answers })
    expect((await (await request.get(candidateURL, { headers: other.headers })).json()).questionnaire.answers).toEqual({})
    const raw = (await payload.find({ collection: 'visa-questionnaires', where: { candidateProcess: { equals: owner.process.id } }, depth: 0 })).docs[0]!
    expect(JSON.stringify(raw.encryptedContent)).not.toContain('Synthetic secret city')
    expect((await request.get(`/api/visa-questionnaires/${raw.id}`, { headers: other.headers })).status()).toBe(403)
    const publicAdminRecord = await (await request.get(`/api/visa-questionnaires/${raw.id}`, { headers: adminHeaders })).json()
    expect(publicAdminRecord.encryptedContent).toBeUndefined()
    expect((await request.patch(`/api/visa-questionnaires/${raw.id}`, { headers: adminHeaders, data: { status: 'REVIEWED' } })).status()).toBe(403)
    expect((await request.post(candidateURL, { headers: owner.headers, data: { ...data, action: 'SUBMIT', expectedRevision: 1 } })).status()).toBe(400)
    const answers = Object.fromEntries(questionnaireFields.map((field) => [field.key, `Synthetic ${field.key}`]))
    const submitted = await request.post(candidateURL, { headers: owner.headers, data: { action: 'SUBMIT', answers, expectedRevision: 1 } })
    expect(submitted.status()).toBe(200)
    expect((await request.post(candidateURL, { headers: owner.headers, data: { ...data, expectedRevision: 2 } })).status()).toBe(409)
    expect((await (await request.get(adminURL, { headers: adminHeaders })).json()).questionnaire).toMatchObject({ status: 'SUBMITTED', answers })
    const review = { action: 'REQUEST_CHANGES', expectedRevision: 2, note: 'Synthetic correction request' }
    expect((await request.post(adminURL, { headers: adminHeaders, data: { ...review, note: '' } })).status()).toBe(400)
    expect((await request.post(adminURL, { headers: adminHeaders, data: review })).status()).toBe(200)
    expect((await request.post(adminURL, { headers: adminHeaders, data: review })).status()).toBe(409)
    const revision = await (await request.get(candidateURL, { headers: owner.headers })).json()
    expect(revision.questionnaire).toMatchObject({ status: 'CHANGES_REQUESTED', revision: 3, editable: true, feedback: review.note })
    const corrected = { ...answers, birthPlace: 'Corrected synthetic city' }
    expect((await request.post(candidateURL, { headers: owner.headers, data: { action: 'SUBMIT', answers: corrected, expectedRevision: 3 } })).status()).toBe(200)
    expect((await request.post(adminURL, { headers: adminHeaders, data: { action: 'APPROVE', expectedRevision: 4, note: '' } })).status()).toBe(200)
    const final = (await (await request.get(candidateURL, { headers: owner.headers })).json()).questionnaire
    expect(final).toMatchObject({ status: 'REVIEWED', revision: 5, editable: false, answers: corrected })
    expect(final.history.map((entry: { action: string }) => entry.action)).toEqual(['SUBMIT', 'REQUEST_CHANGES', 'SUBMIT', 'APPROVE'])
    expect(final.history[0].answers).toEqual(answers)
    expect(final.history[2].answers).toEqual(corrected)
    expect(final.history[1].administratorId).toBeUndefined()
    const applicationId = typeof owner.account.preApplication === 'number' ? owner.account.preApplication : owner.account.preApplication.id
    const audit = await payload.find({ collection: 'audit-events', where: { and: [{ eventType: { equals: 'VISA_QUESTIONNAIRE_UPDATED' } }, { preApplication: { equals: applicationId } }] }, depth: 0 })
    expect(audit.docs).toHaveLength(5)
    expect(JSON.stringify(audit.docs)).not.toContain('Synthetic secret city')
    expect(JSON.stringify(audit.docs)).not.toContain(review.note)
})
