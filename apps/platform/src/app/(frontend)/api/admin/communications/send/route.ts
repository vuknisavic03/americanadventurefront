import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  sendBatchCommunicationSchema,
  sendSingleCommunicationSchema,
} from '@/modules/admin-communications/schema.ts'
import {
  sendBatchCandidateCommunication,
  sendCandidateCommunication,
} from '@/modules/admin-communications/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
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

    const rawBody = await request.text()
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return json({ message: 'Neispravan JSON format tela zahteva.' }, 400)
    }

    if (typeof body !== 'object' || body === null) {
      return json({ message: 'Telo zahteva mora biti objekat.' }, 400)
    }

    const isBatch = 'candidateProcessIds' in body || 'filters' in body

    if (isBatch) {
      const parsed = sendBatchCommunicationSchema.safeParse(body)
      if (!parsed.success) {
        return json(
          {
            errors: parsed.error.issues.map((i) => ({ message: i.message, path: i.path })),
            message: 'Neispravni parametri za grupno slanje.',
          },
          400,
        )
      }

      const result = await sendBatchCandidateCommunication({
        adminId: authentication.user.id,
        data: parsed.data,
        payload,
      })

      return json(result, 200)
    }

    const parsed = sendSingleCommunicationSchema.safeParse(body)
    if (!parsed.success) {
      return json(
        {
          errors: parsed.error.issues.map((i) => ({ message: i.message, path: i.path })),
          message: 'Neispravni parametri za slanje poruke kandidatu.',
        },
        400,
      )
    }

    const result = await sendCandidateCommunication({
      adminId: authentication.user.id,
      data: parsed.data,
      payload,
    })

    return json(result, 200)
  } catch (error) {
    console.error('Failed to send communication:', error)
    const message = error instanceof Error ? error.message : 'Greška pri slanju poruke.'
    return json({ message }, 500)
  }
}
