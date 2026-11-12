import type { PayloadHandler } from 'payload'

import { processingCommandSchema } from './processingSchema.ts'
import {
  getPreApplicationProcessingState,
  ProcessingCommandError,
  processPreApplication,
} from './processPreApplication.ts'
import { WorkflowRuleError } from './workflow.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

function applicationIdFrom(req: Parameters<PayloadHandler>[0]) {
  const rawId = req.routeParams?.id
  const id = typeof rawId === 'string' ? Number(rawId) : Number.NaN
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

function errorResponse(error: unknown) {
  if (error instanceof WorkflowRuleError) {
    return json({ code: error.code, message: error.message }, 409)
  }
  if (error instanceof ProcessingCommandError) {
    return json(
      { code: error.code, message: error.message },
      error.code === 'NOT_FOUND' ? 404 : 503,
    )
  }

  return json(
    {
      code: 'UNEXPECTED_ERROR',
      message: 'Došlo je do neočekivane greške. Pokušajte ponovo.',
    },
    500,
  )
}

export const getProcessingStateEndpoint: PayloadHandler = async (req) => {
  if (!req.user) {
    return json({ code: 'UNAUTHENTICATED', message: 'Prijavite se kao administrator.' }, 401)
  }

  const applicationId = applicationIdFrom(req)
  if (!applicationId) {
    return json({ code: 'INVALID_ID', message: 'Identifikator prijave nije ispravan.' }, 400)
  }

  try {
    return json(await getPreApplicationProcessingState({ applicationId, payload: req.payload }))
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Failed to load pre-application processing state.' })
    return errorResponse(error)
  }
}

export const processPreApplicationEndpoint: PayloadHandler = async (req) => {
  if (!req.user) {
    return json({ code: 'UNAUTHENTICATED', message: 'Prijavite se kao administrator.' }, 401)
  }

  const applicationId = applicationIdFrom(req)
  if (!applicationId) {
    return json({ code: 'INVALID_ID', message: 'Identifikator prijave nije ispravan.' }, 400)
  }

  let body: unknown
  try {
    if (!req.json) throw new Error('Request body reader is unavailable.')
    body = await req.json()
  } catch {
    return json({ code: 'INVALID_BODY', message: 'Podaci zahteva nisu ispravni.' }, 400)
  }

  const parsed = processingCommandSchema.safeParse(body)
  if (!parsed.success) {
    return json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Proverite unete podatke i pokušajte ponovo.',
      },
      422,
    )
  }

  try {
    await processPreApplication({
      actor: req.user,
      applicationId,
      command: parsed.data,
      now: new Date(),
      payload: req.payload,
      req,
    })

    return json(await getPreApplicationProcessingState({ applicationId, payload: req.payload }))
  } catch (error) {
    if (!(error instanceof WorkflowRuleError || error instanceof ProcessingCommandError)) {
      req.payload.logger.error({ err: error, msg: 'Failed to process pre-application.' })
    }
    return errorResponse(error)
  }
}

