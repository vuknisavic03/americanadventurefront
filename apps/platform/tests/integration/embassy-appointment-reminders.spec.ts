import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { completePassportAuthorizationPrerequisites, createActivePassportAuthorizationTemplate } from '../fixtures/passportAuthorization.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

function localDateTime(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { day: '2-digit', hour: '2-digit', hourCycle: 'h23', minute: '2-digit', month: '2-digit', timeZone: 'Europe/Belgrade', year: 'numeric' }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)!.value
  return { appointmentDate: `${get('year')}-${get('month')}-${get('day')}`, appointmentTime: `${get('hour')}:${get('minute')}` }
}

test('FR-053/FR-054 records versioned embassy appointments and sends one email and SMS reminder', async ({ request, visaPayload: payload }) => {
  const email = `embassy-admin-${randomUUID()}@example.test`; const password = 'Synthetic-admin-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Embassy reminder administrator', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } }); const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id)
  await completePassportAuthorizationPrerequisites(request, adminHeaders, candidate)
  await createActivePassportAuthorizationTemplate(request, adminHeaders)
  const generated = await request.post(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: adminHeaders })
  expect(generated.status()).toBe(201)
  const authorizationId = (await generated.json()).authorizationId as number
  const authorization = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true })
  expect((await request.post(`/api/candidate/passport-authorizations/${authorizationId}/accept`, { headers: candidate.headers, data: { confirmed: true, sourcePdfSha256: authorization.pdfSha256 } })).status()).toBe(201)

  expect((await request.get(`/api/admin/embassy-appointments/${candidate.process.id}`)).status()).toBe(401)
  expect((await request.get('/api/embassy-appointments', { headers: candidate.headers })).status()).toBe(403)

  const first = localDateTime(new Date(Date.now() + 36 * 60 * 60_000))
  const saved = await request.post('/api/candidate/embassy-appointment', { headers: candidate.headers, data: { action: 'SAVE', ...first } })
  expect(saved.status()).toBe(200)
  expect(await saved.json()).toMatchObject({ appointment: { status: 'SCHEDULED', version: 1 } })
  expect((await request.post('/api/candidate/embassy-appointment', { headers: candidate.headers, data: { action: 'SAVE', expectedVersion: 99, ...first } })).status()).toBe(409)

  const second = localDateTime(new Date(Date.now() + 38 * 60 * 60_000))
  const rescheduled = await request.post('/api/candidate/embassy-appointment', { headers: candidate.headers, data: { action: 'SAVE', expectedVersion: 1, ...second } })
  expect(rescheduled.status()).toBe(200)
  expect(await rescheduled.json()).toMatchObject({ appointment: { appointmentDate: second.appointmentDate, appointmentTime: second.appointmentTime, version: 2 } })

  const run = await request.get('/api/payload-jobs/run?queue=candidate-communications&limit=10&disableScheduling=true', { headers: adminHeaders })
  expect(run.ok()).toBe(true)
  const adminState = await request.get(`/api/admin/embassy-appointments/${candidate.process.id}`, { headers: adminHeaders })
  expect(adminState.status()).toBe(200)
  const state = await adminState.json()
  expect(state.appointment).toMatchObject({ status: 'SCHEDULED', version: 2 })
  expect(state.deliveries).toEqual(expect.arrayContaining([
    expect.objectContaining({ appointmentVersion: 2, channel: 'EMAIL', provider: 'capture', status: 'DELIVERED' }),
    expect.objectContaining({ appointmentVersion: 2, channel: 'SMS', provider: 'capture', status: 'DELIVERED' }),
  ]))
  expect(state.deliveries).toHaveLength(2)

  const reminderAudits = await payload.find({ collection: 'audit-events', depth: 0, limit: 20, overrideAccess: true, where: { and: [{ preApplication: { equals: typeof candidate.account.preApplication === 'number' ? candidate.account.preApplication : candidate.account.preApplication.id } }, { eventType: { in: ['EMBASSY_REMINDER_EMAIL_SENT', 'EMBASSY_REMINDER_SMS_SENT', 'EMBASSY_REMINDER_SKIPPED'] } }] } })
  expect(reminderAudits.docs.filter((event) => event.eventType === 'EMBASSY_REMINDER_SKIPPED')).toHaveLength(2)
  expect(reminderAudits.docs.filter((event) => event.eventType === 'EMBASSY_REMINDER_EMAIL_SENT')).toHaveLength(1)
  expect(reminderAudits.docs.filter((event) => event.eventType === 'EMBASSY_REMINDER_SMS_SENT')).toHaveLength(1)

  const cancelled = await request.post('/api/candidate/embassy-appointment', { headers: candidate.headers, data: { action: 'CANCEL', expectedVersion: 2 } })
  expect(cancelled.status()).toBe(200)
  expect(await cancelled.json()).toMatchObject({ appointment: { status: 'CANCELLED', version: 3 } })
})
