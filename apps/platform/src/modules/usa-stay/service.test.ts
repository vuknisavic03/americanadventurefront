import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  materialsForCandidate,
  peerNetworkingForCandidate,
  tipsForCandidate,
  updatePeerConsent,
} from './service.ts'

describe('usa-stay service', () => {
  it('returns published materials for candidate program', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'usa-stay-materials') {
          return {
            docs: [
              {
                category: 'HANDBOOK',
                description: 'Opšti priručnik.',
                fileName: 'handbook.pdf',
                fileSize: '1.2 MB',
                fileUrl: '/docs/handbook.pdf',
                id: 1,
                programCode: 'SWT',
                published: true,
                sortOrder: 1,
                title: 'SWT Vodič',
              },
            ],
            totalDocs: 1,
          }
        }
        return { docs: [], totalDocs: 0 }
      }),
    } as unknown as Payload

    const materials = await materialsForCandidate({ payload, programCode: 'SWT' })
    expect(materials).toHaveLength(1)
    expect(materials[0].title).toBe('SWT Vodič')
    expect(materials[0].category).toBe('HANDBOOK')
  })

  it('returns published tips sorted with pinned first', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => {
        if (collection === 'usa-stay-tips') {
          return {
            docs: [
              {
                category: 'SSN',
                content: 'Koraci za SSN...',
                id: 1,
                pinned: true,
                published: true,
                sortOrder: 0,
                summary: 'Kako izvaditi SSN',
                title: 'Vađenje SSN broja',
              },
            ],
            totalDocs: 1,
          }
        }
        return { docs: [], totalDocs: 0 }
      }),
    } as unknown as Payload

    const tips = await tipsForCandidate({ payload, category: 'SSN' })
    expect(tips).toHaveLength(1)
    expect(tips[0].title).toBe('Vađenje SSN broja')
    expect(tips[0].pinned).toBe(true)
  })

  it('protects peer contact details when candidate has not given consent', async () => {
    const myProcess = { id: 10, candidateAccount: 101, peerSharingConsent: false }
    const myOffer = { candidateProcess: 10, employerName: 'Grand Resort', workCity: 'Cape Cod', workState: 'MA', status: 'ACCEPTED' }
    const otherProcess = { id: 20, candidateAccount: 102, peerSharingConsent: true }
    const otherOffer = {
      candidateAccount: { id: 102, fullName: 'Marko Marković', email: 'marko@example.com' },
      candidateProcess: 20,
      employerName: 'Grand Resort',
      workCity: 'Cape Cod',
      workState: 'MA',
      status: 'ACCEPTED',
    }

    const payload = {
      find: vi.fn(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
        if (collection === 'candidate-processes') {
          // If searching for my process
          if (where?.candidateAccount) return { docs: [myProcess], totalDocs: 1 }
          // If searching for other processes
          return { docs: [otherProcess], totalDocs: 1 }
        }
        if (collection === 'employment-offers') {
          // My offer
          if (JSON.stringify(where).includes('"candidateProcess":{"equals":10}')) {
            return { docs: [myOffer], totalDocs: 1 }
          }
          // Other offer
          return { docs: [otherOffer], totalDocs: 1 }
        }
        return { docs: [], totalDocs: 0 }
      }),
    } as unknown as Payload

    const result = await peerNetworkingForCandidate({ accountId: 101, payload })
    expect(result.hasConsent).toBe(false)
    expect(result.myPlacement?.employerName).toBe('Grand Resort')
    // Privacy check: Contacts MUST be empty when consent is false!
    expect(result.peersSameEmployer).toHaveLength(0)
    expect(result.peersSameState).toHaveLength(0)
    expect(result.totalEligiblePeers).toBe(1)
  })

  it('exposes peer contact details when candidate has given consent', async () => {
    const myProcess = { id: 10, candidateAccount: 101, peerSharingConsent: true }
    const myOffer = { candidateProcess: 10, employerName: 'Grand Resort', workCity: 'Cape Cod', workState: 'MA', status: 'ACCEPTED' }
    const peer1Process = { id: 20, candidateAccount: 102, peerSharingConsent: true }
    const peer1Offer = {
      candidateAccount: { id: 102, fullName: 'Marko Marković', email: 'marko@example.com' },
      candidateProcess: 20,
      employerName: 'Grand Resort', // Same employer
      workCity: 'Cape Cod',
      workState: 'MA',
      status: 'ACCEPTED',
    }
    const peer2Process = { id: 30, candidateAccount: 103, peerSharingConsent: true }
    const peer2Offer = {
      candidateAccount: { id: 103, fullName: 'Jovana Jović', email: 'jovana@example.com' },
      candidateProcess: 30,
      employerName: 'Beach Club LLC', // Different employer, same state
      workCity: 'Boston',
      workState: 'MA',
      status: 'ACCEPTED',
    }

    const payload = {
      find: vi.fn(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
        if (collection === 'candidate-processes') {
          if (where?.candidateAccount) return { docs: [myProcess], totalDocs: 1 }
          return { docs: [peer1Process, peer2Process], totalDocs: 2 }
        }
        if (collection === 'employment-offers') {
          if (JSON.stringify(where).includes('"candidateProcess":{"equals":10}')) {
            return { docs: [myOffer], totalDocs: 1 }
          }
          return { docs: [peer1Offer, peer2Offer], totalDocs: 2 }
        }
        return { docs: [], totalDocs: 0 }
      }),
    } as unknown as Payload

    const result = await peerNetworkingForCandidate({ accountId: 101, payload })
    expect(result.hasConsent).toBe(true)
    expect(result.peersSameEmployer).toHaveLength(1)
    expect(result.peersSameEmployer[0].email).toBe('marko@example.com')
    expect(result.peersSameState).toHaveLength(1)
    expect(result.peersSameState[0].email).toBe('jovana@example.com')
  })

  it('updates peer sharing consent on candidate process', async () => {
    const updateFn = vi.fn().mockResolvedValue({ id: 10, peerSharingConsent: true })
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 10, candidateAccount: 101 }], totalDocs: 1 }),
      update: updateFn,
    } as unknown as Payload

    const result = await updatePeerConsent({ accountId: 101, consent: true, payload })
    expect(result.consent).toBe(true)
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'candidate-processes',
        id: 10,
        data: { peerSharingConsent: true },
      }),
    )
  })
})
