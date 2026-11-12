import { createHash } from 'node:crypto'
import type { Payload, TaskConfig } from 'payload'

import type { EmbassyAppointment, EmbassyReminderDelivery } from '../../payload-types.ts'
import { readPlatformEnvironment } from '../../config/environment.ts'
import { createCandidateEmailProvider, CandidateEmailProviderError } from '../candidate-communications/emailProvider.ts'
import { renderCandidateMessage } from '../candidate-communications/templates.ts'
import { createCandidateSmsProvider, CandidateSmsProviderError, normalizeSmsRecipient } from './smsProvider.ts'
import { formatEmbassyAppointment } from './rules.ts'

type Channel = 'EMAIL' | 'SMS'
type TaskIO = { input: { appointmentId: number; appointmentVersion: number; channel: Channel }; output: { deliveryId?: number; status: 'DELIVERED' | 'SKIPPED' } }

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }
function idempotencyKey(appointment: EmbassyAppointment, version: number, channel: Channel) { return `embassy-appointment:${appointment.id}:v${version}:${channel.toLowerCase()}` }

async function existingDelivery(payload: Payload, key: string) {
  return (await payload.find({ collection: 'embassy-reminder-deliveries', depth: 0, limit: 1, overrideAccess: true, where: { idempotencyKey: { equals: key } } })).docs[0]
}

async function audit(payload: Payload, appointment: EmbassyAppointment, eventType: 'CANDIDATE_MESSAGE_FAILED' | 'EMBASSY_REMINDER_EMAIL_SENT' | 'EMBASSY_REMINDER_SKIPPED' | 'EMBASSY_REMINDER_SMS_SENT', metadata: Record<string, unknown>) {
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(appointment.preApplication), overrideAccess: true })
  await payload.create({ collection: 'audit-events', data: {
    actorType: 'SYSTEM', correlationId: application.correlationId, eventType, metadata,
    newStatus: application.status, occurredAt: new Date().toISOString(), preApplication: application.id,
    previousStatus: application.status, workflowVersion: application.workflowVersion,
  }, overrideAccess: true })
}

async function skipped(payload: Payload, appointment: EmbassyAppointment, channel: Channel, requestedVersion: number, reason: string) {
  await audit(payload, appointment, 'EMBASSY_REMINDER_SKIPPED', { appointmentId: appointment.id, channel, currentVersion: appointment.version, reason, requestedVersion })
  return { status: 'SKIPPED' as const }
}

async function prepareDelivery(payload: Payload, appointment: EmbassyAppointment, channel: Channel, key: string, recipient: string, provider: 'capture' | 'resend' | 'webhook', subject: string | undefined, text: string) {
  const current = await existingDelivery(payload, key)
  if (current?.status === 'DELIVERED') return current
  const data = { attemptCount: (current?.attemptCount ?? 0) + 1, contentHash: createHash('sha256').update(text).digest('hex'), lastAttemptAt: new Date().toISOString(), lastErrorCode: null, provider, recipient, status: 'PROCESSING' as const, subject, templateKey: 'SWT_EMBASSY_APPOINTMENT_REMINDER_SR', templateVersion: '1.0' }
  return current
    ? payload.update({ collection: 'embassy-reminder-deliveries', data, id: current.id, overrideAccess: true })
    : payload.create({ collection: 'embassy-reminder-deliveries', data: { ...data, appointmentVersion: appointment.version, channel, embassyAppointment: appointment.id, idempotencyKey: key, preApplication: relationId(appointment.preApplication) }, overrideAccess: true })
}

async function markFailed(payload: Payload, appointment: EmbassyAppointment, delivery: EmbassyReminderDelivery, channel: Channel, errorCode: string) {
  await payload.update({ collection: 'embassy-reminder-deliveries', data: { lastErrorCode: errorCode, status: 'FAILED' }, id: delivery.id, overrideAccess: true })
  await audit(payload, appointment, 'CANDIDATE_MESSAGE_FAILED', { appointmentId: appointment.id, appointmentVersion: appointment.version, channel, deliveryId: delivery.id, errorCode })
}

