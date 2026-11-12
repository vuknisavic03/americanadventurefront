import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  GuarantorServiceError,
  getGuarantorForCandidate,
  submitGuarantorData,
} from '@/modules/guarantor/service.ts'
import {
  guarantorEmploymentStatusKeys,
  guarantorRelationshipKeys,
} from '@/modules/guarantor/types.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const submitGuarantorSchema = z.object({
  email: z.string().trim().email(),
  employerName: z.string().trim().min(2),
  employmentStatus: z.enum(guarantorEmploymentStatusKeys),
  fullName: z.string().trim().min(3),
  idCardIssuer: z.string().trim().min(2),
  idCardNumber: z.string().trim().min(6),
  jobTitle: z.string().trim().min(2),
  jmbg: z.string().trim().length(13),
  monthlyIncomeRsd: z.number().int().positive(),
  phone: z.string().trim().min(6),
  promissoryNotesCount: z.number().int().min(2).max(10).optional(),
  relationship: z.enum(guarantorRelationshipKeys),
  residentialAddress: z.string().trim().min(5),
})

export async function GET() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  try {
    const guarantor = await getGuarantorForCandidate({
      candidateAccountId: authentication.user.id,
      payload,
    })
    return json({ guarantor })
  } catch (error) {
    console.error('Error fetching guarantor:', error)
    return json({ message: 'Greška prilikom dohvatanja podataka jemca.' }, 500)
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Neispravno formatiran zahtev.' }, 400)
  }

  const parsed = submitGuarantorSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return json(
      {
        errors: parsed.error.issues,
        message: firstIssue?.message ?? 'Podaci jemca nisu ispravno popunjeni.',
      },
      400,
    )
  }

  try {
    const result = await submitGuarantorData({
      candidateAccountId: authentication.user.id,
      input: parsed.data,
      now: new Date(),
      payload,
    })

    return json(
      {
        guarantor: result,
        message: 'Podaci o jemcu su uspešno sačuvani i poslati na pregled.',
      },
      201,
    )
  } catch (error) {
    if (error instanceof GuarantorServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Error submitting guarantor data:', error)
    return json({ message: 'Došlo je do greške prilikom čuvanja podataka jemca.' }, 500)
  }
}
