import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import {
  completePassportAuthorizationPrerequisites,
  createActivePassportAuthorizationTemplate,
} from '../fixtures/passportAuthorization.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-052 generates, encrypts, accepts, and protects a passport collection authorization', async ({ request, visaPayload: payload }) => {
  const email = `passport-authorization-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-admin-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Passport authorization administrator' } })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id)
  const otherCandidate = await seedVisaCandidate(payload, admin.id)

  expect((await request.post(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: candidate.headers })).status()).toBe(401)
  const blocked = await request.get(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: adminHeaders })
  expect(blocked.status()).toBe(200)
  expect(await blocked.json()).toMatchObject({ ready: false })

  const personalId = await completePassportAuthorizationPrerequisites(request, adminHeaders, candidate)
  const templateId = await createActivePassportAuthorizationTemplate(request, adminHeaders)

  const ready = await request.get(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: adminHeaders })
  expect(await ready.json()).toMatchObject({ blockers: [], ready: true, template: { id: templateId, version: 1 } })
  const generated = await request.post(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: adminHeaders })
  expect(generated.status()).toBe(201)
  const authorizationId = (await generated.json()).authorizationId as number

  const stored = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true })
  expect(stored.status).toBe('GENERATED')
  expect(stored.snapshotCiphertext).not.toContain(personalId)
  expect(stored.pdfCiphertext).not.toContain(personalId)

  const source = await request.get(`/api/passport-authorizations/${authorizationId}/download`, { headers: candidate.headers })
  expect(source.status()).toBe(200)
  expect(source.headers()['content-type']).toContain('application/pdf')
  expect(Buffer.from(await source.body()).subarray(0, 5).toString()).toBe('%PDF-')
  expect((await request.get(`/api/passport-authorizations/${authorizationId}/download`, { headers: otherCandidate.headers })).status()).toBe(404)

  const acceptanceBody = { confirmed: true, sourcePdfSha256: stored.pdfSha256 }
  const accepted = await request.post(`/api/candidate/passport-authorizations/${authorizationId}/accept`, {
    headers: candidate.headers,
    data: acceptanceBody,
  })
  expect(accepted.status()).toBe(201)
  expect((await request.post(`/api/candidate/passport-authorizations/${authorizationId}/accept`, {
    headers: candidate.headers,
    data: acceptanceBody,
  })).status()).toBe(200)

  const finalDocument = await request.get(`/api/passport-authorizations/${authorizationId}/download?version=accepted`, { headers: adminHeaders })
  expect(finalDocument.status()).toBe(200)
  expect(Buffer.from(await finalDocument.body()).subarray(0, 5).toString()).toBe('%PDF-')
  const persisted = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true })
  expect(persisted).toMatchObject({ status: 'ACCEPTED', statementVersion: '1.0' })
  expect(persisted.finalPdfCiphertext).not.toContain(personalId)

  const audit = await payload.find({
    collection: 'audit-events',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: { eventType: { equals: 'PASSPORT_AUTHORIZATION_ACCEPTED' } },
  })
  expect(audit.docs.filter((event) => (event.metadata as { authorizationId?: number })?.authorizationId === authorizationId)).toHaveLength(1)
})
