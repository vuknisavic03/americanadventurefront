import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen.' }, 401)
    }

    const results = await payload.find({
      collection: 'candidate-invitations',
      limit: 100,
      sort: '-createdAt',
    })

    return json({ invitations: results.docs }, 200)
  } catch (error) {
    console.error('Failed to get invitations:', error)
    return json({ message: 'Greška pri učitavanju pozivnica.' }, 500)
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const authentication = await payload.auth({ headers: await headers() })

    if (!authentication.user || authentication.user.collection !== 'users') {
      return json({ message: 'Pristup odbijen.' }, 401)
    }

    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    const email = String(body.email || '').trim().toLowerCase()
    if (!email) {
      return json({ message: 'Email adresa je obavezna.' }, 400)
    }

    // Generiši kod npr. WT-7492 ako nije zadat
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const code = String(body.code || `WT-${randomDigits}`).trim().toUpperCase()

    const basePrice = Number(body.basePrice) || 1850
    const discount = Number(body.discount) || 0
    const finalPrice = Math.max(0, basePrice - discount)

    const created = await payload.create({
      collection: 'candidate-invitations',
      data: {
        code,
        email,
        candidateName: body.candidateName ? String(body.candidateName).trim() : '',
        packageId: body.packageId || 'swt-full',
        packageName: body.packageName || 'Work & Travel USA — Full Placement',
        basePrice,
        discount,
        discountNote: body.discountNote ? String(body.discountNote).trim() : '',
        finalPrice,
        status: 'pending',
      },
    })

    return json({
      message: 'Pozivnica i verifikacioni kod su uspešno kreirani.',
      invitation: created,
    }, 201)
  } catch (error) {
    console.error('Failed to create invitation:', error)
    return json({ message: 'Greška pri kreiranju pozivnice.' }, 500)
  }
}
