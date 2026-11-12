import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

function syntheticApplication(email: string) {
  return {
    currentStudyYear: 'YEAR_3',
    dateOfBirth: '2002-04-15',
    email,
    espbPoints: 120,
    facultyName: 'Test fakultet',
    firstName: 'Test',
    lastName: 'Kandidat',
    newsletterConsent: false,
    phone: '+381601234567',
    privacyConsent: true,
    residentialAddress: 'Test adresa 1, Beograd',
    studyCity: 'Beograd',
    studyInterruptionStatus: 'NONE',
    website: '',
  }
}

test('ponovljena javna prijava sa istim ključem ne pravi duplikat', async ({ request }) => {
  const idempotencyKey = randomUUID()
  const application = syntheticApplication('integration+' + randomUUID() + '@example.test')
  const headers = {
    'Idempotency-Key': idempotencyKey,
    'X-Forwarded-For': '198.51.100.10',
  }

  const firstResponse = await request.post('/api/public/pre-applications', {
    data: application,
    headers,
  })
  expect(firstResponse.status()).toBe(201)
  const firstResult = (await firstResponse.json()) as {
    reference: string
    status: string
  }
  expect(firstResult).toMatchObject({ status: 'created' })
  expect(firstResult.reference).toBeTruthy()

  const repeatedResponse = await request.post('/api/public/pre-applications', {
    data: application,
    headers,
  })
  expect(repeatedResponse.status()).toBe(200)
  await expect(repeatedResponse.json()).resolves.toEqual({
    reference: firstResult.reference,
    status: 'already_received',
  })
})
