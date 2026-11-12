import type { Payload, PayloadRequest, Where } from 'payload'

import type { PreApplication } from '../../payload-types.ts'

import {
  buildDiscountLineItem,
  DEFAULT_DISCOUNT_AMOUNTS,
  isValidDiscountCode,
  normalizeDiscountCode,
  validateFamilyKinshipData,
  validateLifeguardData,
  validateReturneeData,
} from './rules.ts'
import type {
  AmbassadorReferralsSummary,
  CandidateDiscountRecord,
  DiscountStatus,
  DiscountType,
  GroupMembersSummary,
  KinshipType,
  LifeguardCertifyingBody,
} from './types.ts'

function relationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return Number((value as { id: unknown }).id)
  }
  return undefined
}

export class DiscountServiceError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409 = 400,
  ) {
    super(message)
    this.name = 'DiscountServiceError'
  }
}

export interface ClaimDiscountInput {
  type: DiscountType
  // FR-031
  groupCode?: string
  // FR-032
  ambassadorCode?: string
  // FR-033
  kinshipNotes?: string
  kinshipType?: KinshipType
  relativeCandidateAccountId?: number
  relativeFullName?: string
  // FR-034 Returnee
  returneePreviousEmployer?: string
  returneePreviousSponsor?: string
  returneePreviousYear?: number
  // FR-034 Lifeguard
  lifeguardCertificateNumber?: string
  lifeguardCertifyingBody?: LifeguardCertifyingBody
  lifeguardValidUntil?: string
  // Custom
  adminNotes?: string
  customAmountCents?: number
  customLabel?: string
}

async function recordDiscountAudit({
  actorId,
  actorType,
  application,
  eventType,
  metadata,
  now,
  payload,
  req,
}: {
  actorId?: number
  actorType: 'ADMIN' | 'PUBLIC_APPLICANT' | 'SYSTEM'
  application: PreApplication
  eventType: 'DISCOUNT_CLAIMED' | 'DISCOUNT_VERIFIED' | 'DISCOUNT_REJECTED' | 'DISCOUNT_APPLIED'
  metadata: Record<string, unknown>
  now: string
  payload: Payload
  req?: PayloadRequest
}) {
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: actorType === 'ADMIN' ? actorId : undefined,
      actorType,
      correlationId: application.correlationId,
      eventType,
      metadata,
      newStatus: application.status,
      occurredAt: now,
      preApplication: application.id,
      previousStatus: application.status,
      workflowVersion: application.workflowVersion,
    },
    overrideAccess: true,
    req,
  })
}

