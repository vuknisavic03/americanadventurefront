import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { generateCandidateContract, GeneratedContractError } from '@/modules/generated-contracts/service.ts'

const schema = z.object({ sensitiveProfileId: z.number().int().positive() }).strict()

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je istekla.' }, { status: 401 })
  }
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ message: 'Zahtev nije ispravan.' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ message: 'Zahtev nije ispravan.' }, { status: 400 })

  try {
    const result = await generateCandidateContract({
      administratorId: authentication.user.id,
      now: new Date(),
      payload,
      sensitiveProfileId: parsed.data.sensitiveProfileId,
    })
    return Response.json({
      contractId: result.contract.id,
      created: result.created,
      message: result.created ? 'Ugovor je bezbedno generisan.' : 'Ugovor za ovaj izbor već postoji; vraćena je ista verzija.',
    }, { headers: { 'Cache-Control': 'no-store' }, status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof GeneratedContractError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Contract generation failed.', error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { name: 'UNKNOWN_ERROR' })
    return Response.json({ message: 'Generisanje ugovora trenutno nije dostupno.' }, { status: 500 })
  }
}

