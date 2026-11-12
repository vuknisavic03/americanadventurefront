import { createHash, randomUUID } from 'node:crypto'
import type { EmailAdapter, SendEmailOptions } from 'payload'

import type { PlatformEnvironment } from '../../config/environment.ts'
import type { RenderedCandidateMessage } from './templates.ts'

type CandidateCommunicationEnvironment = PlatformEnvironment['candidateCommunication']

export type SendCandidateMessageInput = {
  idempotencyKey: string
  message: RenderedCandidateMessage
  recipientEmail: string
}

export type CandidateEmailProvider = {
  name: 'capture' | 'resend'
  send(input: SendCandidateMessageInput): Promise<{ messageId: string }>
}

export class CandidateEmailProviderError extends Error {
  constructor(public readonly code: 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE') {
    super('Provajder nije prihvatio poruku kandidatu.')
    this.name = 'CandidateEmailProviderError'
  }
}

export function createCandidateEmailProvider(
  environment: CandidateCommunicationEnvironment,
  fetchImplementation: typeof fetch = fetch,
): CandidateEmailProvider {
  if (environment.provider === 'capture') {
    return {
      name: 'capture',
      async send({ idempotencyKey }) {
        return { messageId: `capture:${idempotencyKey}` }
      },
    }
  }

  return {
    name: 'resend',
    async send({ idempotencyKey, message, recipientEmail }) {
      let response: Response

      try {
        response = await fetchImplementation('https://api.resend.com/emails', {
          body: JSON.stringify({
            from: environment.from,
            html: message.html,
            reply_to: environment.replyTo,
            subject: message.subject,
            text: message.text,
            to: [recipientEmail],
          }),
          headers: {
            Authorization: `Bearer ${environment.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          method: 'POST',
        })
      } catch {
        throw new CandidateEmailProviderError('PROVIDER_UNAVAILABLE')
      }

      if (!response.ok) {
        throw new CandidateEmailProviderError('PROVIDER_REJECTED')
      }

      const body = (await response.json()) as { id?: unknown }
      if (typeof body.id !== 'string' || !body.id) {
        throw new CandidateEmailProviderError('PROVIDER_REJECTED')
      }

      return { messageId: body.id }
    },
  }
}

function addresses(value: SendEmailOptions['to']) {
  const entries = Array.isArray(value) ? value : value ? [value] : []
  return entries.flatMap((entry) => {
    if (typeof entry === 'string') return entry.split(',').map((address) => address.trim()).filter(Boolean)
    return entry.address ? [entry.address] : []
  })
}

function configuredSender(value: string) {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match
    ? { address: match[2]!.trim(), name: match[1]!.trim() || 'American Adventure' }
    : { address: value.trim(), name: 'American Adventure' }
}

export function createPlatformEmailAdapter(
  environment: CandidateCommunicationEnvironment,
): EmailAdapter {
  return ({ payload }) => {
    const sender = configuredSender(environment.from)
    return {
      defaultFromAddress: sender.address,
      defaultFromName: sender.name,
      name: 'american-adventure-candidate-email',
      async sendEmail(options) {
        const subject = typeof options.subject === 'string' ? options.subject : 'American Adventure'
        const html = typeof options.html === 'string' ? options.html : ''
        const text = typeof options.text === 'string' ? options.text : html.replace(/<[^>]+>/g, ' ')
        const recipients = addresses(options.to)

        if (environment.provider === 'capture') {
          payload.logger.info({ html, recipients, subject, text }, 'Captured outgoing email.')
          return { messageId: `capture:${randomUUID()}` }
        }

        const provider = createCandidateEmailProvider(environment)
        const results = []
        for (const recipientEmail of recipients) {
          results.push(await provider.send({
            idempotencyKey: `payload-email:${randomUUID()}`,
            message: {
              category: 'ACCOUNT_ACTIVATION',
              contentHash: createHash('sha256').update(`${subject}\n${text}\n${html}`).digest('hex'),
              html,
              subject,
              templateKey: 'PAYLOAD_SYSTEM_EMAIL',
              templateVersion: '0.1',
              text,
            },
            recipientEmail,
          }))
        }
        return results
      },
    }
  }
}

