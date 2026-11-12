import { verifyPortalInvitation } from '@/modules/portal-sync/localStore.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const { email, code } = JSON.parse(rawBody)

    const result = await verifyPortalInvitation(String(email || ''), String(code || ''))
    if (!result.valid) {
      return json({ message: result.message, valid: false }, result.status)
    }

    return json(
      {
        invitation: result.invitation,
        valid: true,
      },
      200,
    )
  } catch (error) {
    console.error('Error verifying invitation code:', error)
    return json({ message: 'Greška pri obradi zahteva.', valid: false }, 500)
  }
}
