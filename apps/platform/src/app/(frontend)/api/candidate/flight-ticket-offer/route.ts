import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  FlightTicketOfferError,
  flightTicketOffersForCandidate,
  respondToFlightTicketOffer,
} from '@/modules/flight-ticket-offers/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

const responseSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
  confirmed: z.literal(true),
  expectedSnapshotChecksum: z.string().regex(/^[a-f0-9]{64}$/u),
  flightTicketOfferId: z.number().int().positive(),
  rejectionReason: z.string().trim().min(3).max(500).optional(),
  selectedOptionCode: z.string().trim().min(1).max(80).optional(),
}).strict().superRefine((value, context) => {
  if (value.action === 'ACCEPT' && !value.selectedOptionCode) context.addIssue({ code: 'custom', message: 'Izaberite opciju leta.', path: ['selectedOptionCode'] })
})

function response(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

async function candidate() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') return { payload }
  return { accountId: authentication.user.id, payload }
}

export async function GET() {
  const authentication = await candidate()
  if (!authentication.accountId) return response({ message: 'Prijavite se da biste pregledali ponudu.' }, 401)
  try {
    return response(await flightTicketOffersForCandidate({ accountId: authentication.accountId, payload: authentication.payload }))
  } catch (error) {
    if (error instanceof FlightTicketOfferError) return response({ message: error.message }, error.status)
    console.error('Candidate flight ticket offer state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Ponuda avionske karte trenutno nije dostupna.' }, 500)
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const authentication = await candidate()
  if (!authentication.accountId) return response({ message: 'Prijavite se da biste odgovorili na ponudu.' }, 401)
  const parsed = responseSchema.safeParse(await request.json().catch(() => undefined))
  if (!parsed.success) return response({ message: 'Proverite odgovor i izabranu opciju leta.' }, 400)
  try {
    const result = await respondToFlightTicketOffer({
      accountId: authentication.accountId,
      action: parsed.data.action,
      expectedSnapshotChecksum: parsed.data.expectedSnapshotChecksum,
      flightTicketOfferId: parsed.data.flightTicketOfferId,
      now: new Date(),
      payload: authentication.payload,
      rejectionReason: parsed.data.rejectionReason,
      selectedOptionCode: parsed.data.selectedOptionCode,
    })
    const accepted = parsed.data.action === 'ACCEPT'
    return response({
      message: result.created
        ? accepted ? 'Izabrana opcija leta je potvrđena.' : 'Ponuda je odbijena.'
        : accepted ? 'Ova opcija leta je već bila potvrđena.' : 'Ponuda je već bila odbijena.',
      responseId: result.response.id,
    }, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof FlightTicketOfferError) return response({ message: error.message }, error.status)
    console.error('Candidate flight ticket offer response failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Odgovor na ponudu trenutno nije dostupan.' }, 500)
  }
}
