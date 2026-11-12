import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('confirming a valid profile advances the candidate to contract and payment', async ({ page, visaPayload: payload }) => {
  const administrator = (await payload.find({
    collection: 'users',
    limit: 1,
    where: { email: { equals: 'e2e.admin@example.test' } },
  })).docs[0]!
  const candidate = await seedVisaCandidate(payload, administrator.id, false)
  await payload.update({
    collection: 'candidate-processes',
    data: {
      currentStep: 'PROFILE_SETUP',
      nextActionDescription: 'Proverite podatke prenete iz prijave i potvrdite profil.',
      nextActionTitle: 'Proverite i dopunite svoj profil',
    },
    id: candidate.process.id,
    overrideAccess: true,
  })

  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.context().addCookies(candidate.cookies)
  await page.goto('/moj-nalog')
  await expect(page.locator('.status-panel strong')).toHaveText('Profil kandidata')

  const saveResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/candidate/profile') && response.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Sačuvaj izmene', exact: true }).click()
  const response = await saveResponse
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ advanced: true })

  await expect(page.locator('.status-panel strong')).toHaveText('Ugovor i način plaćanja')
  await expect(page.locator('.next-action-card strong')).toHaveText('Sačekajte programsku ponudu')
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 0,
    id: candidate.process.id,
    overrideAccess: true,
  })
  expect(process.currentStep).toBe('CONTRACT_AND_PAYMENT_PLAN')
  const preApplicationId = typeof candidate.account.preApplication === 'number'
    ? candidate.account.preApplication
    : candidate.account.preApplication.id
  const audit = await payload.find({
    collection: 'audit-events',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-occurredAt',
    where: {
      and: [
        { preApplication: { equals: preApplicationId } },
        { eventType: { equals: 'CANDIDATE_PROCESS_UPDATED' } },
      ],
    },
  })
  expect(audit.docs[0]?.metadata).toMatchObject({ reason: 'PROFILE_CONFIRMED' })
  expect(pageErrors).toEqual([])
})
