import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { degrees, PDFDocument, type PDFPage, rgb } from 'pdf-lib'

const fontPath = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf')
const A4 = { height: 841.89, width: 595.28 }
const MARGIN = 54
const BODY_SIZE = 10.5
const LINE_HEIGHT = 16

type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>

export type PassportAuthorizationPdfInput = {
  acceptance?: { acceptedAt: Date; reference: string; statement: string; statementVersion: string }
  authorizationDate: Date
  authorizationNumber: string
  body: string
  candidateName: string
}

let fontBytesPromise: Promise<Uint8Array> | undefined
function loadFontBytes() { return fontBytesPromise ??= readFile(fontPath) }

function wrapText(text: string, font: EmbeddedFont, size: number, width: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
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

function date(value: Date) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(value)
}

function dateTime(value: Date) {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/Belgrade',
  }).format(value)
}

function decorate(page: PDFPage, regular: EmbeddedFont, bold: EmbeddedFont, pageNumber: number, accepted: boolean) {
  const { height, width } = page.getSize()
  page.drawRectangle({ color: rgb(0.70, 0.08, 0.12), height: 7, width, x: 0, y: height - 7 })
  page.drawText('AMERICAN ADVENTURE', { color: rgb(0.08, 0.18, 0.30), font: bold, size: 13, x: MARGIN, y: height - 38 })
  page.drawText('PRIVATNI DOKUMENT KANDIDATA', { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y: height - 51 })
  page.drawLine({ color: rgb(0.84, 0.87, 0.90), end: { x: width - MARGIN, y: 45 }, start: { x: MARGIN, y: 45 }, thickness: 0.7 })
  page.drawText(`Strana ${pageNumber}`, { color: rgb(0.39, 0.45, 0.52), font: regular, size: 8, x: width - MARGIN - 42, y: 29 })
  if (accepted) {
    page.drawText('ELEKTRONSKI PRIHVAĆENO', { color: rgb(0.10, 0.48, 0.31), font: bold, size: 8.5, x: width - MARGIN - 138, y: height - 39 })
  } else {
    page.drawText('NACRT - NIJE ELEKTRONSKI PRIHVAĆENO', { color: rgb(0.91, 0.92, 0.94), font: bold, rotate: degrees(36), size: 25, x: 85, y: 350 })
  }
}

function meta(page: PDFPage, regular: EmbeddedFont, label: string, value: string, y: number) {
  page.drawText(label.toUpperCase(), { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y })
  page.drawText(value, { color: rgb(0.08, 0.18, 0.30), font: regular, size: 9.5, x: 165, y })
}

export async function renderPassportAuthorizationPdf(input: PassportAuthorizationPdfInput) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const bytes = await loadFontBytes()
  const regular = await pdf.embedFont(bytes, { subset: true })
  const bold = await pdf.embedFont(bytes, { subset: true })
  pdf.setAuthor('American Adventure')
  pdf.setCreator('American Adventure Platform')
  pdf.setProducer('American Adventure Platform')
  pdf.setTitle(`Punomoćje ${input.authorizationNumber}`)
  pdf.setSubject(input.acceptance ? 'Elektronski prihvaćeno punomoćje za preuzimanje pasoša' : 'Nacrt punomoćja za preuzimanje pasoša')
  pdf.setCreationDate(input.authorizationDate)
  pdf.setModificationDate(input.acceptance?.acceptedAt ?? input.authorizationDate)

  let pageNumber = 1
  let page = pdf.addPage([A4.width, A4.height])
  decorate(page, regular, bold, pageNumber, Boolean(input.acceptance))
  let y = A4.height - 92
  page.drawText('PUNOMOĆJE ZA PREUZIMANJE PASOŠA', { color: rgb(0.08, 0.18, 0.30), font: bold, size: 17, x: MARGIN, y })
  y -= 34
  meta(page, regular, 'Broj dokumenta', input.authorizationNumber, y)
  y -= 18
  meta(page, regular, 'Datum', date(input.authorizationDate), y)
  y -= 18
  meta(page, regular, 'Davalac punomoćja', input.candidateName, y)
  y -= 25
  page.drawLine({ color: rgb(0.70, 0.08, 0.12), end: { x: A4.width - MARGIN, y }, start: { x: MARGIN, y }, thickness: 1.2 })
  y -= 25

  const addPage = () => {
    pageNumber += 1
    page = pdf.addPage([A4.width, A4.height])
    decorate(page, regular, bold, pageNumber, Boolean(input.acceptance))
    y = A4.height - 82
  }

  for (const rawLine of input.body.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) { y -= LINE_HEIGHT * 0.65; continue }
    const heading = trimmed.startsWith('# ')
    const bullet = trimmed.startsWith('- ')
    const content = heading || bullet ? trimmed.slice(2) : trimmed
    const font = heading ? bold : regular
    const size = heading ? 13 : BODY_SIZE
    const x = bullet ? MARGIN + 13 : MARGIN
    const lines = wrapText(content, font, size, A4.width - x - MARGIN)
    const needed = lines.length * (heading ? 19 : LINE_HEIGHT) + 5
    if (y - needed < 65) addPage()
    if (bullet) page.drawCircle({ color: rgb(0.70, 0.08, 0.12), size: 2.2, x: MARGIN + 3, y: y + 3 })
    for (const line of lines) {
      page.drawText(line, { color: rgb(0.10, 0.14, 0.19), font, size, x, y })
      y -= heading ? 19 : LINE_HEIGHT
    }
    y -= heading ? 5 : 2
  }

  if (input.acceptance) {
    if (y < 235) addPage()
    y -= 12
    page.drawLine({ color: rgb(0.10, 0.48, 0.31), end: { x: A4.width - MARGIN, y }, start: { x: MARGIN, y }, thickness: 1.2 })
    y -= 30
    page.drawText('EVIDENCIJA ELEKTRONSKOG PRIHVATANJA', { color: rgb(0.08, 0.18, 0.30), font: bold, size: 13, x: MARGIN, y })
    y -= 25
    meta(page, regular, 'Prihvaćeno', dateTime(input.acceptance.acceptedAt), y)
    y -= 18
    meta(page, regular, 'Referenca', input.acceptance.reference, y)
    y -= 18
    meta(page, regular, 'Verzija izjave', input.acceptance.statementVersion, y)
    y -= 27
    page.drawText('IZJAVA KANDIDATA', { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: MARGIN, y })
    y -= 17
    for (const line of wrapText(input.acceptance.statement, regular, BODY_SIZE, A4.width - (2 * MARGIN))) {
      page.drawText(line, { color: rgb(0.10, 0.14, 0.19), font: regular, size: BODY_SIZE, x: MARGIN, y })
      y -= LINE_HEIGHT
    }
    y -= 8
    for (const line of wrapText('Prihvatanje je evidentirano putem autentifikovanog kandidatskog naloga. Ovaj zapis nije kvalifikovani elektronski potpis.', regular, 8.5, A4.width - (2 * MARGIN))) {
      page.drawText(line, { color: rgb(0.39, 0.45, 0.52), font: regular, size: 8.5, x: MARGIN, y })
      y -= 13
    }
  }

  return pdf.save({ useObjectStreams: false })
}
