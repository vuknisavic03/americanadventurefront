import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'users') {
    return Response.json({ message: 'Administratorska sesija je neophodna.' }, { status: 401 })
  }

  const invoice = await payload.findByID({
    collection: 'candidate-invoices',
    depth: 0,
    id: Number(id),
    overrideAccess: true,
  }).catch(() => null)

  if (!invoice || !invoice.pdfBase64) {
    return Response.json({ message: 'Faktura ili PDF nisu pronađeni.' }, { status: 404 })
  }

  const buffer = Buffer.from(invoice.pdfBase64, 'base64')
  return new Response(buffer, {
    headers: {
      'Cache-Control': 'private, no-cache',
      'Content-Disposition': `attachment; filename="faktura-${invoice.invoiceNumber}.pdf"`,
      'Content-Type': 'application/pdf',
    },
  })
}
