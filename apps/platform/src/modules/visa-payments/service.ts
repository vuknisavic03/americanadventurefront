import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { PreApplication, VisaPaymentOrder } from '../../payload-types.ts'
import {
  normalizeVisaPaymentOrderTerms,
  sha256,
  validateVisaPaymentOrderTerms,
  visaPaymentOrderNumber,
  visaPaymentOrderSnapshot,
  type VisaPaymentOrderTerms,
} from './rules.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

async function lockCandidateProcess(payload: Payload, transactionID: number | string, candidateProcessId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute: (query: unknown) => Promise<unknown> }
  if (transaction) await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${candidateProcessId} FOR UPDATE`)
}

export class VisaPaymentOrderError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'VisaPaymentOrderError'
  }
}

function orderView(order: VisaPaymentOrder) {
  return {
    amountMinor: order.amountMinor,
    bankAccount: order.bankAccount,
    beneficiaryAddress: order.beneficiaryAddress ?? undefined,
    beneficiaryName: order.beneficiaryName,
    cancellationReason: order.cancellationReason ?? undefined,
    cancelledAt: order.cancelledAt ?? undefined,
    candidateInstructions: order.candidateInstructions,
    currency: order.currency,
    dueAt: order.dueAt,
    externalPaymentReference: order.externalPaymentReference ?? undefined,
    id: order.id,
    issuedAt: order.issuedAt,
    orderNumber: order.orderNumber,
    orderVersion: order.orderVersion,
    overdue: order.status === 'ISSUED' && new Date(order.dueAt) < new Date(),
    paidAt: order.paidAt ?? undefined,
    paymentModel: order.paymentModel ?? undefined,
    paymentNote: order.paymentNote ?? undefined,
    paymentPurpose: order.paymentPurpose,
    paymentReference: order.paymentReference,
    snapshotChecksum: order.snapshotChecksum,
    status: order.status,
    statusVersion: order.statusVersion,
  }
}

async function processOrders(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'visa-payment-orders',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
    sort: '-orderVersion',
    where: { candidateProcess: { equals: candidateProcessId } },
  })).docs
}

async function acceptedEmploymentExists(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'employment-offers',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { and: [{ candidateProcess: { equals: candidateProcessId } }, { status: { equals: 'ACCEPTED' } }] },
  })).docs.length > 0
}

async function createAudit({ administratorId, application, eventType, metadata, now, payload, req }: {
  administratorId: number
  application: PreApplication
  eventType: 'VISA_PAYMENT_ORDER_CANCELLED' | 'VISA_PAYMENT_ORDER_ISSUED' | 'VISA_PAYMENT_RECORDED'
  metadata: Record<string, unknown>
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: administratorId,
      actorType: 'ADMIN',
      correlationId: application.correlationId,
      eventType,
      metadata,
      newStatus: application.status,
      occurredAt: now.toISOString(),
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
    req,
  })
}

export async function visaPaymentOrdersForAdmin({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new VisaPaymentOrderError('Proces kandidata nije pronađen.', 404)
  return {
    acceptedEmployment: await acceptedEmploymentExists(payload, process.id),
    currentStep: process.currentStep,
    orders: (await processOrders(payload, process.id)).map(orderView),
    processStatus: process.processStatus,
  }
}

export async function visaPaymentOrdersForCandidate({ accountId, candidateProcessId, payload }: { accountId: number; candidateProcessId: number; payload: Payload }) {
  const orders = (await processOrders(payload, candidateProcessId)).filter((order) => relationId(order.candidateAccount) === accountId)
  return orders.map(orderView)
}

async function byIdempotencyKey(payload: Payload, idempotencyKey: string) {
  return (await payload.find({
    collection: 'visa-payment-orders', depth: 0, limit: 1, overrideAccess: true,
    where: { idempotencyKey: { equals: idempotencyKey } },
  })).docs[0]
}

export async function issueVisaPaymentOrder({ administratorId, candidateProcessId, idempotencyKey, now, payload, terms }: {
  administratorId: number
  candidateProcessId: number
  idempotencyKey: string
  now: Date
  payload: Payload
  terms: VisaPaymentOrderTerms
}) {
  const existing = await byIdempotencyKey(payload, idempotencyKey)
  if (existing) {
    if (relationId(existing.candidateProcess) !== candidateProcessId) {
      throw new VisaPaymentOrderError('Ključ zahteva je već iskorišćen za drugi proces kandidata.')
    }
    return { created: false, order: orderView(existing) }
  }
  try { validateVisaPaymentOrderTerms(terms, now) } catch (error) {
    throw new VisaPaymentOrderError(error instanceof Error ? error.message : 'Podaci naloga nisu ispravni.', 400)
  }
  const normalized = normalizeVisaPaymentOrderTerms(terms)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Issuing a visa payment order requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new VisaPaymentOrderError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') {
      throw new VisaPaymentOrderError('Vizni nalog se može izdati samo u aktivnom koraku „Viza“.', 403)
    }
    if (!(await acceptedEmploymentExists(payload, process.id, req))) {
      throw new VisaPaymentOrderError('Vizni nalog zahteva prethodno prihvaćenu radnu ponudu.', 403)
    }
    const orders = await processOrders(payload, process.id, req)
    if (orders.some((order) => order.status === 'ISSUED')) {
      throw new VisaPaymentOrderError('Kandidat već ima aktivan nalog koji čeka uplatu.')
    }
    if (orders.some((order) => order.status === 'PAID')) {
      throw new VisaPaymentOrderError('Trošak viziranja je već evidentiran kao plaćen.')
    }
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const orderVersion = (orders[0]?.orderVersion ?? 0) + 1
    const orderNumber = visaPaymentOrderNumber(application.id, orderVersion, now)
    const snapshotChecksum = sha256(visaPaymentOrderSnapshot(normalized, orderNumber, orderVersion))
    const order = await payload.create({
      collection: 'visa-payment-orders',
      data: {
        ...normalized,
        applicant: relationId(process.applicant),
        candidateAccount: relationId(process.candidateAccount),
        candidateProcess: process.id,
        idempotencyKey,
        issuedAt: now.toISOString(),
        issuedBy: administratorId,
        orderNumber,
        orderVersion,
        preApplication: application.id,
        programCode: process.programCode,
        snapshotChecksum,
        status: 'ISSUED',
        statusVersion: 1,
      },
      overrideAccess: true,
      req,
    })
    await payload.update({
      collection: 'candidate-processes',
      data: {
        nextActionDescription: `Nalog ${orderNumber} je spreman. Izvršite uplatu prema prikazanim instrukcijama, a agencija će evidentirati prijem.`,
        nextActionDueAt: normalized.dueAt,
        nextActionTitle: 'Uplatite troškove viziranja',
      },
      id: process.id,
      overrideAccess: true,
      req,
    })
    await createAudit({ administratorId, application, eventType: 'VISA_PAYMENT_ORDER_ISSUED', metadata: { amountMinor: normalized.amountMinor, candidateProcessId: process.id, currency: normalized.currency, dueAt: normalized.dueAt, orderId: order.id, orderNumber, orderVersion, snapshotChecksum }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return { created: true, order: orderView(order) }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const concurrent = await byIdempotencyKey(payload, idempotencyKey)
    if (concurrent) {
      if (relationId(concurrent.candidateProcess) !== candidateProcessId) {
        throw new VisaPaymentOrderError('Ključ zahteva je već iskorišćen za drugi proces kandidata.')
      }
      return { created: false, order: orderView(concurrent) }
    }
    throw error
  }
}

export async function recordVisaPayment({ administratorId, candidateProcessId, expectedStatusVersion, externalPaymentReference, now, orderId, paidAt, paymentNote, payload }: {
  administratorId: number
  candidateProcessId: number
  expectedStatusVersion: number
  externalPaymentReference?: string
  now: Date
  orderId: number
  paidAt: Date
  paymentNote?: string
  payload: Payload
}) {
  if (!Number.isFinite(paidAt.getTime()) || paidAt.toISOString().slice(0, 10) > now.toISOString().slice(0, 10)) throw new VisaPaymentOrderError('Datum uplate nije ispravan.', 400)
  if (externalPaymentReference && externalPaymentReference.trim().length > 160) throw new VisaPaymentOrderError('Referenca uplate je predugačka.', 400)
  if (paymentNote && paymentNote.trim().length > 1_000) throw new VisaPaymentOrderError('Napomena o uplati je predugačka.', 400)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Recording a visa payment requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const order = await payload.findByID({ collection: 'visa-payment-orders', depth: 0, id: orderId, overrideAccess: true, req }).catch(() => undefined)
    if (!order || relationId(order.candidateProcess) !== candidateProcessId) throw new VisaPaymentOrderError('Vizni nalog nije pronađen.', 404)
    if (order.status === 'PAID') {
      await payload.db.commitTransaction(transactionID)
      return { changed: false, order: orderView(order) }
    }
    if (order.status !== 'ISSUED' || order.statusVersion !== expectedStatusVersion) throw new VisaPaymentOrderError('Nalog je u međuvremenu izmenjen ili više nije aktivan.')
    // The administrator records a calendar date, not an exact time. Comparing timestamps
    // would incorrectly reject a payment recorded on the issue date before its generated time.
    if (paidAt.toISOString().slice(0, 10) < new Date(order.issuedAt).toISOString().slice(0, 10)) throw new VisaPaymentOrderError('Datum uplate ne može biti pre izdavanja naloga.', 400)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') throw new VisaPaymentOrderError('Uplata se više ne može evidentirati u trenutnom koraku procesa.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({
      collection: 'visa-payment-orders',
      data: { externalPaymentReference: externalPaymentReference?.trim() || undefined, paidAt: paidAt.toISOString(), paymentNote: paymentNote?.trim() || undefined, paymentRecordedBy: administratorId, status: 'PAID', statusVersion: order.statusVersion + 1 },
      id: order.id, overrideAccess: true, req,
    })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Agencija je evidentirala uplatu troškova viziranja. Popunite i predajte vizni upitnik u portalu.', nextActionDueAt: null, nextActionTitle: 'Popunite vizni upitnik' }, id: process.id, overrideAccess: true, req })
    await createAudit({ administratorId, application, eventType: 'VISA_PAYMENT_RECORDED', metadata: { amountMinor: order.amountMinor, candidateProcessId: process.id, currency: order.currency, orderId: order.id, orderNumber: order.orderNumber, paidAt: paidAt.toISOString() }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return { changed: true, order: orderView(updated) }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

export async function cancelVisaPaymentOrder({ administratorId, candidateProcessId, expectedStatusVersion, now, orderId, payload, reason }: {
  administratorId: number
  candidateProcessId: number
  expectedStatusVersion: number
  now: Date
  orderId: number
  payload: Payload
  reason: string
}) {
  const normalizedReason = reason.trim()
  if (normalizedReason.length < 5 || normalizedReason.length > 1_000) throw new VisaPaymentOrderError('Razlog otkazivanja mora imati između 5 i 1000 znakova.', 400)
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Cancelling a visa payment order requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockCandidateProcess(payload, transactionID, candidateProcessId)
    const order = await payload.findByID({ collection: 'visa-payment-orders', depth: 0, id: orderId, overrideAccess: true, req }).catch(() => undefined)
    if (!order || relationId(order.candidateProcess) !== candidateProcessId) throw new VisaPaymentOrderError('Vizni nalog nije pronađen.', 404)
    if (order.status !== 'ISSUED' || order.statusVersion !== expectedStatusVersion) throw new VisaPaymentOrderError('Samo aktuelni neplaćeni nalog može biti otkazan.')
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'VISA') throw new VisaPaymentOrderError('Nalog se više ne može otkazati u trenutnom koraku procesa.', 403)
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'visa-payment-orders', data: { cancellationReason: normalizedReason, cancelledAt: now.toISOString(), cancelledBy: administratorId, status: 'CANCELLED', statusVersion: order.statusVersion + 1 }, id: order.id, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Prethodni nalog za troškove viziranja je otkazan. Agencija će objaviti ispravljenu verziju.', nextActionDueAt: null, nextActionTitle: 'Sačekajte novi vizni nalog' }, id: process.id, overrideAccess: true, req })
    await createAudit({ administratorId, application, eventType: 'VISA_PAYMENT_ORDER_CANCELLED', metadata: { candidateProcessId: process.id, orderId: order.id, orderNumber: order.orderNumber, orderVersion: order.orderVersion, reason: normalizedReason }, now, payload, req })
    await payload.db.commitTransaction(transactionID)
    return orderView(updated)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
