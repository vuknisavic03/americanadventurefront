import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { completePassportAuthorizationPrerequisites, createActivePassportAuthorizationTemplate } from '../fixtures/passportAuthorization.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

function localDate(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Belgrade', year: 'numeric' }).formatToParts(value)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

test('candidate records an embassy appointment and administrator sees it in the process', async ({ browser, page, visaPayload: payload }) => {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'; const errors: string[] = []
  const email = `embassy-browser-${randomUUID()}@example.test`; const password = 'Synthetic-browser-password-2026!'
  const admin = await payload.create({ collection: 'users', data: { displayName: 'Embassy browser administrator', email, password } })
  const adminLogin = await payload.login({ collection: 'users', data: { email, password } }); const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` }
  const candidate = await seedVisaCandidate(payload, admin.id)
  await completePassportAuthorizationPrerequisites(page.request, adminHeaders, candidate)
  await createActivePassportAuthorizationTemplate(page.request, adminHeaders)
  const generated = await page.request.post(`/api/admin/passport-authorizations/${candidate.process.id}`, { headers: adminHeaders })
  const authorizationId = (await generated.json()).authorizationId as number
  const authorization = await payload.findByID({ collection: 'passport-collection-authorizations', depth: 0, id: authorizationId, overrideAccess: true })
  expect((await page.request.post(`/api/candidate/passport-authorizations/${authorizationId}/accept`, { headers: candidate.headers, data: { confirmed: true, sourcePdfSha256: authorization.pdfSha256 } })).ok()).toBe(true)

  await page.context().addCookies(candidate.cookies); page.on('pageerror', (error) => errors.push(error.message)); await page.goto('/moj-nalog')
  const panel = page.getByRole('region', { name: 'Termin u ambasadi', exact: true })
  await expect(panel).toBeVisible()
  await panel.getByLabel('Datum termina').fill(localDate(new Date(Date.now() + 10 * 24 * 60 * 60_000)))
  await panel.getByLabel('Vreme termina').fill('10:30')
  const save = page.waitForResponse((response) => response.url().endsWith('/api/candidate/embassy-appointment') && response.request().method() === 'POST')
  await panel.getByRole('button', { name: 'Sačuvaj termin', exact: true }).click(); expect((await save).status()).toBe(200)
  await expect(panel.getByText('Zakazan termin:', { exact: false })).toBeVisible()

  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.11' } })
  try {
    expect((await adminContext.request.post('/api/users/login', { data: { email, password } })).ok()).toBe(true)
    const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message))
    const appointmentResponse = adminPage.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/embassy-appointments/${candidate.process.id}`) && response.request().method() === 'GET',
    )
    await Promise.all([appointmentResponse, adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)])
    expect((await appointmentResponse).status()).toBe(200)
    const adminPanel = adminPage.getByRole('region', { name: 'Termin kandidata u ambasadi', exact: true })
    await expect(adminPanel.getByText('Zakazan', { exact: true })).toBeVisible()
    await expect(adminPanel.getByText('Verzija')).toBeVisible()
  } finally { await adminContext.close() }
  expect(errors).toEqual([])
})
