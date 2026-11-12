import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { paymentSelectionSchema } from '@/modules/program-offers/schema.ts'
import { PaymentSelectionError, selectPaymentMethod } from '@/modules/program-offers/selectPaymentMethod.ts'

const MAXIMUM_BODY_SIZE = 2 * 1_024

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  const { id } = await params
  const offerId = Number(id)
  if (!Number.isSafeInteger(offerId) || offerId < 1) return json({ message: 'Ponuda nije pronađena.' }, 404)

  const declaredSize = Number(request.headers.get('content-length') ?? 0)
  if (declaredSize > MAXIMUM_BODY_SIZE) return json({ message: 'Zahtev je prevelik.' }, 413)
  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, 'utf8') > MAXIMUM_BODY_SIZE) return json({ message: 'Zahtev je prevelik.' }, 413)

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ message: 'Uneti podaci nisu ispravni.' }, 400)
  }
  const parsed = paymentSelectionSchema.safeParse(body)
  if (!parsed.success) return json({ message: parsed.error.issues[0]?.message ?? 'Izbor nije ispravan.' }, 400)

  try {
    const selection = await selectPaymentMethod({
      accountId: authentication.user.id,
      method: parsed.data.method,
      now: new Date(),
      offerId,
      payload,
    })
    return json({ message: 'Način plaćanja je uspešno izabran.', selectionId: selection.id }, 200)
  } catch (error) {
    if (error instanceof PaymentSelectionError) return json({ message: error.message }, error.status)
    console.error('Payment method selection failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return json({ message: 'Izbor trenutno nije moguće sačuvati. Pokušajte ponovo.' }, 500)
  }
}
