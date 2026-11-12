import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-059 administrator schedules orientation and candidate sees its calendar entry', async ({ browser, page, visaPayload: payload }, testInfo) => {
  test.setTimeout(120_000)
  const email = `orientation-browser-${randomUUID()}@example.test`
  const password = 'Synthetic-orientation-browser-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Orientation browser administrator', email, password } })
  const candidate = await seedVisaCandidate(payload, admin.id)
  await payload.update({ collection: 'candidate-processes', id: candidate.process.id, data: { currentStep: 'TRAVEL_PREPARATION' }, overrideAccess: true })
  const errors: string[] = []
  const adminContext = await browser.newContext({ baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100', extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.16' }, timezoneId: 'Europe/Belgrade', viewport: { width: 1440, height: 1200 } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage()
    adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const panel = adminPage.getByRole('region', { exact: true, name: 'Orijentacioni sastanak pred putovanje' })
    await expect(panel.getByRole('button', { exact: true, name: 'Zakaži termin' })).toBeVisible({ timeout: 30_000 })
    const day = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    await panel.getByLabel('Početak', { exact: true }).fill(`${day}T12:00`)
    await panel.getByLabel('Kraj (opciono)', { exact: true }).fill(`${day}T13:00`)
    await panel.getByLabel('Lokacija ili link', { exact: true }).fill('https://example.invalid/synthetic-orientation')
    await panel.getByLabel('Instrukcije koje vidi kandidat').fill('Ponesite probni plan putovanja.')
    await panel.getByLabel('Interna napomena — kandidat je ne vidi').fill('PRIVATE-ORIENTATION-BROWSER-NOTE')
    const saved = adminPage.waitForResponse((response) => response.url().includes('purpose=ORIENTATION') && response.request().method() === 'POST')
    await panel.getByRole('button', { exact: true, name: 'Zakaži termin' }).click()
    expect((await saved).status()).toBe(201)
    await expect(panel.getByRole('button', { exact: true, name: 'Promeni termin' })).toBeVisible({ timeout: 30_000 })
    const adminScreenshot = testInfo.outputPath('fr059-admin.png')
    await panel.screenshot({ path: adminScreenshot })
    await testInfo.attach('FR-059 admin orientation', { contentType: 'image/png', path: adminScreenshot })

    await page.context().addCookies(candidate.cookies)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/moj-nalog')
    const candidatePanel = page.getByRole('region', { exact: true, name: 'Orijentacioni sastanak pred putovanje' })
    await expect(candidatePanel.getByText('https://example.invalid/synthetic-orientation', { exact: true })).toBeVisible()
    await expect(candidatePanel.getByText('Ponesite probni plan putovanja.', { exact: true })).toBeVisible()
    await expect(page.getByText('PRIVATE-ORIENTATION-BROWSER-NOTE')).toHaveCount(0)
    const candidateScreenshot = testInfo.outputPath('fr059-candidate.png')
    await candidatePanel.screenshot({ path: candidateScreenshot })
    await testInfo.attach('FR-059 candidate orientation', { contentType: 'image/png', path: candidateScreenshot })
    const downloading = page.waitForEvent('download')
    await candidatePanel.getByRole('link', { name: 'Preuzmi termin za kalendar (.ics)' }).click()
    expect((await downloading).suggestedFilename()).toBe('orijentacioni-sastanak.ics')

    const cancelled = adminPage.waitForResponse((response) => response.url().includes('purpose=ORIENTATION') && response.request().method() === 'POST')
    await panel.getByRole('button', { exact: true, name: 'Otkaži termin' }).click()
    expect((await cancelled).status()).toBe(200)
    await page.reload()
    await expect(candidatePanel.getByText('Orijentacioni sastanak je otkazan', { exact: true }).first()).toBeVisible()
    await expect(candidatePanel.getByRole('link', { name: 'Preuzmi termin za kalendar (.ics)' })).toHaveCount(0)
  } finally {
    await adminContext.close()
  }
  expect(errors).toEqual([])
})
