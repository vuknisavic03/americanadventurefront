import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

const requestData = { departureDate: '2031-06-10', returnDate: '2031-09-12', returnDestination: 'Beograd (BEG)', usaDestination: 'New York, NY' }
const options = [
  { airlineName: 'Synthetic Air', baggageDescription: 'Predati kofer do 23 kg i ručni prtljag.', currency: 'EUR', fareConditions: 'Promena uz doplatu; bez refundacije.', outboundArrivalAt: '2031-06-10T18:00:00.000Z', outboundDepartureAt: '2031-06-10T08:00:00.000Z', outboundRoute: 'BEG–FRA–JFK', returnArrivalAt: '2031-09-13T12:00:00.000Z', returnDepartureAt: '2031-09-12T20:00:00.000Z', returnRoute: 'JFK–MUC–BEG', totalPriceMinor: 85_000 },
  { airlineName: 'Demo Atlantic', baggageDescription: 'Predati kofer do 20 kg i ručni prtljag.', currency: 'USD', outboundArrivalAt: '2031-06-10T20:00:00.000Z', outboundDepartureAt: '2031-06-10T09:00:00.000Z', outboundRoute: 'BEG–AMS–JFK', returnArrivalAt: '2031-09-13T14:00:00.000Z', returnDepartureAt: '2031-09-12T21:00:00.000Z', returnRoute: 'JFK–AMS–BEG', totalPriceMinor: 91_000 },
] as const

