import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getPaymentSlipForCandidate } from '@/modules/invoices/service.ts'

export async function GET(request: Request, context: { params: Promise<{ obligationKey: string }> }) {
  const { obligationKey } = await context.params
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'candidate-accounts') {
    return Response.json({ message: 'Prijavite se na kandidatski portal.' }, { status: 401 })
  }

  try {
    const { bytes, slip } = await getPaymentSlipForCandidate({
      candidateAccountId: auth.user.id,
      obligationKey: decodeURIComponent(obligationKey),
      payload,
    })

    const url = new URL(request.url)
    if (url.searchParams.get('format') === 'json') {
      return Response.json({ slip })
    }

    return new Response(Buffer.from(bytes), {
      headers: {
        'Cache-Control': 'private, no-cache',
        'Content-Disposition': `inline; filename="uplatnica-${slip.obligationKey}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Uplatnica nije mogla biti formirana.'
    return Response.json({ message }, { status: 400 })
  }
}
