import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'

import { scaledRateToString, type TicketCurrency } from './rules.ts'

const fontPath = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf')
let fontBytesPromise: Promise<Uint8Array> | undefined
const loadFontBytes = () => fontBytesPromise ??= readFile(fontPath)

export type FlightTicketPaymentPdfInput = {
  advanceInvoiceNumber?: string
  airlineName: string
  bankAccount: string
  beneficiaryAddress: string
  beneficiaryName: string
  beneficiaryRegistrationNumber?: string
  beneficiaryTaxId?: string
  candidateAddress: string
  candidateInstructions: string
  candidateName: string
  dueAt: Date
  exchangeRateDate: Date
  exchangeRateReference?: string
  exchangeRateScaled: number
  exchangeRateSource: string
  includeAdvanceInvoice: boolean
  issuedAt: Date
  orderNumber: string
  originalAmountMinor: number
  originalCurrency: TicketCurrency
  outboundDepartureAt: Date
  outboundRoute: string
  paymentModel?: string
  paymentPurpose: string
  paymentReference: string
  returnDepartureAt: Date
  returnRoute: string
  settlementAmountMinor: number
}

function money(minor: number, currency: string) {
  return new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(minor / 100)
}
function date(value: Date) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(value) }
function dateTime(value: Date) { return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(value) }

export async function renderFlightTicketPaymentPdf(input: FlightTicketPaymentPdfInput) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const bytes = await loadFontBytes()
  const regular = await pdf.embedFont(bytes, { subset: true })
  const bold = await pdf.embedFont(bytes, { subset: true })
  pdf.setAuthor('American Adventure')
  pdf.setCreator('American Adventure Platform')
  pdf.setProducer('American Adventure Platform')
  pdf.setTitle(`Nalog za uplatu avionske karte ${input.orderNumber}`)
  pdf.setSubject('Nalog za uplatu prihvaćene avionske karte')
  pdf.setCreationDate(input.issuedAt)
  pdf.setModificationDate(input.issuedAt)

  const page = pdf.addPage([595.28, 841.89])
  const width = page.getWidth()
  const margin = 48
  let y = 790
  page.drawRectangle({ color: rgb(0.70, 0.08, 0.12), height: 7, width, x: 0, y: 835 })
  page.drawText('AMERICAN ADVENTURE', { color: rgb(0.08, 0.18, 0.30), font: bold, size: 14, x: margin, y })
  page.drawText('NALOG ZA UPLATU AVIONSKE KARTE', { color: rgb(0.08, 0.18, 0.30), font: bold, size: 18, x: margin, y: y - 35 })
  y -= 70

  const row = (label: string, value: string, emphasize = false) => {
    page.drawText(label.toUpperCase(), { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: margin, y })
    page.drawText(value, { color: rgb(0.08, 0.18, 0.30), font: emphasize ? bold : regular, size: emphasize ? 11 : 9.5, x: 190, y })
    y -= 18
  }
  const section = (title: string) => {
    y -= 6
    page.drawLine({ color: rgb(0.82, 0.85, 0.88), end: { x: width - margin, y }, start: { x: margin, y }, thickness: 0.8 })
    y -= 16
    page.drawText(title, { color: rgb(0.70, 0.08, 0.12), font: bold, size: 10.5, x: margin, y })
    y -= 17
  }

  row('Broj naloga', input.orderNumber, true)
  row('Datum izdavanja', date(input.issuedAt))
  row('Rok za uplatu', date(input.dueAt), true)
  section('PRIMALAC I PLATILAC')
  row('Primalac', input.beneficiaryName)
  row('Adresa primaoca', input.beneficiaryAddress)
  if (input.beneficiaryTaxId) row('PIB', input.beneficiaryTaxId)
  if (input.beneficiaryRegistrationNumber) row('Matični broj', input.beneficiaryRegistrationNumber)
  row('Platilac', input.candidateName)
  row('Adresa platioca', input.candidateAddress)
  section('PODACI ZA UPLATU')
  row('Račun primaoca', input.bankAccount, true)
  row('Model i poziv na broj', `${input.paymentModel ?? '-'} / ${input.paymentReference}`)
  row('Svrha uplate', input.paymentPurpose)
  row('Iznos za uplatu', money(input.settlementAmountMinor, 'RSD'), true)
  section('OSNOV OBRAČUNA')
  row('Prihvaćena opcija', `${input.airlineName} · ${input.outboundRoute}`)
  row('Odlazak', dateTime(input.outboundDepartureAt))
  row('Povratak', `${input.returnRoute} · ${dateTime(input.returnDepartureAt)}`)
  row('Cena iz ponude', money(input.originalAmountMinor, input.originalCurrency))
  row('Kurs', `1 ${input.originalCurrency} = ${scaledRateToString(input.exchangeRateScaled)} RSD`)
  row('Datum kursa', date(input.exchangeRateDate))
  row('Izvor kursa', input.exchangeRateSource)
  if (input.exchangeRateReference) row('Referenca kursa', input.exchangeRateReference)

  if (input.includeAdvanceInvoice) {
    section('AVANSNI OBRAČUN')
    row('Broj dokumenta', input.advanceInvoiceNumber ?? '-')
    row('Osnovica za uplatu', money(input.settlementAmountMinor, 'RSD'), true)
    page.drawText('Ovaj prateći obračun nije fiskalni račun niti dokaz da je uplata izvršena.', { color: rgb(0.55, 0.22, 0.08), font: bold, size: 8.5, x: margin, y })
    y -= 22
  }

  section('NAPOMENA')
  for (const line of input.candidateInstructions.match(/.{1,92}(?:\s|$)/g) ?? [input.candidateInstructions]) {
    page.drawText(line.trim(), { color: rgb(0.10, 0.14, 0.19), font: regular, size: 8.8, x: margin, y })
    y -= 14
  }
  page.drawLine({ color: rgb(0.84, 0.87, 0.90), end: { x: width - margin, y: 43 }, start: { x: margin, y: 43 }, thickness: 0.7 })
  page.drawText('Dokument je automatski generisan iz zaključanih podataka prihvaćene ponude.', { color: rgb(0.39, 0.45, 0.52), font: regular, size: 7.5, x: margin, y: 27 })
  return pdf.save({ useObjectStreams: false })
}
