import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import type { FlightTicketPaymentOrder, PreApplication } from '../../payload-types.ts'
import { renderFlightTicketPaymentPdf, type FlightTicketPaymentPdfInput } from './renderPdf.ts'
import {
  flightTicketPaymentOrderNumber, flightTicketPaymentSnapshot, normalizeFlightTicketPaymentTerms,
  settlementAmount, sha256, validateFlightTicketPaymentTerms, type FlightTicketPaymentTerms, type TicketCurrency,
} from './rules.ts'

function relationId(value: number | { id: number }) { return typeof value === 'number' ? value : value.id }

export class FlightTicketPaymentError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 404 | 409 = 409) { super(message); this.name = 'FlightTicketPaymentError' }
}

async function lockProcess(payload: Payload, transactionID: number | string, id: number) {
  const transaction = payload.db.sessions?.[String(transactionID)]?.db as undefined | { execute(query: unknown): Promise<unknown> }
  if (!transaction) throw new Error('Flight ticket payment transaction session is unavailable.')
  await transaction.execute(sql`SELECT "id" FROM "candidate_processes" WHERE "id" = ${id} FOR UPDATE`)
}

async function ordersForProcess(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  return (await payload.find({ collection: 'flight-ticket-payment-orders', depth: 0, limit: 100, overrideAccess: true, req, sort: '-orderVersion', where: { candidateProcess: { equals: candidateProcessId } } })).docs
}

async function acceptedSelection(payload: Payload, candidateProcessId: number, req?: PayloadRequest) {
  const offer = (await payload.find({ collection: 'flight-ticket-offers', depth: 0, limit: 1, overrideAccess: true, req, where: { and: [{ candidateProcess: { equals: candidateProcessId } }, { status: { equals: 'ACCEPTED' } }] } })).docs[0]
  if (!offer) return undefined
  const response = (await payload.find({ collection: 'flight-ticket-offer-responses', depth: 0, limit: 1, overrideAccess: true, req, where: { and: [{ flightTicketOffer: { equals: offer.id } }, { action: { equals: 'ACCEPT' } }] } })).docs[0]
  const option = response?.selectedOptionCode ? offer.options.find((item) => item.optionCode === response.selectedOptionCode) : undefined
  return response && option ? { offer, option, response } : undefined
}

function orderView(order: FlightTicketPaymentOrder) {
  return {
    airlineName: order.airlineName, cancellationReason: order.cancellationReason ?? undefined, cancelledAt: order.cancelledAt ?? undefined,
    dueAt: order.dueAt, exchangeRateDate: order.exchangeRateDate, exchangeRateReference: order.exchangeRateReference ?? undefined,
    exchangeRateScaled: order.exchangeRateScaled, exchangeRateSource: order.exchangeRateSource, id: order.id,
    includeAdvanceInvoice: Boolean(order.includeAdvanceInvoice), issuedAt: order.issuedAt, orderNumber: order.orderNumber,
    orderVersion: order.orderVersion, originalAmountMinor: order.originalAmountMinor, originalCurrency: order.originalCurrency,
    outboundDepartureAt: order.outboundDepartureAt, outboundRoute: order.outboundRoute,
    overdue: order.status === 'ISSUED' && new Date(order.dueAt) < new Date(), paidAt: order.paidAt ?? undefined,
    paymentReference: order.paymentReference, returnDepartureAt: order.returnDepartureAt, returnRoute: order.returnRoute,
    selectedOptionCode: order.selectedOptionCode, settlementAmountMinor: order.settlementAmountMinor, settlementCurrency: order.settlementCurrency,
    snapshotChecksum: order.snapshotChecksum, status: order.status, statusVersion: order.statusVersion,
  }
}

