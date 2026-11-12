import type { Payload, Where } from 'payload'

import type { PeerContactInfo, PeerNetworkingState } from './rules.ts'

export async function materialsForCandidate({
  payload,
  programCode = 'SWT',
}: {
  payload: Payload
  programCode?: string
}) {
  const result = await payload.find({
    collection: 'usa-stay-materials',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: 'sortOrder',
    where: {
      and: [
        { published: { equals: true } },
        {
          or: [
            { programCode: { equals: programCode } },
            { programCode: { equals: 'ALL' } },
          ],
        },
      ],
    },
  })

  return result.docs.map((doc) => ({
    category: doc.category,
    description: doc.description ?? '',
    fileName: doc.fileName,
    fileSize: doc.fileSize ?? '',
    fileUrl: doc.fileUrl,
    id: doc.id,
    sortOrder: doc.sortOrder ?? 0,
    title: doc.title,
  }))
}

export async function tipsForCandidate({
  category,
  payload,
}: {
  category?: string
  payload: Payload
}) {
  const whereConditions: Where[] = [{ published: { equals: true } }]

  if (category && category !== 'ALL') {
    whereConditions.push({ category: { equals: category } })
  }

  const result = await payload.find({
    collection: 'usa-stay-tips',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: ['-pinned', 'sortOrder', '-createdAt'],
    where: {
      and: whereConditions,
    },
  })

  return result.docs.map((doc) => ({
    category: doc.category,
    content: doc.content,
    id: doc.id,
    pinned: Boolean(doc.pinned),
    sortOrder: doc.sortOrder ?? 0,
    summary: doc.summary,
    title: doc.title,
  }))
}

export async function peerNetworkingForCandidate({
  accountId,
  payload,
}: {
  accountId: number
  payload: Payload
}): Promise<PeerNetworkingState> {
  const processResult = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { candidateAccount: { equals: accountId } },
  })

  const process = processResult.docs[0]
  if (!process) {
    return {
      hasConsent: false,
      myPlacement: null,
      peersSameEmployer: [],
      peersSameState: [],
      totalEligiblePeers: 0,
    }
  }

  const hasConsent = Boolean(process.peerSharingConsent)

  // 1. Pronađi prihvaćenu radnu ponudu za trenutnog kandidata
  const myOfferResult = await payload.find({
    collection: 'employment-offers',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-publishedAt',
    where: {
      and: [
        { candidateProcess: { equals: process.id } },
        { status: { equals: 'ACCEPTED' } },
      ],
    },
  })

  const myOffer = myOfferResult.docs[0]
  if (!myOffer) {
    return {
      hasConsent,
      myPlacement: null,
      peersSameEmployer: [],
      peersSameState: [],
      totalEligiblePeers: 0,
    }
  }

  const myPlacement = {
    city: String(myOffer.workCity || '').trim(),
    employerName: String(myOffer.employerName || '').trim(),
    state: String(myOffer.workState || '').trim(),
  }

  // 2. Pronađi sve druge procese koji su dali pristanak (peerSharingConsent = true)
  const otherProcesses = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { id: { not_equals: process.id } },
        { peerSharingConsent: { equals: true } },
      ],
    },
  })

  if (otherProcesses.docs.length === 0) {
    return {
      hasConsent,
      myPlacement,
      peersSameEmployer: [],
      peersSameState: [],
      totalEligiblePeers: 0,
    }
  }

  const otherProcessIds = otherProcesses.docs.map((p) => p.id)

  // 3. Pronađi prihvaćene ponude tih drugih procesa
  const otherOffers = await payload.find({
    collection: 'employment-offers',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { candidateProcess: { in: otherProcessIds } },
        { status: { equals: 'ACCEPTED' } },
      ],
    },
  })

  const normEmployer = myPlacement.employerName.toLowerCase()
  const normState = myPlacement.state.toLowerCase()

  const sameEmployerList: PeerContactInfo[] = []
  const sameStateList: PeerContactInfo[] = []

  for (const offer of otherOffers.docs) {
    const peerAccount = typeof offer.candidateAccount === 'object' && offer.candidateAccount !== null
      ? offer.candidateAccount as { email: string; fullName: string; id: number }
      : null

    if (!peerAccount || !peerAccount.email) continue

    const peerEmployer = String(offer.employerName || '').trim()
    const peerState = String(offer.workState || '').trim()
    const peerCity = String(offer.workCity || '').trim()

    const isSameEmp = peerEmployer.toLowerCase() === normEmployer
    const isSameSt = peerState.toLowerCase() === normState

    if (isSameEmp) {
      sameEmployerList.push({
        city: peerCity,
        email: peerAccount.email,
        employerName: peerEmployer,
        fullName: peerAccount.fullName || 'Student',
        id: peerAccount.id,
        state: peerState,
      })
    } else if (isSameSt) {
      sameStateList.push({
        city: peerCity,
        email: peerAccount.email,
        employerName: peerEmployer,
        fullName: peerAccount.fullName || 'Student',
        id: peerAccount.id,
        state: peerState,
      })
    }
  }

  const totalEligiblePeers = sameEmployerList.length + sameStateList.length

  // Ako kandidat nije dao pristanak, ne otkrivamo kontakte drugih studenata (Privacy Preservation)
  if (!hasConsent) {
    return {
      hasConsent: false,
      myPlacement,
      peersSameEmployer: [],
      peersSameState: [],
      totalEligiblePeers,
    }
  }

  return {
    hasConsent: true,
    myPlacement,
    peersSameEmployer: sameEmployerList,
    peersSameState: sameStateList,
    totalEligiblePeers,
  }
}

export async function updatePeerConsent({
  accountId,
  consent,
  payload,
}: {
  accountId: number
  consent: boolean
  payload: Payload
}) {
  const processResult = await payload.find({
    collection: 'candidate-processes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { candidateAccount: { equals: accountId } },
  })

  const process = processResult.docs[0]
  if (!process) {
    throw new Error('Candidate process not found')
  }

  await payload.update({
    collection: 'candidate-processes',
    data: {
      peerSharingConsent: consent,
    },
    id: process.id,
    overrideAccess: true,
  })

  return { consent }
}
