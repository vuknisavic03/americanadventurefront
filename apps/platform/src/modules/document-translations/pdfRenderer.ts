import fontkit from '@pdf-lib/fontkit'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb, StandardFonts, type PDFPage } from 'pdf-lib'

import type { DocumentTranslationType } from './templates.ts'

const candidateFontPaths = [
  path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf'),
  path.join(process.cwd(), 'apps', 'platform', 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf'),
]

let fontBytesPromise: Promise<Uint8Array | undefined> | undefined
function loadFontBytes(): Promise<Uint8Array | undefined> {
  return (fontBytesPromise ??= (async () => {
    for (const p of candidateFontPaths) {
      try {
        const bytes = await readFile(p)
        if (bytes && bytes.length > 0) return bytes
      } catch {
        // continue
      }
    }
    return undefined
  })())
}

const A4 = { height: 841.89, width: 595.28 }
const MARGIN = 50

type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>

export interface CertifiedTranslationPdfInput {
  candidateName: string
  documentTitle: string
  documentType: DocumentTranslationType
  reviewedAt: Date
  reviewedByName: string
  translatedFields: Record<string, string | number | undefined | null>
  translationId: number
}

function toAsciiSafe(text: string): string {
  return text
    .replace(/[čČ]/gu, (c) => (c === 'č' ? 'c' : 'C'))
    .replace(/[ćĆ]/gu, (c) => (c === 'ć' ? 'c' : 'C'))
    .replace(/[žŽ]/gu, (c) => (c === 'ž' ? 'z' : 'Z'))
    .replace(/[šŠ]/gu, (c) => (c === 'š' ? 's' : 'S'))
    .replace(/[đĐ]/gu, (c) => (c === 'đ' ? 'dj' : 'Dj'))
}

function sanitizeText(value: string | number | undefined | null, safeFn?: (s: string) => string): string {
  if (value === undefined || value === null) return '-'
  const str = String(value).trim() || '-'
  return safeFn ? safeFn(str) : str
}

function wrapText(text: string, font: EmbeddedFont, size: number, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const lines: string[] = []
  let line = words[0] ?? ''
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next
    } else {
      lines.push(line)
      line = word
    }
  }
  lines.push(line)
  return lines
}

function drawHeader(page: PDFPage, bold: EmbeddedFont, regular: EmbeddedFont) {
  const { height, width } = page.getSize()

  // Top header bar
  page.drawRectangle({
    color: rgb(0.7, 0.08, 0.12),
    height: 6,
    width,
    x: 0,
    y: height - 6,
  })

  // Logo text
  page.drawText('AMERICAN ADVENTURE', {
    color: rgb(0.08, 0.18, 0.3),
    font: bold,
    size: 14,
    x: MARGIN,
    y: height - 36,
  })

  page.drawText('CULTURAL EXCHANGE & EDUCATIONAL TRAVEL • EST. 2007', {
    color: rgb(0.4, 0.45, 0.5),
    font: regular,
    size: 7.5,
    x: MARGIN,
    y: height - 48,
  })

  // Official badge on right
  page.drawRectangle({
    borderColor: rgb(0.1, 0.48, 0.31),
    borderWidth: 1,
    color: rgb(0.95, 0.99, 0.96),
    height: 22,
    width: 175,
    x: width - MARGIN - 175,
    y: height - 48,
  })

  page.drawText('CERTIFIED ENGLISH TRANSLATION', {
    color: rgb(0.1, 0.48, 0.31),
    font: bold,
    size: 8.5,
    x: width - MARGIN - 167,
    y: height - 35,
  })

  // Divider line
  page.drawLine({
    color: rgb(0.85, 0.88, 0.92),
    end: { x: width - MARGIN, y: height - 60 },
    start: { x: MARGIN, y: height - 60 },
    thickness: 1,
  })
}

function drawFooter(page: PDFPage, regular: EmbeddedFont, checksum: string) {
  const { width } = page.getSize()

  page.drawLine({
    color: rgb(0.85, 0.88, 0.92),
    end: { x: width - MARGIN, y: 45 },
    start: { x: MARGIN, y: 45 },
    thickness: 0.8,
  })

  page.drawText('American Adventure d.o.o. • Belgrade, Serbia • www.workandtravel.rs', {
    color: rgb(0.4, 0.45, 0.5),
    font: regular,
    size: 8,
    x: MARGIN,
    y: 32,
  })

  const hashShort = checksum.slice(0, 16)
  page.drawText(`Integrity Hash: ${hashShort}...`, {
    color: rgb(0.5, 0.55, 0.6),
    font: regular,
    size: 7.5,
    x: width - MARGIN - 130,
    y: 32,
  })
}

