import fs from 'node:fs'
import path from 'node:path'
import { createWorker } from 'tesseract.js'
import { parse as parseMrz } from 'mrz'
import type { SupportedDocumentMimeType } from '../candidate-documents/privateDocument.ts'
import { formatMrzDate, isPassportExpired, isPassportValidForSwtSeason } from './dateUtils.ts'
import { prepareImageForOcr } from './imageUtils.ts'
import {
  findCandidateMrzLines,
  normalizeMrzTd3Line1,
  normalizeMrzTd3Line2,
} from './mrzNormalizer.ts'
import type {
  CandidateMatchContext,
  PassportOcrExtractedData,
  PassportOcrMatchResult,
  PassportOcrResult,
  PassportSex,
} from './types.ts'
import { parseVisualZone } from './visualParser.ts'

function resolveTesseractWorkerOptions(): { workerPath?: string } {
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js'),
    path.resolve(process.cwd(), '../../node_modules/tesseract.js/src/worker-script/node/index.js'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { workerPath: candidate }
    }
  }
  return {}
}

function normalizeName(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'DJ')
    .replace(/[^A-Z]/g, '')
}

/**
 * Compare OCR extracted data against applicant records
 */
export function evaluateCandidateMatch(
  extracted: PassportOcrExtractedData,
  context?: CandidateMatchContext,
): PassportOcrMatchResult {
  const notes: string[] = []
  let nameMatch: boolean | null = null
  let birthDateMatch: boolean | null = null
  let jmbgMatch: boolean | null = null

  // 1. Name match
  if (context?.firstName || context?.lastName) {
    const ocrLast = normalizeName(extracted.lastName)
    const ocrFirst = normalizeName(extracted.firstName)
    const ctxLast = normalizeName(context.lastName)
    const ctxFirst = normalizeName(context.firstName)

    const lastMatches = !ctxLast || ocrLast.includes(ctxLast) || ctxLast.includes(ocrLast)
    const firstMatches = !ctxFirst || ocrFirst.includes(ctxFirst) || ctxFirst.includes(ocrFirst)

    nameMatch = lastMatches && firstMatches
    if (!nameMatch) {
      notes.push(`Ime u pasošu (${extracted.firstName} ${extracted.lastName}) se razlikuje od prijave (${context.firstName} ${context.lastName}).`)
    }
  }

  // 2. Date of birth match
  if (context?.dateOfBirth && extracted.birthDate) {
    const ctxDob = context.dateOfBirth.slice(0, 10)
    birthDateMatch = ctxDob === extracted.birthDate
    if (!birthDateMatch) {
      notes.push(`Datum rođenja u pasošu (${extracted.birthDate}) se ne poklapa sa prijavom (${ctxDob}).`)
    }
  }

  // 3. JMBG match (if available in Serbian passport MRZ or visual zone)
  const candidateJmbg = context?.jmbg?.trim()
  const ocrJmbg = extracted.personalNumber || extracted.visualFields?.jmbg
  if (candidateJmbg && ocrJmbg) {
    jmbgMatch = candidateJmbg === ocrJmbg
    if (!jmbgMatch) {
      notes.push('Matični broj (JMBG) iz pasoša se ne poklapa sa unetim JMBG-om.')
    }
  }

  // 4. Expiration checks
  const isExpired = isPassportExpired(extracted.expirationDate)
  if (isExpired) {
    notes.push(`Pasoš je istekao (${extracted.expirationDate}).`)
  }

  const seasonCheck = isPassportValidForSwtSeason(extracted.expirationDate, context?.seasonYear)
  const expiresWithinSeason = !seasonCheck.valid
  if (!isExpired && expiresWithinSeason) {
    notes.push(`Pasoš ističe preporučeno pre ${seasonCheck.requiredUntil} (potrebno je najmanje 6 meseci važenja nakon završetka programa).`)
  }

  // Overall match calculation
  let overallMatch: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'NOT_EVALUATED' = 'NOT_EVALUATED'
  if (nameMatch !== null || birthDateMatch !== null) {
    if (nameMatch === true && (birthDateMatch === true || birthDateMatch === null) && !isExpired) {
      overallMatch = 'MATCH'
    } else if (nameMatch === false || isExpired || (birthDateMatch === false && jmbgMatch === false)) {
      overallMatch = 'MISMATCH'
    } else {
      overallMatch = 'PARTIAL'
    }
  }

  return {
    birthDateMatch,
    expiresWithinSeason,
    isExpired,
    jmbgMatch,
    nameMatch,
    notes,
    overallMatch,
  }
}

/**
 * Main OCR recognition entrypoint for passport documents
 */