test('FR-057 publishes private multi-option offers and records acceptance and rejection evidence', async ({ request, visaPayload: payload }) => {
  const email = `flight-offer-${randomUUID()}@example.test`; const password = 'Synthetic-flight-offer-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight offer administrator', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } }); const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const acceptedCandidate = await seedVisaCandidate(payload, admin.id); const rejectedCandidate = await seedVisaCandidate(payload, admin.id); const fastCandidate = await seedVisaCandidate(payload, admin.id); const other = await seedVisaCandidate(payload, admin.id)
  for (const candidate of [acceptedCandidate, rejectedCandidate, fastCandidate, other]) await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  for (const candidate of [acceptedCandidate, rejectedCandidate, fastCandidate]) expect((await request.post('/api/candidate/flight-ticket-request', { headers: candidate.headers, data: requestData })).status()).toBe(201)

  const candidatePath = '/api/candidate/flight-ticket-offer'
  const acceptedAdminPath = `/api/admin/flight-ticket-offers/${acceptedCandidate.process.id}`
  expect((await request.get(candidatePath)).status()).toBe(401)
  expect((await request.get(acceptedAdminPath)).status()).toBe(401)
  expect((await request.get('/api/flight-ticket-offers', { headers: acceptedCandidate.headers })).status()).toBe(403)
  expect((await request.post(acceptedAdminPath, { data: { action: 'PUBLISH', candidateInstructions: 'Test', options }, headers: { ...adminHeaders, Origin: 'https://untrusted.invalid' } })).status()).toBe(403)

  const publish = await request.post(acceptedAdminPath, { data: { action: 'PUBLISH', candidateInstructions: 'Uporedite sve sintetičke opcije.', options, responseDueAt: '2031-05-01T10:00:00.000Z' }, headers: adminHeaders })
  expect(publish.status()).toBe(201)
  const published = (await publish.json()).offer
  expect(published).toMatchObject({ notificationStatus: 'PENDING', offerVersion: 1, status: 'PUBLISHED' })
  expect(published.options.map((option: { optionCode: string }) => option.optionCode)).toEqual(['AA-FL-1-1', 'AA-FL-1-2'])
  expect((await request.post(acceptedAdminPath, { data: { action: 'PUBLISH', candidateInstructions: 'Duplikat', options }, headers: adminHeaders })).status()).toBe(409)
  expect((await request.post('/api/candidate/flight-ticket-request', { data: { ...requestData, expectedVersion: 1, returnDestination: 'Novi Sad' }, headers: acceptedCandidate.headers })).status()).toBe(409)
  expect((await (await request.get(candidatePath, { headers: other.headers })).json()).offers).toEqual([])

  const rejectedAdminPath = `/api/admin/flight-ticket-offers/${rejectedCandidate.process.id}`
  expect((await request.post(rejectedAdminPath, { data: { action: 'PUBLISH', candidateInstructions: 'Druga sintetička ponuda.', options: [options[0]] }, headers: adminHeaders })).status()).toBe(201)
  expect((await request.get('/api/payload-jobs/run?queue=candidate-communications&limit=20&disableScheduling=true', { headers: adminHeaders })).ok()).toBe(true)
  const candidateState = await (await request.get(candidatePath, { headers: acceptedCandidate.headers })).json()
  expect(candidateState.offers[0]).toMatchObject({ notificationStatus: 'DELIVERED', offerVersion: 1, status: 'PUBLISHED' })

  const acceptBody = { action: 'ACCEPT', confirmed: true, expectedSnapshotChecksum: candidateState.offers[0].snapshotChecksum, flightTicketOfferId: candidateState.offers[0].id, selectedOptionCode: 'AA-FL-1-2' }
  expect((await request.post(candidatePath, { data: acceptBody, headers: acceptedCandidate.headers })).status()).toBe(201)
  expect((await request.post(candidatePath, { data: acceptBody, headers: acceptedCandidate.headers })).status()).toBe(200)
  expect((await request.post(candidatePath, { data: { ...acceptBody, action: 'REJECT', selectedOptionCode: undefined }, headers: acceptedCandidate.headers })).status()).toBe(409)

  const rejectedState = await (await request.get(candidatePath, { headers: rejectedCandidate.headers })).json()
  expect((await request.post(candidatePath, { data: { action: 'REJECT', confirmed: true, expectedSnapshotChecksum: rejectedState.offers[0].snapshotChecksum, flightTicketOfferId: rejectedState.offers[0].id, rejectionReason: 'Želim kraće presedanje.' }, headers: rejectedCandidate.headers })).status()).toBe(201)
  const rejectedAfter = await (await request.get(candidatePath, { headers: rejectedCandidate.headers })).json()
  expect(rejectedAfter.responses[0]).toMatchObject({ action: 'REJECT', rejectionReason: 'Želim kraće presedanje.' })

  const fastAdminPath = `/api/admin/flight-ticket-offers/${fastCandidate.process.id}`
  expect((await request.post(fastAdminPath, { data: { action: 'PUBLISH', candidateInstructions: 'Ponuda za brzu odluku.', options: [options[0]] }, headers: adminHeaders })).status()).toBe(201)
  const fastState = await (await request.get(candidatePath, { headers: fastCandidate.headers })).json()
  expect((await request.post(candidatePath, { data: { action: 'ACCEPT', confirmed: true, expectedSnapshotChecksum: fastState.offers[0].snapshotChecksum, flightTicketOfferId: fastState.offers[0].id, selectedOptionCode: 'AA-FL-1-1' }, headers: fastCandidate.headers })).status()).toBe(201)
  expect((await request.get('/api/payload-jobs/run?queue=candidate-communications&limit=20&disableScheduling=true', { headers: adminHeaders })).ok()).toBe(true)
  const fastOffer = await payload.findByID({ collection: 'flight-ticket-offers', id: fastState.offers[0].id, overrideAccess: true })
  expect(fastOffer.notificationStatus).toBe('SKIPPED')
  const fastEvents = await payload.find({ collection: 'outbox-events', limit: 1, overrideAccess: true, where: { eventKey: { equals: `flight-ticket-offer:${fastOffer.id}:notification:v${fastOffer.offerVersion}` } } })
  expect(fastEvents.docs[0]).toMatchObject({ status: 'COMPLETED' })
  expect(fastEvents.docs[0].completedAt).toBeTruthy()

  const responses = await payload.find({ collection: 'flight-ticket-offer-responses', limit: 100, overrideAccess: true })
  const offerIds = [candidateState.offers[0].id, rejectedState.offers[0].id, fastState.offers[0].id]
  const ownResponses = responses.docs.filter((entry) => offerIds.includes(typeof entry.flightTicketOffer === 'number' ? entry.flightTicketOffer : entry.flightTicketOffer.id))
  expect(ownResponses).toHaveLength(3)
  expect(ownResponses).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'ACCEPT', selectedOptionCode: 'AA-FL-1-2' })]))
  expect(ownResponses.every((entry) => /^[a-f0-9]{64}$/u.test(entry.evidenceChecksum))).toBe(true)
  const deliveries = await payload.find({ collection: 'message-deliveries', limit: 20, overrideAccess: true, where: { category: { equals: 'FLIGHT_TICKET_OFFER' } } })
  const ownDeliveries = deliveries.docs.filter((entry) => offerIds.some((offerId) => entry.idempotencyKey.startsWith(`flight-ticket-offer:${offerId}:`)))
  expect(ownDeliveries).toHaveLength(2)
  expect(ownDeliveries.every((entry) => entry.status === 'DELIVERED')).toBe(true)
  expect(JSON.stringify(ownDeliveries.map((entry) => entry.subject))).not.toContain('BEG')
  expect(JSON.stringify(ownDeliveries.map((entry) => entry.subject))).not.toContain('850')
  const process = await payload.findByID({ collection: 'candidate-processes', id: acceptedCandidate.process.id, overrideAccess: true })
  expect(process.nextActionTitle).toBe('Sačekajte nalog za uplatu avionske karte')
  const applicationId = typeof process.preApplication === 'number' ? process.preApplication : process.preApplication.id
  const audits = await payload.find({ collection: 'audit-events', limit: 100, overrideAccess: true, where: { preApplication: { equals: applicationId } } })
  expect(audits.docs.map((entry) => entry.eventType)).toEqual(expect.arrayContaining(['FLIGHT_TICKET_OFFER_PUBLISHED', 'FLIGHT_TICKET_OFFER_NOTIFICATION_SENT', 'FLIGHT_TICKET_OFFER_ACCEPTED']))
  expect(JSON.stringify(audits.docs.map((entry) => entry.metadata))).not.toContain('BEG–FRA–JFK')
})
