import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { publishFlightTicketOffer, respondToFlightTicketOffer } from '../../src/modules/flight-ticket-offers/service.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-058 administrator issues an order and candidate downloads it in the portal', async ({ browser, page, visaPayload: payload }, testInfo) => {
  test.setTimeout(150_000)
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'; const errors: string[] = []
  const email = `flight-payment-browser-${randomUUID()}@example.test`; const password = 'Synthetic-flight-payment-browser-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight payment browser admin', email, password } })
  const candidate = await seedVisaCandidate(payload, admin.id)
  const candidateProcess = await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  const relationId = (value: number | { id: number }) => typeof value === 'number' ? value : value.id
  await payload.create({ collection: 'flight-ticket-requests', data: { applicant: relationId(candidateProcess.applicant), candidateAccount: candidate.account.id, candidateProcess: candidateProcess.id, departureDate: '2031-06-10', messageDelivery: null, notificationDeliveredAt: null, notificationStatus: 'DELIVERED', preApplication: relationId(candidateProcess.preApplication), programCode: 'SWT', returnDate: '2031-09-12', returnDestination: 'Beograd (BEG)', submittedAt: new Date().toISOString(), usaDestination: 'New York, NY', version: 1 }, overrideAccess: true })
  const offer = await publishFlightTicketOffer({ administratorId: admin.id, candidateProcessId: candidateProcess.id, input: { candidateInstructions: 'Izaberite sintetičku opciju.', options: [{ airlineName: 'Synthetic Air', baggageDescription: 'Predati kofer do 23 kg.', currency: 'EUR', outboundArrivalAt: '2031-06-10T18:00:00.000Z', outboundDepartureAt: '2031-06-10T08:00:00.000Z', outboundRoute: 'BEG–FRA–JFK', returnArrivalAt: '2031-09-13T12:00:00.000Z', returnDepartureAt: '2031-09-12T20:00:00.000Z', returnRoute: 'JFK–MUC–BEG', totalPriceMinor: 85_000 }] }, now: new Date(), payload })
  await respondToFlightTicketOffer({ accountId: candidate.account.id, action: 'ACCEPT', expectedSnapshotChecksum: offer.snapshotChecksum, flightTicketOfferId: offer.id, now: new Date(), payload, selectedOptionCode: 'AA-FL-1-1' })

  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.14' } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidateProcess.id}`)
    const panel = adminPage.getByRole('region', { name: 'Nalog za uplatu avionske karte', exact: true })
    await expect(panel.getByText('Synthetic Air · BEG–FRA–JFK')).toBeVisible({ timeout: 30_000 })
    await panel.getByLabel('Srednji kurs NBS (RSD za 1 EUR)').fill('117,1523')
    await panel.getByLabel('Datum kursa').fill('2026-09-24')
    await panel.getByLabel('Referenca kursa (link ili broj liste)').fill('Sintetička kursna lista 1')
    await panel.getByLabel('Adresa primaoca').fill('Knez Mihailova 1, Beograd')
    await panel.getByLabel('Račun primaoca').fill('160-0000000000000-00')
    await panel.getByLabel('Poziv na broj').fill('2026-0001')
    await panel.getByLabel('Rok za uplatu').fill('2031-05-20')
    const issued = adminPage.waitForResponse((response) => response.url().includes('/api/admin/flight-ticket-payment-orders/') && response.request().method() === 'POST')
    await panel.getByRole('button', { name: 'Generiši i izdaj nalog', exact: true }).click(); expect((await issued).status()).toBe(201)
    await expect(panel.getByRole('link', { name: 'Preuzmi PDF' })).toBeVisible({ timeout: 30_000 })
    const screenshot = testInfo.outputPath('fr058-admin-payment-order.png'); await panel.screenshot({ path: screenshot }); await testInfo.attach('FR-058 admin payment order', { path: screenshot, contentType: 'image/png' })
  } finally { await adminContext.close() }

  await page.context().addCookies(candidate.cookies); page.on('pageerror', (error) => errors.push(error.message)); await page.goto('/moj-nalog')
  const candidatePanel = page.getByRole('region', { name: 'Uplata avionske karte', exact: true })
  await expect(candidatePanel.getByText('99.579,46')).toBeVisible({ timeout: 30_000 })
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    candidatePanel.getByRole('link', { name: 'Preuzmi nalog u PDF-u' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^AA-AIR-.*\.pdf$/u)
  expect(await download.failure()).toBeNull()
  const screenshot = testInfo.outputPath('fr058-candidate-payment-order.png'); await candidatePanel.screenshot({ path: screenshot }); await testInfo.attach('FR-058 candidate payment order', { path: screenshot, contentType: 'image/png' })
  expect(errors).toEqual([])
})
