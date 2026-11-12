import { z } from 'zod'

import { studyInterruptionOptions, studyYearOptions } from './constants.ts'

const studyYears = studyYearOptions.map(({ value }) => value)
const interruptionStatuses = studyInterruptionOptions.map(({ value }) => value)

const requiredText = (label: string, maximumLength: number) =>
  z.string().trim().min(1, `${label} je obavezno polje.`).max(maximumLength, `${label} je predugačko.`)

const optionalText = (maximumLength: number) =>
  z
    .string()
    .trim()
    .max(maximumLength, 'Uneta vrednost je predugačka.')
    .optional()
    .transform((value) => value || undefined)

export function createPreApplicationSchema(today = new Date()) {
  const latestDate = today.toISOString().slice(0, 10)

  return z
    .object({
      applicantNote: optionalText(2_000),
      dateOfBirth: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum rođenja nije ispravan.')
        .refine((value) => {
          const parsed = new Date(`${value}T00:00:00.000Z`)
          return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
        }, 'Datum rođenja nije ispravan.')
        .refine((value) => value >= '1900-01-01' && value <= latestDate, 'Datum rođenja nije ispravan.'),
      email: requiredText('Email adresa', 254).pipe(z.email('Email adresa nije ispravna.')),
      espbPoints: z
        .number({ error: 'Broj ESPB bodova mora biti broj.' })
        .int('Broj ESPB bodova mora biti ceo broj.')
        .nonnegative('Broj ESPB bodova ne može biti negativan.'),
      facultyName: requiredText('Naziv fakulteta', 200),
      firstName: requiredText('Ime', 100),
      lastName: requiredText('Prezime', 100),
      newsletterConsent: z.boolean().optional().default(false),
      phone: requiredText('Broj telefona', 40).refine((value) => {
        const digits = value.replace(/\D/g, '')
        return digits.length >= 7 && digits.length <= 15
      }, 'Broj telefona nije ispravan.'),
      privacyConsent: z.literal(true, { error: 'Saglasnost sa Politikom privatnosti je obavezna.' }),
      residentialAddress: requiredText('Adresa prebivališta', 300),
      studyCity: requiredText('Grad studiranja', 100),
      studyInterruptionExplanation: optionalText(500),
      studyInterruptionStatus: z.enum(interruptionStatuses),
      currentStudyYear: z.enum(studyYears),
      website: z.string().max(200).optional().default(''),
    })
    .strict()
    .superRefine((data, context) => {
      if (data.studyInterruptionStatus === 'OTHER' && !data.studyInterruptionExplanation) {
        context.addIssue({
          code: 'custom',
          message: 'Kratko objašnjenje je obavezno kada izaberete „Drugo”.',
          path: ['studyInterruptionExplanation'],
        })
      }
    })
}

export type PreApplicationInput = z.infer<ReturnType<typeof createPreApplicationSchema>>

export type NormalizedPreApplicationInput = PreApplicationInput & {
  emailNormalized: string
  firstNameNormalized: string
  lastNameNormalized: string
  phoneNormalized: string
}

export function normalizePreApplicationInput(input: PreApplicationInput): NormalizedPreApplicationInput {
  const phoneDigits = input.phone.replace(/\D/g, '')

  return {
    ...input,
    emailNormalized: input.email.toLocaleLowerCase('sr-Latn'),
    firstNameNormalized: input.firstName.toLocaleLowerCase('sr-Latn'),
    lastNameNormalized: input.lastName.toLocaleLowerCase('sr-Latn'),
    phoneNormalized: input.phone.trim().startsWith('+') ? `+${phoneDigits}` : phoneDigits,
  }
}

export function validationErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0]?.toString() ?? 'form'
    errors[field] ??= issue.message
    return errors
  }, {})
}
