import { randomUUID } from 'node:crypto'

import { expect, type APIRequestContext, type APIResponse, test } from '@playwright/test'

type ProcessingState = {
  application: {
    contactAttemptCount: number
    contactStatus: string
    correlationId: string
    status: string
    workflowVersion: number
  }
  deliveries: Array<{
    category: string
    status: string
  }>
}

async function jsonFrom<T>(response: APIResponse, context: string): Promise<T> {
  const body = await response.text()
  expect(
    response.ok(),
    context + ' failed with HTTP ' + response.status() + ': ' + body,
  ).toBe(true)
  return JSON.parse(body) as T
}

async function adminHeaders(request: APIRequestContext) {
  const credentials = {
    email: 'e2e.admin@example.test',
    password: 'E2e-only-password-2026!',
  }
  const initialization = await jsonFrom<{ initialized: boolean }>(
    await request.get('/api/users/init'),
    'Admin initialization check',
  )
  const response = initialization.initialized
    ? await request.post('/api/users/login', {
        data: credentials,
        headers: { 'x-forwarded-for': '198.18.0.20' },
      })
    : await request.post('/api/users/first-register', {
      data: { ...credentials, displayName: 'E2E administrator' },
      headers: { 'x-forwarded-for': '198.18.0.20' },
    })

  const result = await jsonFrom<{ token: string }>(response, 'Admin authentication')
  expect(result.token).toBeTruthy()
  return { Authorization: 'Bearer ' + result.token }
}

async function processingCommand(
  request: APIRequestContext,
  applicationId: number,
  headers: Record<string, string>,
  command: Record<string, unknown>,
) {
  return jsonFrom<ProcessingState>(
    await request.post('/api/pre-applications/' + applicationId + '/processing', {
      data: command,
      headers,
    }),
    'Processing command ' + String(command.action),
  )
}

test('javna prijava prolazi administrativnu kvalifikaciju i automatsku komunikaciju', async ({
  page,
  request,
}) => {
  const unauthenticated = await request.get('/api/pre-applications/1/processing')
  expect(unauthenticated.status()).toBe(401)

  const candidateEmail = 'e2e.candidate+' + randomUUID() + '@example.test'
  await page.goto('/prijava/work-and-travel')
  await page.getByLabel('Ime *', { exact: true }).fill('Test')
  await page.getByLabel('Prezime *', { exact: true }).fill('Kandidat')
  await page.getByLabel('Datum rođenja *', { exact: true }).fill('2002-04-15')
  await page.getByLabel('Broj telefona *', { exact: true }).fill('+381601234567')
  await page.getByLabel('Email adresa *', { exact: true }).fill(candidateEmail)
  await page.getByLabel('Adresa prebivališta *', { exact: true }).fill('Test adresa 1, Beograd')
  await page.getByLabel('Naziv fakulteta *', { exact: true }).fill('Test fakultet')
  await page.getByLabel('Grad studiranja *', { exact: true }).fill('Beograd')
  await page.locator('select[name="currentStudyYear"]').selectOption('YEAR_3')
  await page.getByLabel('Broj ostvarenih ESPB bodova *', { exact: true }).fill('120')
  await page.getByLabel(/Saglasan\/na sam/).check()

  const submissionResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/public/pre-applications'),
  )
  await page.getByRole('button', { name: 'Pošalji prijavu' }).click()
  const submissionResponse = await submissionResponsePromise
  expect(submissionResponse.status()).toBe(201)
  const submission = (await submissionResponse.json()) as {
    reference: string
    status: string
  }
  await expect(page.getByText('Prijava je uspešno poslata')).toBeVisible()
  await expect(page.getByText(submission.reference)).toBeVisible()

  const headers = await adminHeaders(request)
  const query = new URLSearchParams({
    depth: '0',
    limit: '1',
    'where[correlationId][equals]': submission.reference,
  })
  const applications = await jsonFrom<{ docs: Array<{ id: number }> }>(
    await request.get('/api/pre-applications?' + query.toString(), { headers }),
    'Application lookup',
  )
  expect(applications.docs).toHaveLength(1)
  const applicationId = applications.docs[0]!.id

  let state = await processingCommand(request, applicationId, headers, {
    action: 'START_REVIEW',
    expectedVersion: 1,
  })
  expect(state.application).toMatchObject({
    status: 'UNDER_REVIEW',
    workflowVersion: 2,
  })

  state = await processingCommand(request, applicationId, headers, {
    action: 'RECORD_CONTACT',
    attemptedAt: new Date().toISOString(),
    expectedVersion: state.application.workflowVersion,
    note: 'Sintetički E2E kontakt.',
    outcome: 'REACHED',
  })
  expect(state.application).toMatchObject({
    contactAttemptCount: 1,
    contactStatus: 'REACHED',
    status: 'UNDER_REVIEW',
    workflowVersion: 3,
  })

  const staleDecision = await request.post(
    '/api/pre-applications/' + applicationId + '/processing',
    {
      data: { action: 'MARK_QUALIFIED', expectedVersion: 2 },
      headers,
    },
  )
  expect(staleDecision.status()).toBe(409)
  await expect(staleDecision.json()).resolves.toMatchObject({ code: 'VERSION_CONFLICT' })

  state = await processingCommand(request, applicationId, headers, {
    action: 'MARK_QUALIFIED',
    decisionNote: 'Sintetička kvalifikacija za E2E proveru.',
    expectedVersion: state.application.workflowVersion,
  })
  expect(state.application.status).toBe('QUALIFIED')

  await expect
    .poll(
      async () => {
        const jobResponse = await request.get(
          '/api/payload-jobs/run?queue=candidate-communications&limit=10&disableScheduling=true',
          { headers },
        )
        expect(jobResponse.ok()).toBe(true)
        const stateResponse = await request.get(
          '/api/pre-applications/' + applicationId + '/processing',
          { headers },
        )
        state = await jsonFrom<ProcessingState>(stateResponse, 'Processing state')
        return state.application.status
      },
      {
        intervals: [250, 500, 1_000],
        timeout: 30_000,
      },
    )
    .toBe('CONSULTATION_INVITED')

  expect(state.deliveries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ category: 'MATERIAL_BUNDLE', status: 'DELIVERED' }),
      expect.objectContaining({ category: 'CONSULTATION_INVITATION', status: 'DELIVERED' }),
    ]),
  )
})
