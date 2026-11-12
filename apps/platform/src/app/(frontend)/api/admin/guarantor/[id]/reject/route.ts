import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  GuarantorServiceError,
  rejectGuarantor,
} from '@/modules/guarantor/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

const rejectGuarantorSchema = z.object({
  reason: z.string().trim().min(5, 'Obrazloženje mora imati najmanje 5 karaktera.'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Niste autorizovani kao administrator.' }, 401)
  }

  const { id } = await params
  const guarantorId = parseInt(id, 10)
  if (Number.isNaN(guarantorId) || guarantorId <= 0) {
    return json({ message: 'Nevažeći ID jemca.' }, 400)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ message: 'Neispravno formatiran zahtev.' }, 400)
  }

  const parsed = rejectGuarantorSchema.safeParse(body)
  if (!parsed.success) {
    return json({ message: parsed.error.issues[0]?.message ?? 'Neispravno obrazloženje.' }, 400)
  }

  try {
    const rejected = await rejectGuarantor({
      administratorId: authentication.user.id,
      guarantorId,
      now: new Date(),
      payload,
      reason: parsed.data.reason,
    })

    return json({
      guarantor: rejected,
      message: 'Jemac je odbijen uz navedeni razlog.',
    })
  } catch (error) {
    if (error instanceof GuarantorServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Error rejecting guarantor:', error)
    return json({ message: 'Došlo je do greške prilikom odbijanja jemca.' }, 500)
  }
}
