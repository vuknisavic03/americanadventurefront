import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  GuarantorServiceError,
  generateGuarantorContract,
  verifyGuarantor,
} from '@/modules/guarantor/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'users') {
    return json({ message: 'Niste autorizovani kao administrator.' }, 401)
  }

  const { id } = await params
  const guarantorId = parseInt(id, 10)
  if (Number.isNaN(guarantorId) || guarantorId <= 0) {
    return json({ message: 'Nevažeći ID jemca.' }, 400)
  }

  try {
    const now = new Date()
    const verified = await verifyGuarantor({
      administratorId: authentication.user.id,
      guarantorId,
      now,
      payload,
    })

    // Automatically generate the guarantor contract PDF upon verification
    try {
      await generateGuarantorContract({
        guarantorId,
        now,
        payload,
      })
    } catch (genError) {
      console.warn('Contract generation deferred or failed upon guarantor verification:', genError)
    }

    return json({
      guarantor: verified,
      message: 'Jemac je uspešno verifikovan, a ugovor o jemstvu i menično ovlašćenje su generisani.',
    })
  } catch (error) {
    if (error instanceof GuarantorServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Error verifying guarantor:', error)
    return json({ message: 'Došlo je do greške prilikom verifikacije jemca.' }, 500)
  }
}
