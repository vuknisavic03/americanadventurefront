import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import {
  calculateProgressPercent,
  getStepLabel,
  matchesSearchQuery,
  projectFields,
  type AdminCandidateDetail,
  type AdminCandidateFilterOptions,
  type AdminCandidateOverviewItem,
  type AdminCandidateUpdatePayload,
} from './rules.ts'
import { generateCandidatesExcelBuffer, generateEmbassyExcelBuffer } from './export.ts'

function relationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return Number((value as { id: unknown }).id)
  }
  return undefined
}

export async function listCandidatesOverview({
  filters = {},
  payload,
}: {
  filters?: AdminCandidateFilterOptions
  payload: Payload
}) {
  // 1. Učitaj sve procese kandidata sa povezanim relacijama
  const processesResult = await payload.find({
    collection: 'candidate-processes',
    depth: 2,
    limit: 500,
    overrideAccess: true,
    sort: '-createdAt',
  })

  // 2. Učitaj prihvaćene radne ponude (FR-068: praćenje ko ima ponudu a ko nema)
  const offersResult = await payload.find({
    collection: 'employment-offers',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    where: {
      status: { equals: 'ACCEPTED' },
    },
  })

  const offersByProcessId = new Map<number, (typeof offersResult.docs)[number]>()
  for (const offer of offersResult.docs) {
    const processId = relationId(offer.candidateProcess)
    if (processId) {
      offersByProcessId.set(processId, offer)
    }
  }

  // 3. Učitaj aplikacije kandidata (iz prototipa i onboarding toka)
  const applicationsResult = await payload.find({
    collection: 'candidate-applications',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    sort: '-createdAt',
  })

  const appsByEmail = new Map<string, (typeof applicationsResult.docs)[number]>()
  for (const app of applicationsResult.docs) {
    if (app.email) {
      appsByEmail.set(app.email.toLowerCase().trim(), app)
    }
  }

  const seenEmails = new Set<string>()
  const items: AdminCandidateOverviewItem[] = []

  // 4. Izgradi pregled na osnovu procesa
  for (const process of processesResult.docs) {
    const applicant = typeof process.applicant === 'object' && process.applicant !== null
      ? (process.applicant as {
          createdAt?: string
          dateOfBirth?: string
          email?: string
          firstName?: string
          fullName?: string
          id: number
          lastName?: string
          phone?: string
        })
      : null

    const account = typeof process.candidateAccount === 'object' && process.candidateAccount !== null
      ? (process.candidateAccount as {
          citizenship?: string
          email?: string
          fullName?: string
          id: number
        })
      : null

    const preApp = typeof process.preApplication === 'object' && process.preApplication !== null
      ? (process.preApplication as {
          id: number
          submission?: {
            facultyName?: string
            studyCity?: string
          }
        })
      : null

    const email = (account?.email || applicant?.email || '').toLowerCase().trim()
    if (email) seenEmails.add(email)

    const matchingApp = email ? appsByEmail.get(email) : undefined
    const acceptedOffer = offersByProcessId.get(process.id)

    const firstName = applicant?.firstName || matchingApp?.firstName || ''
    const lastName = applicant?.lastName || matchingApp?.lastName || ''
    const fullName =
      applicant?.fullName ||
      account?.fullName ||
      matchingApp?.fullName ||
      `${firstName} ${lastName}`.trim() ||
      email

    const phone = applicant?.phone || matchingApp?.phone || ''
    const step = String(process.currentStep || 'PROFILE_SETUP')
    const stepLabel = getStepLabel(step)
    const progressPercent = calculateProgressPercent(step, matchingApp?.progress)

    items.push({
      accountId: account?.id,
      adminNotes: process.progressNote || matchingApp?.notes || undefined,
      applicantId: applicant?.id,
      applicationId: matchingApp?.id,
      citizenship: account?.citizenship,
      createdAt: process.createdAt,
      currentStep: step,
      currentStepLabel: stepLabel,
      dateOfBirth: applicant?.dateOfBirth,
      email,
      employerName: acceptedOffer?.employerName || undefined,
      facultyName: preApp?.submission?.facultyName,
      finalPrice: matchingApp?.finalPrice ?? undefined,
      firstName,
      fullName,
      hasJobOffer: Boolean(acceptedOffer),
      id: process.id,
      idCardOrPassportNumber: matchingApp?.idCardNumber || undefined,
      jobTitle: acceptedOffer?.jobTitle || undefined,
      lastName,
      packageName: matchingApp?.packageName,
      paymentMethod: matchingApp?.paymentMethod,
      phone,
      processId: process.id,
      processStatus: process.processStatus || 'ACTIVE',
      programCode: process.programCode || 'SWT',
      progressPercent,
      studyCity: preApp?.submission?.studyCity,
      updatedAt: process.updatedAt,
      workCity: acceptedOffer?.workCity || undefined,
      workState: acceptedOffer?.workState || undefined,
    })
  }

  // 5. Dodaj aplikacije koje eventualno još uvek nemaju kreiran proces
  for (const app of applicationsResult.docs) {
    const email = (app.email || '').toLowerCase().trim()
    if (!email || seenEmails.has(email)) continue

    seenEmails.add(email)
    const step = 'PROFILE_SETUP'
    const stepLabel = getStepLabel(step)

    items.push({
      adminNotes: app.notes || undefined,
      applicationId: app.id,
      createdAt: app.createdAt,
      currentStep: step,
      currentStepLabel: stepLabel,
      email,
      finalPrice: app.finalPrice ?? undefined,
      firstName: app.firstName || '',
      fullName: app.fullName || `${app.firstName || ''} ${app.lastName || ''}`.trim() || email,
      hasJobOffer: false,
      id: app.id,
      idCardOrPassportNumber: app.idCardNumber || undefined,
      lastName: app.lastName || '',
      packageName: app.packageName,
      paymentMethod: app.paymentMethod,
      phone: app.phone || '',
      processStatus: 'ACTIVE',
      programCode: 'SWT',
      progressPercent: app.progress ?? 10,
      updatedAt: app.updatedAt,
    })
  }

  // 6. Filtriranje
  const filtered = items.filter((item) => {
    // Filter po fazi/koraku procesa (FR-066)
    if (filters.currentStep && item.currentStep !== filters.currentStep) {
      return false
    }

    // Filter po statusu procesa (FR-066)
    if (filters.processStatus && item.processStatus !== filters.processStatus) {
      return false
    }

    // Filter po programu (FR-066)
    if (filters.programCode && item.programCode !== filters.programCode) {
      return false
    }

    // FR-068: Filter kandidata bez radne ponude
    if (filters.withoutJobOffer === true && item.hasJobOffer) {
      return false
    }
    if (filters.hasJobOffer !== undefined && item.hasJobOffer !== filters.hasJobOffer) {
      return false
    }

    // FR-067: Filter / pretraga po broju pasoša / lične karte
    if (filters.passportNumber && filters.passportNumber.trim()) {
      const p = filters.passportNumber.trim().toLowerCase()
      const docNo = (item.idCardOrPassportNumber || '').toLowerCase()
      if (!docNo.includes(p)) return false
    }

    // FR-074: Pretraga (ime, prezime, email, telefon, identifikator)
    if (filters.search && !matchesSearchQuery(item, filters.search)) {
      return false
    }

    return true
  })

  const total = filtered.length
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 50
  const totalPages = Math.ceil(total / limit) || 1

  const startIndex = (page - 1) * limit
  const pagedItems = filtered.slice(startIndex, startIndex + limit)

  // FR-067: Projekcija polja ukoliko je tražena
  const projected = filters.fields
    ? pagedItems.map((item) => projectFields(item as unknown as Record<string, unknown>, filters.fields))
    : pagedItems

  return {
    candidates: projected,
    limit,
    page,
    total,
    totalPages,
  }
}

