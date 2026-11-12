import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { attachmentContentDisposition } from '@/lib/http/contentDisposition.ts'
import { downloadGeneratedContract, GeneratedContractError } from '@/modules/generated-contracts/service.ts'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const authentication = await payload.auth({ headers: await headers() })
  if (!authentication.user || !['candidate-accounts', 'users'].includes(authentication.user.collection)) {
    return Response.json({ message: 'Prijavite se da biste pristupili ugovoru.' }, { status: 401 })
  }
  const contractId = Number((await params).id)
  if (!Number.isInteger(contractId) || contractId < 1) return Response.json({ message: 'Ugovor nije pronađen.' }, { status: 404 })
  try {
    const result = await downloadGeneratedContract({
      actor: { collection: authentication.user.collection as 'candidate-accounts' | 'users', id: authentication.user.id },
      contractId,
      now: new Date(),
      payload,
    })
    return new Response(new Uint8Array(result.bytes), {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': attachmentContentDisposition(result.fileName),
        'Content-Length': String(result.bytes.length),
        'Content-Type': 'application/pdf',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
      status: 200,
    })
  } catch (error) {
    if (error instanceof GeneratedContractError) return Response.json({ message: error.message }, { status: error.status })
    console.error('Contract download failed.', error instanceof Error ? error.name : 'UNKNOWN_ERROR')
    return Response.json({ message: 'Ugovor trenutno nije dostupan.' }, { status: 500 })
  }
}

