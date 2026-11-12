import { randomInt, randomUUID } from 'node:crypto'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { request, test as base } from '@playwright/test'
import config from '../../src/payload.config.ts'

export async function testPayload() {
  const databaseURL = process.env.DATABASE_URL ?? ''
  if (!/(?:_e2e|_test)$/.test(new URL(databaseURL).pathname)) throw new Error('Visa fixtures require an isolated test database.')
  const resolved = await config
  const payload = await getPayload({ config: { ...resolved, db: { ...postgresAdapter({ pool: { connectionString: databaseURL }, push: false }), allowIDOnCreate: false, name: 'postgres' }, jobs: { ...resolved.jobs, autoRun: [] } } })
  // The existing public-application browser test shares this standard test administrator.
  const shared = await payload.find({ collection: 'users', where: { email: { equals: 'e2e.admin@example.test' } }, limit: 1 })
  if (!shared.docs.length) await payload.create({ collection: 'users', data: { email: 'e2e.admin@example.test', password: 'E2e-only-password-2026!', displayName: 'E2E administrator' } })
  return payload
}

type NoTestFixtures = Record<never, never>

export const test = base.extend<NoTestFixtures, { visaPayload: Payload }>({
  visaPayload: [async ({}, provide) => {
    const payload = await testPayload()
    try {
      await provide(payload)
    } finally {
      await payload.destroy()
    }
  }, { scope: 'worker' }],
})

export async function seedVisaCandidate(payload: Payload, administratorId: number, paid = true) {
  const email = `visa-${randomUUID()}@example.test`
  const password = 'Synthetic-visa-password-2026!'
  const applicant = await payload.create({ collection: 'applicants', data: {
    firstName: 'Test', lastName: 'Visa', fullName: 'Test Visa', dateOfBirth: '2002-04-15',
    residentialAddress: 'Synthetic address', email, phone: '+381601234567', emailNormalized: email,
    phoneNormalized: '+381601234567', firstNameNormalized: 'test', lastNameNormalized: 'visa',
  } })
  const application = await payload.create({ collection: 'pre-applications', data: {
    applicant: applicant.id, programCode: 'SWT', campaignCode: 'SYNTHETIC', source: 'PUBLIC_WEB',
    status: 'READY_FOR_PROFILE', correlationId: randomUUID(), idempotencyKeyHash: randomUUID(),
    workflowVersion: 1, contactStatus: 'REACHED', contactAttemptCount: 1, consultationStatus: 'ATTENDED',
    submission: { firstName: 'Test', lastName: 'Visa', dateOfBirth: '2002-04-15', residentialAddress: 'Synthetic address', phone: '+381601234567', email, facultyName: 'Test faculty', studyCity: 'Test city', currentStudyYear: 'YEAR_3', studyInterruptionStatus: 'NONE', espbPoints: 120 },
    submissionMetadata: { formSchemaVersion: 'test', submissionLanguage: 'sr', sourcePage: '/synthetic-test' },
  } })
  const account = await payload.create({ collection: 'candidate-accounts', disableVerificationEmail: true, data: {
    email, password, fullName: 'Test Visa', applicant: applicant.id, preApplication: application.id,
    programCode: 'SWT', accountStatus: 'ACTIVE', _verified: true, activationVersion: 0, citizenship: 'Srbija',
  } })
  const process = await payload.create({ collection: 'candidate-processes', data: {
    applicant: applicant.id, candidateAccount: account.id, preApplication: application.id,
    programCode: 'SWT', processStatus: 'ACTIVE', currentStep: 'VISA', progressVersion: 1,
  } })
  if (paid) await payload.create({ collection: 'visa-payment-orders', data: {
    candidateProcess: process.id, candidateAccount: account.id, applicant: applicant.id, preApplication: application.id,
    programCode: 'SWT', orderNumber: `TEST-${randomUUID()}`, orderVersion: 1, statusVersion: 2, status: 'PAID',
    amountMinor: 100, currency: 'RSD', beneficiaryName: 'Synthetic beneficiary', bankAccount: 'SYNTHETIC-ACCOUNT',
    paymentReference: 'TEST', paymentPurpose: 'Synthetic fee', candidateInstructions: 'Test only',
    dueAt: '2030-01-01', snapshotChecksum: 'a'.repeat(64), issuedAt: new Date().toISOString(), issuedBy: administratorId,
    paidAt: new Date().toISOString(), paymentRecordedBy: administratorId, idempotencyKey: randomUUID(),
  } })
  const session = await request.newContext({ baseURL: processEnvironmentBaseURL(), extraHTTPHeaders: { 'Sec-Fetch-Site': 'same-origin', 'X-Forwarded-For': `198.18.${randomInt(1, 255)}.${randomInt(1, 255)}` } })
  try {
    const login = await session.post('/api/candidate-accounts/login', { data: { email, password } })
    if (!login.ok()) throw new Error(`Candidate test login failed: HTTP ${login.status()}.`)
    const cookies = (await session.storageState()).cookies
    if (cookies.length === 0) throw new Error(`Login returned no session cookies; set-cookie present: ${Boolean(login.headers()['set-cookie'])}`)
    const me = await session.get('/api/candidate-accounts/me')
    if (!(await me.json()).user) throw new Error('Candidate login cookie is not accepted by the existing me endpoint.')
    return { account, process, email, password, cookies, headers: { 'Sec-Fetch-Site': 'same-origin', Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') } }
  } finally { await session.dispose() }
}

function processEnvironmentBaseURL() { return process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100' }