export async function claimDiscount({
  actor,
  candidateProcessId,
  input,
  now = new Date(),
  payload,
  req,
}: {
  actor: { collection: 'candidate-accounts' | 'users'; id: number }
  candidateProcessId: number
  input: ClaimDiscountInput
  now?: Date
  payload: Payload
  req?: PayloadRequest
}): Promise<CandidateDiscountRecord> {
  const process = await payload.findByID({
    collection: 'candidate-processes',
    depth: 0,
    id: candidateProcessId,
    overrideAccess: true,
    req,
  }).catch(() => undefined)
  if (!process) {
    throw new DiscountServiceError('Kandidatski proces nije pronađen.', 404)
  }

  const candidateAccountId = relationId(process.candidateAccount)
  const preApplicationId = relationId(process.preApplication)
  if (!candidateAccountId || !preApplicationId) {
    throw new DiscountServiceError('Kandidatski nalog ili prijava nisu povezani sa procesom.', 400)
  }

  if (actor.collection === 'candidate-accounts' && actor.id !== candidateAccountId) {
    throw new DiscountServiceError('Nemate dozvolu za podnošenje popusta za drugog kandidata.', 403)
  }

  const preApplication = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  // Prevent multiple discounts of the exact same type for the same process
  const existingSameType = await payload.find({
    collection: 'candidate-discounts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { candidateProcess: { equals: candidateProcessId } },
        { discountType: { equals: input.type } },
        { status: { not_equals: 'REJECTED' } },
      ],
    },
  })
  if (existingSameType.docs.length > 0) {
    throw new DiscountServiceError(
      `Kandidat već ima evidentiran ili aktivan popust tipa ${input.type}.`,
      409,
    )
  }

  let amountCents = DEFAULT_DISCOUNT_AMOUNTS[input.type]
  let label = buildDiscountLineItem(input.type).label
  let initialStatus: DiscountStatus = 'PENDING'
  let discountGroupId: number | undefined
  let groupCode: string | undefined
  let groupMemberRole: 'LEADER' | 'MEMBER' | undefined
  let brandAmbassadorId: number | undefined
  let ambassadorCode: string | undefined

  switch (input.type) {
    case 'GROUP': {
      if (!input.groupCode || !isValidDiscountCode(input.groupCode)) {
        throw new DiscountServiceError('Neispravan format koda grupe.', 400)
      }
      groupCode = normalizeDiscountCode(input.groupCode)
      const groupResult = await payload.find({
        collection: 'discount-groups',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: { groupCode: { equals: groupCode } },
      })
      const group = groupResult.docs[0]
      if (!group) {
        throw new DiscountServiceError(`Grupa sa kodom "${groupCode}" ne postoji.`, 404)
      }
      if (group.status !== 'ACTIVE') {
        throw new DiscountServiceError(`Grupa sa kodom "${groupCode}" je zatvorena.`, 400)
      }
      discountGroupId = group.id
      amountCents = group.discountPerMemberCents
      label = `Grupni popust (${group.name})`

      // Count existing active members to determine role
      const groupMembers = await payload.find({
        collection: 'candidate-discounts',
        depth: 0,
        limit: 100,
        overrideAccess: true,
        req,
        where: {
          and: [
            { discountGroup: { equals: group.id } },
            { status: { not_equals: 'REJECTED' } },
          ],
        },
      })
      groupMemberRole = groupMembers.docs.length === 0 ? 'LEADER' : 'MEMBER'
      // Group discounts are automatically verified once valid code is entered
      initialStatus = 'VERIFIED'
      break
    }

    case 'BRAND_AMBASSADOR': {
      if (!input.ambassadorCode || !isValidDiscountCode(input.ambassadorCode)) {
        throw new DiscountServiceError('Neispravan format koda ambasadora.', 400)
      }
      ambassadorCode = normalizeDiscountCode(input.ambassadorCode)
      const ambassadorResult = await payload.find({
        collection: 'brand-ambassadors',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: { referralCode: { equals: ambassadorCode } },
      })
      const ambassador = ambassadorResult.docs[0]
      if (!ambassador) {
        throw new DiscountServiceError(`Brend ambasador sa kodom "${ambassadorCode}" ne postoji.`, 404)
      }
      if (ambassador.status !== 'ACTIVE') {
        throw new DiscountServiceError(`Kod ambasadora "${ambassadorCode}" više nije aktivan.`, 400)
      }
      brandAmbassadorId = ambassador.id
      amountCents = ambassador.defaultDiscountCents
      label = `Brand Ambassador popust (${ambassador.fullName})`
      initialStatus = 'VERIFIED'
      break
    }

    case 'FAMILY': {
      const val = validateFamilyKinshipData({
        kinshipType: input.kinshipType,
        relativeFullName: input.relativeFullName,
      })
      if (!val.valid) {
        throw new DiscountServiceError(val.error ?? 'Neispravni podaci za porodični popust.', 400)
      }
      label = `Porodični popust (${input.relativeFullName})`
      initialStatus = 'PENDING' // Requires admin verification
      break
    }

    case 'RETURNEE': {
      const val = validateReturneeData({
        returneePreviousYear: input.returneePreviousYear,
      })
      if (!val.valid) {
        throw new DiscountServiceError(val.error ?? 'Neispravna godina prethodnog učešća.', 400)
      }
      label = `Popust za povratnika (${input.returneePreviousYear})`
      initialStatus = 'PENDING' // Requires verification of previous participation
      break
    }

    case 'LIFEGUARD': {
      const val = validateLifeguardData({
        lifeguardCertificateNumber: input.lifeguardCertificateNumber,
        lifeguardCertifyingBody: input.lifeguardCertifyingBody,
        lifeguardValidUntil: input.lifeguardValidUntil,
      })
      if (!val.valid) {
        throw new DiscountServiceError(val.error ?? 'Neispravni podaci za spasilačku licencu.', 400)
      }
      label = `Lifeguard popust (${input.lifeguardCertifyingBody})`
      initialStatus = 'PENDING' // Requires admin verification of certificate
      break
    }

    case 'CUSTOM': {
      if (actor.collection !== 'users') {
        throw new DiscountServiceError('Samo administrator može dodeliti proizvoljan popust.', 403)
      }
      if (!input.customAmountCents || input.customAmountCents <= 0) {
        throw new DiscountServiceError('Iznos popusta mora biti veći od 0.', 400)
      }
      amountCents = input.customAmountCents
      label = input.customLabel?.trim() || 'Prilagođeni administrativni popust'
      initialStatus = 'VERIFIED'
      break
    }

    default:
      throw new DiscountServiceError('Nepoznat tip popusta.', 400)
  }

  const created = await payload.create({
    collection: 'candidate-discounts',
    data: {
      adminNotes: input.adminNotes,
      amountCents,
      brandAmbassador: brandAmbassadorId,
      candidateAccount: candidateAccountId,
      candidateProcess: candidateProcessId,
      discountGroup: discountGroupId,
      discountType: input.type,
      groupCode,
      groupMemberRole,
      ambassadorCode,
      kinshipNotes: input.kinshipNotes,
      kinshipType: input.kinshipType,
      label,
      lifeguardCertificateNumber: input.lifeguardCertificateNumber,
      lifeguardCertifyingBody: input.lifeguardCertifyingBody,
      lifeguardValidUntil: input.lifeguardValidUntil,
      preApplication: preApplicationId,
      relativeCandidateAccount: input.relativeCandidateAccountId,
      relativeFullName: input.relativeFullName,
      returneePreviousEmployer: input.returneePreviousEmployer,
      returneePreviousSponsor: input.returneePreviousSponsor,
      returneePreviousYear: input.returneePreviousYear,
      status: initialStatus,
      verifiedAt: initialStatus === 'VERIFIED' ? now.toISOString() : undefined,
      verifiedBy: initialStatus === 'VERIFIED' && actor.collection === 'users' ? actor.id : undefined,
    },
    overrideAccess: true,
    req,
  })

  await recordDiscountAudit({
    actorId: actor.id,
    actorType: actor.collection === 'users' ? 'ADMIN' : 'PUBLIC_APPLICANT',
    application: preApplication,
    eventType: 'DISCOUNT_CLAIMED',
    metadata: {
      amountCents,
      candidateAccountId,
      candidateProcessId,
      discountId: created.id,
      discountType: input.type,
      initialStatus,
      label,
    },
    now: now.toISOString(),
    payload,
    req,
  })

  return {
    adminNotes: created.adminNotes ?? null,
    amountCents: created.amountCents,
    candidateAccountId,
    candidateProcessId,
    createdAt: created.createdAt,
    discountType: created.discountType as DiscountType,
    id: created.id,
    label: created.label,
    preApplicationId,
    status: created.status as DiscountStatus,
    groupCode: created.groupCode ?? null,
    groupId: discountGroupId ?? null,
    groupMemberRole: created.groupMemberRole ?? null,
    ambassadorCode: created.ambassadorCode ?? null,
    ambassadorId: brandAmbassadorId ?? null,
    kinshipNotes: created.kinshipNotes ?? null,
    kinshipType: (created.kinshipType as KinshipType) ?? null,
    relativeFullName: created.relativeFullName ?? null,
    returneePreviousYear: created.returneePreviousYear ?? null,
    lifeguardCertifyingBody: (created.lifeguardCertifyingBody as LifeguardCertifyingBody) ?? null,
    lifeguardCertificateNumber: created.lifeguardCertificateNumber ?? null,
    verifiedAt: created.verifiedAt ?? null,
  }
}

