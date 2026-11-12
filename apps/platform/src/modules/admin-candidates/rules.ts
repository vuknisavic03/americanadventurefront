import type { CandidateProcessStepKey } from '../candidate-processes/workflow.ts'

export interface AdminCandidateOverviewItem {
  id: number
  processId?: number
  applicationId?: number
  accountId?: number
  applicantId?: number

  // Identitet i kontakt
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  idCardOrPassportNumber?: string
  dateOfBirth?: string
  citizenship?: string
  facultyName?: string
  studyCity?: string

  // Program i status
  programCode: string
  packageName?: string
  processStatus: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | string
  currentStep: CandidateProcessStepKey | string
  currentStepLabel: string
  progressPercent: number

  // Posao (FR-068)
  hasJobOffer: boolean
  employerName?: string
  jobTitle?: string
  workCity?: string
  workState?: string

  // Finansije
  finalPrice?: number
  paymentMethod?: string

  // Administrativne zabeleške
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface AdminCandidateDetail extends AdminCandidateOverviewItem {
  residentialAddress?: string
  nextActionTitle?: string
  nextActionDescription?: string
  nextActionDueAt?: string
  preferences?: {
    location?: string
    position?: string
    englishLevel?: string
    testLink?: string
  }
  guarantor?: {
    name?: string
    idCardNumber?: string
    jmbg?: string
    promissoryNotesCount?: number
  }
  youtubeUrl?: string
  cvFileName?: string
  facultyCertFileName?: string
  recentAuditEvents?: Array<{
    eventType: string
    occurredAt: string
    actorType?: string
  }>
}

export interface AdminCandidateFilterOptions {
  currentStep?: string
  fields?: string // comma-separated e.g. "name,passport,status"
  hasJobOffer?: boolean
  limit?: number
  page?: number
  passportNumber?: string
  processStatus?: string
  programCode?: string
  search?: string
  withoutJobOffer?: boolean
}

export interface AdminCandidateUpdatePayload {
  adminNotes?: string
  citizenship?: string
  currentStep?: CandidateProcessStepKey | string
  nextActionDescription?: string
  nextActionDueAt?: string | null
  nextActionTitle?: string
  phone?: string
  processStatus?: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
  residentialAddress?: string
}

export const STEP_LABELS: Record<string, string> = {
  PROFILE_SETUP: 'Profil kandidata',
  CONTRACT_AND_PAYMENT_PLAN: 'Ugovor i način plaćanja',
  INITIAL_PAYMENT: 'Prva uplata',
  PROGRAM_APPLICATION: 'Programska aplikacija',
  DOCUMENTS: 'Dokumentacija',
  JOB_PLACEMENT: 'Posao i intervju',
  VISA: 'Viza',
  TRAVEL_PREPARATION: 'Putovanje i orijentacija',
  USA_STAY: 'Boravak u SAD',
  COMPLETED: 'Završeno',
}

export const STEP_PROGRESS_PERCENT: Record<string, number> = {
  PROFILE_SETUP: 10,
  CONTRACT_AND_PAYMENT_PLAN: 20,
  INITIAL_PAYMENT: 30,
  PROGRAM_APPLICATION: 45,
  DOCUMENTS: 60,
  JOB_PLACEMENT: 75,
  VISA: 85,
  TRAVEL_PREPARATION: 95,
  USA_STAY: 100,
  COMPLETED: 100,
}

export function getStepLabel(step: string): string {
  return STEP_LABELS[step] || step
}

export function calculateProgressPercent(step: string, explicitProgress?: number | null): number {
  if (typeof explicitProgress === 'number' && explicitProgress >= 0 && explicitProgress <= 100) {
    return explicitProgress
  }
  return STEP_PROGRESS_PERCENT[step] ?? 10
}

export function matchesSearchQuery(
  item: {
    email?: string
    firstName?: string
    fullName?: string
    idCardOrPassportNumber?: string
    lastName?: string
    phone?: string
  },
  query?: string,
): boolean {
  if (!query || !query.trim()) return true
  const q = query.trim().toLowerCase()
  const fn = (item.firstName || '').toLowerCase()
  const ln = (item.lastName || '').toLowerCase()
  const full = (item.fullName || '').toLowerCase()
  const em = (item.email || '').toLowerCase()
  const ph = (item.phone || '').toLowerCase()
  const idNo = (item.idCardOrPassportNumber || '').toLowerCase()

  return (
    fn.includes(q) ||
    ln.includes(q) ||
    full.includes(q) ||
    em.includes(q) ||
    ph.includes(q) ||
    idNo.includes(q)
  )
}

export function projectFields<T extends Record<string, unknown>>(
  item: T,
  fieldsParam?: string,
): Partial<T> {
  if (!fieldsParam || !fieldsParam.trim()) return item

  const requested = fieldsParam
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

  if (requested.length === 0) return item

  // Always keep id
  const allowed = new Set(['id', ...requested])
  const result: Partial<T> = {}

  for (const key of Object.keys(item) as Array<keyof T>) {
    if (allowed.has(String(key))) {
      result[key] = item[key]
    }
  }

  return result
}

export interface ExportColumnDef {
  format?: (value: unknown, row: AdminCandidateOverviewItem) => unknown
  header: string
  key: string
  width: number
}

export const ALL_EXPORT_COLUMNS: ExportColumnDef[] = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Ime', key: 'firstName', width: 16 },
  { header: 'Prezime', key: 'lastName', width: 18 },
  { header: 'Puno ime', key: 'fullName', width: 24 },
  { header: 'Email', key: 'email', width: 28 },
  { header: 'Telefon', key: 'phone', width: 18 },
  { header: 'Broj pasoša / LK', key: 'idCardOrPassportNumber', width: 20 },
  { header: 'Datum rođenja', key: 'dateOfBirth', width: 16 },
  { header: 'Državljanstvo', key: 'citizenship', width: 18 },
  { header: 'Fakultet', key: 'facultyName', width: 24 },
  { header: 'Grad studiranja', key: 'studyCity', width: 18 },
  { header: 'Program', key: 'programCode', width: 14 },
  { header: 'Paket', key: 'packageName', width: 24 },
  { header: 'Status procesa', key: 'processStatus', width: 16 },
  { header: 'Kod faze', key: 'currentStep', width: 18 },
  { header: 'Trenutna faza', key: 'currentStepLabel', width: 24 },
  {
    format: (v) => (typeof v === 'number' ? `${v}%` : ''),
    header: 'Progres',
    key: 'progressPercent',
    width: 14,
  },
  {
    format: (v) => (v ? 'Da' : 'Ne'),
    header: 'Ima radnu ponudu',
    key: 'hasJobOffer',
    width: 18,
  },
  { header: 'Poslodavac', key: 'employerName', width: 24 },
  { header: 'Radna pozicija', key: 'jobTitle', width: 24 },
  { header: 'Grad rada', key: 'workCity', width: 18 },
  { header: 'Savezna država', key: 'workState', width: 16 },
  { header: 'Cena programa (EUR)', key: 'finalPrice', width: 20 },
  { header: 'Način plaćanja', key: 'paymentMethod', width: 18 },
  { header: 'Admin beleška', key: 'adminNotes', width: 32 },
  { header: 'Datum kreiranja', key: 'createdAt', width: 22 },
  { header: 'Datum izmene', key: 'updatedAt', width: 22 },
]

