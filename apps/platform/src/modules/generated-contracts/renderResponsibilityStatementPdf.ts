import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'

const possibleFontPaths = [
  path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf'),
  path.join(process.cwd(), 'apps', 'platform', 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf'),
]

const A4 = { height: 841.89, width: 595.28 }
const MARGIN = 42
const CONTENT_WIDTH = A4.width - MARGIN * 2

type EmbeddedFont = Awaited<ReturnType<PDFDocument['embedFont']>>

export type ResponsibilityStatementPdfInput = {
  candidateName: string
  jmbg: string
  passportNumber: string
  contractNumber?: string
  date?: Date
  sourceInfo?: string
  cityAndDate?: string
  isAccepted?: boolean
  acceptedAt?: Date
  reference?: string
}

export const RESPONSIBILITY_STATEMENT_ITEMS = [
  'Upoznat/a sam sa svim uslovima Ugovora o pružanju usluga i jasni su mi svi članovi, stavovi i tačke iz pomenutog Ugovora i u potpunosti se slažem sa istim I prihvatam sva prava i obaveze koje su definisane u ovom Ugovoru;',
  'Svu potrebnu dokumentaciju dostaviću na vreme i sve uplate troškova programa izvršiću u tačno predviđenim rokovima, pozivajući se na Ugovor o pružanju usluga potpisan sa American Adventure d.o.o',
  'Svestan/a sam da će sve informacije o W&T programu stizati na moju ličnu e-mail adresu i odgovoran sam da proveravam istu svaki dan;',
  'Svestan/a sam da je American Adventure d.o.o. samo posrednik između mene i Sponzorske agencije i poslodavca iz SAD, kao i da je Sponzorska agencija odgovorna za mene tokom mog boravka u SAD-u.',
  'Odgovoran/a sam za svoje ponašanje u Sjedinjenim Američkim Državama.',
  'Odgovoran/a sam za pronalazak smeštaja u SAD-u, snosiću troškove hrane, troškove transporta od kuće do posla i ostale troškove transporta, osim ako radnom ponudom koju dobijam od poslodavca iz SAD ili Aneksom ugovora nije drugačije precizirano;',
  'Ako mi treba pomoć ili imam probleme sa poslom ili W&T programom kontaktiraću Sponzorsku agenciju u SAD-u;',
  'Svestan/a sam da ukoliko pronađem drugog poslodavca tokom trajanja radnog dela programa, nemam prava da radim za njega dok ne obavestim, Sponzorsku agenciju i dok ga Sponzorska agencije ne proveri i odobri mi rad i da ako to ne postupim Sponzorska agencija ima pravo da mi ukine program i vizu;',
  'Shvatam da postoji velika razlika u životu i kulturi moje zemlje i SAD-a, tako da ću u skladu sa tim poštovati sve važeće zakone SAD-a, jer sam svestan ako budem prekršio bilo koji zakon, moj W&T program može biti ugrožen a J1 viza ukinuta;',
  'Svestan/a sam da u skladu sa SEVIS programom imam 72 sata od ulaska u SAD da Sponzorskoj agenciji pošaljem informacije o adresi stanovanja na kojoj ću tokom programa boraviti, kao i da ukoliko menjam adresu stanovanja, moram u roku od najkasnije 7 dana poslati informacije o novoj adresi i da ako to ne radim Sponzorska agencija ima pravo da mi ukine program i vizu;',
  'Dužan/a sam da od trenutka kad počnem da radim jednom mesečno izveštavam Sponzorsku agenciju o statusu svog W&T programa i da ako to ne radim Sponzorska agencija ima pravo da mi ukine program i vizu;',
  'Upoznat/a sam da je trajanje mog radnog dela programa definisano datumima koji se nalaze u DS–2019 obrascu. Po isteku krajnjeg datuma na DS–2019 obrascu svestan sam da imam 30 dana da se vratim u zemlju prebivališta; Ukoliko mi program i viza budu ukinuti pre nego što je navršena polivina trajanja programa, svestan/a sam da nemamo parvo na 30 dana putovanja I da moram da napustim SAD što pre je moguće. Ukidanjem programa i vize ukida se zdravstveno osiguranje.',
  'Svestan/a sam da ako ostanem u SAD nakon 30 dana od krajnjeg datuma na DS-2019 obrascu ili nakon datuma koji mi naknadno odradi Sponzorska agencija, mogu biti uhapšen i deportovan u zemlju prebivališta sa zabranom ulaska u SAD i do 10 godina;',
  'Upoznat/a sam da tokom mog boravka (trajanja radnog dela programa) u SAD podležem zdravstvenom osiguranju koje je obezbeđeno programom. Izjavljujem da ću svaki račun nastao na osnovu medicinske intervencije platiti i račun poslati nadležnoj osiguravajućoj kući kako bi mi se pripadajući iznos refundirao pre nego što napustim SAD;',
  'Upoznat/a sam sa činjenicom da zdravstveno osiguranje traje samo dok traje radni deo programa. Za deo programa koji je namenjen putovanju imam mogućnost da doplatim dodatno zdravstveno osiguranje preko Sponzorske agencije u SAD;',
  'Upoznat/a sam da sam dužan tokom trajanja programa da plaćam porez i da nakon isteka kalendarske godine imam pravo da podnesem zahtev za refundaciju određene kategorije poreza.',
] as const

let fontBytesPromise: Promise<Uint8Array> | undefined

async function loadFontBytes(): Promise<Uint8Array> {
  if (fontBytesPromise) return fontBytesPromise
  for (const p of possibleFontPaths) {
    if (fs.existsSync(p)) {
      fontBytesPromise = readFile(p)
      return fontBytesPromise
    }
  }
  fontBytesPromise = readFile(possibleFontPaths[0]!)
  return fontBytesPromise
}

function wrapText(text: string, font: EmbeddedFont, size: number, width: number): string[] {
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

export async function renderResponsibilityStatementPdf(input: ResponsibilityStatementPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)

  const fontBytes = await loadFontBytes()
  const font = await pdf.embedFont(fontBytes, { subset: true })

  const candidateName = input.candidateName.trim() || 'Student Kandidat'
  const jmbg = input.jmbg.trim() || '1508001710023'
  const passportNumber = input.passportNumber.trim() || '010948212'
  const issueDate = input.date || new Date()
  const contractNumber = input.contractNumber || 'AA-2026'

  pdf.setAuthor('American Adventure d.o.o.')
  pdf.setCreator('American Adventure Platform')
  pdf.setProducer('American Adventure Platform')
  pdf.setTitle(`Izjava o odgovornosti - ${candidateName}`)
  pdf.setSubject(`Izjava o odgovornosti uz ugovor o radnoj i kulturnoj razmeni W&T USA (${contractNumber})`)
  pdf.setCreationDate(issueDate)
  pdf.setModificationDate(input.acceptedAt || issueDate)

  const page = pdf.addPage([A4.width, A4.height])

  // Colors
  const black = rgb(0.08, 0.08, 0.08)
  const brandYellow = rgb(0.98, 0.77, 0.18) // #F9C42E
  const textGray = rgb(0.28, 0.32, 0.36)
  const borderGray = rgb(0.82, 0.84, 0.86)

  // 1. HEADER SECTION
  // 1.1 Left Logo: Yellow emblem circle behind AMERICAN ADVENTURE
  page.drawCircle({
    color: brandYellow,
    opacity: 0.95,
    size: 26,
    x: MARGIN + 40,
    y: A4.height - 52,
  })

  page.drawText('AMERICAN', {
    color: black,
    font,
    size: 15,
    x: MARGIN + 12,
    y: A4.height - 48,
  })

  page.drawText('ADVENTURE', {
    color: black,
    font,
    size: 15,
    x: MARGIN + 12,
    y: A4.height - 63,
  })

  page.drawText('work and travel agency', {
    color: rgb(0.2, 0.2, 0.2),
    font,
    size: 7,
    x: MARGIN + 14,
    y: A4.height - 73,
  })

  // 1.2 Right Box: Yellow box with PIB, MB, Banca Intesa
  const boxWidth = 142
  const boxHeight = 56
  const boxX = A4.width - MARGIN - boxWidth
  const boxY = A4.height - 76

  page.drawRectangle({
    color: brandYellow,
    height: boxHeight,
    width: boxWidth,
    x: boxX,
    y: boxY,
  })

  const boxPadLeft = boxX + 8
  page.drawText('PIB: 105311717', {
    color: black,
    font,
    size: 8,
    x: boxPadLeft,
    y: boxY + 41,
  })
  page.drawText('MB: 20356090', {
    color: black,
    font,
    size: 8,
    x: boxPadLeft,
    y: boxY + 29,
  })
  page.drawText('Banca Intesa:', {
    color: black,
    font,
    size: 8,
    x: boxPadLeft,
    y: boxY + 17,
  })
  page.drawText('160-6000000728717-84', {
    color: black,
    font,
    size: 8,
    x: boxPadLeft,
    y: boxY + 6,
  })

  // 2. DOCUMENT TITLE
  const titleText = 'IZJAVA O ODGOVORNOSTI'
  const titleSize = 11.5
  const titleWidth = font.widthOfTextAtSize(titleText, titleSize)
  const titleX = (A4.width - titleWidth) / 2
  const titleY = A4.height - 110

  page.drawText(titleText, {
    color: black,
    font,
    size: titleSize,
    x: titleX,
    y: titleY,
  })

  // 3. INTRODUCTORY PARAGRAPH WITH CANDIDATE DATA
  // Format: "Ja, [NAME], JMBG: [JMBG], broj pasoša: [PASSPORT], kao jedna od ugovornih strana Ugovora o pružanju usluga agencije American Adventure d.o.o u skladu sa uslovima Work & Travel programom (u daljem tekstu W&T program) izjavljujem sledeće:"
  const introSize = 8
  const introLineHeight = 11.5
  let currentY = titleY - 22

  const introFullText = `Ja, ${candidateName}, JMBG: ${jmbg}, broj pasoša: ${passportNumber}, kao jedna od ugovornih strana Ugovora o pružanju usluga agencije American Adventure d.o.o u skladu sa uslovima Work & Travel programom (u daljem tekstu W&T program) izjavljujem sledeće:`

  const introLines = wrapText(introFullText, font, introSize, CONTENT_WIDTH)
  for (const line of introLines) {
    page.drawText(line, {
      color: black,
      font,
      size: introSize,
      x: MARGIN,
      y: currentY,
    })
    currentY -= introLineHeight
  }

  currentY -= 4

  // 4. THE 16 BULLET POINTS
  const bulletSize = 7.2
  const bulletLineHeight = 9.8
  const bulletSpacing = 3.2
  const textStartX = MARGIN + 10
  const availableTextWidth = CONTENT_WIDTH - 10

  for (const point of RESPONSIBILITY_STATEMENT_ITEMS) {
    // Draw bullet dot
    page.drawText('•', {
      color: black,
      font,
      size: bulletSize + 1,
      x: MARGIN,
      y: currentY,
    })

    const lines = wrapText(point, font, bulletSize, availableTextWidth)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      page.drawText(line, {
        color: black,
        font,
        size: bulletSize,
        x: textStartX,
        y: currentY,
      })
      currentY -= bulletLineHeight
    }
    currentY -= bulletSpacing
  }

  // 5. CLOSING QUESTIONS & SIGNATURE SECTION
  currentY -= 6

  // Source info line
  const sourcePrompt = 'Za American Adventure d.o.o i ovaj program sam čuo: '
  const sourceAnswer = input.sourceInfo?.trim() || '____________________________________________________________________'
  const sourceLine = `${sourcePrompt}${sourceAnswer}`
  page.drawText(sourceLine, {
    color: black,
    font,
    size: 7.8,
    x: MARGIN,
    y: currentY,
  })

  currentY -= 22

  // Signature and Date lines
  const dateStr = new Intl.DateTimeFormat('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(issueDate)

  const cityAndDateValue = input.cityAndDate || `Beograd, ${dateStr}.`
  
  const signLabel = 'Svojeručni potpis: '
  const signBlank = '____________________________'
  const dateLabel = 'Datum i mesto: '

  page.drawText(`${signLabel}${signBlank}`, {
    color: black,
    font,
    size: 8,
    x: MARGIN,
    y: currentY,
  })

  page.drawText(`${dateLabel}${cityAndDateValue}`, {
    color: black,
    font,
    size: 8,
    x: A4.width - MARGIN - 210,
    y: currentY,
  })

  // If electronically accepted, add official verification stamp
  if (input.isAccepted) {
    currentY -= 18
    const acceptStampY = currentY
    const acceptBoxWidth = CONTENT_WIDTH
    const acceptBoxHeight = 22

    page.drawRectangle({
      color: rgb(0.93, 0.98, 0.94),
      borderColor: rgb(0.18, 0.65, 0.35),
      borderWidth: 0.8,
      height: acceptBoxHeight,
      width: acceptBoxWidth,
      x: MARGIN,
      y: acceptStampY - 6,
    })

    const acceptRef = input.reference || `AA-POTPIS-${contractNumber}`
    const acceptTime = input.acceptedAt
      ? new Intl.DateTimeFormat('sr-Latn-RS', {
          dateStyle: 'medium',
          timeStyle: 'medium',
          timeZone: 'Europe/Belgrade',
        }).format(input.acceptedAt)
      : `${dateStr} god.`

    page.drawText(`✓ ELEKTRONSKI POTPISANO I POTVRĐENO • Kandidat: ${candidateName} (JMBG: ${jmbg}, Pasoš: ${passportNumber}) • Datum: ${acceptTime} • Ref: ${acceptRef}`, {
      color: rgb(0.1, 0.45, 0.2),
      font,
      size: 6.8,
      x: MARGIN + 8,
      y: acceptStampY + 3,
    })
  }

  // 6. FOOTER SECTION
  const footerLineY = 66
  page.drawLine({
    color: borderGray,
    end: { x: A4.width - MARGIN, y: footerLineY },
    start: { x: MARGIN, y: footerLineY },
    thickness: 0.8,
  })

  const footerTextY = 54
  const footerSize = 6.8
  const footerLeading = 9.2

  // Left column (Address & Socials)
  page.drawText('Gospodar Jevremova 59/4', { color: textGray, font, size: footerSize, x: MARGIN + 4, y: footerTextY })
  page.drawText('11000, Beograd', { color: textGray, font, size: footerSize, x: MARGIN + 4, y: footerTextY - footerLeading })
  page.drawText('twitter.com/americanadventure', { color: textGray, font, size: footerSize, x: MARGIN + 4, y: footerTextY - footerLeading * 2 })
  page.drawText('facebook.com/AmericanAdventureSerbia', { color: textGray, font, size: footerSize, x: MARGIN + 4, y: footerTextY - footerLeading * 3 })
  page.drawText('linkedin.com/company/american-adventure', { color: textGray, font, size: footerSize, x: MARGIN + 4, y: footerTextY - footerLeading * 4 })

  // Middle column (Contacts)
  const col2X = MARGIN + 210
  page.drawText('P +381 11 4527 320', { color: textGray, font, size: footerSize, x: col2X, y: footerTextY })
  page.drawText('M +381 64 107 2004', { color: textGray, font, size: footerSize, x: col2X, y: footerTextY - footerLeading })
  page.drawText('E office.americanadventure@gmail.com', { color: textGray, font, size: footerSize, x: col2X, y: footerTextY - footerLeading * 2 })

  // Right column (Website)
  const col3X = A4.width - MARGIN - 110
  page.drawText('www.workandtravel.rs', {
    color: rgb(0.12, 0.12, 0.12),
    font,
    size: 7.8,
    x: col3X,
    y: footerTextY - footerLeading,
  })

  return pdf.save({ useObjectStreams: false })
}
