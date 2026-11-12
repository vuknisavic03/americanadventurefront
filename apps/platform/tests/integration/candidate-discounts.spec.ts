import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

import { seedVisaCandidate, test } from '../fixtures/visaQuestionnaire.ts'

test('FR-031–034: Commercial discounts (Group, Brand Ambassador, Family, Returnee, Lifeguard, Custom) lifecycle', async ({
  request,
  visaPayload: payload,
}) => {
  const email = `discount-admin-${randomUUID()}@example.test`
  const password = 'Synthetic-discount-admin-2026!'
  const admin = await payload.create({
    collection: 'users',
    data: { displayName: 'Discount Administrator', email, password },
  })
  const login = await payload.login({ collection: 'users', data: { email, password } })
  const adminHeaders = { Authorization: `Bearer ${login.token}` }

  const candidate = await seedVisaCandidate(payload, admin.id)

  // 1. Unauthenticated request rejected
  const unauthRes = await request.get('/api/candidate/discounts')
  expect(unauthRes.status()).toBe(401)

  // 2. Admin creates a discount group (FR-031)
  const groupCode = `FON-${randomUUID().slice(0, 6).toUpperCase()}`
  const createGroupRes = await request.post('/api/admin/discounts/groups', {
    data: {
      discountPerMemberCents: 5000,
      groupCode,
      minMembers: 3,
      name: 'FON Ekipa 2026',
    },
    headers: adminHeaders,
  })
  expect(createGroupRes.status()).toBe(201)
  const groupJson = await createGroupRes.json()
  expect(groupJson.group.groupCode).toBe(groupCode)

  // 3. Admin creates a brand ambassador (FR-032)
  const referralCode = `AMB-${randomUUID().slice(0, 6).toUpperCase()}`
  const createAmbRes = await request.post('/api/admin/discounts/ambassadors', {
    data: {
      defaultDiscountCents: 5000,
      email: `ambassador-${randomUUID()}@example.test`,
      fullName: 'Milica Jovanović',
      referralCode,
      rewardPerReferralCents: 2500,
      season: '2026',
    },
    headers: adminHeaders,
  })
  expect(createAmbRes.status()).toBe(201)

  // 4. Candidate claims group discount with code (FR-031)
  const claimGroupRes = await request.post('/api/candidate/discounts', {
    data: {
      candidateProcessId: candidate.process.id,
      groupCode,
      type: 'GROUP',
    },
    headers: candidate.headers,
  })
  expect(claimGroupRes.status()).toBe(201)
  const claimGroupJson = await claimGroupRes.json()
  expect(claimGroupJson.discount.status).toBe('VERIFIED')
  expect(claimGroupJson.discount.amountCents).toBe(5000)
  expect(claimGroupJson.discount.groupMemberRole).toBe('LEADER')

  // 5. Candidate claims family discount (FR-033) -> PENDING for admin review
  const claimFamilyRes = await request.post('/api/candidate/discounts', {
    data: {
      candidateProcessId: candidate.process.id,
      kinshipType: 'SIBLING',
      relativeFullName: 'Nikola Nikolić',
      type: 'FAMILY',
    },
    headers: candidate.headers,
  })
  expect(claimFamilyRes.status()).toBe(201)
  const familyJson = await claimFamilyRes.json()
  expect(familyJson.discount.status).toBe('PENDING')
  const familyDiscountId = familyJson.discount.id

  // 6. Candidate views their discounts list
  const candListRes = await request.get(`/api/candidate/discounts?candidateProcessId=${candidate.process.id}`, {
    headers: candidate.headers,
  })
  expect(candListRes.status()).toBe(200)
  const candList = await candListRes.json()
  expect(candList.discounts.length).toBeGreaterThanOrEqual(2)

  // 7. Admin lists all discounts
  const adminListRes = await request.get('/api/admin/discounts?status=PENDING', {
    headers: adminHeaders,
  })
  expect(adminListRes.status()).toBe(200)
  const adminList = await adminListRes.json()
  expect(adminList.docs.some((d: { id: number }) => d.id === familyDiscountId)).toBe(true)

  // 8. Admin verifies family discount
  const verifyRes = await request.post(`/api/admin/discounts/${familyDiscountId}/verify`, {
    data: { note: 'Provereno, brat je ugovoren.' },
    headers: adminHeaders,
  })
  expect(verifyRes.status()).toBe(200)
  const verifiedJson = await verifyRes.json()
  expect(verifiedJson.discount.status).toBe('VERIFIED')

  // 9. Candidate claims lifeguard discount with invalid cert -> admin rejects it (FR-034)
  const claimLgRes = await request.post('/api/candidate/discounts', {
    data: {
      candidateProcessId: candidate.process.id,
      lifeguardCertificateNumber: 'LG-INVALID-999',
      lifeguardCertifyingBody: 'RED_CROSS',
      type: 'LIFEGUARD',
    },
    headers: candidate.headers,
  })
  expect(claimLgRes.status()).toBe(201)
  const lgDiscountId = (await claimLgRes.json()).discount.id

  const rejectRes = await request.post(`/api/admin/discounts/${lgDiscountId}/reject`, {
    data: { reason: 'Sertifikat ne postoji u bazi Crvenog krsta.' },
    headers: adminHeaders,
  })
  expect(rejectRes.status()).toBe(200)
  const rejectedJson = await rejectRes.json()
  expect(rejectedJson.discount.status).toBe('REJECTED')

  // 10. Admin grants custom commercial discount
  const customRes = await request.post('/api/admin/discounts', {
    data: {
      adminNotes: 'Popust sa edukativnog sajma',
      amountCents: 3000,
      candidateProcessId: candidate.process.id,
      label: 'Sajamski promo popust',
    },
    headers: adminHeaders,
  })
  expect(customRes.status()).toBe(201)
  const customJson = await customRes.json()
  expect(customJson.discount.status).toBe('VERIFIED')
  expect(customJson.discount.amountCents).toBe(3000)
})
