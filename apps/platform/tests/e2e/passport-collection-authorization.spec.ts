import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import {
  completePassportAuthorizationPrerequisites,
  createActivePassportAuthorizationTemplate,
} from '../fixtures/passportAuthorization.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('administrator generates and candidate accepts a passport collection authorization in the portal', async ({ page, browser, visaPayload: payload }) => {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.17' } })
  try {
    const email = `passport-authorization-browser-${randomUUID()}@example.test`
    const password = 'Synthetic-browser-password-2026!'
    const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Passport authorization browser administrator' } })
    const adminToken = await payload.login({ collection: 'users', data: { email, password } })
    const adminHeaders = { Authorization: `Bearer ${adminToken.token}` }
    const candidate = await seedVisaCandidate(payload, admin.id)
    await completePassportAuthorizationPrerequisites(page.request, adminHeaders, candidate)
    await createActivePassportAuthorizationTemplate(page.request, adminHeaders)

    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const errors: string[] = []
    const adminPage = await adminContext.newPage()
    adminPage.on('pageerror', (error) => errors.push(error.message))
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const adminPanel = adminPage.getByRole('region', { name: 'Punomoćje za preuzimanje pasoša', exact: true })
    await expect(adminPanel.getByText('Aktivan šablon:', { exact: false })).toBeVisible({ timeout: 30_000 })
    const generateResponse = adminPage.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/passport-authorizations/${candidate.process.id}`) && response.request().method() === 'POST',
    )
    await adminPanel.getByRole('button', { name: 'Generiši punomoćje' }).click()
    expect((await generateResponse).status()).toBe(201)
    await expect(adminPanel.getByText('Čeka prihvatanje kandidata')).toBeVisible({ timeout: 30_000 })
    await expect(adminPanel.getByRole('link', { name: 'Preuzmi nacrt' })).toBeVisible({ timeout: 30_000 })

    await page.context().addCookies(candidate.cookies)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/moj-nalog')
    const candidatePanel = page.getByRole('region', { name: 'Pregledajte i prihvatite punomoćje', exact: true })
    await expect(candidatePanel.getByRole('link', { name: 'Preuzmi nacrt punomoćja' })).toBeVisible({ timeout: 30_000 })
    await candidatePanel.getByRole('checkbox').check()
    const acceptResponse = page.waitForResponse((response) =>
      response.url().includes('/api/candidate/passport-authorizations/') && response.url().endsWith('/accept'),
    )
    await candidatePanel.getByRole('button', { name: 'Elektronski prihvati punomoćje' }).click()
    expect((await acceptResponse).status()).toBe(201)
    const acceptedPanel = page.getByRole('region', { name: 'Punomoćje je prihvaćeno', exact: true })
    await expect(acceptedPanel.getByText('Elektronski prihvaćeno', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(acceptedPanel.getByRole('link', { name: 'Preuzmi prihvaćeni PDF' })).toBeVisible({ timeout: 30_000 })

    const acceptedAdminResponse = adminPage.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/passport-authorizations/${candidate.process.id}`) && response.request().method() === 'GET',
    )
    await Promise.all([acceptedAdminResponse, adminPage.reload()])
    expect((await acceptedAdminResponse).status()).toBe(200)
    await expect(adminPanel.getByText('Elektronski prihvaćeno')).toBeVisible({ timeout: 30_000 })
    await expect(adminPanel.getByRole('link', { name: 'Preuzmi za štampu' })).toBeVisible({ timeout: 30_000 })
    expect(errors).toEqual([])
  } finally {
    await adminContext.close()
  }
})