export async function verifyDiscount({
  adminUserId,
  customAmountCents,
  discountId,
  note,
  now = new Date(),
  payload,
  req,
}: {
  adminUserId: number
  customAmountCents?: number
  discountId: number
  note?: string
  now?: Date
  payload: Payload
  req?: PayloadRequest
}): Promise<CandidateDiscountRecord> {
  const discount = await payload.findByID({
    collection: 'candidate-discounts',
    depth: 0,
    id: discountId,
    overrideAccess: true,
    req,
  }).catch(() => undefined)
  if (!discount) {
    throw new DiscountServiceError('Popust nije pronađen.', 404)
  }

  const preApplicationId = relationId(discount.preApplication)
  const candidateAccountId = relationId(discount.candidateAccount)
  const candidateProcessId = relationId(discount.candidateProcess)
  if (!preApplicationId || !candidateAccountId || !candidateProcessId) {
    throw new DiscountServiceError('Popust nije ispravno povezan.', 400)
  }

  const preApplication = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  const newAmountCents = customAmountCents && customAmountCents > 0 ? customAmountCents : discount.amountCents
  const updated = await payload.update({
    collection: 'candidate-discounts',
    data: {
      amountCents: newAmountCents,
      status: 'VERIFIED',
      verificationNote: note?.trim() || null,
      verifiedAt: now.toISOString(),
      verifiedBy: adminUserId,
    },
    id: discount.id,
    overrideAccess: true,
    req,
  })

  await recordDiscountAudit({
    actorId: adminUserId,
    actorType: 'ADMIN',
    application: preApplication,
    eventType: 'DISCOUNT_VERIFIED',
    metadata: {
      amountCents: newAmountCents,
      candidateAccountId,
      candidateProcessId,
      discountId: discount.id,
      discountType: discount.discountType,
      note,
    },
    now: now.toISOString(),
    payload,
    req,
  })

  return {
    adminNotes: updated.adminNotes ?? null,
    amountCents: updated.amountCents,
    candidateAccountId,
    candidateProcessId,
    createdAt: updated.createdAt,
    discountType: updated.discountType as DiscountType,
    id: updated.id,
    label: updated.label,
    preApplicationId,
    status: updated.status as DiscountStatus,
    verificationNote: updated.verificationNote ?? null,
    verifiedAt: updated.verifiedAt ?? null,
    verifiedById: adminUserId,
  }
}

