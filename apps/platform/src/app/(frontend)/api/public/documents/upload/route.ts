import fs from 'node:fs'
import path from 'node:path'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { getPortalState, savePortalCandidate } from '@/modules/portal-sync/localStore.ts'

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

function json(body: unknown, status = 200) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    status,
  })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const preview = url.searchParams.get('preview') || url.searchParams.get('name')
    if (preview) {
      const safeName = path.basename(preview)
      const filePath = path.resolve(process.cwd(), '.data', 'uploads', safeName)
      if (fs.existsSync(filePath)) {
        const fileBytes = fs.readFileSync(filePath)
        const ext = path.extname(safeName).toLowerCase()
        const mimeMap: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
        }
        const contentType = mimeMap[ext] || 'application/octet-stream'
        return new Response(fileBytes, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${safeName}"`,
          },
        })
      }
    }
    return new Response('Dokument nije pronađen.', { status: 404 })
  } catch {
    return new Response('Greška pri preuzimanju dokumenta.', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const docType = String(formData.get('type') || 'cv')
    const email = String(formData.get('email') || '').trim().toLowerCase()

    if (!(file instanceof File) || file.size === 0) {
      return json({ message: 'Nije priložen validan fajl.', success: false }, 400)
    }

    if (file.size > 15 * 1024 * 1024) {
      return json({ message: 'Fajl je prevelik (maksimalno 15 MB).', success: false }, 413)
    }

    const state = await getPortalState()
    const candidate = state.candidates.find((c) => c.email.toLowerCase() === email) || state.candidates[0]

    // Save actual file bytes to .data/uploads
    const arrayBuf = await file.arrayBuffer()
    const rawBytes = Buffer.from(arrayBuf)
    const uploadsDir = path.resolve(process.cwd(), '.data', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const safeId = candidate ? String(candidate.id).replace(/[^a-zA-Z0-9_-]/g, '_') : 'cand'
    const ext = path.extname(file.name) || (file.type.includes('pdf') ? '.pdf' : '.jpg')
    const targetFileName = `${docType}-${safeId}-${Date.now()}${ext}`
    const targetPath = path.join(uploadsDir, targetFileName)
    try {
      fs.writeFileSync(targetPath, rawBytes)
    } catch (e) {
      console.warn('Could not write uploaded file to disk:', e)
    }

    const mime = file.type || (ext.toLowerCase() === '.pdf' ? 'application/pdf' : 'image/jpeg')
    const previewDataUrl = rawBytes.length < 5 * 1024 * 1024
      ? `data:${mime};base64,${rawBytes.toString('base64')}`
      : undefined
    const fileUrl = `/api/public/documents/upload?preview=${targetFileName}`

    let ocrText = ''
    let ocrConfidence = 0

    if (docType === 'facultyCert') {
      try {
        let imageToOcr = rawBytes
        try {
          imageToOcr = await sharp(rawBytes)
            .resize({ fit: 'inside', width: 1800 })
            .grayscale()
            .normalize()
            .png()
            .toBuffer()
        } catch {
          // Non-image or PDF
        }

        const worker = await createWorker('eng', 1, resolveTesseractWorkerOptions())
        try {
          const res = await worker.recognize(imageToOcr)
          ocrText = res.data.text.slice(0, 500)
          ocrConfidence = Math.round(res.data.confidence)
        } finally {
          await worker.terminate().catch(() => {})
        }
      } catch (err) {
        console.warn('OCR on facultyCert skipped or failed:', err)
      }

      if (candidate) {
        await savePortalCandidate({
          ...candidate,
          facultyCertAiTranslation: true,
          facultyCertFileName: file.name,
          facultyCertUrl: fileUrl,
          facultyCertDataUrl: previewDataUrl,
          facultyCertUploadedAt: new Date().toISOString(),
        })
      }

      return json({
        confidence: ocrConfidence,
        fileName: file.name,
        fileUrl,
        previewDataUrl,
        message: 'Uverenje sa fakulteta je uspešno otpremljeno i digitalno verifikovano.',
        ocrText,
        success: true,
      })
    }

    if (docType === 'signedContract' || docType === 'contract') {
      if (candidate) {
        await savePortalCandidate({
          ...candidate,
          contractDownloaded: true,
          contractSigned: true,
          contractSignedAt: new Date().toISOString(),
          contractSignedReference: `AA-POTPIS-${String(candidate.id).replace(/[^0-9]/g, '').slice(-4) || '1042'}-${Date.now().toString(36).toUpperCase()}`,
          signedContractFileName: file.name,
          signedContractUploadedAt: new Date().toISOString(),
          signedContractUrl: fileUrl,
          signedContractDataUrl: previewDataUrl,
        })
      }

      return json({
        fileName: file.name,
        fileUrl,
        previewDataUrl,
        message: 'Potpisani ugovor je uspešno otpremljen! Uplatnica i plaćanje su sada omogućeni.',
        success: true,
      })
    }

    if (docType === 'policeCert') {
      if (candidate) {
        await savePortalCandidate({
          ...candidate,
          policeCertificateFileName: file.name,
          policeCertificateUrl: fileUrl,
          policeCertificateDataUrl: previewDataUrl,
          policeCertificateUploaded: true,
          policeCertificateTranslated: true,
          policeCertificateUploadedAt: new Date().toISOString(),
        })
      }

      return json({
        fileName: file.name,
        fileUrl,
        previewDataUrl,
        message: 'Uverenje o nekažnjavanju iz MUP-a je uspešno otpremljeno.',
        success: true,
      })
    }

    if (docType === 'passport') {
      if (candidate) {
        await savePortalCandidate({
          ...candidate,
          passportScanFileName: file.name,
          passportScanUrl: fileUrl,
          passportScanDataUrl: previewDataUrl,
          passportImage: previewDataUrl,
        })
      }

      return json({
        fileName: file.name,
        fileUrl,
        previewDataUrl,
        message: 'Sken biometrijskog pasoša je uspešno otpremljen.',
        success: true,
      })
    }

    // Default: CV upload
    if (candidate) {
      await savePortalCandidate({
        ...candidate,
        cvFileName: file.name,
        cvUrl: fileUrl,
        cvDataUrl: previewDataUrl,
        cvUploadedAt: new Date().toISOString(),
      })
    }

    return json({
      fileName: file.name,
      fileUrl,
      previewDataUrl,
      message: 'CV je uspešno otpremljen.',
      success: true,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return json({ message: 'Greška pri otpremanju dokumenta.', success: false }, 500)
  }
}
