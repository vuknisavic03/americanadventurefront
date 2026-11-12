import fontkit from '@pdf-lib/fontkit'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'

import { DEFAULT_AGENCY_BENEFICIARY } from './paymentSlips.ts'
import type { CandidateInvoiceData } from './rules.ts'

const fontPath = path.join(
  process.cwd(),
  'node_modules',
  'next',
  'dist',
  'compiled',
  '@vercel',
  'og',
  'Geist-Regular.ttf',
)
let fontBytesPromise: Promise<Uint8Array> | undefined
const loadFontBytes = () => (fontBytesPromise ??= readFile(fontPath))

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('sr-Latn-RS', {
      dateStyle: 'medium',
      timeZone: 'Europe/Belgrade',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export async function renderInvoicePdf(invoice: CandidateInvoiceData): Promise<{ bytes: Uint8Array; checksum: string }> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fontBytes = await loadFontBytes()
  const font = await pdf.embedFont(fontBytes, { subset: true })

  const page = pdf.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  const primaryColor = rgb(0.08, 0.22, 0.42) // #15386b
  const darkText = rgb(0.12, 0.14, 0.17)
  const mutedText = rgb(0.42, 0.46, 0.52)
  const lineBorder = rgb(0.85, 0.88, 0.92)
  const tableHeaderBg = rgb(0.94, 0.96, 0.98)

  // Header
  page.drawText('AMERICAN ADVENTURE', { color: primaryColor, font, size: 16, x: 50, y: height - 55 })
  page.drawText('DOO ZA TURIZAM, OBRAZOVANJE I POSREDOVANJE', { color: mutedText, font, size: 8, x: 50, y: height - 68 })
  page.drawText(`${DEFAULT_AGENCY_BENEFICIARY.address}`, { color: mutedText, font, size: 8, x: 50, y: height - 80 })
  page.drawText(`PIB: ${DEFAULT_AGENCY_BENEFICIARY.taxId} | MB: ${DEFAULT_AGENCY_BENEFICIARY.registrationNumber} | Račun: ${DEFAULT_AGENCY_BENEFICIARY.accountNumber}`, { color: mutedText, font, size: 8, x: 50, y: height - 92 })
  page.drawText('Email: office@workandtravel.rs | Web: workandtravel.rs', { color: mutedText, font, size: 8, x: 50, y: height - 104 })

  // Document Title & Metadata Box (Right Header)
  page.drawText('RAČUN / FAKTURA', { color: primaryColor, font, size: 16, x: 370, y: height - 55 })
  page.drawText(`Broj: ${invoice.invoiceNumber}`, { color: darkText, font, size: 11, x: 370, y: height - 72 })
  page.drawText(`Datum izdavanja: ${formatDate(invoice.issueDate)}`, { color: mutedText, font, size: 8.5, x: 370, y: height - 86 })
  page.drawText(`Datum prometa: ${formatDate(invoice.issueDate)}`, { color: mutedText, font, size: 8.5, x: 370, y: height - 98 })
  page.drawText(`Datum knjiženja: ${formatDate(invoice.accountingDate)}`, { color: mutedText, font, size: 8.5, x: 370, y: height - 110 })
  page.drawText('Mesto izdavanja: Beograd', { color: mutedText, font, size: 8.5, x: 370, y: height - 122 })

  page.drawLine({ end: { x: width - 50, y: height - 132 }, start: { x: 50, y: height - 132 }, thickness: 1, color: lineBorder })

  // Buyer Info Box (Kupac)
  const buyerY = height - 150
  page.drawText('PODACI O KUPCU (KANDIDATU):', { color: primaryColor, font, size: 9.5, x: 50, y: buyerY })
  page.drawRectangle({ borderColor: lineBorder, borderWidth: 1, color: tableHeaderBg, height: 60, width: width - 100, x: 50, y: buyerY - 68 })
  
  page.drawText(`Ime i prezime: ${invoice.buyerName}`, { color: darkText, font, size: 9.5, x: 62, y: buyerY - 22 })
  page.drawText(`Adresa stanovanja: ${invoice.buyerAddress}`, { color: darkText, font, size: 9, x: 62, y: buyerY - 37 })
  page.drawText(`JMBG / Broj pasoša: ${invoice.buyerIdentificationNumber}`, { color: darkText, font, size: 9, x: 62, y: buyerY - 52 })

  // Items Table
  const tableY = buyerY - 95
  page.drawText('STAVKE RAČUNA:', { color: primaryColor, font, size: 9.5, x: 50, y: tableY })

  const tableTop = tableY - 12
  page.drawRectangle({ color: tableHeaderBg, height: 22, width: width - 100, x: 50, y: tableTop - 22 })
  page.drawLine({ end: { x: width - 50, y: tableTop - 22 }, start: { x: 50, y: tableTop - 22 }, thickness: 1, color: lineBorder })

  page.drawText('R.br.', { color: mutedText, font, size: 8, x: 56, y: tableTop - 15 })
  page.drawText('Opis usluge', { color: mutedText, font, size: 8, x: 88, y: tableTop - 15 })
  page.drawText('JM', { color: mutedText, font, size: 8, x: 310, y: tableTop - 15 })
  page.drawText('Količina', { color: mutedText, font, size: 8, x: 340, y: tableTop - 15 })
  page.drawText('Cena (RSD)', { color: mutedText, font, size: 8, x: 400, y: tableTop - 15 })
  page.drawText('Ukupno (RSD)', { color: mutedText, font, size: 8, x: 475, y: tableTop - 15 })

  // Row 1
  const rowY = tableTop - 42
  page.drawText('1.', { color: darkText, font, size: 8.5, x: 56, y: rowY })
  page.drawText('Učešće u programu Work and Travel USA', { color: darkText, font, size: 8.5, x: 88, y: rowY })
  page.drawText(invoice.note.slice(0, 48), { color: mutedText, font, size: 7.5, x: 88, y: rowY - 12 })
  page.drawText('kom', { color: darkText, font, size: 8.5, x: 310, y: rowY })
  page.drawText('1', { color: darkText, font, size: 8.5, x: 345, y: rowY })
  page.drawText(invoice.settlementAmountRsdFormatted.replace(' RSD', ''), { color: darkText, font, size: 8.5, x: 400, y: rowY })
  page.drawText(invoice.settlementAmountRsdFormatted.replace(' RSD', ''), { color: darkText, font, size: 8.5, x: 475, y: rowY })

  page.drawLine({ end: { x: width - 50, y: rowY - 20 }, start: { x: 50, y: rowY - 20 }, thickness: 0.5, color: lineBorder })

  // Exchange rate & NBS calculation box
  const calcY = rowY - 45
  page.drawRectangle({ borderColor: lineBorder, borderWidth: 0.5, color: tableHeaderBg, height: 48, width: width - 100, x: 50, y: calcY - 48 })
  page.drawText('OBRAČUN VALUTE I KURSA NARODNE BANKE SRBIJE (NBS):', { color: primaryColor, font, size: 8, x: 60, y: calcY - 14 })
  page.drawText(`Izvorni uplaćeni iznos: ${invoice.originalAmountFormatted}`, { color: darkText, font, size: 8.5, x: 60, y: calcY - 28 })
  page.drawText(`Primenjeni srednji kurs NBS na dan ${formatDate(invoice.exchangeRateDate)}: 1 ${invoice.originalCurrency} = ${invoice.exchangeRateFormatted} RSD (${invoice.exchangeRateSource})`, { color: mutedText, font, size: 8, x: 60, y: calcY - 40 })

  // Total summary block
  const sumY = calcY - 70
  page.drawText('OSNOVICA (0% PDV):', { color: mutedText, font, size: 8.5, x: 340, y: sumY })
  page.drawText(invoice.settlementAmountRsdFormatted, { color: darkText, font, size: 8.5, x: 460, y: sumY })

  page.drawText('PDV (član 24. stav 1. ZPDV):', { color: mutedText, font, size: 8.5, x: 340, y: sumY - 14 })
  page.drawText('0,00 RSD', { color: darkText, font, size: 8.5, x: 460, y: sumY - 14 })

  page.drawRectangle({ color: primaryColor, height: 26, width: 235, x: 310, y: sumY - 46 })
  page.drawText('UKUPNO ZA UPLATU:', { color: rgb(1, 1, 1), font, size: 9, x: 320, y: sumY - 37 })
  page.drawText(invoice.settlementAmountRsdFormatted, { color: rgb(1, 1, 1), font, size: 10, x: 435, y: sumY - 37 })

  // Amount in words (Tačka 17 ugovorna promenljiva: iznos slovima)
  const wordsY = sumY - 75
  page.drawText('IZNOS SLOVIMA (promenljiva sistema):', { color: primaryColor, font, size: 8.5, x: 50, y: wordsY })
  page.drawRectangle({ borderColor: lineBorder, borderWidth: 0.5, color: tableHeaderBg, height: 24, width: width - 100, x: 50, y: wordsY - 26 })
  page.drawText(invoice.amountInWords, { color: darkText, font, size: 8.5, x: 60, y: wordsY - 18 })

  // VAT legal clause
  page.drawText('Poresko oslobođenje: Usluga organizovanja programa kulturne razmene studenata u inostranstvu', { color: mutedText, font, size: 7.5, x: 50, y: wordsY - 42 })
  page.drawText('oslobođena je plaćanja PDV-a saglasno članu 24. stav 1. tačka 1) Zakona o porezu na dodatu vrednost Republike Srbije.', { color: mutedText, font, size: 7.5, x: 50, y: wordsY - 52 })

  // Signatures / footer
  const footerY = 90
  page.drawLine({ end: { x: 230, y: footerY }, start: { x: 50, y: footerY }, thickness: 0.5, color: mutedText })
  page.drawText('Za American Adventure DOO', { color: mutedText, font, size: 7.5, x: 75, y: footerY - 14 })
  page.drawText('(Račun je punovažan bez pečata i potpisa)', { color: mutedText, font, size: 6.5, x: 60, y: footerY - 24 })

  page.drawLine({ end: { x: width - 50, y: footerY }, start: { x: width - 230, y: footerY }, thickness: 0.5, color: mutedText })
  page.drawText(`Kupac: ${invoice.buyerName}`, { color: mutedText, font, size: 7.5, x: width - 200, y: footerY - 14 })

  page.drawText('Elektronski račun izdat automatski iz platforme American Adventure.', { color: mutedText, font, size: 6.5, x: 50, y: 30 })

  pdf.setTitle(`Faktura ${invoice.invoiceNumber} - ${invoice.buyerName}`)
  pdf.setAuthor('American Adventure DOO')
  pdf.setCreator('American Adventure Platform')

  const bytes = await pdf.save()
  const checksum = createHash('sha256').update(bytes).digest('hex')
  return { bytes, checksum }
}
