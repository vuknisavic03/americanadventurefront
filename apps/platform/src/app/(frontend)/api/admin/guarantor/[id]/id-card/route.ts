import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import {
  decryptSensitiveBytes,
  readSensitiveDataKeyring,
} from '@/modules/candidate-documents/sensitiveDataCrypto.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

function relationId(value: number | { id: number } | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  return typeof value === 'number' ? value : value.id
}

export async function GET(
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

  const guarantor = await payload
    .findByID({
      collection: 'candidate-guarantors',
      depth: 0,
      id: guarantorId,
      overrideAccess: true,
    })
    .catch(() => undefined)

  if (!guarantor) {
    return json({ message: 'Jemac nije pronađen.' }, 404)
  }

  const idCardDocId = relationId(guarantor.idCardDocument)
  if (!idCardDocId) {
    return json({ message: 'Očitana lična karta još uvek nije postavljena.' }, 404)
  }

  const document = await payload.findByID({
    collection: 'candidate-private-documents',
    depth: 0,
    id: idCardDocId,
    overrideAccess: true,
  })

  if (!document) {
    return json({ message: 'Dokument lične karte nije pronađen.' }, 404)
  }

  try {
    const candidateAccountId = relationId(guarantor.candidateAccount)!
    const keyring = readSensitiveDataKeyring()
    const decryptedBytes = decryptSensitiveBytes(
      {
        authTag: document.authTag,
        ciphertext: document.ciphertext,
        iv: document.iv,
        keyId: document.keyId,
      },
      keyring,
      `guarantor-id-card:${candidateAccountId}`,
    )

    // Audit log access
    const preApplicationId = relationId(guarantor.preApplication)
    if (preApplicationId) {
      const preApp = await payload.findByID({
        collection: 'pre-applications',
        depth: 0,
        id: preApplicationId,
        overrideAccess: true,
      })

      await payload.create({
        collection: 'audit-events',
        data: {
          actor: authentication.user.id,
          actorType: 'ADMIN',
          correlationId: preApp.correlationId,
          eventType: 'PRIVATE_DOCUMENT_ACCESSED',
          metadata: {
            documentId: document.id,
            documentType: document.documentType,
            guarantorId,
          },
          occurredAt: new Date().toISOString(),
          preApplication: preApplicationId,
        },
        overrideAccess: true,
      })
    }

    return new Response(new Uint8Array(decryptedBytes), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${document.originalFileName}"`,
        'Content-Type': document.mimeType,
      },
      status: 200,
    })
  } catch (error) {
    console.error('Error decrypting guarantor ID card:', error)
    return json({ message: 'Došlo je do greške prilikom dešifrovanja lične karte jemca.' }, 500)
  }
}
