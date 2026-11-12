import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-055 administrator schedules preparation and candidate sees it and its cancellation', async ({ browser, page, visaPayload: payload }, testInfo) => {
  // The cold CI admin page loads many independent panels; wait for this panel's
  // actual ready state rather than assuming the default 10s assertion budget.
  test.setTimeout(120_000)
  const email = `prep-browser-${randomUUID()}@example.test`; const password = 'Synthetic-preparation-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Preparation browser admin', email, password } })
  const candidate = await seedVisaCandidate(payload, admin.id)
  const errors: string[] = []
  const adminContext = await browser.newContext({ baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100', extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.12' }, timezoneId: 'Europe/Belgrade', viewport: { width: 1440, height: 1200 } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const panel = adminPage.getByRole('region', { name: 'Priprema za razgovor u ambasadi', exact: true })
    await expect(panel.getByRole('button', { name: 'Zakaži termin', exact: true })).toBeVisible({ timeout: 30_000 })
    const day = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    await panel.getByLabel('Početak', { exact: true }).fill(`${day}T12:00`)
    await panel.getByLabel('Kraj (opciono)', { exact: true }).fill(`${day}T13:00`)
    await panel.getByLabel('Lokacija ili link', { exact: true }).fill('Sintetička sala za pripremu')
    await panel.getByLabel('Instrukcije koje vidi kandidat').fill('Ponesite testni spisak pitanja.')
    await panel.getByLabel('Interna napomena — kandidat je ne vidi').fill('PRIVATE-BROWSER-NOTE')
    const saved = adminPage.waitForResponse((response) => response.url().includes('/api/admin/interview-preparations/') && response.request().method() === 'POST')
    await panel.getByRole('button', { name: 'Zakaži termin', exact: true }).click()
    expect((await saved).status()).toBe(201)
    await expect(panel.getByRole('button', { name: 'Promeni termin', exact: true })).toBeVisible({ timeout: 30_000 })
    const adminScreenshot = testInfo.outputPath('fr055-admin.png')
    await panel.screenshot({ path: adminScreenshot })
    await testInfo.attach('FR-055 admin scheduling', { path: adminScreenshot, contentType: 'image/png' })

    await page.context().addCookies(candidate.cookies); page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/moj-nalog')
    const candidatePanel = page.getByRole('region', { name: 'Priprema za razgovor u ambasadi', exact: true })
    await expect(candidatePanel.getByText('Sintetička sala za pripremu', { exact: true })).toBeVisible()
    await expect(candidatePanel.getByText('Ponesite testni spisak pitanja.', { exact: true })).toBeVisible()
    await expect(page.getByText('PRIVATE-BROWSER-NOTE')).toHaveCount(0)
    const candidateScreenshot = testInfo.outputPath('fr055-candidate.png')
    await candidatePanel.screenshot({ path: candidateScreenshot })
    await testInfo.attach('FR-055 candidate appointment', { path: candidateScreenshot, contentType: 'image/png' })
    const downloading = page.waitForEvent('download')
    await candidatePanel.getByRole('link', { name: 'Preuzmi termin za kalendar (.ics)' }).click()
    expect((await downloading).suggestedFilename()).toBe('priprema-za-ambasadu.ics')
    const cancelled = adminPage.waitForResponse((response) => response.url().includes('/api/admin/interview-preparations/') && response.request().method() === 'POST')
    await panel.getByRole('button', { name: 'Otkaži termin', exact: true }).click()
    expect((await cancelled).status()).toBe(200)
    await page.reload()
    await expect(candidatePanel.getByText('Termin je otkazan', { exact: true }).first()).toBeVisible()
    await expect(candidatePanel.getByRole('link', { name: 'Preuzmi termin za kalendar (.ics)' })).toHaveCount(0)
  } finally { await adminContext.close() }
  expect(errors).toEqual([])
})
