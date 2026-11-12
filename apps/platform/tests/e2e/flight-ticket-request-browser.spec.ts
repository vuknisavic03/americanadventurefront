import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-056 candidate submits a flight request and administrator sees the authoritative data', async ({ browser, page, visaPayload: payload }, testInfo) => {
  test.setTimeout(120_000)
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'; const errors: string[] = []
  const email = `flight-browser-${randomUUID()}@example.test`; const password = 'Synthetic-flight-browser-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Flight browser admin', email, password } })
  const candidate = await seedVisaCandidate(payload, admin.id)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  await page.context().addCookies(candidate.cookies); page.on('pageerror', (error) => errors.push(error.message)); await page.goto('/moj-nalog')
  const panel = page.getByRole('region', { name: 'Zahtev za avionsku kartu', exact: true })
  await expect(panel).toBeVisible()
  await panel.getByLabel('Datum odlaska').fill('2027-06-10')
  await panel.getByLabel('Destinacija u SAD').fill('Ocean City, MD')
  await panel.getByLabel('Datum povratka').fill('2027-09-12')
  await panel.getByLabel('Povratna destinacija').fill('Beograd (BEG)')
  const saved = page.waitForResponse((response) => response.url().endsWith('/api/candidate/flight-ticket-request') && response.request().method() === 'POST')
  await panel.getByRole('button', { name: 'Pošalji zahtev agenciji', exact: true }).click(); expect((await saved).status()).toBe(201)
  await expect(panel.getByText('Zahtev je evidentiran · verzija 1', { exact: true })).toBeVisible()
  const candidateScreenshot = testInfo.outputPath('fr056-candidate.png'); await panel.screenshot({ path: candidateScreenshot }); await testInfo.attach('FR-056 candidate request', { path: candidateScreenshot, contentType: 'image/png' })

  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.15' } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const adminPanel = adminPage.getByRole('region', { name: 'Zahtev kandidata za avionsku kartu', exact: true })
    await expect(adminPanel.getByText('Ocean City, MD', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(adminPanel.getByText('Beograd (BEG)', { exact: true })).toBeVisible()
    const adminScreenshot = testInfo.outputPath('fr056-admin.png'); await adminPanel.screenshot({ path: adminScreenshot }); await testInfo.attach('FR-056 admin request', { path: adminScreenshot, contentType: 'image/png' })
  } finally { await adminContext.close() }
  expect(errors).toEqual([])
})