export const sendEmbassyAppointmentReminderTask: TaskConfig<TaskIO> = {
  inputSchema: [
    { name: 'appointmentId', type: 'number', required: true },
    { name: 'appointmentVersion', type: 'number', required: true },
    { name: 'channel', type: 'select', options: [{ label: 'Email', value: 'EMAIL' }, { label: 'SMS', value: 'SMS' }], required: true },
  ],
  label: 'Pošalji podsetnik za termin u ambasadi',
  outputSchema: [
    { name: 'deliveryId', type: 'number' },
    { name: 'status', type: 'select', options: [{ label: 'Isporučeno', value: 'DELIVERED' }, { label: 'Preskočeno', value: 'SKIPPED' }], required: true },
  ],
  retries: { attempts: 3, backoff: { delay: 30_000, type: 'exponential' } },
  slug: 'sendEmbassyAppointmentReminder',
  async handler({ input, req }) {
    const payload = req.payload
    const appointment = await payload.findByID({ collection: 'embassy-appointments', depth: 0, id: input.appointmentId, overrideAccess: true }).catch(() => undefined)
    if (!appointment) throw new Error('Termin u ambasadi nije pronađen.')
    if (appointment.status !== 'SCHEDULED' || appointment.version !== input.appointmentVersion) return { output: await skipped(payload, appointment, input.channel, input.appointmentVersion, 'STALE_APPOINTMENT') }
    const now = new Date()
    if (new Date(appointment.appointmentAt).getTime() <= now.getTime()) return { output: await skipped(payload, appointment, input.channel, input.appointmentVersion, 'APPOINTMENT_PASSED') }
    if (new Date(appointment.reminderAt).getTime() > now.getTime() + 60_000) throw new Error('Podsetnik je pokrenut pre zakazanog vremena.')

    const [account, applicant, application] = await Promise.all([
      payload.findByID({ collection: 'candidate-accounts', depth: 0, id: relationId(appointment.candidateAccount), overrideAccess: true }),
      payload.findByID({ collection: 'applicants', depth: 0, id: relationId(appointment.applicant), overrideAccess: true }),
      payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(appointment.preApplication), overrideAccess: true }),
    ])
    const environment = readPlatformEnvironment()
    const label = formatEmbassyAppointment(new Date(appointment.appointmentAt))
    const message = renderCandidateMessage('EMBASSY_APPOINTMENT_REMINDER', {
      campaignName: application.campaignCode, candidatePortalUrl: `${environment.serverUrl}/moj-nalog#embassy-appointment`,
      consultationBookingUrl: environment.candidateCommunication.consultationBookingUrl,
      embassyAppointmentLabel: label, firstName: applicant.firstName,
      officialContactEmail: environment.candidateCommunication.replyTo, officialPhone: environment.candidateCommunication.officialPhone,
      privacyPolicyUrl: environment.candidateCommunication.privacyPolicyUrl, programName: 'Work and Travel USA',
    })
    const key = idempotencyKey(appointment, input.appointmentVersion, input.channel)
    const isEmail = input.channel === 'EMAIL'
    const recipient = isEmail ? account.email : applicant.phoneNormalized || applicant.phone
    const provider = isEmail ? environment.candidateCommunication.provider : environment.candidateSms.provider
    const smsText = `American Adventure podsetnik: termin u Ambasadi SAD je ${label}. Proverite portal i dokumentaciju. Kontakt: ${environment.candidateCommunication.officialPhone}`
    const delivery = await prepareDelivery(payload, appointment, input.channel, key, recipient, provider, isEmail ? message.subject : undefined, isEmail ? message.text : smsText)
    if (delivery.status === 'DELIVERED') return { output: { deliveryId: delivery.id, status: 'DELIVERED' } }
    try {
      const result = isEmail
        ? await createCandidateEmailProvider(environment.candidateCommunication).send({ idempotencyKey: key, message, recipientEmail: recipient })
        : await createCandidateSmsProvider(environment.candidateSms).send({ idempotencyKey: key, recipientPhone: normalizeSmsRecipient(recipient), text: smsText })
      const deliveredAt = new Date().toISOString()
      await payload.update({ collection: 'embassy-reminder-deliveries', data: { deliveredAt, lastErrorCode: null, providerMessageId: result.messageId, status: 'DELIVERED' }, id: delivery.id, overrideAccess: true })
      await audit(payload, appointment, isEmail ? 'EMBASSY_REMINDER_EMAIL_SENT' : 'EMBASSY_REMINDER_SMS_SENT', { appointmentId: appointment.id, appointmentVersion: appointment.version, channel: input.channel, deliveryId: delivery.id, providerMessageId: result.messageId })
      return { output: { deliveryId: delivery.id, status: 'DELIVERED' } }
    } catch (error) {
      const errorCode = error instanceof CandidateEmailProviderError || error instanceof CandidateSmsProviderError ? error.code : 'UNEXPECTED_PROVIDER_ERROR'
      await markFailed(payload, appointment, delivery, input.channel, errorCode)
      throw error
    }
  },
}
