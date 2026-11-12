import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { generateCandidateLedgerExcelBuffer } from '@/modules/invoices/exportExcel.ts'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const candidateAccountId = Number(id)
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je neophodna.' }, { status: 401 })
  }

  const candidateAccount = await payload.findByID({
    collection: 'candidate-accounts',
    depth: 1,
    id: candidateAccountId,
    overrideAccess: true,
  }).catch(() => null)

  if (!candidateAccount) {
    return Response.json({ message: 'Kandidat nije pronađen.' }, { status: 404 })
  }

  const applicant =
    typeof candidateAccount.applicant === 'object' && candidateAccount.applicant !== null
      ? (candidateAccount.applicant as { firstName?: string; lastName?: string; phone?: string; residentialAddress?: string })
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

  const candidateName = (applicant ? `${applicant.firstName ?? ''} ${applicant.lastName ?? ''}`.trim() : candidateAccount.fullName) || 'Kandidat'

  const plan = (await payload.find({
    collection: 'candidate-payment-plans',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { candidateAccount: { equals: candidateAccountId } },
  })).docs[0]

  const payments = (await payload.find({
    collection: 'candidate-payments',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: 'receivedAt',
    where: { candidateAccount: { equals: candidateAccountId } },
  })).docs

  const invoices = (await payload.find({
    collection: 'candidate-invoices',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: 'issueDate',
    where: { candidateAccount: { equals: candidateAccountId } },
  })).docs

  const buffer = await generateCandidateLedgerExcelBuffer({
    candidateAddress: applicant?.residentialAddress || 'N/A',
    candidateEmail: candidateAccount.email,
    candidateName,
    candidatePhone: applicant?.phone,
    contractNumber: undefined,
    invoices: invoices.map((inv) => ({
      amountRsdFormatted: `${(inv.settlementAmountRsdCents / 100).toLocaleString('sr-Latn-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`,
      date: new Intl.DateTimeFormat('sr-Latn-RS').format(new Date(inv.issueDate)),
      invoiceNumber: inv.invoiceNumber,
      note: inv.note || '',
    })),
    obligations: Array.isArray(plan?.obligations) ? (plan.obligations as Array<{ amountCents: number; dueAt?: string; label: string; status?: string }>).map((o) => ({
      amountFormatted: `${(o.amountCents / 100).toFixed(2)} USD`,
      dueDate: o.dueAt ? new Intl.DateTimeFormat('sr-Latn-RS').format(new Date(o.dueAt)) : 'Prema ugovoru',
      label: o.label,
      status: o.status || 'PENDING',
    })) : [],
    paidFormatted: plan ? `${(plan.paidCents / 100).toFixed(2)} USD` : '0.00 USD',
    paymentMethodLabel: plan?.selectedMethod || 'N/A',
    payments: payments.map((p) => ({
      amountForeignFormatted: `${(p.amountCents / 100).toFixed(2)} ${p.currency}`,
      amountRsdFormatted: `${((p.amountCents * 108.5) / 100).toLocaleString('sr-Latn-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`,
      date: new Intl.DateTimeFormat('sr-Latn-RS').format(new Date(p.receivedAt)),
      reference: p.paymentReference,
    })),
    programName: 'Work and Travel USA',
    remainingFormatted: plan ? `${(plan.remainingCents / 100).toFixed(2)} USD` : '0.00 USD',
    totalFormatted: plan ? `${(plan.totalCents / 100).toFixed(2)} USD` : '0.00 USD',
  })

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: auth.user.id,
      actorType: 'ADMIN',
      correlationId: crypto.randomUUID(),
      eventType: 'FINANCIAL_REPORT_EXPORTED',
      metadata: { candidateAccountId, type: 'CANDIDATE_LEDGER_EXCEL' },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="Finansijska_kartica_${candidateAccountId}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
