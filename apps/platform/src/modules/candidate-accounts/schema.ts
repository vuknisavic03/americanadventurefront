import { z } from 'zod'

const email = z.string().trim().max(254).pipe(z.email('Email adresa nije ispravna.'))
const password = z
  .string()
  .min(12, 'Lozinka mora imati najmanje 12 znakova.')
  .max(128, 'Lozinka može imati najviše 128 znakova.')

export const candidateActivationSchema = z
  .object({
    citizenship: z
      .string()
      .trim()
      .min(2, 'Državljanstvo je obavezno polje.')
      .max(100, 'Uneta vrednost je predugačka.'),
    confirmPassword: password,
    password,
    token: z.string().trim().min(1).max(2_048),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lozinke se ne podudaraju.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({ email }).strict()

export function normalizeCandidateEmail(value: string) {
  return value.trim().toLocaleLowerCase('sr-Latn')
}

export function candidateAccountValidationErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0]?.toString() ?? 'form'
    errors[field] ??= issue.message
    return errors
  }, {})
}

