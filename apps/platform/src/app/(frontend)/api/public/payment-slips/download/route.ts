import fs from 'node:fs'
import path from 'node:path'
import { getPortalState } from '@/modules/portal-sync/localStore.ts'
import { preparePaymentSlip } from '@/modules/invoices/paymentSlips.ts'
import { renderPaymentSlipPdf } from '@/modules/invoices/renderPaymentSlipPdf.ts'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const idOrEmail = (url.searchParams.get('id') || url.searchParams.get('email') || '').trim().toLowerCase()
    const type = (url.searchParams.get('type') || '').trim().toLowerCase()

    const state = await getPortalState()
    const candidate = state.candidates.find(
      (c) => String(c.id).toLowerCase() === idOrEmail || c.email.toLowerCase() === idOrEmail,
    ) || state.candidates[0]

    if (!candidate) {
      return new Response('Kandidat nije pronađen.', { status: 404 })
    }

    const isSelf = String(candidate.packageId || '').toLowerCase().includes('self') || String(candidate.packageName || '').toLowerCase().includes('self')

    // If official agency PDF slip requested
    if (type === 'official' || url.searchParams.get('official') === 'true') {
      const fileName = isSelf ? 'Uplatnica_avans_AA_SELF.pdf' : 'Uplatnica_avans_AA_FULL.pdf'
      const possiblePaths = [
        path.resolve(process.cwd(), 'public', 'documents', fileName),
        path.resolve(process.cwd(), 'apps', 'platform', 'public', 'documents', fileName),
        path.resolve(process.cwd(), 'dokumentazaswt', isSelf ? 'Uplatnica - avans AA SELF.pdf' : 'Uplatnica - avans AA. FULL.pdf'),
      ]
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const bytes = fs.readFileSync(p)
          return new Response(new Uint8Array(bytes), {
            headers: {
              'Cache-Control': 'no-store',
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Type': 'application/pdf',
            },
          })
        }
      }
    }

    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Luka Jovanović'
    const advanceRsd = isSelf ? 70200 : 49850 // Standardni avans ($600 za self, $425 za full)

    const slipData = preparePaymentSlip({
      candidateAddress: (candidate as unknown as { address?: string }).address || 'Gospodar Jevremova 59 / Student',
      candidateCity: candidate.studyCity || 'Beograd',
      candidateName,
      currency: 'RSD',
      obligationKey: 'advance',
      obligationLabel: isSelf ? 'Avans Self ($600)' : 'Avans Full ($425)',
      paymentAmountRsd: advanceRsd,
      paymentPurpose: `Uplata učešća SWT 2027 — ${candidateName}`,
    })

    const slipPdf = await renderPaymentSlipPdf(slipData)

    const safeLast = (candidate.lastName || 'Kandidat').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeFirst = (candidate.firstName || 'AA').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').replace(/[^a-zA-Z0-9_-]/g, '_')

    return new Response(new Uint8Array(slipPdf.bytes), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="Uplatnica_${safeLast}_${safeFirst}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Payment slip PDF generation failed:', error)
    return new Response('Greška pri kreiranju PDF uplatnice.', { status: 500 })
  }
}
