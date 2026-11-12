import type { Payload, PayloadRequest, Where } from 'payload'
import type { CandidateInvoice } from '../../payload-types.ts'
import {
  type InvoiceCurrency,
  type KirEntry,
  invoiceToKirEntry,
  prepareCandidateInvoice,
} from './rules.ts'
import { renderInvoicePdf } from './renderInvoicePdf.ts'
import {
  type PaymentSlipData,
  preparePaymentSlip,
} from './paymentSlips.ts'
import { renderPaymentSlipPdf } from './renderPaymentSlipPdf.ts'

function relationId(val: number | { id: number }): number {
  return typeof val === 'number' ? val : val.id
}

export class InvoiceServiceError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message)
    this.name = 'InvoiceServiceError'
  }
}

export async function generateInvoiceForPayment({
  administratorId,
  buyerTaxId,
  candidatePaymentId,
  exchangeRateDate,
  exchangeRateScaled,
  exchangeRateSource,
  note,
  now = new Date(),
  payload,
  req,
}: {
  administratorId: number
  buyerTaxId?: string
  candidatePaymentId: number
  exchangeRateDate?: string
  exchangeRateScaled?: number
  exchangeRateSource?: string
  note?: string
  now?: Date
  payload: Payload
  req?: PayloadRequest
}): Promise<{ created: boolean; invoice: CandidateInvoice; pdfChecksum: string }> {
  // Check if invoice already exists for this payment
  const existing = await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { candidatePayment: { equals: candidatePaymentId } },
  })

  if (existing.docs.length > 0) {
    return { created: false, invoice: existing.docs[0], pdfChecksum: existing.docs[0].pdfSha256 }
  }

  // Fetch payment
  const payment = await payload.findByID({
    collection: 'candidate-payments',
    depth: 1,
    id: candidatePaymentId,
    overrideAccess: true,
    req,
  })
  if (!payment) {
    throw new InvoiceServiceError('Uplata nije pronađena.', 404)
  }
  if (payment.entryType !== 'PAYMENT') {
    throw new InvoiceServiceError('Faktura se može generisati samo za primljenu uplatu.', 400)
  }

  const candidateAccountId = relationId(payment.candidateAccount)
  const preApplicationId = relationId(payment.preApplication)

  // Fetch preApplication & process
  const preApp = await payload.findByID({
    collection: 'pre-applications',
    depth: 1,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })
  if (!preApp) {
    throw new InvoiceServiceError('Prijava kandidata nije pronađena.', 404)
  }

  const applicant = typeof preApp.applicant === 'object' && preApp.applicant !== null ? (preApp.applicant as { firstName?: string; lastName?: string; residentialAddress?: string }) : null
  const buyerName = applicant ? `${applicant.firstName} ${applicant.lastName}`.trim() : 'Kandidat'
  const buyerAddress = applicant?.residentialAddress || 'Beograd, Srbija'

  // Fetch process to get candidateProcessId
  const candidateProcess = (
    await payload.find({
      collection: 'candidate-processes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: { candidateAccount: { equals: candidateAccountId } },
    })
  ).docs[0]

  const candidateProcessId = candidateProcess?.id || 1

  // Resolve buyer identification number (JMBG or passport)
  let resolvedTaxId = buyerTaxId?.trim()
  if (!resolvedTaxId) {
    const sensitive = (
      await payload.find({
        collection: 'candidate-sensitive-profiles',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: { candidateAccount: { equals: candidateAccountId } },
      })
    ).docs[0]
    resolvedTaxId = (sensitive as { passportNumber?: string })?.passportNumber || 'Nije evidentirano'
  }

  const year = now.getFullYear()

  // Determine next sequence number for this year safely
  const countResult = await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    sort: '-sequenceNumber',
    where: { year: { equals: year } },
  })
  const lastSequence = countResult.docs[0]?.sequenceNumber || 0
  const sequenceNumber = lastSequence + 1

  const defaultScaledRate = 108_500_000 // 108.500000 RSD / USD
  const actualScaledRate = exchangeRateScaled || defaultScaledRate
  const actualRateDate = exchangeRateDate || payment.receivedAt || now.toISOString()

  const invoiceData = prepareCandidateInvoice({
    accountingDate: now.toISOString(),
    buyerAddress,
    buyerIdentificationNumber: resolvedTaxId,
    buyerName,
    candidateAccountId,
    candidatePaymentId: payment.id,
    candidateProcessId,
    exchangeRateDate: actualRateDate,
    exchangeRateScaled: actualScaledRate,
    exchangeRateSource,
    issueDate: now.toISOString(),
    note: note || payment.note || `Uplata po ugovoru za program Work and Travel`,
    originalAmountCents: payment.amountCents,
    originalCurrency: payment.currency as InvoiceCurrency,
    preApplicationId,
    sequenceNumber,
    year,
  })

  // Render PDF
  const { bytes, checksum } = await renderInvoicePdf(invoiceData)
  const pdfBase64 = Buffer.from(bytes).toString('base64')

  const created = await payload.create({
    collection: 'candidate-invoices',
    data: {
      accountingDate: invoiceData.accountingDate,
      amountInWords: invoiceData.amountInWords,
      buyerAddress: invoiceData.buyerAddress,
      buyerName: invoiceData.buyerName,
      buyerTaxId: invoiceData.buyerIdentificationNumber,
      candidateAccount: candidateAccountId,
      candidatePayment: payment.id,
      candidateProcess: candidateProcessId,
      exchangeRateDate: invoiceData.exchangeRateDate,
      exchangeRateScaled: invoiceData.exchangeRateScaled,
      exchangeRateSource: invoiceData.exchangeRateSource,
      invoiceNumber: invoiceData.invoiceNumber,
      issueDate: invoiceData.issueDate,
      issuedBy: administratorId,
      note: invoiceData.note,
      originalAmountCents: invoiceData.originalAmountCents,
      originalCurrency: invoiceData.originalCurrency,
      pdfBase64,
      pdfSha256: checksum,
      preApplication: preApplicationId,
      sequenceNumber: invoiceData.sequenceNumber,
      settlementAmountRsdCents: invoiceData.settlementAmountRsdCents,
      year: invoiceData.year,
    },
    overrideAccess: true,
    req,
  })

  // Audit event
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: administratorId,
      actorType: 'ADMIN',
      correlationId: preApp.correlationId,
      eventType: 'INVOICE_GENERATED',
      metadata: {
        candidateAccountId,
        candidatePaymentId: payment.id,
        invoiceId: created.id,
        invoiceNumber: created.invoiceNumber,
        pdfSha256: checksum,
        settlementAmountRsdCents: invoiceData.settlementAmountRsdCents,
      },
      newStatus: preApp.status,
      occurredAt: now.toISOString(),
      preApplication: preApp.id,
      previousStatus: preApp.status,
      workflowVersion: preApp.workflowVersion,
    },
    overrideAccess: true,
    req,
  })

  return { created: true, invoice: created, pdfChecksum: checksum }
}

