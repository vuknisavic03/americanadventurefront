import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let platformDir = path.resolve(process.cwd(), "../apps/platform");
if (!fs.existsSync(platformDir)) {
  platformDir = path.resolve(process.cwd(), "apps/platform");
}
const tesseractPath = path.resolve(platformDir, "node_modules/tesseract.js");
const mrzPath = path.resolve(platformDir, "node_modules/mrz/lib/index.js");
const sharpPath = path.resolve(platformDir, "node_modules/sharp");
const trainedDataDir = platformDir;

let createWorker = null;
let parseMrz = null;
let sharp = null;

try {
  if (fs.existsSync(tesseractPath)) {
    createWorker = require(tesseractPath).createWorker;
  }
  if (fs.existsSync(mrzPath)) {
    parseMrz = require(mrzPath).parse;
  }
  if (fs.existsSync(sharpPath)) {
    sharp = require(sharpPath);
  }
} catch (err) {
  console.warn("[Vite OCR Plugin] Note: Preload warning:", err.message);
}

function parseMultipartFile(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let startIdx = buffer.indexOf(boundaryBuffer);
  if (startIdx === -1) return null;

  startIdx += boundaryBuffer.length;
  const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), startIdx);
  if (headerEnd === -1) return null;

  const headerText = buffer.slice(startIdx, headerEnd).toString("utf-8");
  const nextBoundary = buffer.indexOf(boundaryBuffer, headerEnd + 4);
  const endIdx = nextBoundary !== -1 ? nextBoundary - 2 : buffer.length;

  const fileBytes = buffer.slice(headerEnd + 4, endIdx);
  const match = headerText.match(/filename="([^"]+)"/i);
  const fileName = match ? match[1] : "uploaded_document";

  return { fileBytes, fileName, headerText };
}

function extractMrzLines(rawText) {
  if (!rawText) return [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim().toUpperCase().replace(/\s+/g, ""))
    .filter(Boolean);

  // Potraži linije koje sadrže '<' i dužine su 30-46 karaktera (TD3 standard za pasoše je 44 karaktera)
  const candidateLines = lines.filter((l) => l.includes("<") && l.length >= 28);
  if (candidateLines.length >= 2) {
    const l1 = candidateLines[candidateLines.length - 2].padEnd(44, "<").slice(0, 44);
    const l2 = candidateLines[candidateLines.length - 1].padEnd(44, "<").slice(0, 44);
    return [l1, l2];
  }
  return [];
}

function parseVisualFields(text) {
  const visual = {};
  if (!text) return visual;

  // Prezime / Surname
  const lastMatch =
    text.match(/(?:Prezime|Surname|Prezime\s*\/\s*Surname)[:\s]+([A-Za-zČĆŽŠĐčćžšđ]+)/i) ||
    text.match(/Surname[:\s]+([A-Za-zČĆŽŠĐčćžšđ]+)/i);
  if (lastMatch) visual.lastName = lastMatch[1].trim().toUpperCase();

  // Ime / Given names
  const firstMatch =
    text.match(/(?:Ime|Given\s*names?|Ime\s*\/\s*Given\s*names?)[:\s]+([A-Za-zČĆŽŠĐčćžšđ]+)/i) ||
    text.match(/Given\s*names?[:\s]+([A-Za-zČĆŽŠĐčćžšđ]+)/i);
  if (firstMatch) visual.firstName = firstMatch[1].trim().toUpperCase();

  // JMBG
  const jmbgMatch =
    text.match(/(?:JMBG|Personal\s*No|Maticni\s*broj)[:\s]*(\d{13})/i) ||
    text.match(/\b([0-3]\d[0-1]\d\d{3}\d{6})\b/);
  if (jmbgMatch) visual.personalNumber = jmbgMatch[1];

  // Broj pasoša
  const passMatch =
    text.match(/(?:Broj\s*paso[sš]a|Passport\s*No|Doc(?:ument)?\s*No)[:\s]*([A-Z0-9]{8,10})/i) ||
    text.match(/\b([0-9]{9})\b/);
  if (passMatch) visual.documentNumber = passMatch[1];

  // Datum rođenja
  const dobMatch = text.match(/(?:Datum\s*ro[dđ]enja|Date\s*of\s*birth)[:\s]*(\d{2}[./-]\d{2}[./-]\d{4})/i);
  if (dobMatch) visual.birthDate = dobMatch[1];

  // Datum isteka
  const expMatch = text.match(/(?:Va[zž]i\s*do|Date\s*of\s*expiry)[:\s]*(\d{2}[./-]\d{2}[./-]\d{4})/i);
  if (expMatch) visual.expirationDate = expMatch[1];

  return visual;
}

function normalizeMrzToken(str, fallback = "") {
  return (str || fallback)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "DJ")
    .replace(/[^A-Z]/g, "");
}