export async function processPassportOcr(
  bytes: Uint8Array,
  mimeType: SupportedDocumentMimeType,
  context?: CandidateMatchContext,
): Promise<PassportOcrResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null

  try {
    const { fullImage, mrzCroppedImage } = await prepareImageForOcr(bytes, mimeType)

    worker = await createWorker('eng', 1, resolveTesseractWorkerOptions())

    let mrzLines: string[] = []
    let fullText = ''
    let confidence = 0

    // Step A: If MRZ cropped image exists, attempt fast MRZ scan
    if (mrzCroppedImage) {
      const mrzCropRes = await worker.recognize(mrzCroppedImage)
      const cropCandidate = findCandidateMrzLines(mrzCropRes.data.text.split('\n'))
      if (cropCandidate.length >= 2) {
        mrzLines = cropCandidate
        confidence = mrzCropRes.data.confidence
      }
    }

    // Step B: Recognize full image (for full text, visual zone, and MRZ fallback)
    const fullRes = await worker.recognize(fullImage)
    fullText = fullRes.data.text
    if (mrzLines.length < 2) {
      mrzLines = findCandidateMrzLines(fullText.split('\n'))
      confidence = Math.max(confidence, fullRes.data.confidence)
    } else {
      confidence = Math.max(confidence, fullRes.data.confidence)
    }

    // Step C: Parse Visual Inspection Zone as complement/fallback
    const visual = parseVisualZone(fullText)

    // Step D: Parse MRZ if candidate lines found
    let extracted: PassportOcrExtractedData | undefined

    if (mrzLines.length >= 2) {
      const rawL1 = mrzLines[mrzLines.length - 2]
      const rawL2 = mrzLines[mrzLines.length - 1]
      const normL1 = normalizeMrzTd3Line1(rawL1, {
        firstName: context?.firstName || visual.firstName,
        lastName: context?.lastName || visual.lastName,
      })
      const normL2 = normalizeMrzTd3Line2(rawL2)

      try {
        const parsed = parseMrz([normL1, normL2])
        const fields = parsed.fields

        const rawSex = fields.sex?.toUpperCase()
        const sex: PassportSex | null = rawSex === 'MALE' || rawSex === 'M' ? 'M' : rawSex === 'FEMALE' || rawSex === 'F' ? 'F' : null

        extracted = {
          birthDate: formatMrzDate(fields.birthDate, false) ?? visual.birthDate ?? null,
          documentCode: fields.documentCode ?? 'P',
          documentNumber: (fields.documentNumber ?? visual.passportNumber ?? null)?.replace(/[©®]/g, '0')?.replace(/[^A-Z0-9]/g, '') ?? null,
          expirationDate: formatMrzDate(fields.expirationDate, true) ?? visual.expirationDate ?? null,
          firstName: fields.firstName ?? visual.firstName ?? null,
          issuingState: fields.issuingState ?? 'SRB',
          lastName: fields.lastName ?? visual.lastName ?? null,
          mrzFormat: parsed.format,
          mrzValid: parsed.valid,
          nationality: fields.nationality ?? 'SRB',
          personalNumber:
            fields.personalNumber && /^\d{13}$/.test(fields.personalNumber)
              ? fields.personalNumber
              : (visual.jmbg ?? fields.personalNumber ?? null),
          rawMrzLines: [normL1, normL2],
          sex,
          visualFields: visual,
        }
      } catch {
        // Fallback to visual parsing if mrz.parse throws
      }
    }

    // Fallback: If no MRZ was successfully parsed, construct from visual fields
    if (!extracted && (visual.passportNumber || visual.lastName || visual.birthDate)) {
      extracted = {
        birthDate: visual.birthDate ?? null,
        documentCode: 'P',
        documentNumber: (visual.passportNumber ?? null)?.replace(/[©®]/g, '0')?.replace(/[^A-Z0-9]/g, '') ?? null,
        expirationDate: visual.expirationDate ?? null,
        firstName: visual.firstName ?? null,
        issuingState: 'SRB',
        lastName: visual.lastName ?? null,
        mrzFormat: null,
        mrzValid: false,
        nationality: 'SRB',
        personalNumber: visual.jmbg ?? null,
        rawMrzLines: [],
        sex: null,
        visualFields: visual,
      }
    }

    if (!extracted) {
      return {
        confidence: Math.round(confidence),
        rawText: fullText.slice(0, 500),
        status: 'NO_MRZ_DETECTED',
        success: false,
      }
    }

    const match = evaluateCandidateMatch(extracted, context)

    return {
      confidence: Math.round(confidence),
      extracted,
      match,
      rawText: fullText.slice(0, 500),
      status: 'COMPLETED',
      success: true,
    }
  } catch (error) {
    return {
      confidence: 0,
      error: error instanceof Error ? error.message : 'Greška pri obradi pasoša.',
      status: 'FAILED',
      success: false,
    }
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {})
    }
  }
}
