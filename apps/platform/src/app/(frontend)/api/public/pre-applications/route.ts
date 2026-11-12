import { createHmac, randomUUID } from 'node:crypto'

import { readPlatformEnvironment } from '@/config/environment.ts'
import {
  createPreApplicationSchema,
  normalizePreApplicationInput,
  validationErrors,
} from '@/modules/pre-applications/schema.ts'
import { submitPreApplication } from '@/modules/pre-applications/submitPreApplication.ts'
import { getPayloadIfAvailable, savePortalCandidate } from '@/modules/portal-sync/localStore.ts'

const MAXIMUM_BODY_SIZE = 32 * 1_024
const MAXIMUM_IDEMPOTENCY_KEY_LENGTH = 200

function jsonResponse(body: unknown, status: number, headers?: HeadersInit) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store', ...headers },
    status,
  })
}

function hashValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export async function POST(request: Request) {
  const environment = readPlatformEnvironment()
  const declaredSize = Number(request.headers.get('content-length') ?? 0)

  if (declaredSize > MAXIMUM_BODY_SIZE) {
    return jsonResponse({ message: 'Prijava je prevelika.' }, 413)
  }

  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, 'utf8') > MAXIMUM_BODY_SIZE) {
    return jsonResponse({ message: 'Prijava je prevelika.' }, 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ message: 'Podaci prijave nisu ispravni.' }, 400)
  }

  const parsed = createPreApplicationSchema().safeParse(body)
  if (!parsed.success) {
    return jsonResponse(
      {
        fieldErrors: validationErrors(parsed.error),
        message: 'Proverite označena polja i pokušajte ponovo.',
      },
      400,
    )
  }

  if (parsed.data.website) {
    return jsonResponse({ reference: randomUUID(), status: 'received' }, 202)
  }

  const idempotencyKey = request.headers.get('idempotency-key')?.trim() || randomUUID()
  if (idempotencyKey.length > MAXIMUM_IDEMPOTENCY_KEY_LENGTH) {
    return jsonResponse({ message: 'Zahtev nije ispravan.' }, 400)
  }

  try {
    const normalized = normalizePreApplicationInput(parsed.data)
    await savePortalCandidate({
      email: normalized.emailNormalized,
      faculty: normalized.facultyName,
      firstName: normalized.firstName,
      isNew: true,
      lastName: normalized.lastName,
      notes: normalized.applicantNote || `Fakultet: ${normalized.facultyName} (${normalized.studyCity})`,
      phone: normalized.phone,
      progress: 10,
      status: 'applying',
    })

    const payload = await getPayloadIfAvailable()
    if (!payload) {
      return jsonResponse({ reference: randomUUID(), status: 'created' }, 201)
    }

    const result = await submitPreApplication({
      correlationId: randomUUID(),
      idempotencyKeyHash: hashValue(idempotencyKey, environment.payloadSecret),
      input: normalized,
      now: new Date(),
      payload,
    })

    return jsonResponse(
      { reference: result.reference, status: result.created ? 'created' : 'already_received' },
      result.created ? 201 : 200,
    )
  } catch (error) {
    console.error('Pre-application submission failed.', error)
    return jsonResponse(
      { message: 'Prijava trenutno ne može da se sačuva. Molimo pokušajte ponovo.' },
      500,
    )
  }
}
