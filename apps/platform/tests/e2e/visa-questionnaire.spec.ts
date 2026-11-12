import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { questionnaireFields } from '../../src/modules/visa-questionnaires/schema.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('candidate saves and submits a visa questionnaire; administrator requests corrections and completes review', async ({ page, browser, visaPayload: payload }) => {
  const adminContext = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.19' } })
  try {
    const email = `visa-browser-${randomUUID()}@example.test`
    const password = 'Synthetic-browser-password-2026!'
    const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Visa browser administrator' } })
    const candidate = await seedVisaCandidate(payload, admin.id)
    await page.context().addCookies(candidate.cookies)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/moj-nalog')
    const panel = page.getByRole('region', { name: 'Vizni upitnik', exact: true })
    await expect(panel.getByRole('button', { name: 'Sačuvaj nacrt upitnika' })).toBeVisible()
    await panel.getByRole('textbox', { name: 'Mesto rođenja *', exact: true }).fill('Test grad')
    await panel.getByRole('button', { name: 'Sačuvaj nacrt upitnika' }).click()
    await expect(panel.getByRole('status')).toHaveText('Nacrt je sačuvan.')
    await page.reload()
    await expect(panel.getByRole('textbox', { name: 'Mesto rođenja *', exact: true })).toHaveValue('Test grad')
    for (const field of questionnaireFields) {
      await panel.getByRole('textbox', { name: field.label + (field.required ? ' *' : ''), exact: true }).fill(`Test ${field.key}`)
    }
    await panel.getByRole('button', { name: 'Predaj vizni upitnik' }).click()
    await expect(panel.getByText('Predato agenciji', { exact: true })).toBeVisible()

    const adminPage = await adminContext.newPage()
    adminPage.on('pageerror', (error) => errors.push(error.message))
    const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
    const login = await adminContext.request.post(`${baseURL}/api/users/login`, { data: { email, password } })
    expect(login.ok()).toBe(true)
    await adminPage.goto(`${baseURL}/admin/collections/candidate-processes/${candidate.process.id}`)
    const review = adminPage.getByRole('region', { name: 'Vizni upitnik', exact: true })
    await review.getByLabel('Napomena kandidatu (obavezna za dopunu)').fill('Dopunite mesto rođenja — test.')
    await review.getByRole('button', { name: 'Vrati na dopunu' }).click()
    await expect(review.getByText('Potrebna dopuna', { exact: true })).toBeVisible()
    await page.reload()
    await expect(panel.getByText('Dopunite mesto rođenja — test.', { exact: true }).first()).toBeVisible()
    await panel.getByRole('textbox', { name: 'Mesto rođenja *', exact: true }).fill('Ispravljeni test grad')
    await panel.getByRole('button', { name: 'Predaj vizni upitnik' }).click()
    await expect(panel.getByText('Predato agenciji', { exact: true })).toBeVisible()
    await adminPage.reload()
    await expect(review.getByRole('textbox', { name: 'Mesto rođenja *', exact: true })).toHaveValue('Ispravljeni test grad')
    await review.getByRole('button', { name: 'Završi pregled upitnika' }).click()
    await expect(review.getByText('Pregled završen', { exact: true }).first()).toBeVisible()
    await page.reload()
    await expect(panel.getByRole('textbox', { name: 'Mesto rođenja *', exact: true })).toBeDisabled()
    await expect(panel.getByText('Pregled završen', { exact: true }).first()).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    await adminContext.close()
  }
})
