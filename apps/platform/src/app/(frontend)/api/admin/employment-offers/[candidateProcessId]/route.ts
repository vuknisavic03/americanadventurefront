import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { confirmCandidateJobOption, EmploymentOfferError, employmentOffersForAdmin, withdrawEmploymentOffer } from '@/modules/employment-offers/service.ts'
import { CandidateJobOptionError, jobOptionsForAdmin, sendCandidateJobShortlist, withdrawCandidateJobOption } from '@/modules/job-options/service.ts'

const sendSchema = z.object({ action: z.literal('SEND_SHORTLIST'), jobOpeningIds: z.array(z.number().int().positive()).min(1).max(20) }).strict()
const confirmSchema = z.object({ action: z.literal('CONFIRM_OPTION'), candidateJobOptionId: z.number().int().positive(), expectedStatusVersion: z.number().int().positive(), responseDueAt: z.iso.datetime().optional() }).strict()
const withdrawOptionSchema = z.object({ action: z.literal('WITHDRAW_OPTION'), candidateJobOptionId: z.number().int().positive(), expectedStatusVersion: z.number().int().positive(), reason: z.string().trim().min(5).max(1_000) }).strict()
const withdrawOfferSchema = z.object({ action: z.literal('WITHDRAW_OFFER'), employmentOfferId: z.number().int().positive(), expectedStatusVersion: z.number().int().positive(), reason: z.string().trim().min(5).max(1_000) }).strict()
const requestSchema = z.discriminatedUnion('action', [sendSchema, confirmSchema, withdrawOptionSchema, withdrawOfferSchema])

function response(body: unknown, status = 200) { return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status }) }

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
    const [jobState, offerState] = await Promise.all([
      jobOptionsForAdmin({ candidateProcessId, payload: authentication.payload }),
      employmentOffersForAdmin({ candidateProcessId, payload: authentication.payload }),
    ])
    return response({ ...jobState, offers: offerState.offers })
  } catch (error) {
    if (error instanceof CandidateJobOptionError || error instanceof EmploymentOfferError) return response({ message: error.message }, error.status)
    console.error('Candidate job option state failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Katalog i opcije poslova trenutno nisu dostupni.' }, 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ candidateProcessId: string }> }) {
  const requestOrigin = request.headers.get('origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return response({ message: 'Zahtev nije dozvoljen.' }, 403)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ message: 'Zahtev mora biti poslat kao JSON.' }, 415)
  const authentication = await administrator()
  if (!authentication.administratorId) return response({ message: 'Administratorska sesija je istekla.' }, 401)
  const candidateProcessId = processId((await params).candidateProcessId)
  if (!candidateProcessId) return response({ message: 'Proces kandidata nije pronađen.' }, 404)
  const parsed = requestSchema.safeParse(await request.json().catch(() => undefined))
  if (!parsed.success) return response({ message: 'Proverite izabrane poslove i podatke zahteva.' }, 400)
  try {
    if (parsed.data.action === 'SEND_SHORTLIST') {
      const result = await sendCandidateJobShortlist({ administratorId: authentication.administratorId, candidateProcessId, jobOpeningIds: parsed.data.jobOpeningIds, now: new Date(), payload: authentication.payload })
      return response({ ...result, message: 'Izabrane opcije su poslate kandidatu i obaveštenje je stavljeno u red.' }, 201)
    }
    if (parsed.data.action === 'CONFIRM_OPTION') {
      const offer = await confirmCandidateJobOption({ administratorId: authentication.administratorId, candidateJobOptionId: parsed.data.candidateJobOptionId, candidateProcessId, expectedStatusVersion: parsed.data.expectedStatusVersion, now: new Date(), payload: authentication.payload, responseDueAt: parsed.data.responseDueAt })
      return response({ message: 'Posao je potvrđen i zvanična ponuda je poslata kandidatu.', offer }, 201)
    }
    if (parsed.data.action === 'WITHDRAW_OPTION') {
      const option = await withdrawCandidateJobOption({ administratorId: authentication.administratorId, candidateJobOptionId: parsed.data.candidateJobOptionId, candidateProcessId, expectedStatusVersion: parsed.data.expectedStatusVersion, now: new Date(), payload: authentication.payload, reason: parsed.data.reason })
      return response({ message: 'Opcija posla je povučena iz kandidatske liste.', option })
    }
    const offer = await withdrawEmploymentOffer({ administratorId: authentication.administratorId, candidateProcessId, employmentOfferId: parsed.data.employmentOfferId, expectedStatusVersion: parsed.data.expectedStatusVersion, now: new Date(), payload: authentication.payload, reason: parsed.data.reason })
    return response({ message: 'Potvrđena radna ponuda je povučena.', offer })
  } catch (error) {
    if (error instanceof CandidateJobOptionError || error instanceof EmploymentOfferError) return response({ message: error.message }, error.status)
    console.error('Candidate job option mutation failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return response({ message: 'Obrada poslova trenutno nije dostupna.' }, 500)
  }
}
