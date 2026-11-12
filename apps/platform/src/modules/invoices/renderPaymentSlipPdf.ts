import fontkit from '@pdf-lib/fontkit'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'

import type { PaymentSlipData } from './paymentSlips.ts'

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

export async function renderPaymentSlipPdf(slip: PaymentSlipData): Promise<{ bytes: Uint8Array; checksum: string }> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fontBytes = await loadFontBytes()
  const font = await pdf.embedFont(fontBytes, { subset: true })

  // Standard A4 page (595.28 x 841.89 pt) with payment slip at the bottom or middle
  const page = pdf.addPage([595.28, 841.89])
  const { height } = page.getSize()

  const primaryColor = rgb(0.08, 0.22, 0.42) // #15386b
  const darkText = rgb(0.12, 0.14, 0.17)
  const mutedText = rgb(0.42, 0.46, 0.52)
  const borderRed = rgb(0.85, 0.2, 0.2) // Standard red border of Serbian Nalog za uplatu
  const boxBg = rgb(0.98, 0.98, 0.99)

  // Header / Instructions
  page.drawText('AMERICAN ADVENTURE • INSTRUKCIJE ZA PLAĆANJE', {
    color: primaryColor,
    font,
    size: 14,
    x: 50,
    y: height - 60,
  })

  page.drawText('Primer naloga za uplatu (možete uplatiti na šalteru banke/pošte ili putem e-bankinga / m-bankinga)', {
    color: mutedText,
    font,
    size: 9,
    x: 50,
    y: height - 76,
  })

  // Payment slip box coordinates (approx 500 x 240 pt)
  const slipX = 48
  const slipY = height - 340
  const slipW = 500
  const slipH = 240

  // Outer border
  page.drawRectangle({
    borderColor: borderRed,
    borderWidth: 1.5,
    color: boxBg,
    height: slipH,
    width: slipW,
    x: slipX,
    y: slipY,
  })

  // Title inside slip
  page.drawText('NALOG ZA UPLATU', {
    color: borderRed,
    font,
    size: 11,
    x: slipX + 16,
    y: slipY + slipH - 22,
  })

  // Left column (Payer, Purpose, Recipient)
  const leftX = slipX + 16
  const leftW = 220

  // Uplatilac
  page.drawText('Uplatilac:', { color: mutedText, font, size: 7.5, x: leftX, y: slipY + slipH - 45 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 42, width: leftW, x: leftX, y: slipY + slipH - 90 })
  page.drawText(slip.candidateName, { color: darkText, font, size: 9, x: leftX + 6, y: slipY + slipH - 62 })
  page.drawText(slip.candidateAddress, { color: darkText, font, size: 8, x: leftX + 6, y: slipY + slipH - 76 })

  // Svrha uplate
  page.drawText('Svrha uplate:', { color: mutedText, font, size: 7.5, x: leftX, y: slipY + slipH - 102 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 42, width: leftW, x: leftX, y: slipY + slipH - 147 })
  const purposeLine1 = slip.paymentPurpose.slice(0, 36)
  const purposeLine2 = slip.paymentPurpose.slice(36, 75)
  page.drawText(purposeLine1, { color: darkText, font, size: 8.5, x: leftX + 6, y: slipY + slipH - 120 })
  if (purposeLine2) {
    page.drawText(purposeLine2, { color: darkText, font, size: 8, x: leftX + 6, y: slipY + slipH - 134 })
  }

  // Primalac
  page.drawText('Primalac:', { color: mutedText, font, size: 7.5, x: leftX, y: slipY + slipH - 159 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 42, width: leftW, x: leftX, y: slipY + slipH - 204 })
  page.drawText(slip.recipientName, { color: darkText, font, size: 9, x: leftX + 6, y: slipY + slipH - 176 })
  page.drawText(slip.recipientAddress, { color: darkText, font, size: 8, x: leftX + 6, y: slipY + slipH - 190 })

  // Right column (Payment code, Currency, Amount, Account, Model, Reference)
  const rightX = slipX + 250

  // Šifra plaćanja, Valuta, Iznos
  page.drawText('Šifra:', { color: mutedText, font, size: 7.5, x: rightX, y: slipY + slipH - 45 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 22, width: 40, x: rightX, y: slipY + slipH - 70 })
  page.drawText(slip.paymentCode, { color: darkText, font, size: 9, x: rightX + 8, y: slipY + slipH - 62 })

  page.drawText('Valuta:', { color: mutedText, font, size: 7.5, x: rightX + 50, y: slipY + slipH - 45 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 22, width: 40, x: rightX + 50, y: slipY + slipH - 70 })
  page.drawText(slip.currency, { color: darkText, font, size: 9, x: rightX + 56, y: slipY + slipH - 62 })

  page.drawText('Iznos:', { color: mutedText, font, size: 7.5, x: rightX + 100, y: slipY + slipH - 45 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 22, width: 135, x: rightX + 100, y: slipY + slipH - 70 })
  page.drawText(`=${slip.paymentAmountFormatted}`, { color: darkText, font, size: 9.5, x: rightX + 106, y: slipY + slipH - 62 })

  // Račun primaoca
  page.drawText('Račun primaoca:', { color: mutedText, font, size: 7.5, x: rightX, y: slipY + slipH - 85 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 24, width: 235, x: rightX, y: slipY + slipH - 112 })
  page.drawText(slip.recipientAccount, { color: darkText, font, size: 10, x: rightX + 10, y: slipY + slipH - 104 })

  // Model i Poziv na broj
  page.drawText('Model:', { color: mutedText, font, size: 7.5, x: rightX, y: slipY + slipH - 127 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 22, width: 45, x: rightX, y: slipY + slipH - 152 })
  page.drawText(slip.paymentModel, { color: darkText, font, size: 9, x: rightX + 12, y: slipY + slipH - 144 })

  page.drawText('Poziv na broj (odobrenje):', { color: mutedText, font, size: 7.5, x: rightX + 55, y: slipY + slipH - 127 })
  page.drawRectangle({ borderColor: mutedText, borderWidth: 0.5, height: 22, width: 180, x: rightX + 55, y: slipY + slipH - 152 })
  page.drawText(slip.paymentReference, { color: darkText, font, size: 9.5, x: rightX + 64, y: slipY + slipH - 144 })

  // Pečat i potpis mesta
  page.drawText('Potpis uplatioca:', { color: mutedText, font, size: 7.5, x: leftX, y: slipY + 16 })
  page.drawLine({ end: { x: leftX + 100, y: slipY + 14 }, start: { x: leftX, y: slipY + 14 }, thickness: 0.5 })

  page.drawText('Mesto i datum prijema:', { color: mutedText, font, size: 7.5, x: rightX + 80, y: slipY + 16 })
  page.drawLine({ end: { x: rightX + 230, y: slipY + 14 }, start: { x: rightX + 80, y: slipY + 14 }, thickness: 0.5 })

  // IPS info below slip
  page.drawText('NBS IPS Standard:', { color: primaryColor, font, size: 9, x: slipX, y: slipY - 30 })
  page.drawText('Za plaćanje mobilnom aplikacijom banke, koristite opciju "IPS Skeniraj" sa referencom:', { color: mutedText, font, size: 8, x: slipX, y: slipY - 44 })
  page.drawText(`Model: ${slip.paymentModel} | Poziv na broj: ${slip.paymentReference}`, { color: darkText, font, size: 8.5, x: slipX, y: slipY - 58 })
  page.drawText(`NBS IPS string: ${slip.ipsQrPayload}`, { color: mutedText, font, size: 6.5, x: slipX, y: slipY - 72 })

  pdf.setTitle(`Uplatnica - ${slip.obligationLabel} - ${slip.candidateName}`)
  pdf.setAuthor('American Adventure DOO')
  pdf.setCreator('American Adventure Platform')

  const bytes = await pdf.save()
  const checksum = createHash('sha256').update(bytes).digest('hex')
  return { bytes, checksum }
}
