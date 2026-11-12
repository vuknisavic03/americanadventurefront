import { createHash } from 'node:crypto'
import { z } from 'zod'

export const programApplicationFieldTypes = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE'] as const

export type ProgramApplicationFieldType = (typeof programApplicationFieldTypes)[number]

export type ProgramApplicationFieldDefinition = {
  fieldType: ProgramApplicationFieldType
  helpText?: string
  key: string
  label: string
  maxLength?: number
  required: boolean
}

export type ProgramApplicationSchemaSnapshot = {
  fields: ProgramApplicationFieldDefinition[]
  instructions?: string
  name: string
  programCode: 'SWT'
  version: number
}

const keyPattern = /^[a-z][a-zA-Z0-9]{1,63}$/

const reservedKeys = new Set(['__proto__', 'constructor', 'prototype'])
const fieldDefinitionSchema = z.object({
  fieldType: z.enum(programApplicationFieldTypes),
  helpText: z.string().trim().max(500).nullish(),
  key: z.string().trim().regex(keyPattern),
  label: z.string().trim().min(2).max(160),
  maxLength: z.number().int().min(1).max(5_000).nullish(),
  required: z.boolean().default(false),
})

export const programApplicationMutationSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  expectedRevision: z.number().int().min(1),
})

export type ProgramApplicationMutation = z.infer<typeof programApplicationMutationSchema>

export function normalizeTemplateFields(value: unknown): ProgramApplicationFieldDefinition[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new Error('Šablon mora imati između 1 i 40 polja.')
  }

  const fields = value.map((item) => {
    const parsed = fieldDefinitionSchema.safeParse(item)
    if (!parsed.success) throw new Error('Jedno ili više polja šablona nije ispravno definisano.')
    if (reservedKeys.has(parsed.data.key)) throw new Error('Ključ polja šablona nije dozvoljen.')
    const defaultMaximum = parsed.data.fieldType === 'TEXTAREA' ? 5_000 : 500
    return {
      fieldType: parsed.data.fieldType,
      helpText: parsed.data.helpText || undefined,
      key: parsed.data.key,
      label: parsed.data.label,
      maxLength: ['TEXT', 'TEXTAREA'].includes(parsed.data.fieldType)
        ? (parsed.data.maxLength ?? defaultMaximum)
        : undefined,
      required: parsed.data.required,
    }
  })

  const keys = new Set(fields.map((field) => field.key))
  if (keys.size !== fields.length) throw new Error('Svako polje šablona mora imati jedinstveni ključ.')
  return fields
}

export function applicationSchemaChecksum(snapshot: ProgramApplicationSchemaSnapshot) {
  const canonicalSnapshot: ProgramApplicationSchemaSnapshot = {
    fields: normalizeTemplateFields(snapshot.fields),
    instructions: snapshot.instructions?.trim() || undefined,
    name: snapshot.name,
    programCode: snapshot.programCode,
    version: snapshot.version,
  }
  return createHash('sha256').update(JSON.stringify(canonicalSnapshot)).digest('hex')
}

function validCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function hasAnswer(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

export function validateProgramApplicationAnswers({
  answers,
  fields,
  requireComplete,
}: {
  answers: Record<string, unknown>
  fields: ProgramApplicationFieldDefinition[]
  requireComplete: boolean
}) {
  const allowedKeys = new Set(fields.map((field) => field.key))
  const unknownKeys = Object.keys(answers).filter((key) => !allowedKeys.has(key))
  if (unknownKeys.length > 0) throw new Error('Prijava sadrži polja koja ne pripadaju ovom šablonu.')

  const fieldErrors: Record<string, string> = {}
  const normalizedAnswers: Record<string, number | string> = {}

  for (const field of fields) {
    const rawValue = answers[field.key]
    if (!hasAnswer(rawValue)) {
      if (requireComplete && field.required) fieldErrors[field.key] = 'Ovo polje je obavezno.'
      continue
    }

    if (field.fieldType === 'NUMBER') {
      const value = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(',', '.'))
      if (!Number.isFinite(value)) fieldErrors[field.key] = 'Unesite ispravan broj.'
      else normalizedAnswers[field.key] = value
      continue
    }

    if (typeof rawValue !== 'string') {
      fieldErrors[field.key] = 'Uneta vrednost nije ispravna.'
      continue
    }
    const value = rawValue.trim()
    if (field.fieldType === 'DATE') {
      if (!validCalendarDate(value)) fieldErrors[field.key] = 'Unesite ispravan datum.'
      else normalizedAnswers[field.key] = value
      continue
    }

    if (value.length > (field.maxLength ?? 500)) {
      fieldErrors[field.key] = `Dozvoljeno je najviše ${field.maxLength ?? 500} znakova.`
    } else {
      normalizedAnswers[field.key] = value
    }
  }

  const requiredFields = fields.filter((field) => field.required)
  const completedRequired = requiredFields.filter((field) => hasAnswer(normalizedAnswers[field.key])).length
  const completionPercent = requiredFields.length === 0
    ? 100
    : Math.round((completedRequired / requiredFields.length) * 100)

  return { completionPercent, fieldErrors, normalizedAnswers }
}
