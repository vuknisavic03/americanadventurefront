import { createHash } from 'node:crypto'

export const allowedPassportAuthorizationPlaceholders = new Set([
  'authorization.date',
  'authorization.number',
  'candidate.address',
  'candidate.fullName',
  'candidate.personalId',
])

export function validatePassportAuthorizationTemplate(body: string) {
  const placeholders = [...body.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map((match) => match[1].trim())
  const unsupported = [...new Set(placeholders.filter((value) => !allowedPassportAuthorizationPlaceholders.has(value)))]
  return unsupported.length ? `Nepodržana polja u šablonu: ${unsupported.join(', ')}.` : undefined
}

export function passportAuthorizationTemplateChecksum(body: string) {
  return createHash('sha256').update(body, 'utf8').digest('hex')
}

export function renderPassportAuthorizationTemplate(body: string, values: Record<string, string>) {
  return body.replace(/{{\s*([^{}]+?)\s*}}/g, (_match, placeholder: string) => {
    const normalized = placeholder.trim()
    if (!allowedPassportAuthorizationPlaceholders.has(normalized) || values[normalized] === undefined) {
      throw new Error(`Nedostaje vrednost za šablon: ${normalized}.`)
    }
    return values[normalized]
  })
}