export async function getCandidateOverviewDetail({
  id,
  payload,
}: {
  id: number
  payload: Payload
}): Promise<AdminCandidateDetail | null> {
  // 1. Potraži u candidate-processes
  let process = await payload
    .findByID({
      collection: 'candidate-processes',
      depth: 2,
      id,
      overrideAccess: true,
    })
    .catch(() => null)

  // Ako nije pronađeno po id procesa, probaj preko candidateAccount id
  if (!process) {
    const byAccount = await payload.find({
      collection: 'candidate-processes',
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: id } },
    })
    process = byAccount.docs[0] || null
  }

  // Ako postoji proces, konstruiši detalje
  if (process) {
    const applicant = typeof process.applicant === 'object' && process.applicant !== null
      ? (process.applicant as {
          createdAt?: string
          dateOfBirth?: string
          email?: string
          firstName?: string
          fullName?: string
          id: number
          lastName?: string
          phone?: string
          residentialAddress?: string
        })
      : null

    const account = typeof process.candidateAccount === 'object' && process.candidateAccount !== null
      ? (process.candidateAccount as {
          citizenship?: string
          email?: string
          fullName?: string
          id: number
        })
      : null

    const preApp = typeof process.preApplication === 'object' && process.preApplication !== null
      ? (process.preApplication as {
          id: number
          submission?: {
            facultyName?: string
            studyCity?: string
          }
        })
      : null

    const email = (account?.email || applicant?.email || '').toLowerCase().trim()

    // Pronađi prihvaćenu radnu ponudu
    const offerRes = await payload.find({
      collection: 'employment-offers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { candidateProcess: { equals: process.id } },
          { status: { equals: 'ACCEPTED' } },
        ],
      },
    })
    const acceptedOffer = offerRes.docs[0]

    // Pronađi candidate-application ako postoji
    let matchingApp
    if (email) {
      const appRes = await payload.find({
        collection: 'candidate-applications',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: email } },
      })
      matchingApp = appRes.docs[0]
    }

    // Pronađi skorašnje revizijske događaje (audit)
    let recentAuditEvents: AdminCandidateDetail['recentAuditEvents'] = []
    if (preApp?.id) {
      const auditRes = await payload.find({
        collection: 'audit-events',
        depth: 0,
        limit: 10,
        overrideAccess: true,
        sort: '-occurredAt',
        where: { preApplication: { equals: preApp.id } },
      })
      recentAuditEvents = auditRes.docs.map((doc) => ({
        actorType: doc.actorType || undefined,
        eventType: doc.eventType,
        occurredAt: doc.occurredAt,
      }))
    }

    const step = String(process.currentStep || 'PROFILE_SETUP')

    return {
      accountId: account?.id,
      adminNotes: process.progressNote || matchingApp?.notes || undefined,
      applicantId: applicant?.id,
      applicationId: matchingApp?.id,
      citizenship: account?.citizenship,
      createdAt: process.createdAt,
      currentStep: step,
      currentStepLabel: getStepLabel(step),
      cvFileName: matchingApp?.cvFileName || undefined,
      dateOfBirth: applicant?.dateOfBirth,
      email,
      employerName: acceptedOffer?.employerName || undefined,
      facultyCertFileName: matchingApp?.facultyCertFileName || undefined,
      facultyName: preApp?.submission?.facultyName,
      finalPrice: matchingApp?.finalPrice ?? undefined,
      firstName: applicant?.firstName || matchingApp?.firstName || '',
      fullName:
        applicant?.fullName ||
        account?.fullName ||
        matchingApp?.fullName ||
        email,
      guarantor: matchingApp?.guarantor
        ? {
            idCardNumber: matchingApp.guarantor.idCardNumber || undefined,
            jmbg: matchingApp.guarantor.jmbg || undefined,
            name: matchingApp.guarantor.name || undefined,
            promissoryNotesCount: matchingApp.guarantor.promissoryNotesCount || 2,
          }
        : undefined,
      hasJobOffer: Boolean(acceptedOffer),
      id: process.id,
      idCardOrPassportNumber: matchingApp?.idCardNumber || undefined,
      jobTitle: acceptedOffer?.jobTitle || undefined,
      lastName: applicant?.lastName || matchingApp?.lastName || '',
      nextActionDescription: process.nextActionDescription || undefined,
      nextActionDueAt: process.nextActionDueAt || undefined,
      nextActionTitle: process.nextActionTitle || undefined,
      packageName: matchingApp?.packageName,
      paymentMethod: matchingApp?.paymentMethod,
      phone: applicant?.phone || matchingApp?.phone || '',
      preferences: matchingApp?.preferences
        ? {
            englishLevel: matchingApp.preferences.englishLevel || undefined,
            location: matchingApp.preferences.location || undefined,
            position: matchingApp.preferences.position || undefined,
            testLink: matchingApp.preferences.testLink || undefined,
          }
        : undefined,
      processId: process.id,
      processStatus: process.processStatus || 'ACTIVE',
      programCode: process.programCode || 'SWT',
      progressPercent: calculateProgressPercent(step, matchingApp?.progress),
      recentAuditEvents,
      residentialAddress: applicant?.residentialAddress,
      studyCity: preApp?.submission?.studyCity,
      updatedAt: process.updatedAt,
      workCity: acceptedOffer?.workCity || undefined,
      workState: acceptedOffer?.workState || undefined,
      youtubeUrl: matchingApp?.youtubeUrl || undefined,
    }
  }

  // Ako nema proces, proveri u candidate-applications po id
  const app = await payload
    .findByID({
      collection: 'candidate-applications',
      depth: 0,
      id,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!app) return null

  const step = 'PROFILE_SETUP'
  return {
    adminNotes: app.notes || undefined,
    applicationId: app.id,
    createdAt: app.createdAt,
    currentStep: step,
    currentStepLabel: getStepLabel(step),
    cvFileName: app.cvFileName || undefined,
    email: app.email,
    facultyCertFileName: app.facultyCertFileName || undefined,
    finalPrice: app.finalPrice ?? undefined,
    firstName: app.firstName || '',
    fullName: app.fullName || `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.email,
    guarantor: app.guarantor
      ? {
          idCardNumber: app.guarantor.idCardNumber || undefined,
          jmbg: app.guarantor.jmbg || undefined,
          name: app.guarantor.name || undefined,
          promissoryNotesCount: app.guarantor.promissoryNotesCount || 2,
        }
      : undefined,
    hasJobOffer: false,
    id: app.id,
    idCardOrPassportNumber: app.idCardNumber || undefined,
    lastName: app.lastName || '',
    packageName: app.packageName,
    paymentMethod: app.paymentMethod,
    phone: app.phone || '',
    preferences: app.preferences
      ? {
          englishLevel: app.preferences.englishLevel || undefined,
          location: app.preferences.location || undefined,
          position: app.preferences.position || undefined,
          testLink: app.preferences.testLink || undefined,
        }
      : undefined,
    processStatus: 'ACTIVE',
    programCode: 'SWT',
    progressPercent: app.progress ?? 10,
    updatedAt: app.updatedAt,
    youtubeUrl: app.youtubeUrl || undefined,
  }
}

export async function updateCandidateOverview({
  adminId,
  id,
  payload,
  updates,
}: {
  adminId: number
  id: number
  payload: Payload
  updates: AdminCandidateUpdatePayload
}) {
  // 1. Pronađi proces kandidata
  let process = await payload
    .findByID({
      collection: 'candidate-processes',
      depth: 2,
      id,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!process) {
    const byAccount = await payload.find({
      collection: 'candidate-processes',
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: { candidateAccount: { equals: id } },
    })
    process = byAccount.docs[0] || null
  }

  const now = new Date().toISOString()
  const changedFields: string[] = []

  if (process) {
    const processDataToUpdate: Record<string, unknown> = {}

    if (updates.processStatus && updates.processStatus !== process.processStatus) {
      processDataToUpdate.processStatus = updates.processStatus
      changedFields.push('processStatus')
    }

    if (updates.currentStep && updates.currentStep !== process.currentStep) {
      processDataToUpdate.currentStep = updates.currentStep
      changedFields.push('currentStep')
    }

    if (updates.adminNotes !== undefined && updates.adminNotes !== process.progressNote) {
      processDataToUpdate.progressNote = updates.adminNotes
      changedFields.push('progressNote')
    }

    if (updates.nextActionTitle !== undefined) {
      processDataToUpdate.nextActionTitle = updates.nextActionTitle
      changedFields.push('nextActionTitle')
    }

    if (updates.nextActionDescription !== undefined) {
      processDataToUpdate.nextActionDescription = updates.nextActionDescription
      changedFields.push('nextActionDescription')
    }

    if (updates.nextActionDueAt !== undefined) {
      processDataToUpdate.nextActionDueAt = updates.nextActionDueAt
      changedFields.push('nextActionDueAt')
    }

    if (Object.keys(processDataToUpdate).length > 0) {
      processDataToUpdate.progressVersion = (process.progressVersion || 1) + 1
      await payload.update({
        collection: 'candidate-processes',
        data: processDataToUpdate,
        id: process.id,
        overrideAccess: true,
      })
    }

    // Ažuriraj applicant kontakt podatke ako je zadato
    const applicantId = relationId(process.applicant)
    if (applicantId && (updates.phone || updates.residentialAddress)) {
      const applicantUpdate: Record<string, unknown> = {}
      if (updates.phone) {
        applicantUpdate.phone = updates.phone
        applicantUpdate.phoneNormalized = updates.phone.replace(/\D/g, '')
        changedFields.push('phone')
      }
      if (updates.residentialAddress) {
        applicantUpdate.residentialAddress = updates.residentialAddress
        changedFields.push('residentialAddress')
      }
      await payload.update({
        collection: 'applicants',
        data: applicantUpdate,
        id: applicantId,
        overrideAccess: true,
      })
    }

    // Ažuriraj državljanstvo na candidate-accounts ako je zadato
    const accountId = relationId(process.candidateAccount)
    if (accountId && updates.citizenship) {
      await payload.update({
        collection: 'candidate-accounts',
        data: { citizenship: updates.citizenship },
        id: accountId,
        overrideAccess: true,
      })
      changedFields.push('citizenship')
    }

    // Ažuriraj i candidate-applications ako postoji po emailu
    const account = typeof process.candidateAccount === 'object' && process.candidateAccount !== null
      ? (process.candidateAccount as { email?: string })
      : null
    if (account?.email) {
      const appRes = await payload.find({
        collection: 'candidate-applications',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: account.email } },
      })
      if (appRes.docs[0]) {
        const appData: Record<string, unknown> = {}
        if (updates.adminNotes) appData.notes = updates.adminNotes
        if (updates.phone) appData.phone = updates.phone
        if (Object.keys(appData).length > 0) {
          await payload.update({
            collection: 'candidate-applications',
            data: appData,
            id: appRes.docs[0].id,
            overrideAccess: true,
          })
        }
      }
    }

    // FR-070: Evidentiraj revizijski trag (Audit)
    const preAppId = relationId(process.preApplication)
    if (preAppId && changedFields.length > 0) {
      await payload.create({
        collection: 'audit-events',
        data: {
          actor: adminId,
          actorType: 'ADMIN',
          correlationId: randomUUID(),
          eventType: 'CANDIDATE_PROCESS_UPDATED',
          metadata: {
            candidateProcessId: process.id,
            changedFields,
          },
          occurredAt: now,
          preApplication: preAppId,
        },
        overrideAccess: true,
      })
    }

    return getCandidateOverviewDetail({ id: process.id, payload })
  }

  // Ako proces ne postoji, ažuriraj direktno candidate-applications
  const app = await payload.findByID({
    collection: 'candidate-applications',
    depth: 0,
    id,
    overrideAccess: true,
  })

  if (!app) {
    throw new Error('Kandidat nije pronađen.')
  }

  const appUpdate: Record<string, unknown> = {}
  if (updates.adminNotes !== undefined) appUpdate.notes = updates.adminNotes
  if (updates.phone !== undefined) appUpdate.phone = updates.phone

  await payload.update({
    collection: 'candidate-applications',
    data: appUpdate,
    id: app.id,
    overrideAccess: true,
  })

  return getCandidateOverviewDetail({ id: app.id, payload })
}

export async function exportCandidatesOverview({
  adminId,
  filters = {},
  payload,
}: {
  adminId: number
  filters?: AdminCandidateFilterOptions & { format?: 'STANDARD' | 'EMBASSY' }
  payload: Payload
}): Promise<{ buffer: Buffer; count: number; filename: string }> {
  // Dobavi sve kandidate koji zadovoljavaju filtere bez limitiranja na 50
  const result = await listCandidatesOverview({
    filters: {
      ...filters,
      fields: undefined,
      limit: 10_000,
      page: 1,
    },
    payload,
  })

  const candidates = result.candidates as AdminCandidateOverviewItem[]
  const isEmbassy = filters.format === 'EMBASSY'
  const buffer = isEmbassy
    ? await generateEmbassyExcelBuffer(candidates)
    : await generateCandidatesExcelBuffer(candidates, filters.fields)

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = isEmbassy
    ? `ambasada-american-adventure-${dateStr}.xlsx`
    : `kandidati-${dateStr}.xlsx`

  // FR-070: Zabeleži revizijski događaj o izvozu podataka u audit-events
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: randomUUID(),
      eventType: 'CANDIDATE_DATA_EXPORTED',
      metadata: {
        exportedCount: candidates.length,
        fields: filters.fields || 'ALL',
        filename,
        filters: {
          currentStep: filters.currentStep,
          hasJobOffer: filters.hasJobOffer,
          passportNumber: filters.passportNumber,
          processStatus: filters.processStatus,
          programCode: filters.programCode,
          search: filters.search,
          withoutJobOffer: filters.withoutJobOffer,
        },
        format: isEmbassy ? 'EMBASSY_XLSX' : 'XLSX',
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return {
    buffer,
    count: candidates.length,
    filename,
  }
}

