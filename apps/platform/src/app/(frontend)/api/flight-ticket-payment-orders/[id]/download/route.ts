import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { attachmentContentDisposition } from '@/lib/http/contentDisposition.ts'
import { downloadFlightTicketPaymentOrder, FlightTicketPaymentError } from '@/modules/flight-ticket-payments/service.ts'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || !['candidate-accounts', 'users'].includes(authentication.user.collection)) return Response.json({ message: 'Prijavite se da biste preuzeli nalog.' }, { status: 401 })
  const orderId = Number((await params).id)
  if (!Number.isSafeInteger(orderId) || orderId < 1) return Response.json({ message: 'Nalog nije pronađen.' }, { status: 404 })
  try {
    const result = await downloadFlightTicketPaymentOrder({ actor: { collection: authentication.user.collection as 'candidate-accounts' | 'users', id: authentication.user.id }, orderId, payload })
    return new Response(new Uint8Array(result.bytes), { headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Content-Disposition': attachmentContentDisposition(result.fileName), 'Content-Length': String(result.bytes.length), 'Content-Type': 'application/pdf', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } })
  } catch (error) {
    if (error instanceof FlightTicketPaymentError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Flight ticket payment order download failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return Response.json({ message: 'Nalog trenutno nije dostupan.' }, { status: 500 })
  }
}
