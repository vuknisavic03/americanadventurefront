import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

const valid = { departureDate: '2027-06-10', returnDate: '2027-09-12', returnDestination: 'Beograd (BEG)', usaDestination: 'Ocean City, MD' }

test('FR-056 saves an owned versioned request and reliably notifies administrators', async ({ request, visaPayload: payload }) => {
  const email = `flight-admin-${randomUUID()}@example.test`; const password = 'Synthetic-flight-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight request administrator', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } }); const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id); const other = await seedVisaCandidate(payload, admin.id)
  const path = '/api/candidate/flight-ticket-request'
  expect((await request.get(path)).status()).toBe(401)
  expect((await request.post(path, { headers: candidate.headers, data: valid })).status()).toBe(403)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  expect((await request.post(path, { headers: { ...candidate.headers, Origin: 'https://untrusted.invalid' }, data: valid })).status()).toBe(403)
  expect((await request.post(path, { headers: candidate.headers, data: { ...valid, returnDate: valid.departureDate } })).status()).toBe(400)
  const simultaneous = await Promise.all([request.post(path, { headers: candidate.headers, data: valid }), request.post(path, { headers: candidate.headers, data: valid })])
  expect(simultaneous.map((response) => response.status()).sort()).toEqual([201, 409])
  const state = await (await request.get(path, { headers: candidate.headers })).json()
  expect(state.request).toMatchObject({ ...valid, notificationStatus: 'PENDING', version: 1 })
  expect((await (await request.get(path, { headers: other.headers })).json()).request).toBeUndefined()
  expect((await request.get('/api/flight-ticket-requests', { headers: candidate.headers })).status()).toBe(403)
  const adminState = await request.get(`/api/admin/flight-ticket-requests/${candidate.process.id}`, { headers: adminHeaders })
  expect((await adminState.json()).request).toMatchObject({ ...valid, version: 1 })

  const changed = { ...valid, expectedVersion: 1, returnDestination: 'Novi Sad' }
  expect((await request.post(path, { headers: candidate.headers, data: changed })).status()).toBe(200)
  expect((await request.post(path, { headers: candidate.headers, data: changed })).status()).toBe(409)
  const run = await request.get('/api/payload-jobs/run?queue=candidate-communications&limit=10&disableScheduling=true', { headers: adminHeaders })
  expect(run.ok()).toBe(true)
  const delivered = await (await request.get(path, { headers: candidate.headers })).json()
  expect(delivered.request).toMatchObject({ notificationStatus: 'DELIVERED', returnDestination: 'Novi Sad', version: 2 })
  const deliveries = await payload.find({ collection: 'message-deliveries', limit: 10, overrideAccess: true, where: { category: { equals: 'FLIGHT_TICKET_REQUEST' } } })
  const ownDeliveries = deliveries.docs.filter((entry) => entry.idempotencyKey.startsWith(`flight-ticket-request:${state.request.id}:`))
  const deliveryKeys = ownDeliveries.map((entry) => entry.idempotencyKey)
  expect(deliveryKeys).toContain(`flight-ticket-request:${state.request.id}:notification:2`)
  expect(new Set(deliveryKeys).size).toBe(deliveryKeys.length)
  expect(ownDeliveries.length).toBeGreaterThanOrEqual(1)
  expect(ownDeliveries.length).toBeLessThanOrEqual(2)
  expect(ownDeliveries.every((entry) => entry.recipientEmail === 'beograd@workandtravel.rs' && entry.status === 'DELIVERED')).toBe(true)
  expect(ownDeliveries.every((entry) => !entry.subject.includes(valid.usaDestination))).toBe(true)

  const events = await payload.find({ collection: 'outbox-events', limit: 10, overrideAccess: true, where: { eventType: { equals: 'FLIGHT_TICKET_REQUEST_NOTIFICATION_REQUESTED' } } })
  const ownEvents = events.docs.filter((entry) => (entry.payload as { flightTicketRequestId?: number }).flightTicketRequestId === state.request.id)
  expect(ownEvents).toHaveLength(2)
  expect(ownEvents.every((entry) => entry.status === 'COMPLETED')).toBe(true)
  const process = await payload.findByID({ collection: 'candidate-processes', id: candidate.process.id, overrideAccess: true })
  expect(process.nextActionTitle).toBe('Sačekajte ponudu avionske karte')
  const applicationId = typeof process.preApplication === 'number' ? process.preApplication : process.preApplication.id
  const audits = await payload.find({ collection: 'audit-events', limit: 100, overrideAccess: true, where: { preApplication: { equals: applicationId } } })
  const relevant = audits.docs.filter((entry) => entry.eventType.startsWith('FLIGHT_TICKET_REQUEST'))
  expect(relevant.map((entry) => entry.eventType)).toEqual(expect.arrayContaining(['FLIGHT_TICKET_REQUEST_SUBMITTED', 'FLIGHT_TICKET_REQUEST_UPDATED', 'FLIGHT_TICKET_REQUEST_NOTIFICATION_SENT']))
  expect(JSON.stringify(relevant.map((entry) => entry.metadata))).not.toContain(valid.usaDestination)
  expect(JSON.stringify(relevant.map((entry) => entry.metadata))).not.toContain('Novi Sad')
})
