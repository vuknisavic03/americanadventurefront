import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { adminCandidateQuerySchema } from '@/modules/admin-candidates/schema.ts'
import { listCandidatesOverview } from '@/modules/admin-candidates/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    // Provera da li je ulogovan admin
    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = adminCandidateQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return json({ message: 'Neispravni parametri pretrage i filtriranja.' }, 400)
    }

    const result = await listCandidatesOverview({
      filters: {
        currentStep: parsed.data.currentStep,
        fields: parsed.data.fields,
        hasJobOffer: parsed.data.hasJobOffer,
        limit: parsed.data.limit,
        page: parsed.data.page,
        passportNumber: parsed.data.passportNumber,
        processStatus: parsed.data.processStatus,
        programCode: parsed.data.programCode,
        search: parsed.data.search || parsed.data.q,
        withoutJobOffer: parsed.data.withoutJobOffer,
      },
      payload,
    })

    return json(result, 200)
  } catch (error) {
    console.error('Failed to get candidate overview:', error)
    return json({ message: 'Greška pri učitavanju pregleda kandidata.' }, 500)
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return json({ message: 'Zahtev nije dozvoljen.' }, 403)
    }

    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    let data: unknown
    try {
      const rawBody = await request.text()
      data = JSON.parse(rawBody)
    } catch {
      return json({ message: 'Neispravan format zahteva.' }, 400)
    }

    const created = await payload.create({
      collection: 'candidate-applications',
      data: data as never,
    })

    return json(
      {
        candidate: created,
        message: 'Kandidat uspešno kreiran.',
      },
      201,
    )
  } catch (error) {
    console.error('Failed to create candidate application:', error)
    return json({ message: 'Greška pri kreiranju kandidata.' }, 500)
  }
}
