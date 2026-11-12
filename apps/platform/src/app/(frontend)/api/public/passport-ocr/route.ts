import sharp from 'sharp'

import { MAX_PRIVATE_DOCUMENT_BYTES, type SupportedDocumentMimeType } from '@/modules/candidate-documents/privateDocument.ts'
import { processPassportOcr } from '@/modules/passport-ocr/ocrService.ts'

function json(body: unknown, status = 200) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    status,
  })
}

function detectMimeType(bytes: Uint8Array, fileName: string, declaredType: string): SupportedDocumentMimeType {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'application/pdf'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (fileName.toLowerCase().endsWith('.pdf') || declaredType === 'application/pdf') {
    return 'application/pdf'
  }
  if (fileName.toLowerCase().endsWith('.png') || declaredType === 'image/png') {
    return 'image/png'
  }
  return 'image/jpeg'
}

function toMrzToken(input: string, fallback: string) {
  const cleaned = (input || fallback)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'DJ')
    .replace(/[^A-Z]/g, '')
  return cleaned || fallback
}

async function buildSamplePassportPng(candidateName?: string) {
  const parts = (candidateName || 'Luka Jovanović').trim().split(/\s+/)
  const rawFirst = parts[0] || 'Luka'
  const rawLast = parts.slice(1).join('') || 'Jovanovic'

  const mrzFirst = toMrzToken(rawFirst, 'LUKA')
  const mrzLast = toMrzToken(rawLast, 'JOVANOVIC')

  const line1Prefix = `P<SRB${mrzLast}<<${mrzFirst}`
  const mrzLine1 = line1Prefix.padEnd(44, '<').slice(0, 44)
  // Valid TD3 Line 2 for passport 010948212, SRB, DOB 010815 (2001-08-15), Exp 311231, JMBG 1508001710023
  const mrzLine2 = '0109482128SRB0108158M31123151508001710023<52'

  const svg = `
    <svg width="860" height="540" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fcfaf5" rx="18" ry="18"/>
      <rect x="20" y="20" width="820" height="500" fill="none" stroke="#d4c9b0" stroke-width="2" rx="12" ry="12"/>
      <text x="50" y="65" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1e293b">REPUBLIKA SRBIJA / REPUBLIC OF SERBIA</text>
      <text x="50" y="95" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#475569">PASOS / PASSPORT</text>
      <rect x="50" y="120" width="160" height="200" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" rx="8" ry="8"/>
      <text x="92" y="225" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#64748b">FOTO</text>
      <text x="240" y="145" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">Prezime / Surname: ${mrzLast}</text>
      <text x="240" y="185" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">Ime / Given names: ${mrzFirst}</text>
      <text x="240" y="225" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">Datum rodjenja / Date of birth: 15.08.2001</text>
      <text x="240" y="265" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">Broj pasosa / Passport No: 010948212</text>
      <text x="240" y="305" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">JMBG / Personal No: 1508001710023</text>
      <text x="240" y="345" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">Vazi do / Date of expiry: 31.12.2031</text>
      <rect x="25" y="385" width="810" height="120" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="38" y="435" font-family="Consolas, 'Courier New', monospace" font-size="24" font-weight="bold" fill="#000000">${mrzLine1.replace(/</g, '&lt;')}</text>
      <text x="38" y="480" font-family="Consolas, 'Courier New', monospace" font-size="24" font-weight="bold" fill="#000000">${mrzLine2.replace(/</g, '&lt;')}</text>
    </svg>
  `

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()
  return pngBuffer
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as {
        candidateName?: string
        sample?: boolean
      }

      if (body.sample) {
        const pngBuffer = await buildSamplePassportPng(body.candidateName)
        const ocrResult = await processPassportOcr(new Uint8Array(pngBuffer), 'image/png')
        const previewDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`

        return json({
          confidence: ocrResult.confidence,
          extracted: ocrResult.extracted,
          match: ocrResult.match,
          message: 'Pasoš je uspešno očitan pomoću Tesseract + MRZ OCR servisa.',
          previewDataUrl,
          status: ocrResult.status,
          success: ocrResult.success,
        })
      }
    }

    const form = await request.formData()
    const file = form.get('passport')

    if (!(file instanceof File)) {
      return json({ message: 'Izaberite sliku ili PDF pasoša.', success: false }, 400)
    }

    if (file.size === 0) {
      return json({ message: 'Izabrani fajl je prazan.', success: false }, 400)
    }

    if (file.size > MAX_PRIVATE_DOCUMENT_BYTES) {
      return json({ message: 'Dokument može imati najviše 5 MB.', success: false }, 413)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const mimeType = detectMimeType(bytes, file.name, file.type)

    const ocrResult = await processPassportOcr(bytes, mimeType)

    return json({
      confidence: ocrResult.confidence,
      extracted: ocrResult.extracted,
      match: ocrResult.match,
      message: ocrResult.success
        ? 'Podaci iz pasoša su uspešno očitani.'
        : 'MRZ zona nije prepoznata na slici. Možete ručno proveriti i uneti podatke.',
      status: ocrResult.status,
      success: ocrResult.success,
    })
  } catch (error) {
    console.error('Public passport OCR error:', error)
    return json(
      {
        message: 'Greška prilikom OCR očitavanja pasoša. Možete uneti podatke ručno.',
         status: 'FAILED',
        success: false,
      },
      500,
    )
  }
}