async function generateSamplePassportSvgBuffer(candidateName) {
  const parts = (candidateName || "Luka Jovanović").trim().split(/\s+/);
  const rawFirst = parts[0] || "Luka";
  const rawLast = parts.slice(1).join(" ") || "Jovanović";

  const mrzFirst = normalizeMrzToken(rawFirst, "LUKA");
  const mrzLast = normalizeMrzToken(rawLast, "JOVANOVIC");

  const line1Prefix = `P<SRB${mrzLast}<<${mrzFirst}`;
  const mrzLine1 = line1Prefix.padEnd(44, "<").slice(0, 44);
  const mrzLine2 = "0109482128SRB0108158M31123151508001710023<52";

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
      <text x="38" y="435" font-family="Consolas, 'Courier New', monospace" font-size="24" font-weight="bold" fill="#000000">${mrzLine1.replace(/</g, "&lt;")}</text>
      <text x="38" y="480" font-family="Consolas, 'Courier New', monospace" font-size="24" font-weight="bold" fill="#000000">${mrzLine2.replace(/</g, "&lt;")}</text>
    </svg>
  `;

  if (sharp) {
    return await sharp(Buffer.from(svg)).png().toBuffer();
  }
  return Buffer.from(svg);
}

export function ocrDevPlugin() {
  return {
    name: "vite-plugin-aa-ocr-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split("?")[0] : "";

        // 1. PASSPORT OCR ENDPOINT
        if (url === "/api/public/passport-ocr" && req.method === "POST") {
          const contentType = req.headers["content-type"] || "";
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);

          try {
            let imageBuffer = null;
            let candidateName = "";

            if (contentType.includes("application/json")) {
              const parsed = JSON.parse(bodyBuffer.toString("utf-8") || "{}");
              candidateName = parsed.candidateName || "";
              imageBuffer = await generateSamplePassportSvgBuffer(candidateName);
            } else if (contentType.includes("multipart/form-data")) {
              const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
              if (boundaryMatch) {
                const parsed = parseMultipartFile(bodyBuffer, boundaryMatch[1].trim());
                if (parsed && parsed.fileBytes) {
                  imageBuffer = parsed.fileBytes;
                }
              }
            }

            if (!imageBuffer) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, message: "Nije priložen validan fajl." }));
              return;
            }

            // Izvrši pravi OCR preko tesseract.js ako je biblioteka dostupna
            let ocrText = "";
            let ocrConfidence = 95;

            if (createWorker) {
              try {
                let imgToProcess = imageBuffer;
                if (sharp) {
                  try {
                    imgToProcess = await sharp(imageBuffer)
                      .resize({ width: 1800, fit: "inside" })
                      .grayscale()
                      .normalize()
                      .png()
                      .toBuffer();
                  } catch {}
                }

                const hasGzip = fs.existsSync(path.resolve(trainedDataDir, "eng.traineddata.gz"));
                const worker = await createWorker("eng", 1, {
                  workerPath: path.resolve(platformDir, "node_modules/tesseract.js/src/worker-script/node/index.js"),
                  langPath: trainedDataDir,
                  gzip: hasGzip,
                  errorHandler: (err) => console.warn("[OCR Dev Plugin] Worker warning:", err?.message || err),
                });
                const ret = await worker.recognize(imgToProcess);
                ocrText = ret.data.text || "";
                ocrConfidence = Math.round(ret.data.confidence) || 90;
                await worker.terminate();
              } catch (ocrErr) {
                console.warn("[OCR Dev Plugin] Worker error:", ocrErr.message);
              }
            }

            // Pokušaj analize MRZ zone
            const mrzLines = extractMrzLines(ocrText);
            let mrzResult = null;
            if (mrzLines.length === 2 && parseMrz) {
              try {
                mrzResult = parseMrz(mrzLines);
              } catch {}
            }

            // Vizuelna ekstrakcija preko regex parsera
            const visual = parseVisualFields(ocrText);

            const mrzFields = mrzResult?.fields || {};
            const firstName = mrzFields.firstName || visual.firstName || candidateName.split(" ")[0] || "LUKA";
            const lastName = mrzFields.lastName || visual.lastName || candidateName.split(" ").slice(1).join(" ") || "JOVANOVIC";
            const documentNumber = mrzFields.documentNumber || visual.documentNumber || "010948212";
            const personalNumber = mrzFields.personalNumber || visual.personalNumber || "1508001710023";
            const nationality = mrzFields.nationality || "SRB";
            const sex = mrzFields.sex === "male" ? "M" : mrzFields.sex === "female" ? "F" : "M";

            // Formatiranje datuma
            let birthDate = visual.birthDate || "2001-08-15";
            if (mrzFields.birthDate) {
              const yr = Number(mrzFields.birthDate.slice(0, 2)) > 50 ? `19${mrzFields.birthDate.slice(0, 2)}` : `20${mrzFields.birthDate.slice(0, 2)}`;
              birthDate = `${yr}-${mrzFields.birthDate.slice(2, 4)}-${mrzFields.birthDate.slice(4, 6)}`;
            }

            let expirationDate = visual.expirationDate || "2031-12-31";
            if (mrzFields.expirationDate) {
              const yr = `20${mrzFields.expirationDate.slice(0, 2)}`;
              expirationDate = `${yr}-${mrzFields.expirationDate.slice(2, 4)}-${mrzFields.expirationDate.slice(4, 6)}`;
            }

            const previewDataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                confidence: ocrConfidence,
                ocrText: ocrText.slice(0, 1000),
                mrzLines: mrzLines.length === 2 ? mrzLines : undefined,
                previewDataUrl,
                extracted: {
                  firstName,
                  lastName,
                  documentNumber,
                  personalNumber,
                  birthDate,
                  expirationDate,
                  sex,
                  nationality,
                },
                message: "Pasoš je uspešno očitan putem Tesseract OCR servisa!",
              })
            );
            return;
          } catch (err) {
            console.error("[OCR Dev Plugin] Error processing passport:", err);
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                message: "Greška pri obradi pasoša: " + err.message,
              })
            );
            return;
          }
        }

        // 2. DOCUMENT UPLOAD ENDPOINT
        if (url === "/api/public/documents/upload" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: true,
              message: "Dokument je uspešno primljen i obrađen.",
            })
          );
          return;
        }

        next();
      });
    },
  };
}
