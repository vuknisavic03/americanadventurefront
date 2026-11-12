import {
  clearPortalStore,
  createPortalInvitation,
  deletePortalCandidate,
  getPortalState,
  savePortalAnnouncement,
  savePortalCandidate,
  savePortalCandidateDs160,
  savePortalFaq,
  savePortalPromotions,
  savePortalSiteContent,
  signPortalCandidateContract,
  verifyPortalInvitation,
  resetPortalInvitation,
  type PortalFaqItem,
  type PortalPromotion,
} from '@/modules/portal-sync/localStore.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    status,
  })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')?.trim().toLowerCase()
    const state = await getPortalState()

    if (email) {
      const candidate =
        state.candidates.find((c) => c.email.toLowerCase() === email) || null
      return json({
        announcements: state.announcements,
        candidate,
        candidates: state.candidates,
        faqItems: state.faqItems,
        invitations: state.invitations,
        promotions: state.promotions || [],
        siteContent: state.siteContent,
      })
    }

    return json(state)
  } catch (error) {
    console.error('Failed to get portal state:', error)
    return json({ message: 'Greška pri učitavanju stanja portala.' }, 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      payload?: Record<string, unknown>
    }
    const action = body.action
    const data = body.payload || {}

    if (action === 'createInvitation') {
      const invitation = await createPortalInvitation({
        basePrice: Number(data.basePrice) || undefined,
        candidateName: typeof data.candidateName === 'string' ? data.candidateName : '',
        code: typeof data.code === 'string' ? data.code : undefined,
        discount: Number(data.discount) || 0,
        discountNote: typeof data.discountNote === 'string' ? data.discountNote : '',
        email: String(data.email || ''),
        packageId: typeof data.packageId === 'string' ? data.packageId : 'swt-full',
        packageName: typeof data.packageName === 'string' ? data.packageName : undefined,
      })
      const state = await getPortalState()
      return json({ invitation, invitations: state.invitations }, 201)
    }

    if (action === 'saveCandidate') {
      const candidate = await savePortalCandidate(data)
      const state = await getPortalState()
      return json({
        candidate,
        candidates: state.candidates,
        invitations: state.invitations,
      })
    }

    if (action === 'resetInvitation') {
      const code = String(data.code || '')
      const res = await resetPortalInvitation(code)
      const state = await getPortalState()
      return json({ ...res, invitations: state.invitations })
    }

    if (action === 'deleteCandidate') {
      const id = (data.id || data.email || '') as string | number
      const candidates = await deletePortalCandidate(id)
      return json({ candidates })
    }

    if (action === 'verifyInvitation') {
      const res = await verifyPortalInvitation(
        String(data.email || ''),
        String(data.code || ''),
      )
      return json(
        {
          invitation: res.invitation,
          message: res.message,
          valid: res.valid,
        },
        res.status,
      )
    }

    if (action === 'saveAnnouncement') {
      const announcements = await savePortalAnnouncement({
        channel: typeof data.channel === 'string' ? data.channel : 'E-mail',
        date: typeof data.date === 'string' ? data.date : undefined,
        message: typeof data.message === 'string' ? data.message : '',
        subject: typeof data.subject === 'string' ? data.subject : 'Obaveštenje',
        to: typeof data.to === 'string' ? data.to : 'all',
      })
      const state = await getPortalState()
      return json({ announcements, candidates: state.candidates })
    }

    if (action === 'saveSiteContent') {
      const siteContent = await savePortalSiteContent(
        String(data.itemKey || ''),
        String(data.title || ''),
        String(data.content || ''),
      )
      return json({ siteContent })
    }

    if (action === 'saveFaq') {
      const items = Array.isArray(data.items) ? (data.items as PortalFaqItem[]) : []
      const faqItems = await savePortalFaq(items)
      return json({ faqItems })
    }

    if (action === 'savePromotions') {
      const promos = Array.isArray(data.promotions) ? (data.promotions as PortalPromotion[]) : []
      const saved = await savePortalPromotions(promos)
      return json({ promotions: saved })
    }

    if (action === 'saveDs160') {
      const targetId = (data.candidateId || data.email || '') as string | number
      const answers = (data.ds160 || {}) as Record<string, string>
      const candidate = await savePortalCandidateDs160(targetId, answers)
      return json({ candidate, success: true })
    }

    if (action === 'signContract') {
      const targetId = (data.candidateId || data.id || data.email || '') as string | number
      const reference = typeof data.reference === 'string' ? data.reference : undefined
      const candidate = await signPortalCandidateContract(targetId, reference)
      const state = await getPortalState()
      return json({ candidate, candidates: state.candidates, success: true })
    }

    if (action === 'clearMockData') {
      const clean = await clearPortalStore()
      return json(clean)
    }

    return json({ message: 'Nepoznata akcija.' }, 400)
  } catch (error) {
    console.error('Portal state action failed:', error)
    return json({ message: 'Greška pri izvršavanju akcije na serveru.' }, 500)
  }
}
