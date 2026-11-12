import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { recordInterviewPreparationOutcome, scheduleInterviewPreparation } from '../../src/modules/interview-preparations/service.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-055 isolates preparation, enforces permissions/versioning and preserves the embassy action', async ({ request, visaPayload: payload }) => {
  const email = `prep-admin-${randomUUID()}@example.test`; const password = 'Synthetic-preparation-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Preparation test admin', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const headers = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id)
  const other = await seedVisaCandidate(payload, admin.id)
  const path = `/api/admin/interview-preparations/${candidate.process.id}?purpose=EMBASSY`
  const startsAt = new Date(Date.now() + 86_400_000).toISOString()
  const data = { action: 'SCHEDULE', startsAt, deliveryMode: 'ONLINE', timeZone: 'Europe/Belgrade', locationDetails: 'https://example.invalid/preparation', candidateInstructions: 'Ponesite probnu dokumentaciju.', internalNotes: 'SECRET-ADMIN-ONLY' }
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { nextActionTitle: 'Prisustvujte terminu u ambasadi', nextActionDueAt: startsAt }, overrideAccess: true })
  expect((await request.get(path)).status()).toBe(401)
  expect((await request.post(path, { headers: candidate.headers, data })).status()).toBe(401)
  expect((await request.post(path, { headers: { ...headers, Origin: 'https://untrusted.invalid' }, data })).status()).toBe(403)
  expect((await request.get('/api/candidate/embassy-preparation')).status()).toBe(401)
  expect((await request.get('/api/interview-preparation-appointments', { headers: candidate.headers })).status()).toBe(403)
  expect((await request.post('/api/interview-preparation-appointments', { headers, data })).status()).toBe(403)
  expect((await request.post(path, { headers, data: { ...data, startsAt: '2000-01-01T10:00:00Z' } })).status()).toBe(400)
  expect((await request.post(path, { headers, data: { ...data, timeZone: 'invalid-zone' } })).status()).toBe(400)
  expect((await request.post(path.replace('EMBASSY', 'JOB_INTERVIEW'), { headers, data })).status()).toBe(403)

  const simultaneous = await Promise.all([request.post(path, { headers, data }), request.post(path, { headers, data })])
  expect(simultaneous.map((result) => result.status()).sort()).toEqual([201, 409])
  const created = await simultaneous.find((response) => response.status() === 201)!.json()
  const id = created.appointment.id as number
  const beforeStart = { action: 'COMPLETED', appointmentId: id, expectedVersion: 1 }
  expect((await request.post(path, { headers, data: beforeStart })).status()).toBe(409)
  expect((await request.post(`/api/admin/interview-preparations/${other.process.id}?purpose=EMBASSY`, { headers, data: beforeStart })).status()).toBe(404)
  expect((await request.post(path.replace('EMBASSY', 'JOB_INTERVIEW'), { headers, data: beforeStart })).status()).toBe(404)
  const moved = await request.post(path, { headers, data: { ...data, expectedVersion: 1, expectedAppointmentId: id, startsAt: new Date(Date.now() + 90_000_000).toISOString() } })
  expect(moved.status()).toBe(200)
  expect((await request.post(path, { headers, data: { ...data, expectedVersion: 1 } })).status()).toBe(409)
  const candidateState = await request.get('/api/candidate/embassy-preparation', { headers: candidate.headers })
  const candidateText = await candidateState.text()
  expect(candidateText).not.toContain('SECRET-ADMIN-ONLY')
  expect(candidateText).not.toContain('internalNotes')
  expect(JSON.parse(candidateText).appointments).toHaveLength(1)
  expect((await (await request.get(path.replace('EMBASSY', 'JOB_INTERVIEW'), { headers })).json()).appointments).toHaveLength(0)
  expect((await (await request.get('/api/candidate/embassy-preparation', { headers: other.headers })).json()).appointments).toHaveLength(0)
  const calendar = await request.get(`/api/candidate/embassy-preparation?calendar=${id}`, { headers: candidate.headers })
  expect(calendar.status()).toBe(200)
  expect(calendar.headers()['content-type']).toContain('text/calendar')
  expect(await calendar.text()).toContain('SUMMARY:Priprema za razgovor u ambasadi')
  expect((await request.get(`/api/candidate/embassy-preparation?calendar=${id}`, { headers: other.headers })).status()).toBe(404)

  expect((await request.post(path, { headers, data: { action: 'CANCELLED', appointmentId: id, expectedVersion: 2 } })).status()).toBe(200)
  expect((await request.get(`/api/candidate/embassy-preparation?calendar=${id}`, { headers: candidate.headers })).status()).toBe(404)
  expect((await request.post(path, { headers, data: { ...data, expectedVersion: 2 } })).status()).toBe(409)
  const second = await request.post(path, { headers, data })
  expect(second.status()).toBe(201)
  const secondAppointment = (await second.json()).appointment
  expect(secondAppointment.attemptNumber).toBe(2)
  // A previous attempt can have the same version: appointment identity also matters.
  expect((await request.post(path, { headers, data: { ...data, expectedVersion: 1, expectedAppointmentId: id } })).status()).toBe(409)
  // Advance only the service clock, not system time or persisted dates.
  const future = new Date(new Date(startsAt).getTime() + 60_000)
  await recordInterviewPreparationOutcome({ administratorId: admin.id, appointmentId: secondAppointment.id, candidateProcessId: candidate.process.id, expectedVersion: 1, now: future, outcome: 'NO_SHOW', payload, purpose: 'EMBASSY' })
  const third = await scheduleInterviewPreparation({ administratorId: admin.id, candidateProcessId: candidate.process.id, deliveryMode: 'IN_PERSON', locationDetails: 'Sintetička sala', now: future, startsAt: new Date(future.getTime() + 60_000), payload, purpose: 'EMBASSY', timeZone: 'Europe/Belgrade' })
  await recordInterviewPreparationOutcome({ administratorId: admin.id, appointmentId: third.id, candidateProcessId: candidate.process.id, expectedVersion: 1, now: new Date(future.getTime() + 120_000), outcome: 'COMPLETED', payload, purpose: 'EMBASSY' })
  const history = (await (await request.get(path, { headers })).json()).appointments
  expect(history.map((entry: { status: string }) => entry.status)).toEqual(['COMPLETED', 'NO_SHOW', 'CANCELLED'])
  const process = await payload.findByID({ collection: 'candidate-processes', id: candidate.process.id, overrideAccess: true })
  expect(process.currentStep).toBe('VISA')
  expect(process.nextActionTitle).toBe('Prisustvujte terminu u ambasadi')
  expect(process.nextActionDueAt).toBe(startsAt)
  const preApplicationId = typeof candidate.process.preApplication === 'number' ? candidate.process.preApplication : candidate.process.preApplication.id
  const audits = await payload.find({ collection: 'audit-events', where: { preApplication: { equals: preApplicationId } }, limit: 100, overrideAccess: true })
  const preparations = audits.docs.filter((entry) => entry.eventType.startsWith('INTERVIEW_PREPARATION'))
  expect(preparations).toHaveLength(7)
  expect(preparations.every((entry) => (entry.metadata as { purpose: string }).purpose === 'EMBASSY')).toBe(true)
  expect(JSON.stringify(preparations)).not.toContain('SECRET-ADMIN-ONLY')
})
