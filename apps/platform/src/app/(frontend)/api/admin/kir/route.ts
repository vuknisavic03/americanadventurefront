import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getKirBook } from '@/modules/invoices/service.ts'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je neophodna.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const year = url.searchParams.get('year') ? Number(url.searchParams.get('year')) : undefined
  const month = url.searchParams.get('month') ? Number(url.searchParams.get('month')) : undefined

  const entries = await getKirBook({ month, payload, year })
  return Response.json({ entries })
}