export async function rejectDiscount({
  adminUserId,
  discountId,
  now = new Date(),
  payload,
  reason,
  req,
}: {
  adminUserId: number
  discountId: number
  now?: Date
  payload: Payload
  reason: string
  req?: PayloadRequest
}): Promise<CandidateDiscountRecord> {
  const discount = await payload.findByID({
    collection: 'candidate-discounts',
    depth: 0,
    id: discountId,
    overrideAccess: true,
    req,
  }).catch(() => undefined)
  if (!discount) {
    throw new DiscountServiceError('Popust nije pronađen.', 404)
  }

  const preApplicationId = relationId(discount.preApplication)
  const candidateAccountId = relationId(discount.candidateAccount)
  const candidateProcessId = relationId(discount.candidateProcess)
  if (!preApplicationId || !candidateAccountId || !candidateProcessId) {
    throw new DiscountServiceError('Popust nije ispravno povezan.', 400)
  }

  const preApplication = await payload.findByID({
    collection: 'pre-applications',
    depth: 0,
    id: preApplicationId,
    overrideAccess: true,
    req,
  })

  const updated = await payload.update({
    collection: 'candidate-discounts',
    data: {
      status: 'REJECTED',
      verificationNote: reason.trim(),
      verifiedAt: now.toISOString(),
      verifiedBy: adminUserId,
    },
    id: discount.id,
    overrideAccess: true,
    req,
  })

  await recordDiscountAudit({
    actorId: adminUserId,
    actorType: 'ADMIN',
    application: preApplication,
    eventType: 'DISCOUNT_REJECTED',
    metadata: {
      candidateAccountId,
      candidateProcessId,
      discountId: discount.id,
      discountType: discount.discountType,
      reason,
    },
    now: now.toISOString(),
    payload,
    req,
  })

  return {
    adminNotes: updated.adminNotes ?? null,
    amountCents: updated.amountCents,
    candidateAccountId,
    candidateProcessId,
    createdAt: updated.createdAt,
    discountType: updated.discountType as DiscountType,
    id: updated.id,
    label: updated.label,
    preApplicationId,
    status: updated.status as DiscountStatus,
    verificationNote: updated.verificationNote ?? null,
    verifiedAt: updated.verifiedAt ?? null,
    verifiedById: adminUserId,
  }
}