function selectionView(selection: NonNullable<Awaited<ReturnType<typeof acceptedSelection>>>) {
  return {
    airlineName: selection.option.airlineName, currency: selection.option.currency, offerId: selection.offer.id,
    offerVersion: selection.offer.offerVersion, optionCode: selection.option.optionCode,
    outboundDepartureAt: selection.option.outboundDepartureAt, outboundRoute: selection.option.outboundRoute,
    returnDepartureAt: selection.option.returnDepartureAt, returnRoute: selection.option.returnRoute,
    totalPriceMinor: selection.option.totalPriceMinor,
  }
}

async function audit(payload: Payload, req: PayloadRequest, application: PreApplication, administratorId: number, eventType: 'FLIGHT_TICKET_PAYMENT_ORDER_CANCELLED' | 'FLIGHT_TICKET_PAYMENT_ORDER_ISSUED' | 'FLIGHT_TICKET_PAYMENT_RECORDED', metadata: Record<string, unknown>, now: Date) {
  await payload.create({ collection: 'audit-events', data: { actor: administratorId, actorType: 'ADMIN', correlationId: application.correlationId, eventType, metadata, newStatus: application.status, occurredAt: now.toISOString(), preApplication: application.id, previousStatus: application.status, workflowVersion: application.workflowVersion }, overrideAccess: true, req })
}

export async function flightTicketPaymentOrdersForAdmin({ candidateProcessId, payload }: { candidateProcessId: number; payload: Payload }) {
  const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true }).catch(() => undefined)
  if (!process) throw new FlightTicketPaymentError('Proces kandidata nije pronađen.', 404)
  const selection = await acceptedSelection(payload, process.id)
  return { acceptedSelection: selection ? selectionView(selection) : undefined, currentStep: process.currentStep, orders: (await ordersForProcess(payload, process.id)).map(orderView), processStatus: process.processStatus }
}

export async function flightTicketPaymentOrdersForCandidate({ accountId, candidateProcessId, payload }: { accountId: number; candidateProcessId: number; payload: Payload }) {
  return (await ordersForProcess(payload, candidateProcessId)).filter((order) => relationId(order.candidateAccount) === accountId).map(orderView)
}

async function byIdempotencyKey(payload: Payload, idempotencyKey: string) {
  return (await payload.find({ collection: 'flight-ticket-payment-orders', depth: 0, limit: 1, overrideAccess: true, where: { idempotencyKey: { equals: idempotencyKey } } })).docs[0]
}

function pdfInput(value: Omit<FlightTicketPaymentPdfInput, never>) { return value }

