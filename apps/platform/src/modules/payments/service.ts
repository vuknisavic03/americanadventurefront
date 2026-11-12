import { createHash } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { CandidateProcess, PreApplication } from '../../payload-types.ts'
import { swtProcessSteps } from '../candidate-processes/workflow.ts'
import { buildPaymentPlanSnapshot, derivePaymentPlanState } from './ledger.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

function reference(prefix: 'PAY' | 'REV', key: string) {
  return `AA-${prefix}-${createHash('sha256').update(key).digest('hex').slice(0, 16).toUpperCase()}`
}

function money(cents: number) {
  return `${new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(cents / 100)} USD`
}

async function lockPaymentPlan(payload: Payload, transactionID: number | string, paymentPlanId: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | {
    execute: (query: unknown) => Promise<unknown>
  }
  if (!transaction) return
  await transaction.execute(sql`SELECT "id" FROM "candidate_payment_plans" WHERE "id" = ${paymentPlanId} FOR UPDATE`)
}

export class CandidatePaymentError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 = 409) {
    super(message)
    this.name = 'CandidatePaymentError'
  }
}

async function audit({
  actorId,
  application,
  eventType,
  metadata,
  occurredAt,
  payload,
  req,
}: {
  actorId?: number
  application: PreApplication
  eventType: 'INITIAL_PAYMENT_CONFIRMED' | 'PAYMENT_PLAN_CREATED' | 'PAYMENT_RECORDED' | 'PAYMENT_REVERSED'
  metadata: Record<string, unknown>
  occurredAt: string
  payload: Payload
  req: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actorId,
      actorType: actorId ? 'ADMIN' : 'SYSTEM',
      correlationId: application.correlationId,
      eventType,
      metadata,
      newStatus: application.status,
      occurredAt,
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
    req,
  })
}

async function updateProcessAfterFirstPayment({
  actorId,
  application,
  confirmedAt,
  paymentPlanId,
  payload,
  process,
  req,
}: {
  actorId?: number
  application: PreApplication
  confirmedAt: string
  paymentPlanId: number
  payload: Payload
  process: CandidateProcess
  req: PayloadRequest
}) {
  if (process.currentStep === 'INITIAL_PAYMENT') {
    await payload.update({
      collection: 'candidate-processes',
      data: {
        currentStep: 'PROGRAM_APPLICATION',
        nextActionDescription: 'Prva ugovorena uplata je potvrđena. Možete nastaviti sa detaljnom prijavom za program.',
        nextActionDueAt: null,
        nextActionTitle: 'Nastavite programsku aplikaciju',
      },
      id: process.id,
      overrideAccess: true,
      req,
    })
  }
  await audit({
    actorId,
    application,
    eventType: 'INITIAL_PAYMENT_CONFIRMED',
    metadata: { candidateProcessId: process.id, paymentPlanId },
    occurredAt: confirmedAt,
    payload,
    req,
  })
}

export async function createPaymentPlanForAcceptance({
  acceptanceId,
  now,
  payload,
  req,
}: {
  acceptanceId: number
  now: Date
  payload: Payload
  req: PayloadRequest
}) {
  const existing = (await payload.find({
    collection: 'candidate-payment-plans',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { contractAcceptance: { equals: acceptanceId } },
  })).docs[0]
  if (existing) return existing

  const acceptance = await payload.findByID({ collection: 'contract-acceptances', depth: 0, id: acceptanceId, overrideAccess: true, req })
  const contract = await payload.findByID({ collection: 'generated-contracts', depth: 0, id: relationId(acceptance.contract), overrideAccess: true, req })
  const selection = await payload.findByID({ collection: 'program-offer-selections', depth: 0, id: relationId(contract.programOfferSelection), overrideAccess: true, req })
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: relationId(selection.candidateProcess), overrideAccess: true, req })
  const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(acceptance.preApplication), overrideAccess: true, req })
  if (
    relationId(acceptance.candidateAccount) !== relationId(selection.candidateAccount) ||
    relationId(process.candidateAccount) !== relationId(selection.candidateAccount) ||
    relationId(process.preApplication) !== application.id
  ) throw new Error('Contract acceptance and payment selection are not linked to the same candidate process.')

  const snapshot = buildPaymentPlanSnapshot(selection, acceptance.acceptedAt)
  const initialState = derivePaymentPlanState({
    firstPaymentRequiredCents: snapshot.firstPaymentRequiredCents,
    paidCents: 0,
    totalCents: snapshot.totalCents,
  })
  const plan = await payload.create({
    collection: 'candidate-payment-plans',
    data: {
      candidateAccount: relationId(selection.candidateAccount),
      candidateProcess: process.id,
      contractAcceptance: acceptance.id,
      currency: snapshot.currency,
      firstPaymentConfirmedAt: initialState.firstPaymentStatus === 'NOT_REQUIRED' ? now.toISOString() : undefined,
      firstPaymentRequiredCents: snapshot.firstPaymentRequiredCents,
      firstPaymentStatus: initialState.firstPaymentStatus,
      obligations: snapshot.obligations,
      paidCents: 0,
      preApplication: application.id,
      programOfferSelection: selection.id,
      remainingCents: initialState.remainingCents,
      selectedMethod: snapshot.selectedMethod,
      status: initialState.status,
      totalCents: snapshot.totalCents,
    },
    overrideAccess: true,
    req,
  })
  await audit({
    application,
    eventType: 'PAYMENT_PLAN_CREATED',
    metadata: {
      candidateAccountId: relationId(selection.candidateAccount),
      candidateProcessId: process.id,
      firstPaymentRequiredCents: snapshot.firstPaymentRequiredCents,
      paymentPlanId: plan.id,
      selectedMethod: snapshot.selectedMethod,
      totalCents: snapshot.totalCents,
    },
    occurredAt: now.toISOString(),
    payload,
    req,
  })

  if (initialState.firstPaymentStatus === 'NOT_REQUIRED') {
    await updateProcessAfterFirstPayment({
      application,
      confirmedAt: now.toISOString(),
      paymentPlanId: plan.id,
      payload,
      process,
      req,
    })
  } else if (process.currentStep === 'INITIAL_PAYMENT') {
    await payload.update({
      collection: 'candidate-processes',
      data: {
        nextActionDescription: `Uplatite najmanje ${money(snapshot.firstPaymentRequiredCents)} prema instrukcijama agencije. Nastavak aplikacije biće omogućen nakon administrativne potvrde.`,
        nextActionDueAt: snapshot.obligations[0]?.dueAt,
        nextActionTitle: 'Izvršite prvu uplatu',
      },
      id: process.id,
      overrideAccess: true,
      req,
    })
  }
  return plan
}