export function sanitizeExcelCellValue(val: unknown): string | number | boolean | Date | null {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') {
    const trimmed = val.trimStart()
    if (
      trimmed.startsWith('=') ||
      trimmed.startsWith('+') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('@')
    ) {
      return `'${val}`
    }
    return val
  }
  if (typeof val === 'number' || typeof val === 'boolean' || val instanceof Date) {
    return val
  }
  return String(val)
}

const COLUMN_ALIAS_MAP: Record<string, string> = {
  brojpasosa: 'idCardOrPassportNumber',
  cena: 'finalPrice',
  employer: 'employerName',
  faza: 'currentStepLabel',
  idcard: 'idCardOrPassportNumber',
  ime: 'firstName',
  job: 'jobTitle',
  name: 'firstName',
  passport: 'idCardOrPassportNumber',
  passportnumber: 'idCardOrPassportNumber',
  posao: 'jobTitle',
  poslodavac: 'employerName',
  prezime: 'lastName',
  price: 'finalPrice',
  progress: 'progressPercent',
  status: 'processStatus',
  step: 'currentStepLabel',
  surname: 'lastName',
}

export function resolveExportColumns(fieldsParam?: string): ExportColumnDef[] {
  if (!fieldsParam || !fieldsParam.trim()) {
    return ALL_EXPORT_COLUMNS
  }

  const requested = fieldsParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (requested.length === 0) {
    return ALL_EXPORT_COLUMNS
  }

  const targetKeys = new Set<string>()
  for (const field of requested) {
    const resolvedKey = COLUMN_ALIAS_MAP[field] || field
    targetKeys.add(resolvedKey.toLowerCase())
  }

  const selected = ALL_EXPORT_COLUMNS.filter((col) =>
    targetKeys.has(col.key.toLowerCase()),
  )

  return selected.length > 0 ? selected : ALL_EXPORT_COLUMNS
}

/**
 * 48 zvaničnih kategorija studija prema formatu Ambasade SAD i sponzora
 * Izvor: "01.04. American Adventure.xlsx"
 */
export const EMBASSY_STUDY_CATEGORIES = [
  'Applied Ecology',
  'Architecture',
  'Art/ Design/ Theater/ Music',
  'Biofarming',
  'Business/ Finance',
  'Chemistry/ Biology',
  'Criminology',
  'Culture and Media',
  'Dentistry',
  'Economics',
  'Electrical Engineering',
  'Entrepreneurial Business',
  'Finance',
  'Forestry/ Ecology/ Geology/ Environment',
  'Hotel/ Tourism/ Gastronomy',
  'Information Technologies',
  'International Relations/ Political Science/ Diplomacy',
  'IT',
  'Language',
  'Law',
  'Management',
  'Marketing/ Media/ PR',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Mining',
  'Natural Sciences',
  'Pharmacy',
  'Philosophy',
  'Philology',
  'Physics',
  'Political Science',
  'Psychology',
  'Railway',
  'Security',
  'Social Sciences',
  'Sociology',
  'Sports',
  'Teaching',
  'Tech/ Engineering',
  'Technology',
  'Telecommunications',
  'Textiles',
  'Theology',
  'Tourism',
  'Transportations/ Logistics',
  'Veterinary Science',
  'OTHER',
] as const

export const EMBASSY_YEARS_OF_STUDY = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '1st master',
  '2nd master',
  '1st specialization',
  '2nd specialization',
  'PHD',
] as const


