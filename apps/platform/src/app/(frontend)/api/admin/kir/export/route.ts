import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getKirBook } from '@/modules/invoices/service.ts'
import { generateKirExcelBuffer } from '@/modules/invoices/exportExcel.ts'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je neophodna.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const year = url.searchParams.get('year') ? Number(url.searchParams.get('year')) : new Date().getFullYear()
  const month = url.searchParams.get('month') ? Number(url.searchParams.get('month')) : undefined

  const entries = await getKirBook({ month, payload, year })
  const buffer = await generateKirExcelBuffer(entries)

  await payload.create({
    collection: 'audit-events',
    data: {
      actor: auth.user.id,
      actorType: 'ADMIN',
      correlationId: crypto.randomUUID(),
      eventType: 'FINANCIAL_REPORT_EXPORTED',
      metadata: { count: entries.length, month, type: 'KIR_EXCEL', year },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="KIR_Knjiga_${year}${month ? `_${month}` : ''}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