export async function applyDiscountsForProcess({
  candidateProcessId,
  now = new Date(),
  payload,
  req,
}: {
  candidateProcessId: number
  now?: Date
  payload: Payload
  req?: PayloadRequest
}): Promise<CandidateDiscountRecord[]> {
  const verified = await payload.find({
    collection: 'candidate-discounts',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    req,
    where: {
      and: [
        { candidateProcess: { equals: candidateProcessId } },
        { status: { equals: 'VERIFIED' } },
      ],
    },
  })

  const appliedList: CandidateDiscountRecord[] = []
  for (const doc of verified.docs) {
    const updated = await payload.update({
      collection: 'candidate-discounts',
      data: { status: 'APPLIED' },
      id: doc.id,
      overrideAccess: true,
      req,
    })

    const preApplicationId = relationId(doc.preApplication)
    if (preApplicationId) {
      const preApplication = await payload.findByID({
        collection: 'pre-applications',
        depth: 0,
        id: preApplicationId,
        overrideAccess: true,
        req,
      })
      await recordDiscountAudit({
        actorType: 'SYSTEM',
        application: preApplication,
        eventType: 'DISCOUNT_APPLIED',
        metadata: {
          amountCents: doc.amountCents,
          candidateProcessId,
          discountId: doc.id,
          discountType: doc.discountType,
        },
        now: now.toISOString(),
        payload,
        req,
      })
    }

    appliedList.push({
      amountCents: updated.amountCents,
      candidateAccountId: relationId(updated.candidateAccount) ?? 0,
      candidateProcessId,
      createdAt: updated.createdAt,
      discountType: updated.discountType as DiscountType,
      id: updated.id,
      label: updated.label,
      preApplicationId: preApplicationId ?? 0,
      status: 'APPLIED',
    })
  }

  return appliedList
}

export async function getCandidateDiscounts({
  candidateProcessId,
  payload,
  req,
}: {
  candidateProcessId: number
  payload: Payload
  req?: PayloadRequest
}): Promise<CandidateDiscountRecord[]> {
  const result = await payload.find({
    collection: 'candidate-discounts',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    req,
    where: { candidateProcess: { equals: candidateProcessId } },
  })

  return result.docs.map((doc) => ({
    adminNotes: doc.adminNotes ?? null,
    amountCents: doc.amountCents,
    candidateAccountId: relationId(doc.candidateAccount) ?? 0,
    candidateProcessId: relationId(doc.candidateProcess) ?? 0,
    createdAt: doc.createdAt,
    discountType: doc.discountType as DiscountType,
    id: doc.id,
    label: doc.label,
    preApplicationId: relationId(doc.preApplication) ?? 0,
    status: doc.status as DiscountStatus,
    groupCode: doc.groupCode ?? null,
    groupMemberRole: doc.groupMemberRole ?? null,
    ambassadorCode: doc.ambassadorCode ?? null,
    kinshipType: (doc.kinshipType as KinshipType) ?? null,
    relativeFullName: doc.relativeFullName ?? null,
    returneePreviousYear: doc.returneePreviousYear ?? null,
    lifeguardCertifyingBody: (doc.lifeguardCertifyingBody as LifeguardCertifyingBody) ?? null,
    lifeguardCertificateNumber: doc.lifeguardCertificateNumber ?? null,
    lifeguardValidUntil: doc.lifeguardValidUntil ?? null,
    verificationNote: doc.verificationNote ?? null,
    verifiedAt: doc.verifiedAt ?? null,
  }))
}

export async function getApplicableDiscountsForProcess({
  candidateProcessId,
  payload,
  req,
}: {
  candidateProcessId: number
  payload: Payload
  req?: PayloadRequest
}): Promise<{ amountCents: number; candidateDiscountId: number; discountType: DiscountType; label: string }[]> {
  const result = await payload.find({
    collection: 'candidate-discounts',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    req,
    where: {
      and: [
        { candidateProcess: { equals: candidateProcessId } },
        { status: { in: ['VERIFIED', 'APPLIED'] } },
      ],
    },
  })

  return result.docs.map((doc) => ({
    amountCents: doc.amountCents,
    candidateDiscountId: doc.id,
    discountType: doc.discountType as DiscountType,
    label: doc.label,
  }))
}

