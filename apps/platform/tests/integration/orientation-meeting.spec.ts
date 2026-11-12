import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { recordInterviewPreparationOutcome } from '../../src/modules/interview-preparations/service.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-059 schedules an orientation, exposes a private calendar snapshot and records attendance', async ({ request, visaPayload: payload }) => {
  const email = `orientation-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-orientation-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Orientation administrator', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id)
  const other = await seedVisaCandidate(payload, admin.id)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  await payload.update({ collection: 'candidate-processes', id: other.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })

  const path = `/api/admin/interview-preparations/${candidate.process.id}?purpose=ORIENTATION`
  const startsAt = new Date(Date.now() + 86_400_000)
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000)
  const schedule = {
    action: 'SCHEDULE',
    candidateInstructions: 'Ponesite probni plan putovanja.',
    deliveryMode: 'ONLINE',
    endsAt: endsAt.toISOString(),
    internalNotes: 'PRIVATE-ORIENTATION-NOTE',
    locationDetails: 'https://example.invalid/orientation',
    startsAt: startsAt.toISOString(),
    timeZone: 'Europe/Belgrade',
  }

  expect((await request.get(path)).status()).toBe(401)
  expect((await request.post(path, { data: schedule, headers: candidate.headers })).status()).toBe(401)
  expect((await request.post(path, { data: schedule, headers: { ...adminHeaders, Origin: 'https://untrusted.invalid' } })).status()).toBe(403)
  expect((await request.get('/api/candidate/orientation-meeting')).status()).toBe(401)
  expect((await request.post(path.replace('ORIENTATION', 'EMBASSY'), { data: schedule, headers: adminHeaders })).status()).toBe(403)

  const createdResponse = await request.post(path, { data: schedule, headers: adminHeaders })
  expect(createdResponse.status()).toBe(201)
  const created = (await createdResponse.json()).appointment
  expect(created).toMatchObject({ attemptNumber: 1, deliveryMode: 'ONLINE', status: 'SCHEDULED', version: 1 })

  const movedStart = new Date(startsAt.getTime() + 86_400_000)
  const movedResponse = await request.post(path, { data: {
    ...schedule,
    endsAt: new Date(movedStart.getTime() + 60 * 60_000).toISOString(),
    expectedAppointmentId: created.id,
    expectedVersion: created.version,
    startsAt: movedStart.toISOString(),
  }, headers: adminHeaders })
  expect(movedResponse.status()).toBe(200)
  const moved = (await movedResponse.json()).appointment
  expect(moved).toMatchObject({ id: created.id, version: 2 })
  expect((await request.post(path, { data: { ...schedule, expectedAppointmentId: created.id, expectedVersion: 1 }, headers: adminHeaders })).status()).toBe(409)

  const candidateState = await request.get('/api/candidate/orientation-meeting', { headers: candidate.headers })
  const candidateText = await candidateState.text()
  expect(candidateState.status()).toBe(200)
  expect(candidateText).not.toContain('PRIVATE-ORIENTATION-NOTE')
  expect(candidateText).not.toContain('internalNotes')
  expect(JSON.parse(candidateText).appointments).toHaveLength(1)
  expect((await (await request.get(`/api/admin/interview-preparations/${candidate.process.id}?purpose=EMBASSY`, { headers: adminHeaders })).json()).appointments).toHaveLength(0)
  expect((await (await request.get('/api/candidate/orientation-meeting', { headers: other.headers })).json()).appointments).toHaveLength(0)

  const calendar = await request.get(`/api/candidate/orientation-meeting?calendar=${created.id}`, { headers: candidate.headers })
  expect(calendar.status()).toBe(200)
  expect(calendar.headers()['content-type']).toContain('text/calendar')
  expect(calendar.headers()['content-disposition']).toContain('orijentacioni-sastanak.ics')
  expect(await calendar.text()).toContain('SUMMARY:Orijentacioni sastanak pred putovanje')
  expect((await request.get(`/api/candidate/orientation-meeting?calendar=${created.id}`, { headers: other.headers })).status()).toBe(404)

  expect((await request.post(path, { data: { action: 'COMPLETED', appointmentId: created.id, expectedVersion: 2 }, headers: adminHeaders })).status()).toBe(409)
  await recordInterviewPreparationOutcome({
    administratorId: admin.id,
    appointmentId: created.id,
    candidateProcessId: candidate.process.id,
    expectedVersion: 2,
    now: new Date(movedStart.getTime() + 60_000),
    outcome: 'COMPLETED',
    payload,
    purpose: 'ORIENTATION',
  })
  expect((await request.get(`/api/candidate/orientation-meeting?calendar=${created.id}`, { headers: candidate.headers })).status()).toBe(404)
  const completed = await (await request.get('/api/candidate/orientation-meeting', { headers: candidate.headers })).json()
  expect(completed.appointments[0].status).toBe('COMPLETED')

  const process = await payload.findByID({ collection: 'candidate-processes', id: candidate.process.id, overrideAccess: true })
  expect(process.currentStep).toBe('TRAVEL_PREPARATION')
  expect(process.nextActionTitle).toBe('Pripremite se za putovanje')
  expect(process.nextActionDueAt).toBeFalsy()
  const preApplicationId = typeof candidate.process.preApplication === 'number' ? candidate.process.preApplication : candidate.process.preApplication.id
  const audits = await payload.find({ collection: 'audit-events', limit: 100, overrideAccess: true, where: { preApplication: { equals: preApplicationId } } })
  const orientationAudits = audits.docs.filter((entry) => entry.eventType.startsWith('ORIENTATION_MEETING'))
  expect(orientationAudits.map((entry) => entry.eventType)).toEqual(expect.arrayContaining([
    'ORIENTATION_MEETING_SCHEDULED',
    'ORIENTATION_MEETING_RESCHEDULED',
    'ORIENTATION_MEETING_COMPLETED',
  ]))
  expect(orientationAudits.every((entry) => (entry.metadata as { purpose: string }).purpose === 'ORIENTATION')).toBe(true)
  expect(JSON.stringify(orientationAudits)).not.toContain('PRIVATE-ORIENTATION-NOTE')
})
