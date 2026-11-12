import sharp from 'sharp'
import type { SupportedDocumentMimeType } from '../candidate-documents/privateDocument.ts'

/**
 * Extracts an image buffer from either an image file or an embedded PDF stream.
 */
export async function prepareImageForOcr(
  bytes: Uint8Array,
  mimeType: SupportedDocumentMimeType,
): Promise<{ fullImage: Buffer; mrzCroppedImage?: Buffer }> {
  let rawBuffer: Buffer

  if (mimeType === 'application/pdf') {
    // Attempt to extract embedded JPEG or PNG stream from the PDF
    const extracted = extractImageFromPdf(bytes)
    rawBuffer = extracted ?? Buffer.from(bytes)
  } else {
    rawBuffer = Buffer.from(bytes)
  }

  // Preprocess with sharp: auto-rotate via EXIF, grayscale, normalize contrast
  const baseSharp = sharp(rawBuffer).rotate()
  const metadata = await baseSharp.metadata().catch(() => null)

  const fullImage = await baseSharp
    .grayscale()
    .normalize()
    .png()
    .toBuffer()

  // If dimensions are available, crop bottom 35% where MRZ is located
  let mrzCroppedImage: Buffer | undefined
  if (metadata && metadata.width && metadata.height && metadata.height > 200) {
    const cropTop = Math.floor(metadata.height * 0.6)
    const cropHeight = metadata.height - cropTop

    mrzCroppedImage = await sharp(rawBuffer)
      .rotate()
      .extract({
        left: 0,
        top: cropTop,
        width: metadata.width,
        height: cropHeight,
      })
      .grayscale()
      .normalize()
      .threshold(140) // High-contrast binary for MRZ font
      .png()
      .toBuffer()
      .catch(() => undefined)
  }

  return { fullImage, mrzCroppedImage }
}

/**
 * Lightweight extractor for embedded images in scanned PDF documents.
 * Scanners wrap a raw JPEG (0xFF 0xD8 0xFF) or PNG stream inside a PDF wrapper.
 */
export function extractImageFromPdf(pdfBytes: Uint8Array): Buffer | null {
  const buf = Buffer.from(pdfBytes)

  // Look for JPEG signature: 0xFF 0xD8 0xFF
  const jpegStart = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]))
  if (jpegStart !== -1) {
    // Look for JPEG end: 0xFF 0xD9
    const jpegEnd = buf.lastIndexOf(Buffer.from([0xff, 0xd9]))
    if (jpegEnd !== -1 && jpegEnd > jpegStart) {
      return buf.subarray(jpegStart, jpegEnd + 2)
    }
  }

  // Look for PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  const pngStart = buf.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (pngStart !== -1) {
    // Look for PNG IEND: 0x49 0x45 0x4E 0x44 0xAE 0x42 0x60 0x82
    const pngEnd = buf.lastIndexOf(Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]))
    if (pngEnd !== -1 && pngEnd > pngStart) {
      return buf.subarray(pngStart, pngEnd + 8)
    }
  }

  return null
}
