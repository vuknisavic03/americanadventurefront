import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_BYTES = 16
const IV_BYTES = 12
const KEY_BYTES = 32

export type EncryptedValue = {
  authTag: string
  ciphertext: string
  iv: string
  keyId: string
}

export type SensitiveDataKeyring = {
  activeKeyId: string
  fingerprintKey: Buffer
  keys: Map<string, Buffer>
}

export class SensitiveDataConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SensitiveDataConfigurationError'
  }
}

export function readSensitiveDataKeyring(
  environment: Record<string, string | undefined> = process.env,
): SensitiveDataKeyring {
  const activeKeyId = environment.SENSITIVE_DATA_ACTIVE_KEY_ID?.trim()
  const serializedKeys = environment.SENSITIVE_DATA_ENCRYPTION_KEYS?.trim()
  const serializedFingerprintKey = environment.SENSITIVE_DATA_FINGERPRINT_KEY?.trim()
  if (!activeKeyId || !serializedKeys || !serializedFingerprintKey) {
    throw new SensitiveDataConfigurationError(
      'Sensitive-data encryption is not configured. Set the active key ID, encryption key ring and fingerprint key.',
    )
  }

  const keys = new Map<string, Buffer>()
  for (const entry of serializedKeys.split(',')) {
    const separator = entry.indexOf(':')
    if (separator <= 0) throw new SensitiveDataConfigurationError('Invalid sensitive-data key entry.')
    const id = entry.slice(0, separator).trim()
    const encodedKey = entry.slice(separator + 1).trim()
    if (!/^[a-zA-Z0-9._-]{1,64}$/.test(id) || keys.has(id)) {
      throw new SensitiveDataConfigurationError('Sensitive-data key IDs must be unique and URL-safe.')
    }
    const key = Buffer.from(encodedKey, 'base64')
    if (key.length !== KEY_BYTES || key.toString('base64') !== encodedKey) {
      throw new SensitiveDataConfigurationError('Every sensitive-data key must be exactly 32 base64-encoded bytes.')
    }
    keys.set(id, key)
  }
  if (!keys.has(activeKeyId)) {
    throw new SensitiveDataConfigurationError('The active sensitive-data key ID is not present in the key ring.')
  }
  const fingerprintKey = Buffer.from(serializedFingerprintKey, 'base64')
  if (fingerprintKey.length !== KEY_BYTES || fingerprintKey.toString('base64') !== serializedFingerprintKey) {
    throw new SensitiveDataConfigurationError('The sensitive-data fingerprint key must be exactly 32 base64-encoded bytes.')
  }
  return { activeKeyId, fingerprintKey, keys }
}

export function encryptSensitiveBytes(
  plaintext: Uint8Array,
  keyring: SensitiveDataKeyring,
  context: string,
): EncryptedValue {
  const key = keyring.keys.get(keyring.activeKeyId)
  if (!key) throw new SensitiveDataConfigurationError('The active encryption key is unavailable.')
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES })
  cipher.setAAD(Buffer.from(context, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    keyId: keyring.activeKeyId,
  }
}

export function decryptSensitiveBytes(
  value: EncryptedValue,
  keyring: SensitiveDataKeyring,
  context: string,
): Buffer {
  const key = keyring.keys.get(value.keyId)
  if (!key) throw new SensitiveDataConfigurationError(`Encryption key ${value.keyId} is unavailable.`)
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, 'base64'), {
    authTagLength: AUTH_TAG_BYTES,
  })
  decipher.setAAD(Buffer.from(context, 'utf8'))
  decipher.setAuthTag(Buffer.from(value.authTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ])
}

export function sensitiveFingerprint(
  value: string,
  keyring: SensitiveDataKeyring,
  purpose: string,
): string {
  return createHmac('sha256', keyring.fingerprintKey).update(`${purpose}\0${value}`).digest('hex')
}
