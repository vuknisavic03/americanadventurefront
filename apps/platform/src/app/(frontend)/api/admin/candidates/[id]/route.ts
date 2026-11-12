import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { adminUpdateCandidateSchema } from '@/modules/admin-candidates/schema.ts'
import {
  getCandidateOverviewDetail,
  updateCandidateOverview,
} from '@/modules/admin-candidates/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    const candidateId = Number(id)
    const candidate = await getCandidateOverviewDetail({
      id: Number.isFinite(candidateId) ? candidateId : (id as unknown as number),
      payload,
    })

    if (!candidate) {
      return json({ message: 'Kandidat nije pronađen.' }, 404)
    }

    return json({ candidate }, 200)
  } catch (error) {
    console.error('Failed to get candidate detail:', error)
    return json({ message: 'Greška pri učitavanju kandidata.' }, 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSameOriginRequest(request)) {
      return json({ message: 'Zahtev nije dozvoljen.' }, 403)
    }

    const { id } = await params
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    let rawBody: unknown
    try {
      const text = await request.text()
      rawBody = JSON.parse(text)
    } catch {
      return json({ message: 'Neispravan format zahteva.' }, 400)
    }

    const parsed = adminUpdateCandidateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return json({ message: 'Neispravni podaci za ažuriranje kandidata.' }, 400)
    }

    const candidateId = Number(id)
    const updated = await updateCandidateOverview({
      adminId: authentication.user.id,
      id: Number.isFinite(candidateId) ? candidateId : (id as unknown as number),
      payload,
      updates: parsed.data,
    })

    return json(
      {
        candidate: updated,
        message: 'Podaci kandidata su uspešno ažurirani.',
      },
      200,
    )
  } catch (error) {
    console.error('Failed to update candidate application:', error)
    return json({ message: 'Greška pri izmeni podataka kandidata.' }, 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    await payload.delete({
      collection: 'candidate-applications',
      id,
    })

    return json({ message: 'Kandidat je uspešno obrisan.' }, 200)
  } catch (error) {
    console.error('Failed to delete candidate:', error)
    return json({ message: 'Greška pri brisanju kandidata.' }, 500)
  }
}
