import config from '@payload-config'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'

export interface PortalGuarantor {
  name: string
  idCardNumber: string
  jmbg: string
  promissoryNotesCount: number
}

export interface PortalPreferences {
  location: string
  position: string
  englishLevel: string
  testLink: string
}

export interface PortalInvitation {
  id?: string | number
  code: string
  email: string
  candidateName: string
  packageId: string
  packageName: string
  basePrice: number
  discount: number
  discountNote: string
  finalPrice: number
  createdAt: string
  registeredAt?: string
  status: 'pending' | 'registered' | 'in_review'
}

export interface PortalCandidate {
  id: string | number
  email: string
  firstName: string
  lastName: string
  name?: string
  phone?: string
  jmbg?: string
  idCardNumber?: string
  faculty?: string
  program?: string
  packageId: string
  packageName: string
  basePrice: number
  discount: number
  discountNote: string
  finalPrice: number
  paymentMethod: 'now' | 'installments' | 'later'
  guarantor: PortalGuarantor | null
  preferences: PortalPreferences
  youtubeUrl: string
  cvFileName: string
  cvUrl?: string
  cvDataUrl?: string
  cvUploadedAt?: string
  facultyCertFileName: string
  facultyCertUrl?: string
  facultyCertDataUrl?: string
  facultyCertUploadedAt?: string
  facultyCertAiTranslation: boolean
  policeCertificateFileName?: string
  policeCertificateUrl?: string
  policeCertificateDataUrl?: string
  policeCertificateUploaded?: boolean
  policeCertificateTranslated?: boolean
  policeCertificateUploadedAt?: string
  status: 'applying' | 'review' | 'in_review' | 'docs' | 'job' | 'departure' | 'ready'
  progress: number
  notes: string
  isNew?: boolean
  ds160?: Record<string, string>
  discountId?: string
  discountTiming?: 'immediate' | 'end'
  discountVerified?: boolean
  discountDetails?: Record<string, unknown>
  referralCode?: string
  referredBy?: string
  referredByEmail?: string
  groupCode?: string
  hasJob?: boolean
  hasVisa?: boolean
  passportNumber?: string
  passportScanFileName?: string
  passportScanUrl?: string
  passportScanDataUrl?: string
  passportImage?: string
  birthDate?: string
  address?: string
  passportExpiryDate?: string
  gender?: string
  contractSigned?: boolean
  contractSignedAt?: string
  contractSignedReference?: string
  contractDownloaded?: boolean
  contractDownloadedAt?: string
  signedContractFileName?: string
  signedContractUrl?: string
  signedContractDataUrl?: string
  signedContractUploadedAt?: string
  isRegistered?: boolean
  registeredAt?: string
  selectionDecision?: 'QUALIFIED' | 'REJECTED' | 'WAITING_LIST' | 'REVIEW' | 'PENDING'
  activationCode?: string
  contactStatus?: string
  latestContactOutcome?: string | null
  latestContactAt?: string | null
  nextContactAt?: string | null
  infoMaterialsSent?: boolean
  infoMaterialsSentAt?: string | null
  consultationStatus?: string
  consultationStartsAt?: string | null
  consultationType?: string
  consultationNotes?: string
  decisionNote?: string
  decidedAt?: string | null
  studyYear?: string
  ectsPoints?: number
  studyCity?: string
  contractApproved?: boolean
  contractVerificationStatus?: string
  firstInstallmentStatus?: string
  firstInstallmentApproved?: boolean
  documentsApproved?: boolean
  documentsVerificationStatus?: string
  documentsRejectionReason?: string
  documentsRejectedAt?: string
  contractRejectionReason?: string
  secondInstallmentStatus?: string
  secondInstallmentPaid?: boolean
  thirdInstallmentStatus?: string
  thirdInstallmentPaid?: boolean
  interviewPrepStatus?: string
  interviewPrepScheduledAt?: string | null
  interviewPrepType?: string | null
  interviewPrepNotes?: string | null
  interviewPrepAttendedAt?: string | null
  selectedJobTitle?: string | null
  selectedJobEmployer?: string | null
  selectedJobCity?: string | null
  selectedJobWage?: string | null
  selectedJobHousing?: string | null
  jobOfferSignedAt?: string | null
  jobOfferSignature?: string | null
  jobOfferDetails?: Record<string, unknown> | null
  embassyInterviewDate?: string | null
  embassyInterviewStatus?: string | null
  embassyPrepStatus?: string | null
  ds2019Status?: string | null
  ds2019Number?: string | null
  flightTicketStatus?: string | null
  flightDepartureDate?: string | null
  flightReturnDate?: string | null
  orientationAttended?: boolean
  createdAt: string
  [key: string]: unknown
}

export interface PortalPromotion {
  id: string
  code?: string
  name: string
  title?: string
  description?: string
  amount: number
  currency?: string
  timing: 'immediate' | 'end'
  timingLabel?: string
  conditionType?: string
  conditionText?: string
  minMembers?: number
  active: boolean
  isCustom?: boolean
  createdAt?: string
}

export interface PortalAnnouncement {
  id: string | number
  channel: string
  subject: string
  message: string
  date: string
  to: string
}

export interface PortalFaqItem {
  id: number
  q: string
  a: string
}

export interface PortalStoreData {
  invitations: PortalInvitation[]
  candidates: PortalCandidate[]
  announcements?: PortalAnnouncement[]
  siteContent?: Record<string, { title: string; content: string }>
  faqItems?: PortalFaqItem[]
  promotions?: PortalPromotion[]
}

const STORE_FILE = path.resolve(process.cwd(), '.data', 'portal-store.json')

