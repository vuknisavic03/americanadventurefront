import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, type PDFPage, rgb } from 'pdf-lib'

import type { GuarantorContractTerms } from './types.ts'

const regularFontPath = path.join(
  process.cwd(),
  'node_modules',
  'next',
  'dist',
  'compiled',
  '@vercel',
  'og',
  'Geist-Regular.ttf',
)

const A4 = { height: 841.89, width: 595.28 }
const MARGIN = 50
const CONTENT_WIDTH = A4.width - MARGIN * 2
const BODY_SIZE = 9.5
const LINE_HEIGHT = 14

type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>

let fontBytesPromise: Promise<Uint8Array> | undefined

function loadFontBytes() {
  fontBytesPromise ??= readFile(regularFontPath)
  return fontBytesPromise
}

function wrapText(text: string, font: EmbeddedFont, size: number, width: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    dateStyle: 'long',
    timeZone: 'Europe/Belgrade',
  }).format(value)
}

function moneyUsd(cents: number) {
  return `$${new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(cents / 100)} USD`
}

function moneyRsd(amount: number) {
  return `${new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)} RSD`
}

function decoratePage(page: PDFPage, regular: EmbeddedFont, bold: EmbeddedFont, pageNumber: number) {
  const { height, width } = page.getSize()
  // Header bar
  page.drawRectangle({ color: rgb(0.7, 0.08, 0.12), height: 6, width, x: 0, y: height - 6 })
  page.drawText('AMERICAN ADVENTURE', {
    color: rgb(0.08, 0.18, 0.3),
    font: bold,
    size: 12,
    x: MARGIN,
    y: height - 32,
  })
  page.drawText('PRAVNI DOKUMENT I MENIČNO OBEZBEĐENJE (PKZ)', {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 7,
    x: MARGIN,
    y: height - 44,
  })
  // Footer
  page.drawLine({
    color: rgb(0.84, 0.87, 0.9),
    end: { x: width - MARGIN, y: 40 },
    start: { x: MARGIN, y: 40 },
    thickness: 0.6,
  })
  page.drawText(`Strana ${pageNumber}`, {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 7.5,
    x: width - MARGIN - 40,
    y: 26,
  })
  page.drawText('American Adventure d.o.o. Beograd • Ugovor o jemstvu i menično ovlašćenje', {
    color: rgb(0.5, 0.55, 0.6),
    font: regular,
    size: 7,
    x: MARGIN,
    y: 26,
  })
}

