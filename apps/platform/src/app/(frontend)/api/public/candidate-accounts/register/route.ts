import {
  savePortalCandidate,
  verifyPortalInvitation,
} from '@/modules/portal-sync/localStore.ts'

function json(body: unknown, status: number) {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' }, status })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    const code = String(body.code || '').trim().toUpperCase()
    const email = String(body.email || '').trim().toLowerCase()
    const firstName = String(body.firstName || '').trim()
    const lastName = String(body.lastName || '').trim()

    if (!code || !email || !firstName || !lastName) {
      return json({ message: 'Nedostaju obavezni podaci za registraciju.' }, 400)
    }

    const verification = await verifyPortalInvitation(email, code)
    if (!verification.valid || !verification.invitation) {
      return json(
        { message: verification.message || 'Verifikacioni kod nije ispravan.' },
        verification.status || 400,
      )
    }

    const inv = verification.invitation
    const savedApp = await savePortalCandidate({
      id: body.id && !String(body.id).startsWith('preapp-') ? body.id : `cand-${Date.now()}`,
      basePrice: inv.basePrice || Number(body.basePrice) || 1850,
      code,
      cvFileName: body.cvFileName || undefined,
      discount: inv.discount ?? Number(body.discount) ?? 0,
      discountNote: inv.discountNote || body.discountNote || '',
      email: inv.email.toLowerCase(),
      faculty: body.faculty ? String(body.faculty).trim() : undefined,
      studyCity: body.studyCity ? String(body.studyCity).trim() : undefined,
      studyYear: body.studyYear || undefined,
      ectsPoints: body.ectsPoints !== undefined ? Number(body.ectsPoints) : undefined,
      birthDate: body.birthDate ? String(body.birthDate).trim() : undefined,
      address: body.address ? String(body.address).trim() : undefined,
      passportExpiryDate: body.passportExpiryDate ? String(body.passportExpiryDate).trim() : undefined,
      gender: body.gender ? String(body.gender).trim() : undefined,
      facultyCertAiTranslation: Boolean(body.facultyCertAiTranslation),
      facultyCertFileName: body.facultyCertFileName || undefined,
      finalPrice: inv.finalPrice || Number(body.finalPrice) || 1850,
      firstName,
      guarantor: body.guarantor || null,
      idCardNumber: body.idCardNumber ? String(body.idCardNumber).trim() : '',
      passportNumber: body.passportNumber
        ? String(body.passportNumber).trim()
        : body.idCardNumber
        ? String(body.idCardNumber).trim()
        : undefined,
      passportImage: body.passportImage || body.passportScanDataUrl || undefined,
      passportScanDataUrl: body.passportScanDataUrl || body.passportImage || undefined,
      passportScanFileName:
        body.passportScanFileName ||
        (body.passportImage || body.passportScanDataUrl ? 'Sken_Pasosa_OCR.png' : undefined),
      passportScanUrl: body.passportScanUrl || undefined,
      jmbg: body.jmbg ? String(body.jmbg).trim() : '',
      lastName,
      notes: 'Uspešno registrovan preko verifikacionog koda ' + code,
      packageId: inv.packageId || body.packageId || 'swt-full',
      packageName: inv.packageName || body.packageName || 'Work & Travel USA — Full Placement',
      paymentMethod: body.paymentMethod || 'now',
      phone: body.phone ? String(body.phone).trim() : undefined,
      preferences: body.preferences || {
        englishLevel: 'B2',
        location: '',
        position: '',
        testLink: '',
      },
      progress: 40,
      status: 'review',
      isRegistered: true,
      registeredAt: body.registeredAt || new Date().toISOString(),
      selectionDecision: 'QUALIFIED',
      activationCode: code,
      youtubeUrl: body.youtubeUrl || undefined,
    })

    return json(
      {
        candidate: savedApp,
        message: 'Registracija je uspešno završena.',
      },
      200,
    )
  } catch (error) {
    console.error('Registration failed:', error)
    return json({ message: 'Registracija trenutno nije uspela. Molimo pokušajte ponovo.' }, 500)
  }
}
