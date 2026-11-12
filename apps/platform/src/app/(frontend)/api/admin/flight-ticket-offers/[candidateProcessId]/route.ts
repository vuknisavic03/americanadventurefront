import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import {
  FlightTicketOfferError,
  flightTicketOffersForAdmin,
  publishFlightTicketOffer,
  withdrawFlightTicketOffer,
} from '@/modules/flight-ticket-offers/service.ts'
import { isSameOriginRequest } from '@/modules/security/sameOrigin.ts'

const optionSchema = z.object({
  airlineName: z.string().trim().min(2).max(160),
  baggageDescription: z.string().trim().min(2).max(500),
  currency: z.enum(['EUR', 'RSD', 'USD']),
  fareConditions: z.string().trim().min(2).max(1_000).optional(),
  outboundArrivalAt: z.iso.datetime(),
  outboundDepartureAt: z.iso.datetime(),
  outboundRoute: z.string().trim().min(3).max(300),
  returnArrivalAt: z.iso.datetime(),
  returnDepartureAt: z.iso.datetime(),
  returnRoute: z.string().trim().min(3).max(300),
  totalPriceMinor: z.number().int().positive(),
}).strict()

const publishSchema = z.object({
  action: z.literal('PUBLISH'),
  candidateInstructions: z.string().trim().min(2).max(2_000),
  internalNotes: z.string().trim().min(2).max(2_000).optional(),
  options: z.array(optionSchema).min(1).max(5),
  responseDueAt: z.iso.datetime().optional(),
}).strict()

const withdrawSchema = z.object({
  action: z.literal('WITHDRAW'),
  expectedStatusVersion: z.number().int().positive(),
  flightTicketOfferId: z.number().int().positive(),
  reason: z.string().trim().min(5).max(1_000),
}).strict()

const requestSchema = z.discriminatedUnion('action', [publishSchema, withdrawSchema])

function response(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

async function administrator() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') return { payload }
  return { administratorId: authentication.user.id, payload }
}

function processId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

export async function GET(_request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = processId((await params).candidateProcessId)
  if (!candidateProcessId) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  try {
    return response(await flightTicketOffersForAdmin({ candidateProcessId, payload: authentication.payload }))
  } catch (error) {
    if (error instanceof FlightTicketOfferError) return response({ message: error.message }, error.status)
    console.error('Flight ticket offer state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Ponude avionskih karata trenutno nisu dostupne.' }, 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  if (!isSameOriginRequest(request)) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = processId((await params).candidateProcessId)
  if (!candidateProcessId) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  const parsed = requestSchema.safeParse(await request.json().catch(() => undefined))
  if (!parsed.success) return response({ message: 'Proverite podatke ponude i pokušajte ponovo.' }, 400)
  try {
    if (parsed.data.action === 'PUBLISH') {
      const offer = await publishFlightTicketOffer({
        administratorId: authentication.administratorId,
        candidateProcessId,
        input: {
          candidateInstructions: parsed.data.candidateInstructions,
          internalNotes: parsed.data.internalNotes,
          options: parsed.data.options,
          responseDueAt: parsed.data.responseDueAt,
        },
        now: new Date(),
        payload: authentication.payload,
      })
      return response({ message: 'Ponuda je objavljena kandidatu i email obaveštenje je stavljeno u red.', offer }, 201)
    }
    const offer = await withdrawFlightTicketOffer({
      administratorId: authentication.administratorId,
      candidateProcessId,
      expectedStatusVersion: parsed.data.expectedStatusVersion,
      flightTicketOfferId: parsed.data.flightTicketOfferId,
      now: new Date(),
      payload: authentication.payload,
      reason: parsed.data.reason,
    })
    return response({ message: 'Ponuda je povučena.', offer })
  } catch (error) {
    if (error instanceof FlightTicketOfferError) return response({ message: error.message }, error.status)
    console.error('Flight ticket offer mutation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Obrada ponude avionske karte trenutno nije dostupna.' }, 500)
  }
}
