import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { preApplicationExportQuerySchema } from '@/modules/pre-applications/exportSchema.ts'
import { exportPreApplicationsOverview } from '@/modules/pre-applications/exportService.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    // Provera administratorske sesije
    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen. Neophodna administratorska prijava.' }, 401)
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const parsed = preApplicationExportQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return json({ message: 'Neispravni parametri pretrage i filtriranja za izvoz.' }, 400)
    }

    const { buffer, filename } = await exportPreApplicationsOverview({
      adminId: authentication.user.id,
      filters: parsed.data,
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
    console.error('Failed to export pre-applications to Excel:', error)
    return json({ message: 'Greška pri izvozu pre-prijava u Excel tabelu.' }, 500)
  }
}