export async function issueFlightTicketPaymentOrder({ administratorId, candidateProcessId, idempotencyKey, now, payload, terms }: { administratorId: number; candidateProcessId: number; idempotencyKey: string; now: Date; payload: Payload; terms: FlightTicketPaymentTerms }) {
  const existing = await byIdempotencyKey(payload, idempotencyKey)
  if (existing) {
    if (relationId(existing.candidateProcess) !== candidateProcessId) throw new FlightTicketPaymentError('Ključ zahteva je već iskorišćen za drugi proces.')
    return { created: false, order: orderView(existing) }
  }
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null) throw new Error('Issuing a flight ticket payment order requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, candidateProcessId)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req }).catch(() => undefined)
    if (!process) throw new FlightTicketPaymentError('Proces kandidata nije pronađen.', 404)
    if (process.processStatus !== 'ACTIVE' || process.currentStep !== 'TRAVEL_PREPARATION') throw new FlightTicketPaymentError('Nalog se može izdati samo tokom aktivnog koraka „Putovanje i orijentacija“.', 403)
    const selection = await acceptedSelection(payload, process.id, req)
    if (!selection) throw new FlightTicketPaymentError('Nalog zahteva prethodno prihvaćenu opciju leta.', 403)
    const currency = selection.option.currency as TicketCurrency
    try { validateFlightTicketPaymentTerms(terms, currency, now) } catch (error) { throw new FlightTicketPaymentError(error instanceof Error ? error.message : 'Podaci naloga nisu ispravni.', 400) }
    const normalized = normalizeFlightTicketPaymentTerms(terms, currency)
    const orders = await ordersForProcess(payload, process.id, req)
    if (orders.some((order) => order.status === 'ISSUED')) throw new FlightTicketPaymentError('Kandidat već ima aktivan nalog koji čeka uplatu.')
    if (orders.some((order) => order.status === 'PAID')) throw new FlightTicketPaymentError('Avionska karta je već evidentirana kao plaćena.')
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const applicant = await payload.findByID({ collection: 'applicants', depth: 0, id: relationId(process.applicant), overrideAccess: true, req })
    const orderVersion = (orders[0]?.orderVersion ?? 0) + 1
    const orderNumber = flightTicketPaymentOrderNumber(process.id, orderVersion, now)
    const settlementAmountMinor = settlementAmount(selection.option.totalPriceMinor, currency, normalized.exchangeRateScaled)
    const frozen = {
      ...normalized, airlineName: selection.option.airlineName, candidateAddressSnapshot: applicant.residentialAddress,
      candidateNameSnapshot: applicant.fullName, flightTicketOffer: selection.offer.id, flightTicketOfferResponse: selection.response.id,
      orderNumber, orderVersion, originalAmountMinor: selection.option.totalPriceMinor, originalCurrency: currency,
      outboundDepartureAt: selection.option.outboundDepartureAt, outboundRoute: selection.option.outboundRoute,
      returnDepartureAt: selection.option.returnDepartureAt, returnRoute: selection.option.returnRoute,
      selectedOptionCode: selection.option.optionCode, settlementAmountMinor, settlementCurrency: 'RSD' as const,
    }
    const snapshotChecksum = sha256(flightTicketPaymentSnapshot(frozen))
    const bytes = await renderFlightTicketPaymentPdf(pdfInput({ advanceInvoiceNumber: normalized.advanceInvoiceNumber, airlineName: frozen.airlineName, bankAccount: normalized.bankAccount, beneficiaryAddress: normalized.beneficiaryAddress, beneficiaryName: normalized.beneficiaryName, beneficiaryRegistrationNumber: normalized.beneficiaryRegistrationNumber, beneficiaryTaxId: normalized.beneficiaryTaxId, candidateAddress: applicant.residentialAddress, candidateInstructions: normalized.candidateInstructions, candidateName: applicant.fullName, dueAt: new Date(normalized.dueAt), exchangeRateDate: new Date(normalized.exchangeRateDate), exchangeRateReference: normalized.exchangeRateReference, exchangeRateScaled: normalized.exchangeRateScaled, exchangeRateSource: normalized.exchangeRateSource, includeAdvanceInvoice: normalized.includeAdvanceInvoice, issuedAt: now, orderNumber, originalAmountMinor: frozen.originalAmountMinor, originalCurrency: currency, outboundDepartureAt: new Date(frozen.outboundDepartureAt), outboundRoute: frozen.outboundRoute, paymentModel: normalized.paymentModel, paymentPurpose: normalized.paymentPurpose, paymentReference: normalized.paymentReference, returnDepartureAt: new Date(frozen.returnDepartureAt), returnRoute: frozen.returnRoute, settlementAmountMinor }))
    const order = await payload.create({ collection: 'flight-ticket-payment-orders', data: { ...frozen, applicant: applicant.id, candidateAccount: relationId(process.candidateAccount), candidateProcess: process.id, idempotencyKey, issuedAt: now.toISOString(), issuedBy: administratorId, pdfSha256: sha256(bytes), preApplication: application.id, programCode: process.programCode, snapshotChecksum, status: 'ISSUED', statusVersion: 1 }, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: `Nalog ${orderNumber} je spreman. Preuzmite PDF i izvršite uplatu do navedenog roka.`, nextActionDueAt: normalized.dueAt, nextActionTitle: 'Uplatite avionsku kartu' }, id: process.id, overrideAccess: true, req })
    await audit(payload, req, application, administratorId, 'FLIGHT_TICKET_PAYMENT_ORDER_ISSUED', { candidateProcessId: process.id, orderId: order.id, orderNumber, originalAmountMinor: frozen.originalAmountMinor, originalCurrency: currency, settlementAmountMinor, snapshotChecksum }, now)
    await payload.db.commitTransaction(transactionID)
    return { created: true, order: orderView(order) }
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}