export function readFileStore(): PortalStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8')
      const parsed = JSON.parse(raw) as Partial<PortalStoreData>
      if (Array.isArray(parsed.invitations) && Array.isArray(parsed.candidates)) {
        return {
          announcements: parsed.announcements || [],
          candidates: parsed.candidates,
          faqItems: parsed.faqItems || [],
          invitations: parsed.invitations,
          promotions: parsed.promotions || [],
          siteContent: parsed.siteContent || {},
        }
      }
    }
  } catch {
    // Fallback to defaults
  }

  const initial: PortalStoreData = {
    announcements: [],
    candidates: [],
    faqItems: [],
    invitations: [],
    promotions: [],
    siteContent: {},
  }
  writeFileStore(initial)
  return initial
}

export function writeFileStore(data: PortalStoreData) {
  try {
    const dir = path.dirname(STORE_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch {
    // Ignore file write errors in read-only environments
  }
}

function checkPostgresReachable(timeoutMs = 150): Promise<boolean> {
  return new Promise((resolve) => {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/american_adventure'
    let host = '127.0.0.1'
    let port = 5432
    try {
      const u = new URL(dbUrl)
      host = u.hostname || '127.0.0.1'
      port = Number(u.port) || 5432
    } catch {
      // use defaults
    }

    const socket = new net.Socket()
    let settled = false
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true
        socket.destroy()
        resolve(ok)
      }
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, host)
  })
}

export async function getPayloadIfAvailable(): Promise<Payload | null> {
  const reachable = await checkPostgresReachable(150)
  if (!reachable) return null
  try {
    return await getPayload({ config })
  } catch {
    return null
  }
}

export async function getPortalState(): Promise<PortalStoreData> {
  const fileData = readFileStore()
  const payload = await getPayloadIfAvailable()

  if (!payload) {
    return fileData
  }

  try {
    const [invRes, appRes] = await Promise.all([
      payload.find({
        collection: 'candidate-invitations',
        limit: 200,
        overrideAccess: true,
        sort: '-createdAt',
      }),
      payload.find({
        collection: 'candidate-applications',
        limit: 200,
        overrideAccess: true,
        sort: '-createdAt',
      }),
    ])

    let invitations: PortalInvitation[] = invRes.docs.map((doc) => ({
      basePrice: doc.basePrice,
      candidateName: doc.candidateName || '',
      code: doc.code,
      createdAt: doc.createdAt,
      discount: doc.discount || 0,
      discountNote: doc.discountNote || '',
      email: doc.email,
      finalPrice: doc.finalPrice,
      id: doc.id,
      packageId: doc.packageId,
      packageName: doc.packageName,
      registeredAt: doc.registeredAt || undefined,
      status: doc.status,
    }))

    const dbCandidates: PortalCandidate[] = appRes.docs.map((doc) => ({
      basePrice: doc.basePrice || 1850,
      createdAt: doc.createdAt,
      cvFileName: doc.cvFileName || '',
      discount: doc.discount || 0,
      discountNote: doc.discountNote || '',
      email: doc.email,
      facultyCertAiTranslation: Boolean(doc.facultyCertAiTranslation),
      facultyCertFileName: doc.facultyCertFileName || '',
      finalPrice: doc.finalPrice || 1850,
      firstName: doc.firstName,
      guarantor: doc.guarantor?.name
        ? {
            idCardNumber: doc.guarantor.idCardNumber || '',
            jmbg: doc.guarantor.jmbg || '',
            name: doc.guarantor.name,
            promissoryNotesCount: doc.guarantor.promissoryNotesCount || 2,
          }
        : null,
      id: doc.id,
      idCardNumber: doc.idCardNumber || '',
      jmbg: doc.jmbg || '',
      lastName: doc.lastName,
      name: doc.fullName || `${doc.firstName} ${doc.lastName}`.trim(),
      notes: doc.notes || '',
      packageId: doc.packageId,
      packageName: doc.packageName,
      paymentMethod: doc.paymentMethod,
      phone: doc.phone || '',
      preferences: {
        englishLevel: doc.preferences?.englishLevel || 'B2',
        location: doc.preferences?.location || '',
        position: doc.preferences?.position || '',
        testLink: doc.preferences?.testLink || '',
      },
      program: doc.packageName,
      progress: doc.progress ?? 30,
      status: doc.status,
      youtubeUrl: doc.youtubeUrl || '',
    }))

    // Poveži kandidate iz baze sa dosijeima iz fileData (kako se ne bi obrisali selekcioni podaci, ugovori, rate i status registracije)
    const fileCandByEmail = new Map<string, PortalCandidate>()
    const fileCandById = new Map<string, PortalCandidate>()
    for (const fc of fileData.candidates) {
      if (fc.email) fileCandByEmail.set(fc.email.toLowerCase(), fc)
      if (fc.id) fileCandById.set(String(fc.id).toLowerCase(), fc)
    }

    const mergedDbCandidates: PortalCandidate[] = dbCandidates.map((dbCand) => {
      const existing = (dbCand.email ? fileCandByEmail.get(dbCand.email.toLowerCase()) : null) ||
        fileCandById.get(String(dbCand.id).toLowerCase())
      if (!existing) return dbCand
      const isRegistered = existing.isRegistered ?? ['review', 'docs', 'job', 'departure', 'ready'].includes(dbCand.status)
      return {
        ...existing,
        ...dbCand,
        isRegistered,
        registeredAt: existing.registeredAt || (isRegistered ? dbCand.createdAt : undefined),
        selectionDecision: existing.selectionDecision || (isRegistered ? 'QUALIFIED' : 'PENDING'),
        activationCode: existing.activationCode || dbCand.activationCode,
        contactStatus: existing.contactStatus || 'NOT_ATTEMPTED',
        latestContactOutcome: existing.latestContactOutcome || null,
        latestContactAt: existing.latestContactAt || null,
        nextContactAt: existing.nextContactAt || null,
        infoMaterialsSent: existing.infoMaterialsSent ?? false,
        infoMaterialsSentAt: existing.infoMaterialsSentAt || null,
        consultationStatus: existing.consultationStatus || 'NOT_SCHEDULED',
        consultationStartsAt: existing.consultationStartsAt || null,
        consultationType: existing.consultationType || 'ONLINE',
        consultationNotes: existing.consultationNotes || '',
        decisionNote: existing.decisionNote || '',
        decidedAt: existing.decidedAt || null,
        studyYear: existing.studyYear || dbCand.studyYear,
        ectsPoints: existing.ectsPoints || dbCand.ectsPoints,
        studyCity: existing.studyCity || dbCand.studyCity,
        faculty: existing.faculty || dbCand.faculty,
        contractApproved: existing.contractApproved ?? false,
        contractVerificationStatus: existing.contractVerificationStatus,
        contractRejectionReason: existing.contractRejectionReason,
        contractRejectedAt: existing.contractRejectedAt,
        contractSigned: existing.contractSigned ?? false,
        signedContractFileName: existing.signedContractFileName || dbCand.signedContractFileName,
        firstInstallmentStatus: existing.firstInstallmentStatus,
        firstInstallmentApproved: existing.firstInstallmentApproved,
        documentsApproved: existing.documentsApproved,
        documentsVerificationStatus: existing.documentsVerificationStatus,
        documentsRejectionReason: existing.documentsRejectionReason,
        secondInstallmentStatus: existing.secondInstallmentStatus,
        secondInstallmentPaid: existing.secondInstallmentPaid,
        thirdInstallmentStatus: existing.thirdInstallmentStatus,
        thirdInstallmentPaid: existing.thirdInstallmentPaid,
        interviewPrepStatus: existing.interviewPrepStatus,
        interviewPrepScheduledAt: existing.interviewPrepScheduledAt,
        interviewPrepType: existing.interviewPrepType,
        interviewPrepNotes: existing.interviewPrepNotes,
        interviewPrepAttendedAt: existing.interviewPrepAttendedAt,
        selectedJobTitle: existing.selectedJobTitle,
        selectedJobEmployer: existing.selectedJobEmployer,
        selectedJobCity: existing.selectedJobCity,
        selectedJobWage: existing.selectedJobWage,
        selectedJobHousing: existing.selectedJobHousing,
        jobOfferSignedAt: existing.jobOfferSignedAt,
        jobOfferSignature: existing.jobOfferSignature,
        jobOfferDetails: existing.jobOfferDetails,
        hasJob: existing.hasJob ?? dbCand.hasJob,
        hasVisa: existing.hasVisa ?? dbCand.hasVisa,
        referralCode: existing.referralCode || dbCand.referralCode,
      }
    })

    // Uključi sve pre-aplikacije i kandidate iz fileStore koji još nisu u bazi
    let candidates: PortalCandidate[] = [...mergedDbCandidates]
    for (const fc of fileData.candidates) {
      const alreadyPresent = candidates.some(
        (c) => (fc.email && c.email.toLowerCase() === fc.email.toLowerCase()) || String(c.id) === String(fc.id),
      )
      if (!alreadyPresent) {
        candidates.push(fc)
      }
    }

    if (invitations.length === 0) {
      invitations = fileData.invitations
    }
    if (candidates.length === 0) {
      candidates = fileData.candidates
    }

    const merged = { candidates, invitations }
    writeFileStore(merged)
    return merged
  } catch {
    return fileData
  }
}

