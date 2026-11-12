import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { questionnaireFields } from '../../src/modules/visa-questionnaires/schema.ts'
import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

const pdf = Buffer.from('%PDF-1.4\nSynthetic browser visa document\n%%EOF')

test('candidate uploads a visa document and administrator reviews it from the process', async ({ page, browser, visaPayload: payload }) => {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
  const adminContext = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.18' } })
  try {
    const email = `visa-doc-browser-${randomUUID()}@example.test`
    const password = 'Synthetic-browser-password-2026!'
    const admin = await payload.create({ collection: 'users', data: { email, password, displayName: 'Visa document browser administrator' } })
    const adminLogin = await payload.login({ collection: 'users', data: { email, password } })
    const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` }
    const candidate = await seedVisaCandidate(payload, admin.id)
    await page.context().addCookies(candidate.cookies)
    const login = await adminContext.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)

    const passport = await page.request.post('/api/candidate/contract-readiness/passport', { headers: candidate.headers, multipart: { passport: { name: 'synthetic-passport.pdf', mimeType: 'application/pdf', buffer: pdf } } })
    expect(passport.status()).toBe(201)
    expect((await adminContext.request.post(`/api/admin/private-documents/${(await passport.json()).documentId}/review`, { headers: adminHeaders, data: { action: 'VERIFY' } })).status()).toBe(200)
    const answers = Object.fromEntries(questionnaireFields.map((field) => [field.key, `Synthetic ${field.key}`]))
    expect((await page.request.post('/api/candidate/visa-questionnaire', { headers: candidate.headers, data: { action: 'SUBMIT', answers, expectedRevision: 0 } })).status()).toBe(200)
    expect((await adminContext.request.post(`/api/admin/visa-questionnaires/${candidate.process.id}`, { headers: adminHeaders, data: { action: 'APPROVE', expectedRevision: 1, note: '' } })).status()).toBe(200)

    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/moj-nalog')
    const panel = page.getByRole('region', { name: 'Dokumentacija za vizu', exact: true })
    await expect(panel.getByText('1 od 5 prihvaćeno', { exact: true })).toBeVisible()
    const ds160 = panel.getByRole('article').filter({ hasText: 'Potvrda obrasca DS-160' })
    await ds160.getByLabel('Izaberite fajl').setInputFiles({ name: 'ds160.pdf', mimeType: 'application/pdf', buffer: pdf })
    await ds160.getByRole('button', { name: 'Postavi dokument' }).click()
    await expect(ds160.getByText('Čeka proveru agencije', { exact: true })).toBeVisible()

    const adminPage = await adminContext.newPage()
    adminPage.on('pageerror', (error) => {
      if (error.message !== 'Event' && !error.message.includes('Monaco')) {
        errors.push(error.message)
      }
    })
    await adminPage.goto(`/admin/collections/candidate-processes/${candidate.process.id}`)
    const adminPanel = adminPage.getByRole('region', { name: 'Dokumentacija za vizu', exact: true })
    const adminDs160 = adminPanel.getByRole('listitem').filter({ hasText: 'Potvrda obrasca DS-160' })
    await expect(adminDs160.getByText('Čeka proveru', { exact: true })).toBeVisible()
    await adminDs160.getByRole('link', { name: 'Otvori dokument' }).click()
    // A cold Payload admin compilation can consume the default assertion timeout in CI.
    // The review control itself signals hydration; an unrelated /me response does not.
    await expect(adminPage.getByRole('button', { name: 'Verifikuj dokument' })).toBeEnabled({ timeout: 30_000 })
    const reviewResponse = adminPage.waitForResponse((response) => response.url().includes('/api/admin/private-documents/') && response.url().endsWith('/review') && response.request().method() === 'POST')
    await adminPage.getByRole('button', { name: 'Verifikuj dokument' }).click()
    expect((await reviewResponse).ok()).toBe(true)
    await expect.poll(async () => {
      const response = await adminContext.request.get(`/api/admin/visa-documents/${candidate.process.id}`, { headers: adminHeaders })
      if (!response.ok()) return undefined
      const state = await response.json()
      return state.items.find((item: { documentType: string }) => item.documentType === 'VISA_DS160_CONFIRMATION')?.document?.status
    }).toBe('VERIFIED')
    await page.reload()
    await expect(panel.getByText('2 od 5 prihvaćeno', { exact: true })).toBeVisible()
    await expect(ds160.getByText('Prihvaćeno', { exact: true })).toBeVisible()
    expect(errors).toEqual([])
  } finally { await adminContext.close() }
})