export async function recordFlightTicketPayment({ administratorId, candidateProcessId, expectedStatusVersion, externalPaymentReference, now, orderId, paidAt, paymentNote, payload }: { administratorId: number; candidateProcessId: number; expectedStatusVersion: number; externalPaymentReference?: string; now: Date; orderId: number; paidAt: Date; paymentNote?: string; payload: Payload }) {
  if (!Number.isFinite(paidAt.getTime()) || paidAt.toISOString().slice(0, 10) > now.toISOString().slice(0, 10)) throw new FlightTicketPaymentError('Datum uplate nije ispravan.', 400)
  const transactionID = await payload.db.beginTransaction(); if (transactionID === null) throw new Error('Recording a flight ticket payment requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, candidateProcessId)
    const order = await payload.findByID({ collection: 'flight-ticket-payment-orders', depth: 0, id: orderId, overrideAccess: true, req }).catch(() => undefined)
    if (!order || relationId(order.candidateProcess) !== candidateProcessId) throw new FlightTicketPaymentError('Nalog nije pronađen.', 404)
    if (order.status === 'PAID') { await payload.db.commitTransaction(transactionID); return { changed: false, order: orderView(order) } }
    if (order.status !== 'ISSUED' || order.statusVersion !== expectedStatusVersion) throw new FlightTicketPaymentError('Nalog je u međuvremenu izmenjen ili više nije aktivan.')
    if (paidAt.toISOString().slice(0, 10) < new Date(order.issuedAt).toISOString().slice(0, 10)) throw new FlightTicketPaymentError('Datum uplate ne može biti pre izdavanja naloga.', 400)
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'flight-ticket-payment-orders', data: { externalPaymentReference: externalPaymentReference?.trim() || undefined, paidAt: paidAt.toISOString(), paymentNote: paymentNote?.trim() || undefined, paymentRecordedBy: administratorId, status: 'PAID', statusVersion: order.statusVersion + 1 }, id: order.id, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Uplata avionske karte je evidentirana. Agencija će vas obavestiti o narednim koracima i orijentaciji.', nextActionDueAt: null, nextActionTitle: 'Sačekajte informacije o orijentaciji' }, id: process.id, overrideAccess: true, req })
    await audit(payload, req, application, administratorId, 'FLIGHT_TICKET_PAYMENT_RECORDED', { candidateProcessId: process.id, orderId: order.id, orderNumber: order.orderNumber, paidAt: paidAt.toISOString() }, now)
    await payload.db.commitTransaction(transactionID); return { changed: true, order: orderView(updated) }
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}

export async function cancelFlightTicketPaymentOrder({ administratorId, candidateProcessId, expectedStatusVersion, now, orderId, payload, reason }: { administratorId: number; candidateProcessId: number; expectedStatusVersion: number; now: Date; orderId: number; payload: Payload; reason: string }) {
  const normalizedReason = reason.trim(); if (normalizedReason.length < 5 || normalizedReason.length > 1_000) throw new FlightTicketPaymentError('Razlog mora imati između 5 i 1000 znakova.', 400)
  const transactionID = await payload.db.beginTransaction(); if (transactionID === null) throw new Error('Cancelling a flight ticket payment order requires a database transaction.')
  const req = { transactionID } as PayloadRequest
  try {
    await lockProcess(payload, transactionID, candidateProcessId)
    const order = await payload.findByID({ collection: 'flight-ticket-payment-orders', depth: 0, id: orderId, overrideAccess: true, req }).catch(() => undefined)
    if (!order || relationId(order.candidateProcess) !== candidateProcessId) throw new FlightTicketPaymentError('Nalog nije pronađen.', 404)
    if (order.status !== 'ISSUED' || order.statusVersion !== expectedStatusVersion) throw new FlightTicketPaymentError('Samo aktuelni neplaćeni nalog može biti otkazan.')
    const process = await payload.findByID({ collection: 'candidate-processes', depth: 0, id: candidateProcessId, overrideAccess: true, req })
    const application = await payload.findByID({ collection: 'pre-applications', depth: 0, id: relationId(process.preApplication), overrideAccess: true, req })
    const updated = await payload.update({ collection: 'flight-ticket-payment-orders', data: { cancellationReason: normalizedReason, cancelledAt: now.toISOString(), cancelledBy: administratorId, status: 'CANCELLED', statusVersion: order.statusVersion + 1 }, id: order.id, overrideAccess: true, req })
    await payload.update({ collection: 'candidate-processes', data: { nextActionDescription: 'Prethodni nalog je otkazan. Agencija će objaviti ispravljenu verziju.', nextActionDueAt: null, nextActionTitle: 'Sačekajte novi nalog za avionsku kartu' }, id: process.id, overrideAccess: true, req })
    await audit(payload, req, application, administratorId, 'FLIGHT_TICKET_PAYMENT_ORDER_CANCELLED', { candidateProcessId: process.id, orderId: order.id, orderNumber: order.orderNumber, reason: normalizedReason }, now)
    await payload.db.commitTransaction(transactionID); return orderView(updated)
  } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
}

function pdfInputFromOrder(order: FlightTicketPaymentOrder): FlightTicketPaymentPdfInput {
  return { advanceInvoiceNumber: order.advanceInvoiceNumber ?? undefined, airlineName: order.airlineName, bankAccount: order.bankAccount, beneficiaryAddress: order.beneficiaryAddress, beneficiaryName: order.beneficiaryName, beneficiaryRegistrationNumber: order.beneficiaryRegistrationNumber ?? undefined, beneficiaryTaxId: order.beneficiaryTaxId ?? undefined, candidateAddress: order.candidateAddressSnapshot, candidateInstructions: order.candidateInstructions, candidateName: order.candidateNameSnapshot, dueAt: new Date(order.dueAt), exchangeRateDate: new Date(order.exchangeRateDate), exchangeRateReference: order.exchangeRateReference ?? undefined, exchangeRateScaled: order.exchangeRateScaled, exchangeRateSource: order.exchangeRateSource, includeAdvanceInvoice: Boolean(order.includeAdvanceInvoice), issuedAt: new Date(order.issuedAt), orderNumber: order.orderNumber, originalAmountMinor: order.originalAmountMinor, originalCurrency: order.originalCurrency, outboundDepartureAt: new Date(order.outboundDepartureAt), outboundRoute: order.outboundRoute, paymentModel: order.paymentModel ?? undefined, paymentPurpose: order.paymentPurpose, paymentReference: order.paymentReference, returnDepartureAt: new Date(order.returnDepartureAt), returnRoute: order.returnRoute, settlementAmountMinor: order.settlementAmountMinor }
}

export async function downloadFlightTicketPaymentOrder({ actor, orderId, payload }: { actor: { collection: 'candidate-accounts' | 'users'; id: number }; orderId: number; payload: Payload }) {
  const order = await payload.findByID({ collection: 'flight-ticket-payment-orders', depth: 0, id: orderId, overrideAccess: true }).catch(() => undefined)
  if (!order || (actor.collection === 'candidate-accounts' && relationId(order.candidateAccount) !== actor.id)) throw new FlightTicketPaymentError('Nalog nije pronađen.', 404)
  const bytes = await renderFlightTicketPaymentPdf(pdfInputFromOrder(order))
  if (sha256(bytes) !== order.pdfSha256) throw new Error(`Flight ticket payment PDF integrity mismatch for order ${order.id}.`)
  return { bytes, fileName: `${order.orderNumber}.pdf` }
}
