import type { Payload, PayloadRequest } from 'payload'

import type { PaymentMethod, ProgramOfferTerms } from './pricing.ts'
import { buildPaymentSelectionSnapshot } from './pricing.ts'
import {
  applyDiscountsForProcess,
  getApplicableDiscountsForProcess,
} from '../discounts/service.ts'

function relationId(value: number | { id: number }) {
  return typeof value === 'number' ? value : value.id
}

export class PaymentSelectionError extends Error {
  constructor(message: string, readonly status: 403 | 404 | 409 = 409) {
    super(message)
    this.name = 'PaymentSelectionError'
  }
}

async function findExistingSelection(payload: Payload, candidateProcessId: number, req?: PayloadRequest | { transactionID?: number | string }) {
  const result = await payload.find({
    collection: 'program-offer-selections',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidateProcess: { equals: candidateProcessId } },
  })
  return result.docs[0]
}

export async function selectPaymentMethod({
  accountId,
  method,
  now,
  offerId,
  payload,
}: {
  accountId: number
  method: PaymentMethod
  now: Date
  offerId: number
  payload: Payload
}) {
  const account = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 0,
    id: accountId,
    overrideAccess: true,
  }).catch(() => undefined)
  if (!account || account.accountStatus !== 'ACTIVE' || !account._verified) {
    throw new PaymentSelectionError('Nalog nema dozvolu za izbor načina plaćanja.', 403)
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Payment selection requires a database transaction.')
  const req = { transactionID } as unknown as PayloadRequest

  try {
    const offer = await payload.findByID({
      collection: 'program-offers',
      depth: 0,
      id: offerId,
      overrideAccess: true,
      req,
    }).catch(() => undefined)
    if (!offer || relationId(offer.candidateAccount) !== account.id) {
      throw new PaymentSelectionError('Ponuda nije pronađena.', 404)
    }

    const processId = relationId(offer.candidateProcess)
    const existing = await findExistingSelection(payload, processId, req)
    if (existing) {
      if (relationId(existing.offer) === offer.id && existing.selectedMethod === method) {
        await payload.db.commitTransaction(transactionID)
        return existing
      }
      throw new PaymentSelectionError('Način plaćanja za ovaj proces je već izabran.')
    }

    if (offer.status !== 'PUBLISHED') {
      throw new PaymentSelectionError('Ponuda više nije dostupna za izbor.')
    }
    if (new Date(offer.validUntil).getTime() <= now.getTime()) {
      throw new PaymentSelectionError('Rok za prihvatanje ponude je istekao.')
    }

    const applicableDiscounts = await getApplicableDiscountsForProcess({
      candidateProcessId: processId,
      payload,
      req,
    })

    const snapshot = buildPaymentSelectionSnapshot(offer as ProgramOfferTerms, method, applicableDiscounts)
    const acceptedAt = now.toISOString()
    const selection = await payload.create({
      collection: 'program-offer-selections',
      data: {
        acceptedAt,
        basePriceCents: snapshot.basePriceCents,
        candidateAccount: account.id,
        candidateProcess: processId,
        currency: snapshot.currency,
        discountCents: snapshot.discountCents,
        installmentSchedule: snapshot.installmentSchedule,
        offer: offer.id,
        offerSnapshot: {
          commercialVersion: offer.commercialVersion,
          installments: offer.installments,
          oneTime: offer.oneTime,
          payWhenYouEarn: offer.payWhenYouEarn,
          publishedAt: offer.publishedAt,
          validUntil: offer.validUntil,
        },
        payWhenYouEarnSnapshot: snapshot.payWhenYouEarn,
        selectedMethod: method,
        totalCents: snapshot.totalCents,
      },
      overrideAccess: true,
      req,
    })

    if (applicableDiscounts.length > 0) {
      await applyDiscountsForProcess({
        candidateProcessId: processId,
        now,
        payload,
        req,
      })
    }
    await payload.update({
      collection: 'program-offers',
      context: { acceptProgramOffer: true },
      data: { acceptedAt, status: 'ACCEPTED' },
      id: offer.id,
      overrideAccess: true,
      req,
    })

    const process = await payload.findByID({
      collection: 'candidate-processes',
      depth: 0,
      id: processId,
      overrideAccess: true,
      req,
    })
    const shouldMoveToContract = process.currentStep === 'PROFILE_SETUP'
    if (shouldMoveToContract || process.currentStep === 'CONTRACT_AND_PAYMENT_PLAN') {
      await payload.update({
        collection: 'candidate-processes',
        context: { paymentSelectionProcessUpdate: true },
        data: {
          ...(shouldMoveToContract ? { currentStep: 'CONTRACT_AND_PAYMENT_PLAN' } : {}),
          nextActionDescription:
            'Izabrani način plaćanja je sačuvan. Agencija priprema odgovarajući ugovor i javiće vam kada bude spreman za pregled.',
          nextActionDueAt: null,
          nextActionTitle: 'Sačekajte pripremu ugovora',
        },
        id: process.id,
        overrideAccess: true,
        req,
      })
    }

    const applicationId = relationId(offer.preApplication)
    const application = await payload.findByID({
      collection: 'pre-applications',
      depth: 0,
      id: applicationId,
      overrideAccess: true,
      req,
    })
    await payload.create({
      collection: 'audit-events',
      data: {
        actorType: 'PUBLIC_APPLICANT',
        correlationId: application.correlationId,
        eventType: 'PAYMENT_METHOD_SELECTED',
        metadata: {
          candidateAccountId: account.id,
          candidateProcessId: process.id,
          offerId: offer.id,
          selectedMethod: method,
          selectionId: selection.id,
          totalCents: snapshot.totalCents,
        },
        newStatus: application.status,
        occurredAt: acceptedAt,
        preApplication: application.id,
        previousStatus: application.status,
        workflowVersion: application.workflowVersion,
      },
      overrideAccess: true,
      req,
    })
    await payload.db.commitTransaction(transactionID)
    return selection
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)

    if (!(error instanceof PaymentSelectionError)) {
      const offer = await payload.findByID({
        collection: 'program-offers',
        depth: 0,
        id: offerId,
        overrideAccess: true,
      }).catch(() => undefined)
      if (offer && relationId(offer.candidateAccount) === account.id) {
        const existing = await findExistingSelection(payload, relationId(offer.candidateProcess))
        if (existing && relationId(existing.offer) === offer.id && existing.selectedMethod === method) return existing
      }
    }
    throw error
  }
}