export async function renderCertifiedTranslationPdf(
  input: CertifiedTranslationPdfInput,
): Promise<{ buffer: Uint8Array; checksum: string }> {
  const doc = await PDFDocument.create()
  doc.setAuthor('American Adventure')
  doc.setCreator('American Adventure Platform')
  doc.setProducer('American Adventure Platform')
  doc.setTitle(`Certified Translation AA-TR-${input.translationId.toString().padStart(6, '0')}`)
  doc.setSubject('Official Certified English Translation')
  doc.setCreationDate(input.reviewedAt)
  doc.setModificationDate(input.reviewedAt)

  let regularFont: EmbeddedFont
  let boldFont: EmbeddedFont
  let isCustomFont = false

  const fontBytes = await loadFontBytes()
  if (fontBytes) {
    try {
      doc.registerFontkit(fontkit)
      regularFont = await doc.embedFont(fontBytes)
      boldFont = regularFont
      isCustomFont = true
    } catch {
      regularFont = await doc.embedFont(StandardFonts.Helvetica)
      boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
    }
  } else {
    regularFont = await doc.embedFont(StandardFonts.Helvetica)
    boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  }

  const safe = (val: string) => (isCustomFont ? val : toAsciiSafe(val))

  const page = doc.addPage([A4.width, A4.height])
  const { height, width } = page.getSize()

  drawHeader(page, boldFont, regularFont)

  let cursorY = height - 85

  // Document Title Header
  page.drawText(safe(input.documentTitle.toUpperCase()), {
    color: rgb(0.08, 0.18, 0.3),
    font: boldFont,
    size: 13,
    x: MARGIN,
    y: cursorY,
  })
  cursorY -= 16

  const dateStr = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'Europe/Belgrade',
  }).format(input.reviewedAt)

  page.drawText(
    `Verification Reference: AA-TR-${input.translationId.toString().padStart(6, '0')}  •  Issue Date: ${dateStr}`,
    {
      color: rgb(0.35, 0.4, 0.45),
      font: regularFont,
      size: 9,
      x: MARGIN,
      y: cursorY,
    },
  )
  cursorY -= 25

  // Candidate Overview Card
  page.drawRectangle({
    color: rgb(0.97, 0.98, 0.99),
    height: 48,
    width: width - 2 * MARGIN,
    x: MARGIN,
    y: cursorY - 40,
  })

  page.drawText('CANDIDATE INFORMATION', {
    color: rgb(0.4, 0.45, 0.5),
    font: boldFont,
    size: 8,
    x: MARGIN + 12,
    y: cursorY - 14,
  })

  page.drawText(safe(`Full Name: ${input.candidateName}`), {
    color: rgb(0.08, 0.15, 0.25),
    font: boldFont,
    size: 10,
    x: MARGIN + 12,
    y: cursorY - 28,
  })

  cursorY -= 65

  // Fields Table
  const tableData: Array<{ label: string; value: string }> = []

  if (input.documentType === 'STUDENT_STATUS_CERTIFICATE') {
    tableData.push(
      { label: 'University / Institution', value: sanitizeText(input.translatedFields.universityNameEn, safe) },
      { label: 'Faculty / College', value: sanitizeText(input.translatedFields.facultyNameEn, safe) },
      { label: 'Study Program / Curriculum', value: sanitizeText(input.translatedFields.studyProgramEn, safe) },
      { label: 'Student Index / ID No.', value: sanitizeText(input.translatedFields.studentIndexNumber, safe) },
      { label: 'Current Study Year', value: sanitizeText(input.translatedFields.studyYearEn, safe) },
      { label: 'Enrollment Status', value: sanitizeText(input.translatedFields.enrollmentStatusEn, safe) },
      { label: 'Academic Year', value: sanitizeText(input.translatedFields.academicYearEn, safe) },
      { label: 'Completed Credits (ECTS / ESPB)', value: sanitizeText(input.translatedFields.academicCreditsEspb, safe) },
      { label: 'Place of Issuance', value: sanitizeText(input.translatedFields.issuedCityEn, safe) },
    )
  } else if (input.documentType === 'GUARANTOR_STATEMENT') {
    tableData.push(
      { label: 'Financial Guarantor', value: sanitizeText(input.translatedFields.guarantorFullName, safe) },
      { label: 'Relationship to Candidate', value: sanitizeText(input.translatedFields.relationshipToCandidateEn, safe) },
      { label: 'Employment Status', value: sanitizeText(input.translatedFields.employmentStatusEn, safe) },
      { label: 'Monthly Income', value: sanitizeText(input.translatedFields.monthlyIncomeEur, safe) },
      { label: 'Guarantor ID Number', value: sanitizeText(input.translatedFields.guarantorIdNumber, safe) },
      { label: 'Declaration Details', value: sanitizeText(input.translatedFields.statementNotesEn, safe) },
    )
  } else {
    tableData.push(
      { label: 'Translated Content', value: sanitizeText(input.translatedFields.translatedTextEn, safe) },
    )
  }

  const labelColWidth = 180
  const valColWidth = width - 2 * MARGIN - labelColWidth - 20

  for (const row of tableData) {
    page.drawText(row.label, {
      color: rgb(0.35, 0.4, 0.48),
      font: boldFont,
      size: 9,
      x: MARGIN + 8,
      y: cursorY,
    })

    const wrappedVal = wrapText(row.value, regularFont, 9, valColWidth)
    let valY = cursorY
    for (const line of wrappedVal) {
      page.drawText(line, {
        color: rgb(0.1, 0.15, 0.2),
        font: regularFont,
        size: 9,
        x: MARGIN + labelColWidth,
        y: valY,
      })
      valY -= 12
    }

    const rowHeight = Math.max(20, wrappedVal.length * 12 + 6)

    // Row separator
    page.drawLine({
      color: rgb(0.92, 0.94, 0.96),
      end: { x: width - MARGIN, y: cursorY - (rowHeight - 12) },
      start: { x: MARGIN, y: cursorY - (rowHeight - 12) },
      thickness: 0.5,
    })

    cursorY -= rowHeight
  }

  cursorY -= 15

  // Certification Statement Box
  const certStatement = safe(
    String(input.translatedFields.certificationStatementEn || '').trim() ||
    'This is a certified English translation and official structured verification of the original applicant documentation, verified by American Adventure agency for U.S. Sponsor and Embassy visa processing.',
  )

  const certBoxWidth = width - 2 * MARGIN
  const certLines = wrapText(certStatement, regularFont, 8.5, certBoxWidth - 24)
  const certBoxHeight = certLines.length * 12 + 24

  page.drawRectangle({
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1),
    height: certBoxHeight,
    width: certBoxWidth,
    x: MARGIN,
    y: cursorY - certBoxHeight,
  })

  page.drawText('AGENCY CERTIFICATION STATEMENT', {
    color: rgb(0.08, 0.18, 0.3),
    font: boldFont,
    size: 8,
    x: MARGIN + 12,
    y: cursorY - 14,
  })

  let certTextY = cursorY - 26
  for (const line of certLines) {
    page.drawText(line, {
      color: rgb(0.25, 0.3, 0.35),
      font: regularFont,
      size: 8.5,
      x: MARGIN + 12,
      y: certTextY,
    })
    certTextY -= 12
  }

  cursorY -= certBoxHeight + 25

  // Signature and Verification Block
  page.drawRectangle({
    color: rgb(0.97, 0.98, 0.99),
    height: 55,
    width: width - 2 * MARGIN,
    x: MARGIN,
    y: cursorY - 45,
  })

  page.drawText('VERIFIED & APPROVED BY:', {
    color: rgb(0.4, 0.45, 0.5),
    font: boldFont,
    size: 7.5,
    x: MARGIN + 12,
    y: cursorY - 12,
  })

  page.drawText(safe(input.reviewedByName), {
    color: rgb(0.08, 0.18, 0.3),
    font: boldFont,
    size: 10,
    x: MARGIN + 12,
    y: cursorY - 26,
  })

  page.drawText('Authorized Administrator & Verification Officer', {
    color: rgb(0.4, 0.45, 0.5),
    font: regularFont,
    size: 8,
    x: MARGIN + 12,
    y: cursorY - 37,
  })

  page.drawText(`Date: ${dateStr}`, {
    color: rgb(0.2, 0.25, 0.3),
    font: regularFont,
    size: 9,
    x: width - MARGIN - 140,
    y: cursorY - 26,
  })

  // Provisional checksum calculation for footer
  const rawBytes = await doc.save()
  const checksum = createHash('sha256').update(rawBytes).digest('hex')

  drawFooter(page, regularFont, checksum)
  doc.setModificationDate(input.reviewedAt)

  const finalBytes = await doc.save()
  const finalChecksum = createHash('sha256').update(finalBytes).digest('hex')

  return {
    buffer: finalBytes,
    checksum: finalChecksum,
  }
}
