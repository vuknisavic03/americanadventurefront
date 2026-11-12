import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-071, FR-072, FR-073: Admin communications (Email, SMS, In-App) and candidate portal notifications', async ({
  request,
  visaPayload: payload,
}) => {
  const suffix = randomUUID().slice(0, 8)

  // 1. Kreiraj administratora
  const adminEmail = `admin-comm-${suffix}@americanadventure.test`
  const adminPassword = 'Password123!'
  const admin = await payload.create({
    collection: 'users',
    data: {
      displayName: 'Admin Komunikacije',
      email: adminEmail,
      password: adminPassword,
    },
  })

  const adminLogin = await payload.login({
    collection: 'users',
    data: { email: adminEmail, password: adminPassword },
  })
  const adminHeaders = {
    Authorization: `Bearer ${adminLogin.token}`,
  }

  // 2. Pripremi dva kandidata
  const candidate1 = await seedVisaCandidate(payload, admin.id)
  const candidate2 = await seedVisaCandidate(payload, admin.id)

  const c1ApplicantId =
    typeof candidate1.process.applicant === 'object' && candidate1.process.applicant !== null
      ? (candidate1.process.applicant as { id: number }).id
      : Number(candidate1.process.applicant)

  const c2ApplicantId =
    typeof candidate2.process.applicant === 'object' && candidate2.process.applicant !== null
      ? (candidate2.process.applicant as { id: number }).id
      : Number(candidate2.process.applicant)

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Milica',
      fullName: 'Milica Petrović',
      lastName: 'Petrović',
      phone: '064 123 4567',
    },
    id: c1ApplicantId,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'applicants',
    data: {
      firstName: 'Nikola',
      fullName: 'Nikola Jovanović',
      lastName: 'Jovanović',
      phone: '065 987 6543',
    },
    id: c2ApplicantId,
    overrideAccess: true,
  })

  // -------------------------------------------------------------
  // Sigurnosne provere (401 i 403)
  // -------------------------------------------------------------
  const templatesPath = '/api/admin/communications/templates'
  const sendPath = '/api/admin/communications/send'
  const logsPath = '/api/admin/communications/logs'
  const candidateNotificationsPath = '/api/candidate/notifications'

  expect((await request.get(templatesPath)).status()).toBe(401)
  expect((await request.get(templatesPath, { headers: candidate1.headers })).status()).toBe(401)
  expect((await request.get(logsPath)).status()).toBe(401)
  expect((await request.get(logsPath, { headers: candidate1.headers })).status()).toBe(401)
  expect((await request.post(sendPath, { data: {} })).status()).toBe(401)
  expect((await request.post(sendPath, { data: {}, headers: candidate1.headers })).status()).toBe(401)
  expect((await request.get(candidateNotificationsPath)).status()).toBe(401)

  // -------------------------------------------------------------
  // FR-072: Pregled šablona (Admin)
  // -------------------------------------------------------------
  const templatesRes = await request.get(templatesPath, { headers: adminHeaders })
  expect(templatesRes.status()).toBe(200)
  const { templates } = await templatesRes.json()
  expect(Array.isArray(templates)).toBe(true)
  expect(templates.length).toBeGreaterThan(5)

  const emailTemplates = templates.filter((t: { channel: string }) => t.channel === 'EMAIL')
  const smsTemplates = templates.filter((t: { channel: string }) => t.channel === 'SMS')
  expect(emailTemplates.length).toBeGreaterThanOrEqual(3)
  expect(smsTemplates.length).toBeGreaterThanOrEqual(3)

  // -------------------------------------------------------------
  // FR-072: Slanje individualne EMAIL poruke
  // -------------------------------------------------------------
  const sendEmailRes = await request.post(sendPath, {
    data: {
      candidateProcessId: candidate1.process.id,
      channel: 'EMAIL',
      templateKey: 'EMAIL_GENERAL_ANNOUNCEMENT',
      templateParams: {
        customNote: 'Vaša prijava je uspešno prošla administrativnu proveru.',
      },
    },
    headers: adminHeaders,
  })
  expect(sendEmailRes.status()).toBe(200)
  const sendEmailJson = await sendEmailRes.json()
  expect(sendEmailJson.success).toBe(true)
  expect(sendEmailJson.status).toBe('DELIVERED')
  expect(sendEmailJson.recipient).toBe(candidate1.email)

  // -------------------------------------------------------------
  // FR-073: Slanje individualne SMS poruke
  // -------------------------------------------------------------
  const sendSmsRes = await request.post(sendPath, {
    data: {
      actionRequiredDueAt: '2026-11-20T12:00:00.000Z',
      actionRequiredTitle: 'Dostava pasoša',
      candidateProcessId: candidate1.process.id,
      channel: 'SMS',
      templateKey: 'SMS_URGENT_ACTION',
    },
    headers: adminHeaders,
  })
  expect(sendSmsRes.status()).toBe(200)
  const sendSmsJson = await sendSmsRes.json()
  expect(sendSmsJson.success).toBe(true)
  expect(sendSmsJson.status).toBe('DELIVERED')
  expect(sendSmsJson.recipient).toBe('+381641234567')

  // -------------------------------------------------------------
  // FR-071: Slanje in-app obaveštenja (portal kandidata)
  // -------------------------------------------------------------
  const sendInAppRes = await request.post(sendPath, {
    data: {
      actionRequiredDueAt: '2026-11-30T10:00:00.000Z',
      actionRequiredTitle: 'Elektronsko potpisivanje ugovora',
      candidateProcessId: candidate1.process.id,
      channel: 'IN_APP',
      templateKey: 'IN_APP_ACTION_REQUIRED',
    },
    headers: adminHeaders,
  })
  expect(sendInAppRes.status()).toBe(200)
  const sendInAppJson = await sendInAppRes.json()
  expect(sendInAppJson.success).toBe(true)
  expect(sendInAppJson.provider).toBe('in-app')

  // -------------------------------------------------------------
  // FR-071: Pregled in-app notifikacija od strane kandidata
  // -------------------------------------------------------------
  const candidateNotifsRes = await request.get(candidateNotificationsPath, {
    headers: candidate1.headers,
  })
  expect(candidateNotifsRes.status()).toBe(200)
  const candidateNotifsJson = await candidateNotifsRes.json()
  expect(candidateNotifsJson.items.length).toBeGreaterThanOrEqual(1)
  expect(candidateNotifsJson.unreadCount).toBeGreaterThanOrEqual(1)

  const inAppNotif = candidateNotifsJson.items.find(
    (item: { actionRequiredTitle?: string }) => item.actionRequiredTitle === 'Elektronsko potpisivanje ugovora',
  )
  expect(inAppNotif).toBeDefined()
  expect(inAppNotif.isRead).toBe(false)
  expect(inAppNotif.actionRequiredDueAt).toBe('2026-11-30T10:00:00.000Z')

  // Označavanje kao pročitano
  const markReadRes = await request.patch(candidateNotificationsPath, {
    data: {
      notificationIds: [inAppNotif.id],
    },
    headers: candidate1.headers,
  })
  expect(markReadRes.status()).toBe(200)
  const markReadJson = await markReadRes.json()
  expect(markReadJson.markedCount).toBe(1)
  expect(markReadJson.markedIds).toContain(inAppNotif.id)

  // Proveri da nema više nepročitanih
  const unreadOnlyRes = await request.get(`${candidateNotificationsPath}?unreadOnly=true`, {
    headers: candidate1.headers,
  })
  expect(unreadOnlyRes.status()).toBe(200)
  const unreadOnlyJson = await unreadOnlyRes.json()
  expect(unreadOnlyJson.items.some((i: { id: number }) => i.id === inAppNotif.id)).toBe(false)

  // -------------------------------------------------------------
  // FR-072 / FR-073: Grupno slanje (Batch)
  // -------------------------------------------------------------
  const batchRes = await request.post(sendPath, {
    data: {
      candidateProcessIds: [candidate1.process.id, candidate2.process.id],
      channel: 'EMAIL',
      templateKey: 'EMAIL_DOCUMENT_REMINDER',
      templateParams: {
        dueDate: '01.12.2026.',
      },
    },
    headers: adminHeaders,
  })
  expect(batchRes.status()).toBe(200)
  const batchJson = await batchRes.json()
  expect(batchJson.total).toBe(2)
  expect(batchJson.succeeded).toBe(2)
  expect(batchJson.failed).toBe(0)

  // -------------------------------------------------------------
  // Evidencija komunikacije (Logs) i Audit Log
  // -------------------------------------------------------------
  const logsRes = await request.get(logsPath, { headers: adminHeaders })
  expect(logsRes.status()).toBe(200)
  const logsJson = await logsRes.json()
  expect(logsJson.totalDocs).toBeGreaterThanOrEqual(5)

  // Filter po SMS kanalu
  const smsLogsRes = await request.get(`${logsPath}?channel=SMS`, { headers: adminHeaders })
  expect(smsLogsRes.status()).toBe(200)
  const smsLogsJson = await smsLogsRes.json()
  expect(smsLogsJson.docs.every((d: { channel: string }) => d.channel === 'SMS')).toBe(true)

  // Proveri revizijske događaje u bazi
  const auditEvents = await payload.find({
    collection: 'audit-events',
    limit: 10,
    overrideAccess: true,
    where: {
      or: [
        { eventType: { equals: 'ADMIN_COMMUNICATION_SENT' } },
        { eventType: { equals: 'ADMIN_BATCH_COMMUNICATION_SENT' } },
      ],
    },
  })
  expect(auditEvents.totalDocs).toBeGreaterThanOrEqual(4)
})
