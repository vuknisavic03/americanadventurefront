import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Niste autorizovani kao administrator.' }, 401)
  }

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)))

  const whereConditions: Where[] = []

  if (statusFilter && ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'].includes(statusFilter)) {
    whereConditions.push({ status: { equals: statusFilter } })
  }

  if (search && search.trim().length > 0) {
    const term = search.trim()
    whereConditions.push({
      or: [
        { fullName: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
        { idCardNumber: { contains: term } },
      ],
    })
  }

  const where: Where = whereConditions.length > 0 ? { and: whereConditions } : {}

  const result = await payload.find({
    collection: 'candidate-guarantors',
    depth: 1,
    limit,
    overrideAccess: true,
    page,
    sort: '-submittedAt',
    where,
  })

  const docs = result.docs.map((doc) => ({
    candidateAccount: doc.candidateAccount,
    candidateProcess: doc.candidateProcess,
    contractGeneratedAt: doc.contractGeneratedAt ?? null,
    contractPdfSha256: doc.contractPdfSha256 ?? null,
    email: doc.email,
    employerName: doc.employerName,
    employmentStatus: doc.employmentStatus,
    fullName: doc.fullName,
    id: doc.id,
    idCardDocument: doc.idCardDocument,
    idCardIssuer: doc.idCardIssuer,
    idCardNumber: doc.idCardNumber,
    jobTitle: doc.jobTitle,
    jmbgMasked: '******',
    monthlyIncomeRsd: doc.monthlyIncomeRsd,
    preApplication: doc.preApplication,
    promissoryNotesCount: doc.promissoryNotesCount,
    rejectionReason: doc.rejectionReason ?? null,
    relationship: doc.relationship,
    residentialAddress: doc.residentialAddress,
    status: doc.status,
    submittedAt: doc.submittedAt,
    verifiedAt: doc.verifiedAt ?? null,
    verifiedBy: doc.verifiedBy ?? null,
  }))

  return json({
    docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    limit: result.limit,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  })
}
