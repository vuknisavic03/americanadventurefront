import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { degrees, PDFDocument, type PDFPage, rgb } from 'pdf-lib'

const regularFontPath = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf')
const boldFontPath = regularFontPath

const A4 = { height: 841.89, width: 595.28 }
const MARGIN = 54
const BODY_SIZE = 10.5
const BODY_LINE_HEIGHT = 16

type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>

export type ContractPdfInput = {
  acceptance?: {
    acceptedAt: Date
    reference: string
    statement: string
    statementVersion: string
  }
  body: string
  candidateName: string
  contractDate: Date
  contractNumber: string
  jmbg?: string
  passportNumber?: string
  paymentLabel: string
  programLabel: string
  totalLabel: string
}

let fontBytesPromise: Promise<[Uint8Array, Uint8Array]> | undefined

function loadFontBytes() {
  fontBytesPromise ??= Promise.all([readFile(regularFontPath), readFile(boldFontPath)])
  return fontBytesPromise
}

function wrapText(text: string, font: EmbeddedFont, size: number, width: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let line = words[0] ?? ''
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`
    if (font.widthOfTextAtSize(next, size) <= width) line = next
    else { lines.push(line); line = word }
  }
  lines.push(line)
  return lines
}

function acceptanceDateTime(value: Date) {
  const dateParts = new Intl.DateTimeFormat('sr-Latn-RS', {
    day: 'numeric', month: 'long', timeZone: 'Europe/Belgrade', year: 'numeric',
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value ?? ''
  const time = new Intl.DateTimeFormat('sr-Latn-RS', {
    hour: '2-digit', hour12: false, minute: '2-digit', second: '2-digit', timeZone: 'Europe/Belgrade',
  }).format(value)
  return `${part('day')}. ${part('month')} ${part('year')}. ${time}`
}

function decoratePage(page: PDFPage, regular: EmbeddedFont, bold: EmbeddedFont, pageNumber: number, accepted: boolean) {
  const { height, width } = page.getSize()
  page.drawRectangle({ color: rgb(0.70, 0.08, 0.12), height: 7, width, x: 0, y: height - 7 })
  page.drawText('AMERICAN ADVENTURE', {
    color: rgb(0.08, 0.18, 0.30), font: bold, size: 13, x: MARGIN, y: height - 38,
  })
  page.drawText('PRIVATNI DOKUMENT KANDIDATA', {
    color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y: height - 51,
  })
  page.drawLine({
    color: rgb(0.84, 0.87, 0.90), end: { x: width - MARGIN, y: 45 },
    start: { x: MARGIN, y: 45 }, thickness: 0.7,
  })
  page.drawText('AMERICAN ADVENTURE D.O.O. BEOGRAD · Gospodar Jevremova 59/4 · MB: 20356090 · PIB: 105311717', {
    color: rgb(0.55, 0.60, 0.65), font: regular, size: 6.5, x: MARGIN, y: 29,
  })
  page.drawText(`Strana ${pageNumber}`, {
    color: rgb(0.39, 0.45, 0.52), font: regular, size: 8, x: width - MARGIN - 42, y: 29,
  })
  if (accepted) {
    page.drawText('ELEKTRONSKI PRIHVAĆEN', {
      color: rgb(0.10, 0.48, 0.31), font: bold, size: 8.5, x: width - MARGIN - 126, y: height - 39,
    })
  } else {
    page.drawText('NACRT - NIJE ELEKTRONSKI PRIHVAĆEN', {
      color: rgb(0.91, 0.92, 0.94), font: bold, rotate: degrees(36), size: 27, x: 105, y: 350,
    })
  }
}

function drawMetaRow({
  label, page, regular, value, y,
}: {
  label: string
  page: PDFPage
  regular: EmbeddedFont
  value: string
  y: number
}) {
  page.drawText(label.toUpperCase(), { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y })
  page.drawText(value, { color: rgb(0.08, 0.18, 0.30), font: regular, size: 9.5, x: 165, y })
}

export async function renderContractPdf(input: ContractPdfInput) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const [regularBytes, boldBytes] = await loadFontBytes()
  const regular = await pdf.embedFont(regularBytes, { subset: true })
  const bold = await pdf.embedFont(boldBytes, { subset: true })
  pdf.setAuthor('American Adventure')
  pdf.setCreator('American Adventure Platform')
  pdf.setProducer('American Adventure Platform')
  pdf.setTitle(`Ugovor ${input.contractNumber}`)
  pdf.setSubject(input.acceptance ? 'Elektronski prihvaćen ugovor kandidata' : 'Generisani nacrt ugovora kandidata')
  pdf.setCreationDate(input.contractDate)
  pdf.setModificationDate(input.contractDate)

  let pageNumber = 1
  let page = pdf.addPage([A4.width, A4.height])
  decoratePage(page, regular, bold, pageNumber, Boolean(input.acceptance))
  let y = A4.height - 92

  page.drawText('UGOVOR O PROGRAMU', {
    color: rgb(0.08, 0.18, 0.30), font: bold, size: 20, x: MARGIN, y,
  })
  y -= 34
  drawMetaRow({ label: 'Broj ugovora', page, regular, value: input.contractNumber, y })
  y -= 18
  drawMetaRow({ label: 'Datum', page, regular, value: new Intl.DateTimeFormat('sr-Latn-RS').format(input.contractDate), y })
  y -= 18
  drawMetaRow({ label: 'Kandidat', page, regular, value: input.candidateName, y })
  if (input.jmbg) {
    y -= 18
    drawMetaRow({ label: 'JMBG', page, regular, value: input.jmbg, y })
  }
  if (input.passportNumber) {
    y -= 18
    drawMetaRow({ label: 'Broj pasoša', page, regular, value: input.passportNumber, y })
  }
  y -= 18
  drawMetaRow({ label: 'Program', page, regular, value: input.programLabel, y })
  y -= 18
  drawMetaRow({ label: 'Način plaćanja', page, regular, value: input.paymentLabel, y })
  y -= 18
  drawMetaRow({ label: 'Ukupan iznos', page, regular, value: input.totalLabel, y })
  y -= 24
  page.drawLine({
    color: rgb(0.70, 0.08, 0.12), end: { x: A4.width - MARGIN, y }, start: { x: MARGIN, y }, thickness: 1.2,
  })
  y -= 25

  const addPage = () => {
    pageNumber += 1
    page = pdf.addPage([A4.width, A4.height])
    decoratePage(page, regular, bold, pageNumber, Boolean(input.acceptance))
    y = A4.height - 82
  }

  for (const rawLine of input.body.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) { y -= BODY_LINE_HEIGHT * 0.65; continue }
    const heading = trimmed.startsWith('# ')
    const bullet = trimmed.startsWith('- ')
    const content = heading ? trimmed.slice(2) : bullet ? trimmed.slice(2) : trimmed
    const font = heading ? bold : regular
    const size = heading ? 13 : BODY_SIZE
    const x = bullet ? MARGIN + 13 : MARGIN
    const availableWidth = A4.width - x - MARGIN
    const lines = wrapText(content, font, size, availableWidth)
    const requiredHeight = lines.length * (heading ? 19 : BODY_LINE_HEIGHT) + 5
    if (y - requiredHeight < 65) addPage()
    if (bullet) page.drawCircle({ color: rgb(0.70, 0.08, 0.12), size: 2.2, x: MARGIN + 3, y: y + 3 })
    for (const line of lines) {
      page.drawText(line, { color: rgb(0.10, 0.14, 0.19), font, size, x, y })
      y -= heading ? 19 : BODY_LINE_HEIGHT
    }
    y -= heading ? 5 : 2
  }

  if (input.acceptance) {
    if (y < 235) addPage()
    y -= 12
    page.drawLine({
      color: rgb(0.10, 0.48, 0.31), end: { x: A4.width - MARGIN, y }, start: { x: MARGIN, y }, thickness: 1.2,
    })
    y -= 30
    page.drawText('EVIDENCIJA ELEKTRONSKOG PRIHVATANJA', {
      color: rgb(0.08, 0.18, 0.30), font: bold, size: 13, x: MARGIN, y,
    })
    y -= 25
    drawMetaRow({
      label: 'Prihvaćen',
      page,
      regular,
      value: acceptanceDateTime(input.acceptance.acceptedAt),
      y,
    })
    y -= 18
    drawMetaRow({ label: 'Referenca', page, regular, value: input.acceptance.reference, y })
    y -= 18
    drawMetaRow({ label: 'Verzija izjave', page, regular, value: input.acceptance.statementVersion, y })
    y -= 27
    page.drawText('IZJAVA KANDIDATA', {
      color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y,
    })
    y -= 17
    for (const line of wrapText(input.acceptance.statement, regular, BODY_SIZE, A4.width - (2 * MARGIN))) {
      page.drawText(line, { color: rgb(0.10, 0.14, 0.19), font: regular, size: BODY_SIZE, x: MARGIN, y })
      y -= BODY_LINE_HEIGHT
    }
    y -= 7
    const evidenceNote = 'Prihvatanje je evidentirano putem autentifikovanog kandidatskog naloga. Ovaj zapis nije kvalifikovani elektronski potpis.'
    for (const line of wrapText(evidenceNote, regular, 8.5, A4.width - (2 * MARGIN))) {
      page.drawText(line, { color: rgb(0.39, 0.45, 0.52), font: regular, size: 8.5, x: MARGIN, y })
      y -= 13
    }
  }

  return pdf.save({ useObjectStreams: false })
}

