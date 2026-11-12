import { sanitizeExcelCellValue } from '../admin-candidates/rules.ts'

export interface PreApplicationExportItem {
  id: number
  correlationId: string
  createdAt: string
  status: string
  contactStatus: string
  latestContactAt?: string | null
  latestContactOutcome?: string | null
  consultationStatus: string
  consultationStartsAt?: string | null
  consultationNotes?: string | null
  decisionNote?: string | null
  profileReadinessNote?: string | null
  programCode: string
  campaignCode: string
  source: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string
  residentialAddress: string
  phone: string
  email: string
  facultyName: string
  studyCity: string
  currentStudyYear: string
  studyInterruptionStatus: string
  studyInterruptionExplanation?: string | null
  espbPoints: number
  applicantNote?: string | null
}

export const statusLabels: Record<string, string> = {
  CONSULTATION_COMPLETED: 'Konsultacije završene',
  CONSULTATION_INVITED: 'Poziv za konsultacije poslat',
  CONSULTATION_SCHEDULED: 'Konsultacije zakazane',
  MATERIALS_SENT: 'Materijali poslati',
  QUALIFIED: 'Kvalifikovan kandidat',
  READY_FOR_PROFILE: 'Spreman za kreiranje profila',
  REJECTED: 'Odbijen kandidat',
  SUBMITTED: 'Pristigla prijava',
  UNDER_REVIEW: 'U administrativnoj obradi',
}

export const contactStatusLabels: Record<string, string> = {
  ATTEMPTED: 'Kontakt je pokušan',
  FOLLOW_UP_REQUIRED: 'Potreban ponovni kontakt',
  NOT_ATTEMPTED: 'Kontakt nije pokušan',
  REACHED: 'Razgovor je obavljen',
}

export const contactOutcomeLabels: Record<string, string> = {
  CALLBACK_REQUESTED: 'Tražen ponovni poziv',
  INVALID_CONTACT: 'Neispravan kontakt',
  NO_ANSWER: 'Bez odgovora',
  REACHED: 'Razgovor obavljen',
}

export const consultationStatusLabels: Record<string, string> = {
  ATTENDED: 'Prisustvovao/la',
  CANCELLED: 'Otkazane',
  NOT_SCHEDULED: 'Nisu zakazane',
  NO_SHOW: 'Nije se pojavio/la',
  SCHEDULED: 'Zakazane',
}

export const studyYearLabels: Record<string, string> = {
  DOCTORAL: 'Doktorske studije',
  MASTER: 'Master studije',
  OTHER: 'Drugo',
  YEAR_1: '1. godina',
  YEAR_2: '2. godina',
  YEAR_3: '3. godina',
  YEAR_4: '4. godina',
  YEAR_5: '5. godina',
  YEAR_6: '6. godina',
}

export const studyInterruptionLabels: Record<string, string> = {
  NONE: 'Nisam obnavljao/la niti pauzirao/la godinu',
  OTHER: 'Drugo',
  PAUSED_YEAR: 'Pauzirao/la sam godinu',
  RENEWED_YEAR: 'Obnavljao/la sam godinu',
}

export const programCodeLabels: Record<string, string> = {
  SWT: 'Work & Travel USA (SWT)',
}

export const sourceLabels: Record<string, string> = {
  ADMIN_MANUAL: 'Ručni administratorski unos',
  PUBLIC_WEB: 'Javna internet prijava',
}

export interface PreAppExportColumnDef {
  key: keyof PreApplicationExportItem
  header: string
  width: number
  format?: (value: unknown, item: PreApplicationExportItem) => string | number
}

function formatDate(val: unknown): string {
  if (!val) return ''
  try {
    const d = new Date(String(val))
    if (isNaN(d.getTime())) return String(val)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}.`
  } catch {
    return String(val)
  }
}

function formatDateTime(val: unknown): string {
  if (!val) return ''
  try {
    const d = new Date(String(val))
    if (isNaN(d.getTime())) return String(val)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year}. ${hours}:${minutes}`
  } catch {
    return String(val)
  }
}

