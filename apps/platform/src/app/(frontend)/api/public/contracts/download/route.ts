import fs from 'node:fs'
import path from 'node:path'
import { getPortalState, markPortalCandidateContractDownloaded } from '@/modules/portal-sync/localStore.ts'
import { renderContractPdf } from '@/modules/generated-contracts/renderContractPdf.ts'
import { renderResponsibilityStatementPdf } from '@/modules/generated-contracts/renderResponsibilityStatementPdf.ts'
import { PDFDocument } from 'pdf-lib'

function findDocFile(fileName: string): Buffer | null {
  const possiblePaths = [
    path.resolve(process.cwd(), 'public', 'documents', fileName),
    path.resolve(process.cwd(), 'apps', 'platform', 'public', 'documents', fileName),
    path.resolve(process.cwd(), 'front', 'public', 'documents', fileName),
    path.resolve(process.cwd(), 'dokumentazaswt', fileName),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p)
    }
  }
  return null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const idOrEmail = (url.searchParams.get('id') || url.searchParams.get('email') || '').trim().toLowerCase()
    const type = (url.searchParams.get('type') || '').trim().toLowerCase()

    const state = await getPortalState()
    const candidate =
      state.candidates.find(
        (c) => String(c.id).toLowerCase() === idOrEmail || c.email.toLowerCase() === idOrEmail,
      ) || state.candidates[0]

    if (!candidate) {
      return new Response('Kandidat nije pronađen.', { status: 404 })
    }

    // Mark as downloaded
    await markPortalCandidateContractDownloaded(candidate.id || candidate.email).catch(() => {})

    const queryJmbg = (url.searchParams.get('jmbg') || '').trim()
    const queryPassport = (url.searchParams.get('passport') || url.searchParams.get('passportNumber') || '').trim()
    const queryName = (url.searchParams.get('name') || '').trim()

    const candidateName = queryName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.name || 'Student Kandidat'
    const jmbg = queryJmbg || candidate.jmbg || '1508001710023'
    const passportNumber = queryPassport || candidate.passportNumber || candidate.idCardNumber || '010948212'
    const contractNumber = `AA-2027-${String(candidate.id).replace(/[^0-9]/g, '').slice(-4) || '1042'}`
    const isSigned = Boolean(candidate.contractSigned)
    const signedAt = candidate.contractSignedAt ? new Date(candidate.contractSignedAt) : isSigned ? new Date() : undefined
    const signedReference = candidate.contractSignedReference || `AA-REF-${contractNumber}`

    const isSelf = String(candidate.packageId || '').toLowerCase().includes('self') || String(candidate.packageName || '').toLowerCase().includes('self')

    const safeLast = (candidate.lastName || 'Kandidat')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'dj')
      .replace(/Đ/g, 'Dj')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeFirst = (candidate.firstName || 'AA')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'dj')
      .replace(/Đ/g, 'Dj')
      .replace(/[^a-zA-Z0-9_-]/g, '_')

    // 1. Zvanična saglasnost i važne informacije
    if (type === 'consent' || type === 'saglasnost') {
      const bytes = findDocFile('Saglasnost_Vazne_informacije_SWT_USA_2027.pdf')
      if (bytes) {
        return new Response(new Uint8Array(bytes), {
          headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': `attachment; filename="Saglasnost_Vazne_informacije_SWT_USA_2027.pdf"`,
            'Content-Type': 'application/pdf',
          },
        })
      }
    }

    // 2. Prilog 1 - Promocije i popusti
    if (type === 'promotions' || type === 'prilog1') {
      const bytes = findDocFile('Prilog_1_Promocije_i_popusti_2026.pdf')
      if (bytes) {
        return new Response(new Uint8Array(bytes), {
          headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': `attachment; filename="Prilog_1_Promocije_i_popusti.pdf"`,
            'Content-Type': 'application/pdf',
          },
        })
      }
    }

    // 3. Zvanični originalni ugovor agencije
    if (type === 'official' || url.searchParams.get('official') === 'true') {
      const targetDoc = isSelf ? 'SELF_UGOVOR_2027.pdf' : 'FULL_Lifeguard_UGOVOR_2027.pdf'
      const bytes = findDocFile(targetDoc)
      if (bytes) {
        return new Response(new Uint8Array(bytes), {
          headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': `attachment; filename="${targetDoc}"`,
            'Content-Type': 'application/pdf',
          },
        })
      }
    }

    // 4. Izjava o odgovornosti
    if (type === 'statement' || type === 'izjava') {
      const statementPdfBytes = await renderResponsibilityStatementPdf({
        acceptedAt: signedAt,
        candidateName,
        contractNumber,
        date: new Date(),
        isAccepted: isSigned,
        jmbg,
        passportNumber,
        reference: signedReference,
        sourceInfo: candidate.referredBy ? `Preporuka (${candidate.referredBy})` : 'Zvanični portal i preporuka',
      })

      return new Response(new Uint8Array(statementPdfBytes), {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename="Izjava_o_odgovornosti_${safeLast}_${safeFirst}.pdf"`,
          'Content-Type': 'application/pdf',
        },
      })
    }

    // 5. Default: Kompletan ugovor sa unetim podacima kandidata i Izjavom
    const paymentLabel =
      candidate.paymentMethod === 'later'
        ? 'Opcija C — Plaćanje tokom/nakon programa (PKZ uz jemca)'
        : candidate.paymentMethod === 'installments'
        ? 'Opcija A — Plaćanje u ratama'
        : 'Opcija B — Puna uplata pri prijavi'

    const programLabel = isSelf
      ? 'Self Adventure — Work and Travel USA 2027'
      : candidate.packageName || candidate.program || 'Full Adventure — Work and Travel USA 2027'
    const totalLabel = isSelf ? '$1,975 USD' : `${candidate.finalPrice || 2275} USD`

    const body = `UGOVOR O PRUŽANJU USLUGA
WORK AND TRAVEL USA 2027.

Zaključen u Beogradu između:
1. Privrednog društva AMERICAN ADVENTURE D.O.O. BEOGRAD, sa sedištem u ul. Gospodar Jevremova 59/4, 11000 Beograd, MB: 20356090, PIB: 105311717, tekući račun: 160-6000000728717-84, koje zastupa direktor Ana Ristovski (u daljem tekstu: Davalac usluga), i
2. Naručioca usluga: ${candidateName.toUpperCase()}, JMBG: ${jmbg}, Broj pasoša/dokumenta: ${passportNumber}, e-mail: ${candidate.email} (u daljem tekstu: Naručilac usluga).

ČLAN 1. PREDMET UGOVORA I SWT PROGRAM
Predmet ovog ugovora je regulisanje međusobnih prava i obaveza povodom učešća Naručioca u programu kulturne i radne razmene studenata u SAD („Summer Work & Travel USA 2027“) pod pokroviteljstvom US State Department-a, u okviru izabranog paketa: ${programLabel}.

ČLAN 2. CENA PROGRAMA I USLOVI PLAĆANJA
Ukupna ugovorena cena programa iznosi ${totalLabel}. Model plaćanja je: ${paymentLabel}.
Naručilac se obavezuje da uplate vrši prema definisanoj dinamici i instrukcijama Agencije. Uplate se vrše u dinarskoj protivvrednosti po zvaničnom srednjem kursu NBS na račun Agencije.

ČLAN 3. OBAVEZE KANDIDATA
Naručilac se obavezuje da:
1. Blagovremeno i savesno dostavi verodostojnu dokumentaciju (uverenje o statusu redovnog studenta, važeći biometrijski pasoš, CV i video biografiju).
2. Prisustvuje zakazanim intervjuima sa američkim sponzorima i poslodavcima, kao i obaveznoj orijentaciji pre polaska.
3. Poštuje sve imigracione propise SAD, pravila J-1 BridgeUSA vize, propise SEVIS sistema, te da se javi sponzoru u roku od 72 časa od ulaska u SAD.

ČLAN 4. PRATEĆA DOKUMENTACIJA
Sastavni deo ovog Ugovora čine: zvanična Izjava o odgovornosti, Saglasnost i važne informacije SWT USA 2027 i Prilog 1 o popustima i akcijama.`

    const contractPdfBytes = await renderContractPdf({
      acceptance: isSigned
        ? {
            acceptedAt: signedAt || new Date(),
            reference: signedReference,
            statement: 'Elektronski potvrđeno i prihvaćeno od strane kandidata i ovlašćenog lica agencije.',
            statementVersion: '2027.1',
          }
        : undefined,
      body,
      candidateName,
      contractDate: new Date(),
      contractNumber,
      jmbg,
      passportNumber,
      paymentLabel,
      programLabel,
      totalLabel,
    })

    const statementPdfBytes = await renderResponsibilityStatementPdf({
      acceptedAt: signedAt,
      candidateName,
      contractNumber,
      date: new Date(),
      isAccepted: isSigned,
      jmbg,
      passportNumber,
      reference: signedReference,
      sourceInfo: candidate.referredBy ? `Preporuka (${candidate.referredBy})` : 'Zvanični portal i preporuka',
    })

    // Merge both documents: Contract + Authentic Statement of Responsibility
    const mergedDoc = await PDFDocument.load(contractPdfBytes)
    const statementDoc = await PDFDocument.load(statementPdfBytes)
    const copiedPages = await mergedDoc.copyPages(statementDoc, statementDoc.getPageIndices())
    for (const page of copiedPages) {
      mergedDoc.addPage(page)
    }

    const mergedBytes = await mergedDoc.save({ useObjectStreams: false })

    return new Response(new Uint8Array(mergedBytes), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="Ugovor_i_Izjava_${safeLast}_${safeFirst}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Contract PDF generation failed:', error)
    return new Response('Greška pri kreiranju PDF ugovora.', { status: 500 })
  }
}
