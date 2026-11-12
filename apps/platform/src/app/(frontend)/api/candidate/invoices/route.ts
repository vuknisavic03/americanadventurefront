import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export async function GET() {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'candidate-accounts') {
    return Response.json({ message: 'Prijavite se na kandidatski portal.' }, { status: 401 })
  }

  const invoices = await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    sort: '-issueDate',
    where: { candidateAccount: { equals: auth.user.id } },
  })

  return Response.json({
    invoices: invoices.docs.map((doc) => ({
      accountingDate: doc.accountingDate,
      amountInWords: doc.amountInWords,
      id: doc.id,
      invoiceNumber: doc.invoiceNumber,
      issueDate: doc.issueDate,
      note: doc.note,
      originalAmountCents: doc.originalAmountCents,
      originalCurrency: doc.originalCurrency,
      pdfSha256: doc.pdfSha256,
      settlementAmountRsdCents: doc.settlementAmountRsdCents,
    })),
  })
}