export async function getKirBook({
  month,
  payload,
  year,
}: {
  month?: number
  payload: Payload
  year?: number
}): Promise<KirEntry[]> {
  const currentYear = year || new Date().getFullYear()
  const whereClause: Where = { year: { equals: currentYear } }

  const invoices = await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    sort: 'sequenceNumber',
    where: whereClause,
  })

  let filtered = invoices.docs
  if (month && month >= 1 && month <= 12) {
    filtered = filtered.filter((doc) => {
      const docDate = new Date(doc.issueDate)
      return docDate.getMonth() + 1 === month
    })
  }

  return filtered.map((doc) => {
    return invoiceToKirEntry({
      accountingDate: doc.accountingDate,
      amountInWords: doc.amountInWords,
      buyerAddress: doc.buyerAddress,
      buyerIdentificationNumber: doc.buyerTaxId || 'N/A',
      buyerName: doc.buyerName,
      candidateAccountId: relationId(doc.candidateAccount),
      candidatePaymentId: relationId(doc.candidatePayment),
      candidateProcessId: relationId(doc.candidateProcess),
      exchangeRateDate: doc.exchangeRateDate,
      exchangeRateFormatted: (doc.exchangeRateScaled / 1_000_000).toFixed(6),
      exchangeRateScaled: doc.exchangeRateScaled,
      exchangeRateSource: doc.exchangeRateSource || '',
      invoiceNumber: doc.invoiceNumber,
      issueDate: doc.issueDate,
      note: doc.note || '',
      originalAmountCents: doc.originalAmountCents,
      originalAmountFormatted: `${(doc.originalAmountCents / 100).toFixed(2)} ${doc.originalCurrency}`,
      originalCurrency: doc.originalCurrency as InvoiceCurrency,
      preApplicationId: relationId(doc.preApplication),
      sequenceNumber: doc.sequenceNumber,
      settlementAmountRsdCents: doc.settlementAmountRsdCents,
      settlementAmountRsdFormatted: `${(doc.settlementAmountRsdCents / 100).toLocaleString('sr-Latn-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`,
      year: doc.year,
    })
  })
}

export async function getPaymentSlipForCandidate({
  candidateAccountId,
  obligationKey,
  payload,
}: {
  candidateAccountId: number
  obligationKey: string
  payload: Payload
}): Promise<{ bytes: Uint8Array; checksum: string; slip: PaymentSlipData }> {
  const candidateAccount = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 1,
    id: candidateAccountId,
    overrideAccess: true,
  })
  if (!candidateAccount) {
    throw new InvoiceServiceError('Nalog kandidata nije pronađen.', 404)
  }

  let candidateAddress = 'Beograd, Srbija'
  let candidateName = candidateAccount.fullName || 'Kandidat'

  const applicant =
    typeof candidateAccount.applicant === 'object' && candidateAccount.applicant !== null
      ? (candidateAccount.applicant as { firstName?: string; lastName?: string; residentialAddress?: string })
      : typeof candidateAccount.applicant === 'number'
        ? await payload
            .findByID({
              collection: 'applicants',
              depth: 0,
              id: candidateAccount.applicant,
              overrideAccess: true,
            })
            .catch(() => null)
        : null

  if (applicant) {
    if (applicant.firstName || applicant.lastName) {
      candidateName = `${applicant.firstName ?? ''} ${applicant.lastName ?? ''}`.trim()
    }
    if (applicant.residentialAddress) {
      candidateAddress = applicant.residentialAddress
    }
  }

  // Fetch payment plan
  const plan = (
    await payload.find({
      collection: 'candidate-payment-plans',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: candidateAccountId } },
    })
  ).docs[0]

  let amountRsd = 37975 // Default 350 USD at 108.5
  let obligationLabel = 'Rata programa'

  if (plan && Array.isArray(plan.obligations)) {
    const ob = (plan.obligations as Array<{ amountCents: number; key: string; label?: string }>).find((o) => o.key === obligationKey)
    if (ob) {
      obligationLabel = ob.label || obligationLabel
      amountRsd = Math.round((ob.amountCents * 108.5) / 100)
    }
  }

  const slip = preparePaymentSlip(
    {
      candidateAddress,
      candidateName,
      currency: 'RSD',
      obligationKey,
      obligationLabel,
      paymentAmountRsd: amountRsd,
    },
    candidateAccountId,
  )

  const { bytes, checksum } = await renderPaymentSlipPdf(slip)
  return { bytes, checksum, slip }
}
