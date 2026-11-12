import { z } from 'zod'

export const candidateProfileUpdateSchema = z
  .object({
    citizenship: z
      .string()
      .trim()
      .min(2, 'Državljanstvo je obavezno polje.')
      .max(100, 'Državljanstvo može imati najviše 100 znakova.'),
    phone: z
      .string()
      .trim()
      .min(6, 'Broj telefona je prekratak.')
      .max(30, 'Broj telefona može imati najviše 30 znakova.')
      .regex(/^[+0-9()/.\s-]+$/, 'Broj telefona sadrži nedozvoljene znakove.'),
    residentialAddress: z
      .string()
      .trim()
      .min(5, 'Adresa je prekratka.')
      .max(300, 'Adresa može imati najviše 300 znakova.'),
  })
  .strict()

export type CandidateProfileUpdate = z.infer<typeof candidateProfileUpdateSchema>

export function candidateProfileValidationErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0]?.toString() ?? 'form'
    errors[field] ??= issue.message
    return errors
  }, {})
}
