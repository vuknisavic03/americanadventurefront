import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  GuarantorServiceError,
  generateGuarantorContract,
  getGuarantorContractPdf,
} from '@/modules/guarantor/service.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET() {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || authentication.user.collection !== 'candidate-accounts') {
    return json({ message: 'Sesija je istekla. Prijavite se ponovo.' }, 401)
  }

  const existing = (
    await payload.find({
      collection: 'candidate-guarantors',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: authentication.user.id } },
    })
  ).docs[0]

  if (!existing) {
    return json({ message: 'Podaci o jemcu nisu pronađeni.' }, 404)
  }

  try {
    // Generate if not already generated and status is VERIFIED
    if (!existing.contractPdfSha256) {
      if (existing.status !== 'VERIFIED') {
        return json(
          { message: 'Ugovor o jemstvu biće dostupan nakon što administrator verifikuje podatke jemca.' },
          400,
        )
      }
      await generateGuarantorContract({
        guarantorId: existing.id,
        now: new Date(),
        payload,
      })
    }

    const { fileName, pdfBytes } = await getGuarantorContractPdf({
      guarantorId: existing.id,
      payload,
    })

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/pdf',
      },
      status: 200,
    })
  } catch (error) {
    if (error instanceof GuarantorServiceError) {
      return json({ message: error.message }, error.status)
    }
    console.error('Error fetching guarantor contract PDF:', error)
    return json({ message: 'Došlo je do greške prilikom preuzimanja ugovora o jemstvu.' }, 500)
  }
}
