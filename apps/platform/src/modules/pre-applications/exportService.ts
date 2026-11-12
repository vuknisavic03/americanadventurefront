import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import { generatePreApplicationsExcelBuffer } from './export.ts'
import type {
  PreApplicationExportFilters,
  PreApplicationExportItem,
} from './exportRules.ts'

function matchesSearch(item: PreApplicationExportItem, query: string): boolean {
  const q = query.toLowerCase().trim()
  return (
    item.fullName.toLowerCase().includes(q) ||
    item.email.toLowerCase().includes(q) ||
    item.phone.toLowerCase().includes(q) ||
    item.facultyName.toLowerCase().includes(q) ||
    item.studyCity.toLowerCase().includes(q) ||
    item.correlationId.toLowerCase().includes(q)
  )
}

export async function exportPreApplicationsOverview({
  adminId,
  filters = {},
  payload,
}: {
  adminId: number
  filters?: PreApplicationExportFilters
  payload: Payload
}): Promise<{ buffer: Buffer; count: number; filename: string }> {
  // 1. Dobavi sve pre-prijave
  const result = await payload.find({
    collection: 'pre-applications',
    depth: 1,
    limit: filters.limit ?? 10_000,
    overrideAccess: true,
    page: filters.page ?? 1,
    sort: '-createdAt',
  })

  // 2. Mapiraj u pljosnati oblik pogodan za Excel i pretragu
  const mapped: PreApplicationExportItem[] = result.docs.map((doc) => {
    const sub = (doc.submission || {}) as Record<string, unknown>
    const firstName = String(sub.firstName || '')
    const lastName = String(sub.lastName || '')
    const fullName = `${firstName} ${lastName}`.trim()

    return {
      applicantNote: typeof sub.applicantNote === 'string' ? sub.applicantNote : null,
      campaignCode: String(doc.campaignCode || 'SWT_MVP'),
      consultationNotes: typeof doc.consultationNotes === 'string' ? doc.consultationNotes : null,
      consultationStartsAt: typeof doc.consultationStartsAt === 'string' ? doc.consultationStartsAt : null,
      consultationStatus: String(doc.consultationStatus || 'NOT_SCHEDULED'),
      contactStatus: String(doc.contactStatus || 'NOT_ATTEMPTED'),
      correlationId: String(doc.correlationId || ''),
      createdAt: String(doc.createdAt || ''),
      currentStudyYear: String(sub.currentStudyYear || ''),
      dateOfBirth: String(sub.dateOfBirth || ''),
      decisionNote: typeof doc.decisionNote === 'string' ? doc.decisionNote : null,
      email: String(sub.email || ''),
      espbPoints: typeof sub.espbPoints === 'number' ? sub.espbPoints : 0,
      facultyName: String(sub.facultyName || ''),
      firstName,
      fullName,
      id: Number(doc.id),
      lastName,
      latestContactAt: typeof doc.latestContactAt === 'string' ? doc.latestContactAt : null,
      latestContactOutcome: typeof doc.latestContactOutcome === 'string' ? doc.latestContactOutcome : null,
      phone: String(sub.phone || ''),
      profileReadinessNote: typeof doc.profileReadinessNote === 'string' ? doc.profileReadinessNote : null,
      programCode: String(doc.programCode || 'SWT'),
      residentialAddress: String(sub.residentialAddress || ''),
      source: String(doc.source || 'PUBLIC_WEB'),
      status: String(doc.status || 'SUBMITTED'),
      studyCity: String(sub.studyCity || ''),
      studyInterruptionExplanation: typeof sub.studyInterruptionExplanation === 'string' ? sub.studyInterruptionExplanation : null,
      studyInterruptionStatus: String(sub.studyInterruptionStatus || 'NONE'),
    }
  })

  // 3. Primeni filtere u memoriji
  const filtered = mapped.filter((item) => {
    if (filters.status && item.status !== filters.status) return false
    if (filters.contactStatus && item.contactStatus !== filters.contactStatus) return false
    if (filters.consultationStatus && item.consultationStatus !== filters.consultationStatus) return false
    if (filters.programCode && item.programCode !== filters.programCode) return false
    if (filters.campaignCode && item.campaignCode !== filters.campaignCode) return false
    if (filters.studyCity && item.studyCity.toLowerCase() !== filters.studyCity.toLowerCase().trim()) return false
    if (filters.currentStudyYear && item.currentStudyYear !== filters.currentStudyYear) return false
    if (filters.studyInterruptionStatus && item.studyInterruptionStatus !== filters.studyInterruptionStatus) return false

    // Filter po datumima
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime()
      if (!isNaN(from) && new Date(item.createdAt).getTime() < from) return false
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime()
      if (!isNaN(to) && new Date(item.createdAt).getTime() > to) return false
    }

    // Pretraga (ime, prezime, email, telefon, fakultet, grad, correlationId)
    const searchQuery = filters.search || filters.q
    if (searchQuery && !matchesSearch(item, searchQuery)) return false

    return true
  })

  // 4. Generiši Excel bafer
  const buffer = await generatePreApplicationsExcelBuffer(filtered, filters.fields)

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `pre-prijave-${dateStr}.xlsx`

  // 5. FR-070 / NFR-005: Zabeleži revizijski događaj o izvozu u audit-events
  await payload.create({
    collection: 'audit-events',
    data: {
      actor: adminId,
      actorType: 'ADMIN',
      correlationId: randomUUID(),
      eventType: 'CANDIDATE_DATA_EXPORTED',
      metadata: {
        exportType: 'PRE_APPLICATIONS',
        exportedCount: filtered.length,
        fields: filters.fields || 'ALL',
        filename,
        filters: {
          campaignCode: filters.campaignCode,
          consultationStatus: filters.consultationStatus,
          contactStatus: filters.contactStatus,
          currentStudyYear: filters.currentStudyYear,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          programCode: filters.programCode,
          search: filters.search || filters.q,
          status: filters.status,
          studyCity: filters.studyCity,
          studyInterruptionStatus: filters.studyInterruptionStatus,
        },
      },
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return {
    buffer,
    count: filtered.length,
    filename,
  }
}
