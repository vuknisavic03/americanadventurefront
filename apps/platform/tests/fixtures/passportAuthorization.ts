import { expect, type APIRequestContext } from '@playwright/test'

import { questionnaireFields } from '../../src/modules/visa-questionnaires/schema.ts'
import { swtVisaDocumentRequirements } from '../../src/modules/visa-documents/requirements.ts'
import { seedVisaCandidate } from './visaQuestionnaire.ts'

const syntheticPdf = (label: string) => Buffer.from(`%PDF-1.4\nSynthetic ${label}\n%%EOF`)

function syntheticPersonalId(accountId: number) {
  const prefix = `150400271${String(accountId % 1_000).padStart(3, '0')}`
  const digits = [...prefix].map(Number)
  const weighted = 7 * (digits[0]! + digits[6]!) + 6 * (digits[1]! + digits[7]!) +
    5 * (digits[2]! + digits[8]!) + 4 * (digits[3]! + digits[9]!) +
    3 * (digits[4]! + digits[10]!) + 2 * (digits[5]! + digits[11]!)
  const remainder = 11 - (weighted % 11)
  return `${prefix}${remainder > 9 ? 0 : remainder}`
}

export async function completePassportAuthorizationPrerequisites(
  request: APIRequestContext,
  adminHeaders: Record<string, string>,
  candidate: Awaited<ReturnType<typeof seedVisaCandidate>>,
) {
  const personalId = syntheticPersonalId(candidate.account.id)
  expect((await request.put('/api/candidate/contract-readiness/personal-id', {
    headers: candidate.headers,
    data: { personalId },
  })).status()).toBe(200)

  const passport = await request.post('/api/candidate/contract-readiness/passport', {
    headers: candidate.headers,
    multipart: { passport: { name: 'synthetic-passport.pdf', mimeType: 'application/pdf', buffer: syntheticPdf('passport') } },
  })
  expect(passport.status()).toBe(201)
  expect((await request.post(`/api/admin/private-documents/${(await passport.json()).documentId}/review`, {
    headers: adminHeaders,
    data: { action: 'VERIFY' },
  })).status()).toBe(200)

  const answers = Object.fromEntries(questionnaireFields.map((field) => [field.key, `Synthetic ${field.key}`]))
  expect((await request.post('/api/candidate/visa-questionnaire', {
    headers: candidate.headers,
    data: { action: 'SUBMIT', answers, expectedRevision: 0 },
  })).status()).toBe(200)
  expect((await request.post(`/api/admin/visa-questionnaires/${candidate.process.id}`, {
    headers: adminHeaders,
    data: { action: 'APPROVE', expectedRevision: 1, note: '' },
  })).status()).toBe(200)

  for (const requirement of swtVisaDocumentRequirements.filter((item) => item.uploadable)) {
    const document = requirement.documentType === 'VISA_PHOTO'
      ? { name: 'synthetic-visa-photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]) }
      : { name: `${requirement.documentType}.pdf`, mimeType: 'application/pdf', buffer: syntheticPdf(requirement.documentType) }
    const upload = await request.post(`/api/candidate/visa-documents/${requirement.documentType}`, {
      headers: candidate.headers,
      multipart: { document },
    })
    expect(upload.status()).toBe(201)
    expect((await request.post(`/api/admin/private-documents/${(await upload.json()).documentId}/review`, {
      headers: adminHeaders,
      data: { action: 'VERIFY' },
    })).status()).toBe(200)
  }
  return personalId
}

export async function createActivePassportAuthorizationTemplate(
  request: APIRequestContext,
  adminHeaders: Record<string, string>,
) {
  const active = await request.get('/api/passport-authorization-templates?where[programCode][equals]=SWT&where[status][equals]=ACTIVE&limit=100', { headers: adminHeaders })
  expect(active.status()).toBe(200)
  for (const template of (await active.json()).docs as Array<{ id: number }>) {
    expect((await request.patch(`/api/passport-authorization-templates/${template.id}`, {
      headers: adminHeaders,
      data: { status: 'RETIRED' },
    })).status()).toBe(200)
  }
  const draft = await request.post('/api/passport-authorization-templates', {
    headers: adminHeaders,
    data: {
      body: '# Punomoćje\n\nJa, {{ candidate.fullName }}, JMBG {{ candidate.personalId }}, sa adresom {{ candidate.address }}, ovlašćujem agenciju da preuzme moj pasoš.\n\nBroj: {{ authorization.number }}\nDatum: {{ authorization.date }}',
      name: 'Sintetički FR-052 šablon',
      programCode: 'SWT',
      status: 'DRAFT',
      version: 1,
    },
  })
  expect(draft.status()).toBe(201)
  const templateId = (await draft.json()).doc.id as number
  expect((await request.patch(`/api/passport-authorization-templates/${templateId}`, {
    headers: adminHeaders,
    data: { status: 'ACTIVE' },
  })).status()).toBe(200)
  return templateId
}
