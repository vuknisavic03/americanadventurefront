import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { adminCandidateExportQuerySchema } from '@/modules/admin-candidates/schema.ts'
import { exportCandidatesOverview } from '@/modules/admin-candidates/service.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    // Provera da li je ulogovan admin
    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = adminCandidateExportQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return json({ message: 'Neispravni parametri pretrage i filtriranja za izvoz.' }, 400)
    }

    const { buffer, filename } = await exportCandidatesOverview({
      adminId: authentication.user.id,
      filters: {
        currentStep: parsed.data.currentStep,
        fields: parsed.data.fields,
        format: parsed.data.format,
        hasJobOffer: parsed.data.hasJobOffer,
        limit: parsed.data.limit,
        page: parsed.data.page,
        passportNumber: parsed.data.passportNumber,
        processStatus: parsed.data.processStatus,
        programCode: parsed.data.programCode,
        search: parsed.data.search || parsed.data.q,
        withoutJobOffer: parsed.data.withoutJobOffer,
      },
      payload,
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      status: 200,
    })
  } catch (error) {
    console.error('Failed to export candidates to Excel:', error)
    return json({ message: 'Greška pri izvozu kandidata u Excel tabelu.' }, 500)
  }
}