export async function listDiscountsForAdmin({
  discountType,
  limit = 20,
  page = 1,
  payload,
  search,
  status,
}: {
  discountType?: DiscountType
  limit?: number
  page?: number
  payload: Payload
  search?: string
  status?: DiscountStatus
}) {
  const whereConditions: Where[] = []
  if (status) whereConditions.push({ status: { equals: status } })
  if (discountType) whereConditions.push({ discountType: { equals: discountType } })
  if (search?.trim()) {
    whereConditions.push({
      or: [
        { label: { like: search.trim() } },
        { groupCode: { like: search.trim() } },
        { ambassadorCode: { like: search.trim() } },
        { relativeFullName: { like: search.trim() } },
      ],
    })
  }

  const where: Where | undefined = whereConditions.length > 0 ? { and: whereConditions } : undefined
  const result = await payload.find({
    collection: 'candidate-discounts',
    depth: 1,
    limit,
    page,
    overrideAccess: true,
    sort: '-createdAt',
    where,
  })

  return {
    docs: result.docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

export async function getGroupSummary({
  groupId,
  payload,
}: {
  groupId: number
  payload: Payload
}): Promise<GroupMembersSummary> {
  const group = await payload.findByID({
    collection: 'discount-groups',
    depth: 0,
    id: groupId,
    overrideAccess: true,
  }).catch(() => undefined)
  if (!group) {
    throw new DiscountServiceError('Grupa nije pronađena.', 404)
  }

  const membersResult = await payload.find({
    collection: 'candidate-discounts',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    where: { discountGroup: { equals: groupId } },
  })

  const members = membersResult.docs.map((m) => {
    const acc = typeof m.candidateAccount === 'object' && m.candidateAccount !== null
      ? (m.candidateAccount as { email?: string; id?: number })
      : undefined
    return {
      amountCents: m.amountCents,
      candidateAccountId: relationId(m.candidateAccount) ?? 0,
      candidateName: acc?.email ?? `Kandidat #${relationId(m.candidateAccount)}`,
      candidateProcessId: relationId(m.candidateProcess) ?? 0,
      discountId: m.id,
      role: (m.groupMemberRole as 'LEADER' | 'MEMBER') ?? 'MEMBER',
      status: m.status as DiscountStatus,
    }
  })

  return {
    discountPerMemberCents: group.discountPerMemberCents,
    groupCode: group.groupCode,
    groupId: group.id,
    groupName: group.name,
    members,
    minMembers: group.minMembers,
    status: group.status as 'ACTIVE' | 'CLOSED',
    totalMembers: members.length,
  }
}

export async function getAmbassadorSummary({
  ambassadorId,
  payload,
}: {
  ambassadorId: number
  payload: Payload
}): Promise<AmbassadorReferralsSummary> {
  const ambassador = await payload.findByID({
    collection: 'brand-ambassadors',
    depth: 0,
    id: ambassadorId,
    overrideAccess: true,
  }).catch(() => undefined)
  if (!ambassador) {
    throw new DiscountServiceError('Brend ambasador nije pronađen.', 404)
  }

  const referralsResult = await payload.find({
    collection: 'candidate-discounts',
    depth: 1,
    limit: 500,
    overrideAccess: true,
    where: { brandAmbassador: { equals: ambassadorId } },
  })

  const referrals = referralsResult.docs.map((r) => {
    const acc = typeof r.candidateAccount === 'object' && r.candidateAccount !== null
      ? (r.candidateAccount as { email?: string; id?: number })
      : undefined
    return {
      amountCents: r.amountCents,
      candidateAccountId: relationId(r.candidateAccount) ?? 0,
      candidateName: acc?.email ?? `Kandidat #${relationId(r.candidateAccount)}`,
      candidateProcessId: relationId(r.candidateProcess) ?? 0,
      discountId: r.id,
      status: r.status as DiscountStatus,
    }
  })

  return {
    ambassadorCode: ambassador.referralCode,
    ambassadorId: ambassador.id,
    ambassadorName: ambassador.fullName,
    defaultDiscountCents: ambassador.defaultDiscountCents,
    email: ambassador.email,
    referrals,
    rewardPerReferralCents: ambassador.rewardPerReferralCents,
    status: ambassador.status as 'ACTIVE' | 'INACTIVE',
    totalReferrals: referrals.length,
  }
}
