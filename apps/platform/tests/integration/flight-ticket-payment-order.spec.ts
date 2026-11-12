import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

const requestData = { departureDate: '2031-06-10', returnDate: '2031-09-12', returnDestination: 'Beograd (BEG)', usaDestination: 'New York, NY' }
const option = { airlineName: 'Synthetic Air', baggageDescription: 'Predati kofer do 23 kg i ručni prtljag.', currency: 'EUR', outboundArrivalAt: '2031-06-10T18:00:00.000Z', outboundDepartureAt: '2031-06-10T08:00:00.000Z', outboundRoute: 'BEG–FRA–JFK', returnArrivalAt: '2031-09-13T12:00:00.000Z', returnDepartureAt: '2031-09-12T20:00:00.000Z', returnRoute: 'JFK–MUC–BEG', totalPriceMinor: 85_000 }

test('FR-058 issues, downloads and settles an immutable order for the accepted flight option', async ({ request, visaPayload: payload }) => {
  const email = `flight-payment-${randomUUID()}@example.test`; const password = 'Synthetic-flight-payment-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight payment administrator', email, password } })
  const login = await payload.login({ collection: 'users', data: { email, password } }); const adminHeaders = { Authorization: `Bearer ${login.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id); const other = await seedVisaCandidate(payload, admin.id)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  await payload.update({ collection: 'candidate-processes', id: other.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  expect((await request.post('/api/candidate/flight-ticket-request', { headers: candidate.headers, data: requestData })).status()).toBe(201)
  const offerPath = `/api/admin/flight-ticket-offers/${candidate.process.id}`
  expect((await request.post(offerPath, { data: { action: 'PUBLISH', candidateInstructions: 'Izaberite sintetičku opciju.', options: [option] }, headers: adminHeaders })).status()).toBe(201)
  const offerState = await (await request.get('/api/candidate/flight-ticket-offer', { headers: candidate.headers })).json()
  expect((await request.post('/api/candidate/flight-ticket-offer', { data: { action: 'ACCEPT', confirmed: true, expectedSnapshotChecksum: offerState.offers[0].snapshotChecksum, flightTicketOfferId: offerState.offers[0].id, selectedOptionCode: 'AA-FL-1-1' }, headers: candidate.headers })).status()).toBe(201)

  const orderPath = `/api/admin/flight-ticket-payment-orders/${candidate.process.id}`
  const state = await (await request.get(orderPath, { headers: adminHeaders })).json()
  expect(state.acceptedSelection).toMatchObject({ currency: 'EUR', optionCode: 'AA-FL-1-1', totalPriceMinor: 85_000 })
  const body = { action: 'ISSUE', bankAccount: '160-0000000000000-00', beneficiaryAddress: 'Knez Mihailova 1, Beograd', beneficiaryName: 'American Adventure', candidateInstructions: 'Uplatite do roka.', dueAt: '2031-05-20T21:59:59.000Z', exchangeRateDate: '2026-09-24T10:00:00.000Z', exchangeRateReference: 'Synthetic NBS list 1', exchangeRateScaled: 117_152_300, exchangeRateSource: 'Srednji kurs NBS', idempotencyKey: randomUUID(), includeAdvanceInvoice: false, paymentModel: '97', paymentPurpose: 'Uplata avionske karte', paymentReference: '2026-0001' }
  expect((await request.post(orderPath, { data: body, headers: { ...adminHeaders, Origin: 'https://untrusted.invalid' } })).status()).toBe(403)
  const issuedResponse = await request.post(orderPath, { data: body, headers: adminHeaders }); expect(issuedResponse.status()).toBe(201)
  const issued = (await issuedResponse.json()).order
  expect(issued).toMatchObject({ originalAmountMinor: 85_000, originalCurrency: 'EUR', settlementAmountMinor: 9_957_946, status: 'ISSUED' })
  expect((await request.post(orderPath, { data: body, headers: adminHeaders })).status()).toBe(201)
  expect((await request.post(orderPath, { data: { ...body, idempotencyKey: randomUUID() }, headers: adminHeaders })).status()).toBe(409)

  const downloadPath = `/api/flight-ticket-payment-orders/${issued.id}/download`
  const download = await request.get(downloadPath, { headers: candidate.headers }); expect(download.status()).toBe(200)
  expect(download.headers()['content-type']).toBe('application/pdf')
  expect(Buffer.from(await download.body()).subarray(0, 4).toString()).toBe('%PDF')
  expect((await request.get(downloadPath, { headers: other.headers })).status()).toBe(404)
  expect((await request.get(downloadPath)).status()).toBe(401)

  const paymentDate = `${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`
  const paid = await request.post(orderPath, { data: { action: 'RECORD_PAYMENT', expectedStatusVersion: issued.statusVersion, externalPaymentReference: 'SYNTHETIC-STATEMENT-1', orderId: issued.id, paidAt: paymentDate }, headers: adminHeaders })
  expect(paid.status()).toBe(200); expect((await paid.json()).order.status).toBe('PAID')
  const process = await payload.findByID({ collection: 'candidate-processes', id: candidate.process.id, overrideAccess: true })
  expect(process.nextActionTitle).toBe('Sačekajte informacije o orijentaciji')
  const applicationId = typeof process.preApplication === 'number' ? process.preApplication : process.preApplication.id
  const audits = await payload.find({ collection: 'audit-events', limit: 100, overrideAccess: true, where: { preApplication: { equals: applicationId } } })
  expect(audits.docs.map((entry) => entry.eventType)).toEqual(expect.arrayContaining(['FLIGHT_TICKET_PAYMENT_ORDER_ISSUED', 'FLIGHT_TICKET_PAYMENT_RECORDED']))
})
