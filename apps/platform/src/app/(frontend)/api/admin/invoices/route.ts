import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je neophodna.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const yearParam = url.searchParams.get('year')
  const candidateIdParam = url.searchParams.get('candidateAccountId')

  const where: Where = {}
  if (yearParam) {
    where.year = { equals: Number(yearParam) }
  }
  if (candidateIdParam) {
    where.candidateAccount = { equals: Number(candidateIdParam) }
  }

  const invoices = await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: '-sequenceNumber',
    where,
  })

  return Response.json({
    invoices: invoices.docs.map((doc) => ({
      accountingDate: doc.accountingDate,
      amountInWords: doc.amountInWords,
      buyerName: doc.buyerName,
      buyerTaxId: doc.buyerTaxId,
      candidateAccountId: typeof doc.candidateAccount === 'number' ? doc.candidateAccount : doc.candidateAccount.id,
      candidatePaymentId: typeof doc.candidatePayment === 'number' ? doc.candidatePayment : doc.candidatePayment.id,
      id: doc.id,
      invoiceNumber: doc.invoiceNumber,
      issueDate: doc.issueDate,
      originalAmountCents: doc.originalAmountCents,
      originalCurrency: doc.originalCurrency,
      pdfSha256: doc.pdfSha256,
      sequenceNumber: doc.sequenceNumber,
      settlementAmountRsdCents: doc.settlementAmountRsdCents,
      year: doc.year,
    })),
  })
}