export const ALL_PRE_APPLICATION_EXPORT_COLUMNS: PreAppExportColumnDef[] = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Kod prijave (Correlation ID)', key: 'correlationId', width: 36 },
  { format: (v) => formatDateTime(v), header: 'Datum i vreme prijave', key: 'createdAt', width: 20 },
  { format: (v) => statusLabels[String(v)] || String(v), header: 'Status prijave', key: 'status', width: 26 },
  { header: 'Ime', key: 'firstName', width: 16 },
  { header: 'Prezime', key: 'lastName', width: 18 },
  { format: (v) => formatDate(v), header: 'Datum rođenja', key: 'dateOfBirth', width: 14 },
  { header: 'Email', key: 'email', width: 28 },
  { header: 'Telefon', key: 'phone', width: 18 },
  { header: 'Adresa prebivališta', key: 'residentialAddress', width: 30 },
  { header: 'Fakultet', key: 'facultyName', width: 28 },
  { header: 'Grad studiranja', key: 'studyCity', width: 18 },
  { format: (v) => studyYearLabels[String(v)] || String(v), header: 'Godina studija', key: 'currentStudyYear', width: 18 },
  { format: (v) => studyInterruptionLabels[String(v)] || String(v), header: 'Obnova/pauza studija', key: 'studyInterruptionStatus', width: 24 },
  { header: 'Objašnjenje obnove/pauze', key: 'studyInterruptionExplanation', width: 28 },
  { header: 'ESPB bodovi', key: 'espbPoints', width: 12 },
  { header: 'Napomena kandidata', key: 'applicantNote', width: 30 },
  { format: (v) => programCodeLabels[String(v)] || String(v), header: 'Program', key: 'programCode', width: 24 },
  { header: 'Kampanja', key: 'campaignCode', width: 14 },
  { format: (v) => sourceLabels[String(v)] || String(v), header: 'Izvor prijave', key: 'source', width: 22 },
  { format: (v) => contactStatusLabels[String(v)] || String(v), header: 'Status kontakta', key: 'contactStatus', width: 24 },
  { format: (v) => formatDateTime(v), header: 'Poslednji kontakt', key: 'latestContactAt', width: 20 },
  { format: (v) => contactOutcomeLabels[String(v)] || String(v || ''), header: 'Ishod kontakta', key: 'latestContactOutcome', width: 22 },
  { format: (v) => consultationStatusLabels[String(v)] || String(v), header: 'Status konsultacija', key: 'consultationStatus', width: 20 },
  { format: (v) => formatDateTime(v), header: 'Termin konsultacija', key: 'consultationStartsAt', width: 20 },
  { header: 'Beleške sa konsultacija', key: 'consultationNotes', width: 32 },
  { header: 'Beleška uz odluku / razlog odbijanja', key: 'decisionNote', width: 32 },
  { header: 'Beleška uz odobrenje profila', key: 'profileReadinessNote', width: 32 },
]

export function resolvePreApplicationExportColumns(fieldsParam?: string): PreAppExportColumnDef[] {
  if (!fieldsParam || fieldsParam.trim().toUpperCase() === 'ALL') {
    return ALL_PRE_APPLICATION_EXPORT_COLUMNS
  }

  const requestedKeys = new Set(
    fieldsParam
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
  )

  const matched = ALL_PRE_APPLICATION_EXPORT_COLUMNS.filter((col) => requestedKeys.has(col.key))
  return matched.length > 0 ? matched : ALL_PRE_APPLICATION_EXPORT_COLUMNS
}

export interface PreApplicationExportFilters {
  campaignCode?: string
  consultationStatus?: string
  contactStatus?: string
  currentStudyYear?: string
  dateFrom?: string
  dateTo?: string
  fields?: string
  limit?: number
  page?: number
  programCode?: string
  q?: string
  search?: string
  status?: string
  studyCity?: string
  studyInterruptionStatus?: string
}

export { sanitizeExcelCellValue }
