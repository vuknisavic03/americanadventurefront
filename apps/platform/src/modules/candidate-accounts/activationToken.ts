import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_CONTEXT = 'american-adventure:candidate-activation:v1'

type ActivationTokenPayload = {
  accountId: number
  expiresAt: number
  nonce: string
  version: number
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(`${TOKEN_CONTEXT}:${value}`).digest('base64url')
}

export function createCandidateActivationToken(payload: ActivationTokenPayload, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encoded}.${signature(encoded, secret)}`
}

export function readCandidateActivationToken(token: string, secret: string) {
  if (!token || token.length > 2_048) return undefined
  const [encoded, providedSignature, extra] = token.split('.')
  if (!encoded || !providedSignature || extra) return undefined

  const expectedSignature = signature(encoded, secret)
  const provided = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return undefined

  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<ActivationTokenPayload>
    if (
      !Number.isSafeInteger(value.accountId) ||
      !Number.isSafeInteger(value.expiresAt) ||
      !Number.isSafeInteger(value.version) ||
      typeof value.nonce !== 'string' ||
      value.nonce.length < 16 ||
      value.nonce.length > 128
    ) {
      return undefined
    }

    return value as ActivationTokenPayload
  } catch {
    return undefined
  }
}

export function candidateActivationUrl({
  accountId,
  expiresAt,
  nonce,
  secret,
  serverUrl,
  version,
}: ActivationTokenPayload & { secret: string; serverUrl: string }) {
  const token = createCandidateActivationToken({ accountId, expiresAt, nonce, version }, secret)
  return `${serverUrl.replace(/\/$/, '')}/nalog/aktivacija?token=${encodeURIComponent(token)}`
}

