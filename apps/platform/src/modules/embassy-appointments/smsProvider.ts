export type SmsEnvironment = { provider: 'capture' | 'webhook'; sender: string; webhookToken?: string; webhookUrl?: string }
export type SmsInput = { idempotencyKey: string; recipientPhone: string; text: string }

export class CandidateSmsProviderError extends Error {
  constructor(readonly code: 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE') {
    super('SMS provajder nije prihvatio poruku kandidatu.')
    this.name = 'CandidateSmsProviderError'
  }
}

export function normalizeSmsRecipient(value: string) {
  const compact = value.trim().replace(/[\s()./-]/g, '')
  const normalized = compact.startsWith('+') ? `+${compact.slice(1).replace(/\D/g, '')}`
    : compact.startsWith('00') ? `+${compact.slice(2).replace(/\D/g, '')}`
      : compact.startsWith('0') ? `+381${compact.slice(1).replace(/\D/g, '')}`
        : compact.startsWith('381') ? `+${compact.replace(/\D/g, '')}` : compact
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new CandidateSmsProviderError('PROVIDER_REJECTED')
  return normalized
}

export function createCandidateSmsProvider(environment: SmsEnvironment, fetchImplementation: typeof fetch = fetch) {
  if (environment.provider === 'capture') return {
    name: 'capture' as const,
    async send({ idempotencyKey }: SmsInput) { return { messageId: `capture:${idempotencyKey}` } },
  }
  return {
    name: 'webhook' as const,
    async send(input: SmsInput) {
      let response: Response
      try {
        response = await fetchImplementation(environment.webhookUrl!, {
          body: JSON.stringify({ from: environment.sender, idempotencyKey: input.idempotencyKey, text: input.text, to: input.recipientPhone }),
          headers: { Authorization: `Bearer ${environment.webhookToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
          method: 'POST',
        })
      } catch { throw new CandidateSmsProviderError('PROVIDER_UNAVAILABLE') }
      if (!response.ok) throw new CandidateSmsProviderError('PROVIDER_REJECTED')
      const result = await response.json().catch(() => undefined) as { id?: unknown } | undefined
      if (!result || typeof result.id !== 'string' || !result.id) throw new CandidateSmsProviderError('PROVIDER_REJECTED')
      return { messageId: result.id }
    },
  }
}