async function existingByIdempotencyKey(payload: Payload, idempotencyKey: string, req?: PayloadRequest) {
  return (await payload.find({
    collection: 'candidate-payments', depth: 0, limit: 1, overrideAccess: true, req,
    where: { idempotencyKey: { equals: idempotencyKey } },
  })).docs[0]
}

export async function recordCandidatePayment({
  administratorId,
  amountCents,
  externalReference,
  idempotencyKey,
  note,
  now,
  paymentPlanId,
  receivedAt,
  payload,
}: {
  administratorId: number
  amountCents: number
  externalReference?: string
  idempotencyKey: string
  note?: string
  now: Date
  paymentPlanId: number
  receivedAt: Date
  payload: Payload
}) {
  const idempotent = await existingByIdempotencyKey(payload, idempotencyKey)
  if (idempotent) return { created: false, payment: idempotent }
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new CandidatePaymentError('Iznos uplate nije ispravan.', 400)
  if (!Number.isFinite(receivedAt.getTime())) throw new CandidatePaymentError('Datum uplate nije ispravan.', 400)
  if (receivedAt.getTime() > now.getTime() + 5 * 60_000) throw new CandidatePaymentError('Datum uplate ne može biti u budućnosti.', 400)

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Recording a payment requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockPaymentPlan(payload, transactionID, paymentPlanId)
    const plan = await payload.findByID({ collection: 'candidate-payment-plans', depth: 0, id: paymentPlanId, overrideAccess: true, req }).catch(() => undefined)
    if (!plan) throw new CandidatePaymentError('Plan plaćanja nije pronađen.', 404)
    if (amountCents > plan.remainingCents) throw new CandidatePaymentError('Uplata ne može biti veća od preostalog iznosa.')
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(plan.preApplication), overrideAccess: true, req })
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: relationId(plan.candidateProcess), overrideAccess: true, req })
    const payment = await payload.create({
      collection: 'candidate-payments',
      data: {
        amountCents,
        candidateAccount: relationId(plan.candidateAccount),
        currency: plan.currency,
        entryType: 'PAYMENT',
        externalReference: externalReference?.trim() || undefined,
        idempotencyKey,
        note: note?.trim() || undefined,
        paymentPlan: plan.id,
        paymentReference: reference('PAY', idempotencyKey),
        preApplication: application.id,
        receivedAt: receivedAt.toISOString(),
        recordedBy: administratorId,
      },
      overrideAccess: true,
      req,
    })
    const paidCents = plan.paidCents + amountCents
    const state = derivePaymentPlanState({ firstPaymentRequiredCents: plan.firstPaymentRequiredCents, paidCents, totalCents: plan.totalCents })
    const firstPaymentBecameConfirmed = plan.firstPaymentStatus === 'PENDING' && state.firstPaymentStatus === 'CONFIRMED'
    await payload.update({
      collection: 'candidate-payment-plans',
      data: {
        firstPaymentConfirmedAt: firstPaymentBecameConfirmed ? receivedAt.toISOString() : plan.firstPaymentConfirmedAt,
        firstPaymentStatus: state.firstPaymentStatus,
        paidCents,
        remainingCents: state.remainingCents,
        status: state.status,
      },
      id: plan.id,
      overrideAccess: true,
      req,
    })
    await audit({
      actorId: administratorId,
      application,
      eventType: 'PAYMENT_RECORDED',
      metadata: { amountCents, paymentId: payment.id, paymentPlanId: plan.id, paymentReference: payment.paymentReference },
      occurredAt: now.toISOString(),
      payload,
      req,
    })
    if (firstPaymentBecameConfirmed) {
      await updateProcessAfterFirstPayment({
        actorId: administratorId,
        application,
        confirmedAt: receivedAt.toISOString(),
        paymentPlanId: plan.id,
        payload,
        process,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
    return { created: true, payment }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const concurrent = await existingByIdempotencyKey(payload, idempotencyKey)
    if (concurrent) return { created: false, payment: concurrent }
    throw error
  }
}

export async function reverseCandidatePayment({
  administratorId,
  idempotencyKey,
  now,
  paymentId,
  payload,
  reason,
}: {
  administratorId: number
  idempotencyKey: string
  now: Date
  paymentId: number
  payload: Payload
  reason: string
}) {
  const idempotent = await existingByIdempotencyKey(payload, idempotencyKey)
  if (idempotent) return { created: false, reversal: idempotent }
  if (!reason.trim()) throw new CandidatePaymentError('Razlog poništenja je obavezan.', 400)

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Reversing a payment requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    const original = await payload.findByID({ collection: 'candidate-payments', depth: 0, id: paymentId, overrideAccess: true, req }).catch(() => undefined)
    if (!original) throw new CandidatePaymentError('Uplata nije pronađena.', 404)
    if (original.entryType !== 'PAYMENT') throw new CandidatePaymentError('Samo primljena uplata može biti poništena.')
    const existingReversal = (await payload.find({
      collection: 'candidate-payments', depth: 0, limit: 1, overrideAccess: true, req,
      where: { reversesPayment: { equals: original.id } },
    })).docs[0]
    if (existingReversal) throw new CandidatePaymentError('Ova uplata je već poništena.')
    const paymentPlanId = relationId(original.paymentPlan)
    await lockPaymentPlan(payload, transactionID, paymentPlanId)
    const plan = await payload.findByID({ collection: 'candidate-payment-plans', depth: 0, id: paymentPlanId, overrideAccess: true, req })
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(plan.preApplication), overrideAccess: true, req })
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: relationId(plan.candidateProcess), overrideAccess: true, req })
    const paidCents = plan.paidCents - original.amountCents
    if (paidCents < 0) throw new Error('Payment ledger balance would become negative.')
    const state = derivePaymentPlanState({ firstPaymentRequiredCents: plan.firstPaymentRequiredCents, paidCents, totalCents: plan.totalCents })
    const reversal = await payload.create({
      collection: 'candidate-payments',
      data: {
        amountCents: original.amountCents,
        candidateAccount: relationId(plan.candidateAccount),
        currency: plan.currency,
        entryType: 'REVERSAL',
        idempotencyKey,
        paymentPlan: plan.id,
        paymentReference: reference('REV', idempotencyKey),
        preApplication: application.id,
        receivedAt: now.toISOString(),
        recordedBy: administratorId,
        reversalReason: reason.trim(),
        reversesPayment: original.id,
      },
      overrideAccess: true,
      req,
    })
    const firstPaymentLost = plan.firstPaymentStatus === 'CONFIRMED' && state.firstPaymentStatus === 'PENDING'
    await payload.update({
      collection: 'candidate-payment-plans',
      data: {
        firstPaymentConfirmedAt: firstPaymentLost ? null : plan.firstPaymentConfirmedAt,
        firstPaymentStatus: state.firstPaymentStatus,
        paidCents,
        remainingCents: state.remainingCents,
        status: state.status,
      },
      id: plan.id,
      overrideAccess: true,
      req,
    })
    if (firstPaymentLost) {
      const currentIndex = swtProcessSteps.findIndex((step) => step.key === process.currentStep)
      const applicationIndex = swtProcessSteps.findIndex((step) => step.key === 'PROGRAM_APPLICATION')
      await payload.update({
        collection: 'candidate-processes',
        data: currentIndex <= applicationIndex
          ? {
              currentStep: 'INITIAL_PAYMENT',
              nextActionDescription: 'Prethodno evidentirana prva uplata je administrativno poništena. Obratite se agenciji radi provere i novih instrukcija.',
              nextActionDueAt: null,
              nextActionTitle: 'Kontaktirajte agenciju u vezi sa uplatom',
            }
          : {
              nextActionDescription: 'Uplata koja je omogućila nastavak procesa je poništena. Administratorska provera je obavezna pre nastavka.',
              nextActionDueAt: null,
              nextActionTitle: 'Sačekajte finansijsku proveru agencije',
              processStatus: 'ON_HOLD',
            },
        id: process.id,
        overrideAccess: true,
        req,
      })
    }
    await audit({
      actorId: administratorId,
      application,
      eventType: 'PAYMENT_REVERSED',
      metadata: { amountCents: original.amountCents, originalPaymentId: original.id, paymentPlanId: plan.id, reversalId: reversal.id },
      occurredAt: now.toISOString(),
      payload,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return { created: true, reversal }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    const concurrent = await existingByIdempotencyKey(payload, idempotencyKey)
    if (concurrent) return { created: false, reversal: concurrent }
    throw error
  }
}