export async function renderGuarantorContractPdf(terms: GuarantorContractTerms): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const bytes = await loadFontBytes()
  const regular = await pdf.embedFont(bytes, { subset: true })
  const bold = regular

  pdf.setAuthor('American Adventure')
  pdf.setCreator('American Adventure Platform')
  pdf.setTitle(`Ugovor o jemstvu ${terms.contractNumber}`)
  pdf.setSubject('Ugovor o solidarnom jemstvu i menično ovlašćenje za Platiš kad zaradiš model')
  pdf.setCreationDate(terms.contractDate)

  let pageNumber = 1
  let page = pdf.addPage([A4.width, A4.height])
  decoratePage(page, regular, bold, pageNumber)

  let y = A4.height - 75

  const ensureSpace = (needed: number) => {
    if (y - needed < 55) {
      pageNumber += 1
      page = pdf.addPage([A4.width, A4.height])
      decoratePage(page, regular, bold, pageNumber)
      y = A4.height - 65
    }
  }

  // Naslov
  page.drawText('UGOVOR O SOLIDARNOM JEMSTVU I MENIČNO OVLAŠĆENJE', {
    color: rgb(0.08, 0.18, 0.3),
    font: bold,
    size: 13,
    x: MARGIN,
    y,
  })
  y -= 16

  page.drawText(`Broj: ${terms.contractNumber}   •   Datum: ${formatDate(terms.contractDate)}   •   Mesto: Beograd`, {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 8.5,
    x: MARGIN,
    y,
  })
  y -= 16

  page.drawLine({
    color: rgb(0.7, 0.08, 0.12),
    end: { x: A4.width - MARGIN, y },
    start: { x: MARGIN, y },
    thickness: 1,
  })
  y -= 20

  // Uvodni tekst o ugovornim stranama
  const introParagraphs = [
    'Zaključen u Beogradu između sledećih ugovornih strana:',
    `1. ${terms.agency.name}, sa sedištem na adresi ${terms.agency.address}, PIB: ${terms.agency.pib}, MB: ${terms.agency.mb}, zastupan po direktoru ${terms.agency.director} (u daljem tekstu: Poverilac / Agencija),`,
    `2. ${terms.candidate.fullName}, sa prebivalištem na adresi ${terms.candidate.address}${terms.candidate.jmbg ? `, JMBG: ${terms.candidate.jmbg}` : ''} (u daljem tekstu: Korisnik / Glavni dužnik), i`,
    `3. ${terms.guarantor.fullName}, sa prebivalištem na adresi ${terms.guarantor.address}, LK br. ${terms.guarantor.idCardNumber} izdata od ${terms.guarantor.idCardIssuer || 'MUP RS'}${terms.guarantor.jmbg ? `, JMBG: ${terms.guarantor.jmbg}` : ''}, srodstvo sa Korisnikom: ${terms.guarantor.relationshipLabel}, zaposlen/a kod poslodavca ${terms.guarantor.employerName} na radnom mestu ${terms.guarantor.employmentStatusLabel}, sa mesečnim primanjima od ${moneyRsd(terms.guarantor.monthlyIncomeRsd)} (u daljem tekstu: Jemac-platac).`,
  ]

  for (const p of introParagraphs) {
    const lines = wrapText(p, regular, BODY_SIZE, CONTENT_WIDTH)
    ensureSpace(lines.length * LINE_HEIGHT + 6)
    for (const line of lines) {
      page.drawText(line, { color: rgb(0.12, 0.15, 0.18), font: regular, size: BODY_SIZE, x: MARGIN, y })
      y -= LINE_HEIGHT
    }
    y -= 4
  }

  y -= 8

  // Članovi ugovora
  const articles = [
    {
      title: 'Član 1. Predmet ugovora i osnovna obaveza',
      body: `Korisnik i Poverilac su zaključili Ugovor o učešću u Work & Travel USA programu po modelu plaćanja „Platiš kad zaradiš“ (PKZ). Ukupna ugovorena cena programa iznosi ${moneyUsd(terms.finance.totalPriceCents)}. Korisnik plaća početni depozit u iznosu od ${moneyUsd(terms.finance.depositCents)}, dok odloženi iznos od ${moneyUsd(terms.finance.deferredAmountCents)} dospeva za naplatu nakon početka rada u SAD odnosno po završetku programa, a najkasnije u roku predviđenim ugovorom o programu.`,
    },
    {
      title: 'Član 2. Solidarno jemstvo (Jemac-platac)',
      body: `Jemac-platac ovim ugovorom neopozivo i bezuslovno preuzima obavezu da kao solidarni jemac (jemac-platac u smislu člana 1004. Zakona o obligacionim odnosima Republike Srbije) odgovara Poveriocu za celokupnu novčanu obavezu Korisnika iz Člana 1. ovog ugovora. Jemac-platac se obavezuje da će na prvi pisani poziv Poverioca, bez prigovora i odlaganja, u celosti isplatiti dospeli odloženi iznos od ${moneyUsd(terms.finance.deferredAmountCents)} u dinarskoj protivvrednosti po srednjem kursu NBS na dan uplate, ukoliko Korisnik ne izmiri dug u roku dospeća.`,
    },
    {
      title: 'Član 3. Izdavanje menica i menično ovlašćenje',
      body: `Radi obezbeđenja naplate duga, Jemac-platac predaje Poveriocu ${terms.finance.promissoryNotesCount} (slovima: dve) potpisane blanko solo menice sa klauzulom „bez protesta“. Jemac-platac ovim neopozivo ovlašćuje Poverioca da, u slučaju da Korisnik ili Jemac-platac ne izmire dospelu obavezu u ugovorenom roku, popuni menice na ukupan dospeli iznos potraživanja u dinarskoj protivvrednosti, sa datumom dospeća po izboru Poverioca, i podnese ih na naplatu poslovnoj banci Jemca-platca ili nadležnom javnom izvršitelju / sudu.`,
    },
    {
      title: 'Član 4. Izjave i garancije jemca',
      body: `Jemac-platac pod punom materijalnom i krivičnom odgovornošću izjavljuje da su podaci o zaposlenju i primanjima tačni, da protiv njega nije pokrenut stečajni ili izvršni postupak, da je kreditno sposoban, te da dostavljena očitana lična karta predstavlja veran dokaz njegovog identiteta i prebivališta.`,
    },
    {
      title: 'Član 5. Završne odredbe',
      body: 'Ovaj ugovor je sačinjen u 3 (tri) istovetna primerka, od kojih po jedan zadržavaju Korisnik i Jemac-platac, a jedan primerak zadržava Poverilac. Za sve što nije predviđeno ovim ugovorom primenjuju se odredbe Zakona o obligacionim odnosima i Zakona o menici Republike Srbije. U slučaju spora koji se ne može rešiti sporazumno, nadležan je Prvi osnovni sud u Beogradu.',
    },
  ]

  for (const art of articles) {
    const titleLines = wrapText(art.title, bold, 10, CONTENT_WIDTH)
    const bodyLines = wrapText(art.body, regular, BODY_SIZE, CONTENT_WIDTH)
    ensureSpace(titleLines.length * LINE_HEIGHT + bodyLines.length * LINE_HEIGHT + 14)

    for (const line of titleLines) {
      page.drawText(line, { color: rgb(0.08, 0.18, 0.3), font: bold, size: 10, x: MARGIN, y })
      y -= LINE_HEIGHT
    }
    y -= 2

    for (const line of bodyLines) {
      page.drawText(line, { color: rgb(0.15, 0.18, 0.22), font: regular, size: BODY_SIZE, x: MARGIN, y })
      y -= LINE_HEIGHT
    }
    y -= 8
  }

  // Potpisi
  ensureSpace(90)
  y -= 15
  page.drawText('UGOVORNE STRANE:', { color: rgb(0.08, 0.18, 0.3), font: bold, size: 9.5, x: MARGIN, y })
  y -= 35

  const colWidth = (CONTENT_WIDTH - 40) / 3

  // Korisnik
  page.drawLine({
    color: rgb(0.5, 0.55, 0.6),
    end: { x: MARGIN + colWidth, y },
    start: { x: MARGIN, y },
    thickness: 0.8,
  })
  page.drawText(terms.candidate.fullName, {
    color: rgb(0.12, 0.15, 0.18),
    font: bold,
    size: 8,
    x: MARGIN,
    y: y - 12,
  })
  page.drawText('Korisnik (Glavni dužnik)', {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 7.5,
    x: MARGIN,
    y: y - 22,
  })

  // Jemac-platac
  const col2X = MARGIN + colWidth + 20
  page.drawLine({
    color: rgb(0.5, 0.55, 0.6),
    end: { x: col2X + colWidth, y },
    start: { x: col2X, y },
    thickness: 0.8,
  })
  page.drawText(terms.guarantor.fullName, {
    color: rgb(0.12, 0.15, 0.18),
    font: bold,
    size: 8,
    x: col2X,
    y: y - 12,
  })
  page.drawText('Jemac-platac (Garant)', {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 7.5,
    x: col2X,
    y: y - 22,
  })

  // Poverilac
  const col3X = col2X + colWidth + 20
  page.drawLine({
    color: rgb(0.5, 0.55, 0.6),
    end: { x: col3X + colWidth, y },
    start: { x: col3X, y },
    thickness: 0.8,
  })
  page.drawText(terms.agency.name, {
    color: rgb(0.12, 0.15, 0.18),
    font: bold,
    size: 8,
    x: col3X,
    y: y - 12,
  })
  page.drawText('Poverilac (Agencija d.o.o.)', {
    color: rgb(0.39, 0.45, 0.52),
    font: regular,
    size: 7.5,
    x: col3X,
    y: y - 22,
  })

  return pdf.save()
}