export async function verifyPortalInvitation(email: string, code: string) {
  const normEmail = String(email || '').trim().toLowerCase()
  const normCode = String(code || '').trim().toUpperCase()

  if (!normEmail) {
    return {
      message: 'Morate uneti email adresu na koju vam je poslat verifikacioni kod.',
      status: 400,
      valid: false,
    }
  }
  if (!normCode) {
    return {
      message: 'Morate uneti verifikacioni kod iz pozivnice.',
      status: 400,
      valid: false,
    }
  }

  const state = await getPortalState()
  let inv = state.invitations.find((i) => (i?.code || '').toUpperCase() === normCode)

  if (!inv) {
    const payload = await getPayloadIfAvailable()
    if (payload) {
      try {
        const dbRes = await payload.find({
          collection: 'candidate-invitations',
          limit: 1,
          overrideAccess: true,
          where: { code: { equals: normCode } },
        })
        if (dbRes.docs.length > 0) {
          const doc = dbRes.docs[0]
          inv = {
            basePrice: doc.basePrice,
            candidateName: doc.candidateName || '',
            code: doc.code,
            createdAt: doc.createdAt,
            discount: doc.discount || 0,
            discountNote: doc.discountNote || '',
            email: doc.email,
            finalPrice: doc.finalPrice,
            id: doc.id,
            packageId: doc.packageId,
            packageName: doc.packageName,
            registeredAt: doc.registeredAt || undefined,
            status: doc.status,
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (!inv) {
    return {
      message: 'Verifikacioni kod nije pronađen. Molimo proverite unos koda.',
      status: 404,
      valid: false,
    }
  }

  if ((inv.email || '').toLowerCase() !== normEmail) {
    return {
      message: `Verifikacioni kod ${normCode} je vezan isključivo za email: ${inv.email}. Ne možete se registrovati sa drugom email adresom.`,
      status: 400,
      valid: false,
    }
  }

  if (inv.status === 'registered') {
    const registeredCand = state.candidates.find(
      (c) =>
        (c.email || '').toLowerCase() === normEmail &&
        c.status !== 'applying' &&
        !String(c.id).startsWith('preapp-')
    );
    if (!registeredCand) {
      inv.status = 'pending';
      delete inv.registeredAt;
      writeFileStore(state);
    } else {
      return {
        message: `Verifikacioni kod za ${inv.email} je već iskorišćen za registraciju. Molimo prijavite se na stranici za prijavu.`,
        status: 400,
        valid: false,
      };
    }
  }

  return {
    invitation: inv,
    status: 200,
    valid: true,
  }
}

export async function createPortalInvitation(input: {
  code?: string
  email: string
  candidateName?: string
  packageId?: string
  packageName?: string
  basePrice?: number
  discount?: number
  discountNote?: string
}) {
  const email = String(input.email || '').trim().toLowerCase()
  const randomDigits = Math.floor(1000 + Math.random() * 9000)
  const code = String(input.code || `WT-${randomDigits}`).trim().toUpperCase()
  const basePrice = Number(input.basePrice) || 1850
  const discount = Math.max(0, Number(input.discount) || 0)
  const finalPrice = Math.max(0, basePrice - discount)

  const newInv: PortalInvitation = {
    basePrice,
    candidateName: input.candidateName ? String(input.candidateName).trim() : '',
    code,
    createdAt: new Date().toISOString(),
    discount,
    discountNote: input.discountNote ? String(input.discountNote).trim() : '',
    email,
    finalPrice,
    packageId: input.packageId || 'swt-full',
    packageName: input.packageName || 'Work & Travel USA — Full Placement',
    status: 'pending',
  }

  const fileData = readFileStore()
  const existingIdx = fileData.invitations.findIndex((i) => i.code.toUpperCase() === code)
  if (existingIdx >= 0) {
    fileData.invitations[existingIdx] = newInv
  } else {
    fileData.invitations.unshift(newInv)
  }
  writeFileStore(fileData)

  const payload = await getPayloadIfAvailable()
  if (payload) {
    try {
      const created = await payload.create({
        collection: 'candidate-invitations',
        data: {
          basePrice: newInv.basePrice,
          candidateName: newInv.candidateName,
          code: newInv.code,
          discount: newInv.discount,
          discountNote: newInv.discountNote,
          email: newInv.email,
          finalPrice: newInv.finalPrice,
          packageId: (newInv.packageId as 'swt-full' | 'swt-self' | 'swt-lifeguard' | 'camp-usa' | 'other') || 'swt-full',
          packageName: newInv.packageName,
          status: 'pending',
        },
        overrideAccess: true,
      })
      newInv.id = created.id
    } catch {
      // Already saved in fileStore
    }
  }

  return newInv
}

export async function savePortalCandidate(candidateInput: Partial<PortalCandidate> & { code?: string }) {
  const fileData = readFileStore()
  const normEmail = String(candidateInput.email || '').trim().toLowerCase()

  const existingIdx = fileData.candidates.findIndex(
    (c) =>
      (candidateInput.id && String(c.id) === String(candidateInput.id)) ||
      (normEmail && c.email.toLowerCase() === normEmail),
  )

  const base = existingIdx >= 0 ? fileData.candidates[existingIdx] : null
  const firstName = String(candidateInput.firstName ?? base?.firstName ?? '').trim()
  const lastName = String(candidateInput.lastName ?? base?.lastName ?? '').trim()
  const basePrice = Number(candidateInput.basePrice ?? base?.basePrice ?? 1850)
  const discount = Number(candidateInput.discount ?? base?.discount ?? 0)
  const finalPrice = Math.max(0, basePrice - discount)

  const isNowRegistered = Boolean(
    candidateInput.isRegistered ||
    candidateInput.registeredAt ||
    base?.isRegistered ||
    base?.registeredAt ||
    (candidateInput.status && ['review', 'docs', 'job', 'departure', 'ready'].includes(candidateInput.status))
  )

  let assignedId = candidateInput.id || base?.id
  if (!assignedId) {
    assignedId = isNowRegistered ? `cand-${Date.now()}` : `preapp-${Date.now()}`
  } else if (isNowRegistered && String(assignedId).startsWith('preapp-')) {
    assignedId = candidateInput.id && !String(candidateInput.id).startsWith('preapp-')
      ? candidateInput.id
      : `cand-${Date.now()}`
  }

  const registeredAt =
    candidateInput.registeredAt ??
    base?.registeredAt ??
    (isNowRegistered ? new Date().toISOString() : undefined)

  const mergedCandidate: PortalCandidate = {
    ...(base || {}),
    ...candidateInput,
    basePrice,
    createdAt: base?.createdAt || new Date().toISOString(),
    cvFileName: candidateInput.cvFileName ?? base?.cvFileName ?? '',
    discount,
    discountNote: candidateInput.discountNote ?? base?.discountNote ?? '',
    email: normEmail || base?.email || '',
    faculty: candidateInput.faculty ?? base?.faculty,
    facultyCertAiTranslation: Boolean(
      candidateInput.facultyCertAiTranslation ?? base?.facultyCertAiTranslation ?? false,
    ),
    facultyCertFileName: candidateInput.facultyCertFileName ?? base?.facultyCertFileName ?? '',
    finalPrice,
    firstName,
    guarantor:
      candidateInput.guarantor !== undefined
        ? candidateInput.guarantor
        : (base?.guarantor ?? null),
    id: assignedId,
    idCardNumber: candidateInput.idCardNumber ?? base?.idCardNumber ?? '',
    isNew: candidateInput.isNew ?? base?.isNew ?? false,
    jmbg: candidateInput.jmbg ?? base?.jmbg ?? '',
    lastName,
    name: `${firstName} ${lastName}`.trim() || normEmail,
    notes: candidateInput.notes ?? base?.notes ?? '',
    packageId: candidateInput.packageId ?? base?.packageId ?? 'swt-full',
    packageName:
      candidateInput.packageName ??
      candidateInput.program ??
      base?.packageName ??
      'Work & Travel USA — Full Placement',
    paymentMethod: candidateInput.paymentMethod ?? base?.paymentMethod ?? 'now',
    phone: (candidateInput.phone && String(candidateInput.phone).trim()) || base?.phone || '',
    preferences: candidateInput.preferences ??
      base?.preferences ?? {
        englishLevel: 'B2',
        location: '',
        position: '',
        testLink: '',
      },
    program:
      candidateInput.program ??
      candidateInput.packageName ??
      base?.packageName ??
      'Work & Travel USA — Full Placement',
    progress: Number(candidateInput.progress ?? base?.progress ?? (isNowRegistered ? 40 : 10)),
    status: candidateInput.status ?? base?.status ?? (isNowRegistered ? 'review' : 'applying'),
    youtubeUrl: candidateInput.youtubeUrl ?? base?.youtubeUrl ?? '',
    discountId: candidateInput.discountId ?? base?.discountId,
    discountTiming: candidateInput.discountTiming ?? base?.discountTiming,
    discountVerified: candidateInput.discountVerified ?? base?.discountVerified,
    discountDetails: candidateInput.discountDetails ?? base?.discountDetails,
    referralCode: candidateInput.referralCode ?? base?.referralCode ?? `AA-${(firstName || 'REF').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    referredBy: candidateInput.referredBy ?? base?.referredBy,
    referredByEmail: candidateInput.referredByEmail ?? base?.referredByEmail,
    groupCode: candidateInput.groupCode ?? base?.groupCode,
    hasJob: candidateInput.hasJob !== undefined ? Boolean(candidateInput.hasJob) : Boolean(base?.hasJob || candidateInput.jobOfferSignedAt || base?.jobOfferSignedAt || (candidateInput.status || base?.status) === 'departure' || (candidateInput.status || base?.status) === 'ready'),
    hasVisa: candidateInput.hasVisa !== undefined ? Boolean(candidateInput.hasVisa) : Boolean(base?.hasVisa || (candidateInput.status || base?.status) === 'ready'),
    cvUrl: candidateInput.cvUrl ?? base?.cvUrl ?? undefined,
    cvDataUrl: candidateInput.cvDataUrl ?? base?.cvDataUrl ?? undefined,
    cvUploadedAt: candidateInput.cvUploadedAt ?? base?.cvUploadedAt ?? undefined,
    facultyCertUrl: candidateInput.facultyCertUrl ?? base?.facultyCertUrl ?? undefined,
    facultyCertDataUrl: candidateInput.facultyCertDataUrl ?? base?.facultyCertDataUrl ?? undefined,
    facultyCertUploadedAt: candidateInput.facultyCertUploadedAt ?? base?.facultyCertUploadedAt ?? undefined,
    policeCertificateFileName: candidateInput.policeCertificateFileName ?? base?.policeCertificateFileName ?? undefined,
    policeCertificateUrl: candidateInput.policeCertificateUrl ?? base?.policeCertificateUrl ?? undefined,
    policeCertificateDataUrl: candidateInput.policeCertificateDataUrl ?? base?.policeCertificateDataUrl ?? undefined,
    policeCertificateUploaded: candidateInput.policeCertificateUploaded !== undefined ? Boolean(candidateInput.policeCertificateUploaded) : base?.policeCertificateUploaded,
    policeCertificateTranslated: candidateInput.policeCertificateTranslated !== undefined ? Boolean(candidateInput.policeCertificateTranslated) : base?.policeCertificateTranslated,
    policeCertificateUploadedAt: candidateInput.policeCertificateUploadedAt ?? base?.policeCertificateUploadedAt ?? undefined,
    passportNumber: (candidateInput.passportNumber && String(candidateInput.passportNumber).trim()) || base?.passportNumber || candidateInput.idCardNumber || base?.idCardNumber || '',
    passportScanFileName:
      (candidateInput.passportScanFileName && String(candidateInput.passportScanFileName).trim()) ||
      base?.passportScanFileName ||
      (candidateInput.passportScanDataUrl || candidateInput.passportImage || base?.passportScanDataUrl || base?.passportImage
        ? 'Sken_Pasosa_OCR.png'
        : undefined),
    passportScanUrl: candidateInput.passportScanUrl || base?.passportScanUrl || undefined,
    passportScanDataUrl:
      candidateInput.passportScanDataUrl ||
      candidateInput.passportImage ||
      base?.passportScanDataUrl ||
      base?.passportImage ||
      undefined,
    passportImage:
      candidateInput.passportImage ||
      candidateInput.passportScanDataUrl ||
      base?.passportImage ||
      base?.passportScanDataUrl ||
      undefined,
    contractSigned: candidateInput.contractSigned !== undefined ? Boolean(candidateInput.contractSigned) : (base?.contractSigned ?? false),
    contractSignedAt: candidateInput.contractSignedAt ?? base?.contractSignedAt ?? undefined,
    contractSignedReference: candidateInput.contractSignedReference ?? base?.contractSignedReference ?? undefined,
    contractDownloaded: candidateInput.contractDownloaded !== undefined ? Boolean(candidateInput.contractDownloaded) : (base?.contractDownloaded ?? false),
    contractDownloadedAt: candidateInput.contractDownloadedAt ?? base?.contractDownloadedAt ?? undefined,
    signedContractFileName: candidateInput.signedContractFileName ?? base?.signedContractFileName ?? undefined,
    signedContractUrl: candidateInput.signedContractUrl ?? base?.signedContractUrl ?? undefined,
    signedContractDataUrl: candidateInput.signedContractDataUrl ?? base?.signedContractDataUrl ?? undefined,
    signedContractUploadedAt: candidateInput.signedContractUploadedAt ?? base?.signedContractUploadedAt ?? undefined,
    isRegistered: isNowRegistered,
    registeredAt,
    selectionDecision: candidateInput.selectionDecision ?? base?.selectionDecision,
    activationCode: candidateInput.activationCode ?? base?.activationCode ?? candidateInput.code,
    contactStatus: candidateInput.contactStatus ?? base?.contactStatus,
    latestContactOutcome: candidateInput.latestContactOutcome ?? base?.latestContactOutcome,
    latestContactAt: candidateInput.latestContactAt ?? base?.latestContactAt,
    nextContactAt: candidateInput.nextContactAt ?? base?.nextContactAt,
    infoMaterialsSent: candidateInput.infoMaterialsSent !== undefined ? Boolean(candidateInput.infoMaterialsSent) : base?.infoMaterialsSent,
    infoMaterialsSentAt: candidateInput.infoMaterialsSentAt ?? base?.infoMaterialsSentAt,
    consultationStatus: candidateInput.consultationStatus ?? base?.consultationStatus,
    consultationStartsAt: candidateInput.consultationStartsAt ?? base?.consultationStartsAt,
    consultationType: candidateInput.consultationType ?? base?.consultationType,
    consultationNotes: candidateInput.consultationNotes ?? base?.consultationNotes,
    decisionNote: candidateInput.decisionNote ?? base?.decisionNote,
    decidedAt: candidateInput.decidedAt ?? base?.decidedAt,
    studyYear: candidateInput.studyYear ?? base?.studyYear,
    ectsPoints: candidateInput.ectsPoints ?? base?.ectsPoints,
    studyCity: candidateInput.studyCity ?? base?.studyCity,
    contractApproved: candidateInput.contractApproved !== undefined ? Boolean(candidateInput.contractApproved) : base?.contractApproved,
    contractVerificationStatus: candidateInput.contractVerificationStatus ?? base?.contractVerificationStatus,
    firstInstallmentStatus: candidateInput.firstInstallmentStatus ?? base?.firstInstallmentStatus,
    firstInstallmentApproved: candidateInput.firstInstallmentApproved !== undefined ? Boolean(candidateInput.firstInstallmentApproved) : base?.firstInstallmentApproved,
    documentsApproved: candidateInput.documentsApproved !== undefined ? Boolean(candidateInput.documentsApproved) : base?.documentsApproved,
    documentsVerificationStatus: candidateInput.documentsVerificationStatus ?? base?.documentsVerificationStatus,
    documentsRejectionReason: candidateInput.documentsRejectionReason !== undefined ? candidateInput.documentsRejectionReason : base?.documentsRejectionReason,
    documentsRejectedAt: candidateInput.documentsRejectedAt !== undefined ? candidateInput.documentsRejectedAt : base?.documentsRejectedAt,
    contractRejectionReason: candidateInput.contractRejectionReason !== undefined ? candidateInput.contractRejectionReason : base?.contractRejectionReason,
    secondInstallmentStatus: candidateInput.secondInstallmentStatus ?? base?.secondInstallmentStatus,
    secondInstallmentPaid: candidateInput.secondInstallmentPaid !== undefined ? Boolean(candidateInput.secondInstallmentPaid) : base?.secondInstallmentPaid,
    thirdInstallmentStatus: candidateInput.thirdInstallmentStatus ?? base?.thirdInstallmentStatus,
    thirdInstallmentPaid: candidateInput.thirdInstallmentPaid !== undefined ? Boolean(candidateInput.thirdInstallmentPaid) : base?.thirdInstallmentPaid,
    interviewPrepStatus: candidateInput.interviewPrepStatus ?? base?.interviewPrepStatus,
    interviewPrepScheduledAt: candidateInput.interviewPrepScheduledAt !== undefined ? candidateInput.interviewPrepScheduledAt : base?.interviewPrepScheduledAt,
    interviewPrepType: candidateInput.interviewPrepType !== undefined ? candidateInput.interviewPrepType : base?.interviewPrepType,
    interviewPrepNotes: candidateInput.interviewPrepNotes !== undefined ? candidateInput.interviewPrepNotes : base?.interviewPrepNotes,
    interviewPrepAttendedAt: candidateInput.interviewPrepAttendedAt !== undefined ? candidateInput.interviewPrepAttendedAt : base?.interviewPrepAttendedAt,
    selectedJobTitle: candidateInput.selectedJobTitle !== undefined ? candidateInput.selectedJobTitle : base?.selectedJobTitle,
    selectedJobEmployer: candidateInput.selectedJobEmployer !== undefined ? candidateInput.selectedJobEmployer : base?.selectedJobEmployer,
    selectedJobCity: candidateInput.selectedJobCity !== undefined ? candidateInput.selectedJobCity : base?.selectedJobCity,
    selectedJobWage: candidateInput.selectedJobWage !== undefined ? candidateInput.selectedJobWage : base?.selectedJobWage,
    selectedJobHousing: candidateInput.selectedJobHousing !== undefined ? candidateInput.selectedJobHousing : base?.selectedJobHousing,
    jobOfferSignedAt: candidateInput.jobOfferSignedAt !== undefined ? candidateInput.jobOfferSignedAt : base?.jobOfferSignedAt,
    jobOfferSignature: candidateInput.jobOfferSignature !== undefined ? candidateInput.jobOfferSignature : base?.jobOfferSignature,
    jobOfferDetails: candidateInput.jobOfferDetails !== undefined ? candidateInput.jobOfferDetails : base?.jobOfferDetails,
  }

  // Ukloni stari preapp zapis ili duplikate sa istim ID-jem ili emailom
  fileData.candidates = fileData.candidates.filter(
    (c) =>
      String(c.id) !== String(assignedId) &&
      (base ? String(c.id) !== String(base.id) : true) &&
      (!normEmail || c.email.toLowerCase() !== normEmail)
  )
  fileData.candidates.unshift(mergedCandidate)

  const normCode = (candidateInput.code || candidateInput.activationCode || base?.activationCode || '')
    ? String(candidateInput.code || candidateInput.activationCode || base?.activationCode).trim().toUpperCase()
    : ''

  // Mark invitation as registered ONLY IF this is an actual user account registration
  if (isNowRegistered) {
    fileData.invitations = fileData.invitations.map((inv) => {
      if (
        (normCode && inv.code.toUpperCase() === normCode) ||
        (normEmail && inv.email.toLowerCase() === normEmail)
      ) {
        return {
          ...inv,
          registeredAt: inv.registeredAt || registeredAt || new Date().toISOString(),
          status: 'registered',
        }
      }
      return inv
    })
  }

  writeFileStore(fileData)

  const payload = await getPayloadIfAvailable()
  if (payload && mergedCandidate.email && mergedCandidate.firstName && mergedCandidate.lastName) {
    try {
      const normalizedStatus =
        mergedCandidate.status === 'in_review' ? 'review' : mergedCandidate.status
      const validPkgIds = ['swt-full', 'swt-self', 'swt-lifeguard', 'camp-usa', 'other'] as const
      const pkgId = validPkgIds.includes(mergedCandidate.packageId as (typeof validPkgIds)[number])
        ? (mergedCandidate.packageId as (typeof validPkgIds)[number])
        : 'swt-full'

      const payloadData = {
        basePrice: mergedCandidate.basePrice,
        cvFileName: mergedCandidate.cvFileName,
        discount: mergedCandidate.discount,
        discountNote: mergedCandidate.discountNote,
        email: mergedCandidate.email,
        facultyCertAiTranslation: mergedCandidate.facultyCertAiTranslation,
        facultyCertFileName: mergedCandidate.facultyCertFileName,
        finalPrice: mergedCandidate.finalPrice,
        firstName: mergedCandidate.firstName,
        guarantor: mergedCandidate.guarantor || undefined,
        idCardNumber: mergedCandidate.idCardNumber,
        jmbg: mergedCandidate.jmbg,
        lastName: mergedCandidate.lastName,
        notes: mergedCandidate.notes,
        packageId: pkgId,
        packageName: mergedCandidate.packageName,
        paymentMethod: mergedCandidate.paymentMethod,
        phone: mergedCandidate.phone,
        preferences: {
          englishLevel: (mergedCandidate.preferences.englishLevel || 'B2') as
            | 'A1'
            | 'A2'
            | 'B1'
            | 'B2'
            | 'C1'
            | 'C2',
          location: mergedCandidate.preferences.location,
          position: mergedCandidate.preferences.position,
          testLink: mergedCandidate.preferences.testLink,
        },
        progress: mergedCandidate.progress,
        status: normalizedStatus,
        youtubeUrl: mergedCandidate.youtubeUrl,
      }

      const existing = await payload.find({
        collection: 'candidate-applications',
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: mergedCandidate.email } },
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'candidate-applications',
          data: payloadData,
          id: existing.docs[0].id,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'candidate-applications',
          data: payloadData,
          overrideAccess: true,
        })
      }

      if (normCode && (candidateInput.isRegistered || candidateInput.registeredAt)) {
        const invDocs = await payload.find({
          collection: 'candidate-invitations',
          limit: 1,
          overrideAccess: true,
          where: { code: { equals: normCode } },
        })
        if (invDocs.docs.length > 0) {
          await payload.update({
            collection: 'candidate-invitations',
            data: {
              registeredAt: new Date().toISOString(),
              status: 'registered',
            },
            id: invDocs.docs[0].id,
            overrideAccess: true,
          })
        }
      }
    } catch {
      // Fallback already persisted in fileStore
    }
  }

  return mergedCandidate
}

export async function deletePortalCandidate(idOrEmail: string | number) {
  const fileData = readFileStore()
  const key = String(idOrEmail).trim().toLowerCase()
  const isKeyEmail = key.includes('@')
  const target = fileData.candidates.find(
    (c) => String(c.id).toLowerCase() === key || (isKeyEmail && c.email.toLowerCase() === key),
  )

  fileData.candidates = fileData.candidates.filter(
    (c) => String(c.id).toLowerCase() !== key && (!isKeyEmail || c.email.toLowerCase() !== key),
  )
  writeFileStore(fileData)

  const payload = await getPayloadIfAvailable()
  if (payload && target && isKeyEmail) {
    try {
      const existing = await payload.find({
        collection: 'candidate-applications',
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: target.email } },
      })
      if (existing.docs.length > 0) {
        await payload.delete({
          collection: 'candidate-applications',
          id: existing.docs[0].id,
          overrideAccess: true,
        })
      }
    } catch {
      // Already removed from fileStore
    }
  }

  return fileData.candidates
}

export async function savePortalAnnouncement(
  item: Omit<PortalAnnouncement, 'id' | 'date'> & { id?: string | number; date?: string },
) {
  const fileData = readFileStore()
  const announcements = fileData.announcements || []
  const newId = item.id || Date.now()
  const fullItem: PortalAnnouncement = {
    channel: item.channel || 'E-mail',
    date: item.date || new Date().toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }),
    id: newId,
    message: item.message,
    subject: item.subject,
    to: item.to || 'all',
  }

  // Update notes of matching candidates so they see it in Dashboard
  fileData.candidates = fileData.candidates.map((cand) => {
    if (fullItem.to === 'all' || cand.status === fullItem.to) {
      return {
        ...cand,
        notes: `[${fullItem.subject}]: ${fullItem.message}`,
      }
    }
    return cand
  })

  fileData.announcements = [fullItem, ...announcements]
  writeFileStore(fileData)
  return fileData.announcements
}

export async function savePortalSiteContent(itemKey: string, title: string, content: string) {
  const fileData = readFileStore()
  fileData.siteContent = fileData.siteContent || {}
  fileData.siteContent[itemKey] = { content, title }
  writeFileStore(fileData)
  return fileData.siteContent
}

export async function savePortalFaq(items: PortalFaqItem[]) {
  const fileData = readFileStore()
  fileData.faqItems = items
  writeFileStore(fileData)
  return fileData.faqItems
}

export async function savePortalPromotions(promotions: PortalPromotion[]) {
  const fileData = readFileStore()
  fileData.promotions = promotions
  writeFileStore(fileData)
  return fileData.promotions
}

export async function savePortalCandidateDs160(candidateIdOrEmail: string | number, ds160: Record<string, string>) {
  const fileData = readFileStore()
  const key = String(candidateIdOrEmail).trim().toLowerCase()
  const target = fileData.candidates.find(
    (c) => String(c.id).toLowerCase() === key || c.email.toLowerCase() === key,
  )
  if (target) {
    target.ds160 = { ...(target.ds160 || {}), ...ds160 }
    if (ds160.firstName) target.firstName = ds160.firstName
    if (ds160.lastNameAndMaiden) target.lastName = ds160.lastNameAndMaiden
    if (ds160.firstName || ds160.lastNameAndMaiden) {
      target.name = `${ds160.firstName || target.firstName || ''} ${ds160.lastNameAndMaiden || target.lastName || ''}`.trim()
    }
    if (ds160.mobilePhone) target.phone = ds160.mobilePhone
    if (ds160.jmbg) target.jmbg = ds160.jmbg
    if (ds160.passportNumber) {
      target.passportNumber = ds160.passportNumber
      target.idCardNumber = ds160.passportNumber
    }
    if (ds160.dateOfBirth) target.birthDate = ds160.dateOfBirth
    if (ds160.passportExpiryDate) target.passportExpiryDate = ds160.passportExpiryDate
    if (ds160.gender) target.gender = ds160.gender
    if (ds160.homeAddress) target.address = ds160.homeAddress
    if (ds160.university) target.faculty = ds160.university
    writeFileStore(fileData)
  }
  return target || null
}

export async function clearPortalStore(): Promise<PortalStoreData> {
  const clean: PortalStoreData = {
    announcements: [],
    candidates: [],
    faqItems: [],
    invitations: [],
    siteContent: {},
  }
  writeFileStore(clean)
  return clean
}

export async function signPortalCandidateContract(candidateIdOrEmail: string | number, reference?: string) {
  const fileData = readFileStore()
  const key = String(candidateIdOrEmail).trim().toLowerCase()
  const target = fileData.candidates.find(
    (c) => String(c.id).toLowerCase() === key || c.email.toLowerCase() === key,
  )
  if (target) {
    target.contractSigned = true
    target.contractSignedAt = new Date().toISOString()
    target.contractSignedReference = reference || `AA-POTPIS-${String(target.id).replace(/[^0-9]/g, '').slice(-4) || '1042'}-${Date.now().toString(36).toUpperCase()}`
    target.contractDownloaded = true
    if (!target.contractDownloadedAt) {
      target.contractDownloadedAt = target.contractSignedAt
    }
    writeFileStore(fileData)
  }
  return target || null
}

export async function markPortalCandidateContractDownloaded(candidateIdOrEmail: string | number) {
  const fileData = readFileStore()
  const key = String(candidateIdOrEmail).trim().toLowerCase()
  const target = fileData.candidates.find(
    (c) => String(c.id).toLowerCase() === key || c.email.toLowerCase() === key,
  )
  if (target) {
    target.contractDownloaded = true
    if (!target.contractDownloadedAt) {
      target.contractDownloadedAt = new Date().toISOString()
    }
    writeFileStore(fileData)
  }
  return target || null
}

export async function uploadPortalSignedContract(
  candidateIdOrEmail: string | number,
  fileName: string,
  fileUrl?: string,
) {
  const fileData = readFileStore()
  const key = String(candidateIdOrEmail).trim().toLowerCase()
  const target = fileData.candidates.find(
    (c) => String(c.id).toLowerCase() === key || c.email.toLowerCase() === key,
  )
  if (target) {
    target.signedContractFileName = fileName
    if (fileUrl) target.signedContractUrl = fileUrl
    target.signedContractUploadedAt = new Date().toISOString()
    target.contractSigned = true
    target.contractSignedAt = target.signedContractUploadedAt
    target.contractSignedReference = `AA-POTPIS-${String(target.id).replace(/[^0-9]/g, '').slice(-4) || '1042'}-${Date.now().toString(36).toUpperCase()}`
    target.contractDownloaded = true
    writeFileStore(fileData)
  }
  return target || null
}

export async function resetPortalInvitation(code: string) {
  const normCode = String(code || '').trim().toUpperCase();
  const state = await getPortalState();
  const inv = state.invitations.find((i) => (i?.code || '').toUpperCase() === normCode);
  if (inv) {
    inv.status = 'pending';
    delete inv.registeredAt;
    writeFileStore(state);
    const payload = await getPayloadIfAvailable();
    if (payload) {
      try {
        const dbRes = await payload.find({
          collection: 'candidate-invitations',
          limit: 1,
          overrideAccess: true,
          where: { code: { equals: normCode } },
        });
        if (dbRes.docs.length > 0) {
          await payload.update({
            collection: 'candidate-invitations',
            data: { status: 'pending', registeredAt: null },
            id: dbRes.docs[0].id,
            overrideAccess: true,
          });
        }
      } catch {}
    }
    return { success: true, invitation: inv };
  }
  return { success: false, message: 'Pozivnica nije pronađena.' };
}
