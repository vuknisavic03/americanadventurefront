import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-057 administrator publishes options and candidate accepts one in the portal', async ({ browser, page, visaPayload: payload }, testInfo) => {
  test.setTimeout(150_000)
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'; const errors: string[] = []
  const email = `flight-offer-browser-${randomUUID()}@example.test`; const password = 'Synthetic-flight-offer-browser-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight offer browser admin', email, password } })
  const candidate = await seedVisaCandidate(payload, admin.id)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  const relationId = (value: number | { id: number }) => typeof value === 'number' ? value : value.id
  await payload.create({ collection: 'flight-ticket-requests', data: { applicant: relationId(candidate.process.applicant), candidateAccount: candidate.account.id, candidateProcess: candidate.process.id, departureDate: '2031-06-10', messageDelivery: null, notificationDeliveredAt: null, notificationStatus: 'DELIVERED', preApplication: relationId(candidate.process.preApplication), programCode: 'SWT', returnDate: '2031-09-12', returnDestination: 'Beograd (BEG)', submittedAt: new Date().toISOString(), usaDestination: 'New York, NY', version: 1 }, overrideAccess: true })

  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.13' } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const panel = adminPage.getByRole('region', { name: 'Ponuda avionske karte kandidatu', exact: true })
    await expect(panel.getByText('New York, NY')).toBeVisible({ timeout: 30_000 })
    await panel.getByLabel('Aviokompanija opcije 1').fill('Synthetic Air')
    await panel.getByLabel('Cena opcije 1').fill('850.00')
    await panel.getByLabel('Odlazna ruta opcije 1').fill('BEG–FRA–JFK')
    await panel.getByLabel('Polazak opcije 1', { exact: true }).fill('2031-06-10T08:00')
    await panel.getByLabel('Dolazak opcije 1', { exact: true }).fill('2031-06-10T18:00')
    await panel.getByLabel('Povratna ruta opcije 1').fill('JFK–MUC–BEG')
    await panel.getByLabel('Povratni polazak opcije 1', { exact: true }).fill('2031-09-12T20:00')
    await panel.getByLabel('Povratni dolazak opcije 1', { exact: true }).fill('2031-09-13T12:00')
    await panel.getByLabel('Prtljag opcije 1').fill('Predati kofer do 23 kg i ručni prtljag.')
    const published = adminPage.waitForResponse((response) => response.url().includes('/api/admin/flight-ticket-offers/') && response.request().method() === 'POST')
    await panel.getByRole('button', { name: 'Objavi ponudu kandidatu', exact: true }).click(); expect((await published).status()).toBe(201)
    await expect(panel.getByText('Ponuda je objavljena kandidatu i email obaveštenje je stavljeno u red.', { exact: true })).toBeVisible()
    const adminScreenshot = testInfo.outputPath('fr057-admin-offer.png'); await panel.screenshot({ path: adminScreenshot }); await testInfo.attach('FR-057 admin offer', { path: adminScreenshot, contentType: 'image/png' })
  } finally { await adminContext.close() }

  await page.context().addCookies(candidate.cookies); page.on('pageerror', (error) => errors.push(error.message)); await page.goto('/moj-nalog')
  const candidatePanel = page.getByRole('region', { name: 'Ponuda avionske karte', exact: true })
  await expect(candidatePanel.getByText('Synthetic Air', { exact: true })).toBeVisible({ timeout: 30_000 })
  await candidatePanel.getByRole('radio').check()
  await candidatePanel.getByRole('checkbox').check()
  const accepted = page.waitForResponse((response) => response.url().endsWith('/api/candidate/flight-ticket-offer') && response.request().method() === 'POST')
  await candidatePanel.getByRole('button', { name: 'Prihvati izabranu opciju', exact: true }).click(); expect((await accepted).status()).toBe(201)
  await expect(candidatePanel.getByText('Izabrali ste AA-FL-1-1.', { exact: true })).toBeVisible()
  const candidateScreenshot = testInfo.outputPath('fr057-candidate-response.png'); await candidatePanel.screenshot({ path: candidateScreenshot }); await testInfo.attach('FR-057 candidate response', { path: candidateScreenshot, contentType: 'image/png' })
  expect(errors).toEqual([])
})
