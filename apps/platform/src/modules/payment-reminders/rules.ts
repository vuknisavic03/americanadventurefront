import { DEFAULT_AGENCY_BENEFICIARY, generatePaymentReference } from '../invoices/paymentSlips.ts'
import type {
  
  ObligationEvaluation,
  PaymentReminderContext,
  PaymentReminderRules,
  PaymentReminderTrigger,
} from './types.ts'

export const DEFAULT_PAYMENT_REMINDER_RULES: PaymentReminderRules = {
  channels: ['EMAIL', 'SMS', 'IN_APP'],
  enableOnDue: true,
  exchangeRateRsd: 108.5,
  overdueGraceDays: 1,
  preDueDays: 5,
}

function startOfDayUtc(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function formatDateSr(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nije definisan'
  const d = new Date(dateStr)
  if (!Number.isFinite(d.getTime())) return 'Nije definisan'
  const day = d.getUTCDate().toString().padStart(2, '0')
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}.${month}.${year}.`
}

export function formatRsdAmount(amountRsd: number): string {
  return new Intl.NumberFormat('sr-Latn-RS', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amountRsd)
}

/**
 * Pure evaluation function for payment plan obligations based on allocated paid amount,
 * current reference date, and configured reminder rules.
 */
export function evaluateObligations({
  asOfDate,
  obligations,
  paidCents,
  rules = DEFAULT_PAYMENT_REMINDER_RULES,
}: {
  asOfDate: Date
  obligations: Array<{
    amountCents: number
    dueAt: string | null
    key: string
    kind?: 'DEFERRED' | 'INITIAL' | 'INSTALLMENT'
    label?: string
  }>
  paidCents: number
  rules?: Partial<PaymentReminderRules>
}): ObligationEvaluation[] {
  const effectiveRules: PaymentReminderRules = {
    ...DEFAULT_PAYMENT_REMINDER_RULES,
    ...rules,
  }

  const asOfUtc = startOfDayUtc(asOfDate)
  let remainingPaid = Math.max(0, paidCents)

  return obligations.map((obligation) => {
    const amountCents = Math.max(0, obligation.amountCents)
    const allocatedPaidCents = Math.min(amountCents, remainingPaid)
    remainingPaid = Math.max(0, remainingPaid - allocatedPaidCents)
    const unpaidCents = Math.max(0, amountCents - allocatedPaidCents)
    const isFullyPaid = unpaidCents === 0

    const amountUsd = Math.round(unpaidCents) / 100
    const amountRsd = Math.round((unpaidCents * effectiveRules.exchangeRateRsd) / 100)
    const label = obligation.label?.trim() || 'Rata programa'

    if (isFullyPaid || !obligation.dueAt) {
      return {
        allocatedPaidCents,
        amountCents,
        amountRsd,
        amountUsd,
        daysOverdue: null,
        daysUntilDue: null,
        dueAt: obligation.dueAt,
        isEligibleForReminder: false,
        isFullyPaid,
        key: obligation.key,
        kind: obligation.kind || 'INSTALLMENT',
        label,
        trigger: null,
        unpaidCents,
      }
    }

    const dueUtc = startOfDayUtc(obligation.dueAt)
    const diffDays = Math.round((dueUtc - asOfUtc) / (24 * 3600 * 1000))

    let trigger: PaymentReminderTrigger | null = null
    let daysUntilDue: number | null = null
    let daysOverdue: number | null = null
    let isEligibleForReminder = false

    if (diffDays > 0) {
      daysUntilDue = diffDays
      if (diffDays <= effectiveRules.preDueDays) {
        trigger = 'PRE_DUE'
        isEligibleForReminder = true
      }
    } else if (diffDays === 0) {
      daysUntilDue = 0
      if (effectiveRules.enableOnDue) {
        trigger = 'ON_DUE'
        isEligibleForReminder = true
      }
    } else {
      daysOverdue = Math.abs(diffDays)
      if (daysOverdue >= effectiveRules.overdueGraceDays) {
        trigger = 'OVERDUE'
        isEligibleForReminder = true
      }
    }

    return {
      allocatedPaidCents,
      amountCents,
      amountRsd,
      amountUsd,
      daysOverdue,
      daysUntilDue,
      dueAt: obligation.dueAt,
      isEligibleForReminder,
      isFullyPaid: false,
      key: obligation.key,
      kind: obligation.kind || 'INSTALLMENT',
      label,
      trigger,
      unpaidCents,
    }
  })
}

/**
 * Identifies the most critical actionable obligation for a candidate.
 * Priority: OVERDUE -> ON_DUE -> PRE_DUE -> Earliest unpaid.
 */
export function determineActiveObligation(
  evaluations: ObligationEvaluation[],
): ObligationEvaluation | null {
  const eligible = evaluations.filter((e) => !e.isFullyPaid)
  if (eligible.length === 0) return null

  // Prioritize overdue obligations
  const overdue = eligible.find((e) => e.trigger === 'OVERDUE')
  if (overdue) return overdue

  // Then obligations due today
  const dueToday = eligible.find((e) => e.trigger === 'ON_DUE')
  if (dueToday) return dueToday

  // Then pre-due upcoming obligations
  const preDue = eligible.find((e) => e.trigger === 'PRE_DUE')
  if (preDue) return preDue

  // Fallback: earliest unpaid obligation
  return eligible[0] || null
}

export function generatePaymentReminderIdempotencyKey(
  candidateAccountId: number,
  obligationKey: string,
  trigger: PaymentReminderTrigger,
  dateOrCycleKey: string,
): string {
  const sanitizedDate = dateOrCycleKey.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20)
  return `pay-rem:${candidateAccountId}:${obligationKey}:${trigger}:${sanitizedDate}`
}

export function buildPaymentReminderContext({
  candidateAccountId,
  candidateName,
  customNote,
  email,
  obligation,
  phone,
  portalBaseUrl = 'https://workandtravel.rs',
  programCode = 'SWT',
  recipientAccount = DEFAULT_AGENCY_BENEFICIARY.accountNumber,
  recipientName = DEFAULT_AGENCY_BENEFICIARY.name,
}: {
  candidateAccountId: number
  candidateName: string
  customNote?: string
  email: string
  obligation: ObligationEvaluation
  phone: string
  portalBaseUrl?: string
  programCode?: string
  recipientAccount?: string
  recipientName?: string
}): PaymentReminderContext {
  const names = candidateName.trim().split(/\s+/)
  const firstName = names[0] || 'Kandidat'
  const lastName = names.slice(1).join(' ') || ''
  const paymentModel = '97'
  const paymentReference = generatePaymentReference(candidateAccountId, obligation.key)
  const dueAtDateFormatted = formatDateSr(obligation.dueAt)

  const portalUrl = `${portalBaseUrl}/moj-nalog#uplate`
  const paymentSlipUrl = `${portalBaseUrl}/api/candidate/payment-slips/${encodeURIComponent(obligation.key)}`

  return {
    amountCents: obligation.unpaidCents,
    amountRsd: obligation.amountRsd,
    amountUsd: obligation.amountUsd,
    candidateAccountId,
    candidateName,
    customNote,
    daysOverdue: obligation.daysOverdue,
    daysUntilDue: obligation.daysUntilDue,
    dueAtDateFormatted,
    email,
    firstName,
    lastName,
    obligationKey: obligation.key,
    obligationLabel: obligation.label,
    paymentModel,
    paymentReference,
    paymentSlipUrl,
    phone,
    portalUrl,
    programCode,
    recipientAccount,
    recipientName,
    trigger: obligation.trigger || 'PRE_DUE',
  }
}

export function renderPaymentReminderEmail(ctx: PaymentReminderContext): {
  html: string
  subject: string
  text: string
} {
  let subject: string
  let urgencyNotice: string

  if (ctx.trigger === 'OVERDUE') {
    const overdueDays = ctx.daysOverdue ?? 1
    subject = `OPOMENA: Kašnjenje uplate rate (${ctx.obligationLabel}) - American Adventure`
    urgencyNotice = `Obaveštavamo vas da je rok za uplatu rate "${ctx.obligationLabel}" istekao pre ${overdueDays} dan(a) (rok je bio ${ctx.dueAtDateFormatted}). Molimo vas da izvršite uplatu u najkraćem roku kako biste izbegli zastoj u programu.`
  } else if (ctx.trigger === 'ON_DUE') {
    subject = `Danas dospeva uplata rate (${ctx.obligationLabel}) - American Adventure`
    urgencyNotice = `Podsećamo vas da danas (${ctx.dueAtDateFormatted}) dospeva uplata rate "${ctx.obligationLabel}".`
  } else {
    const daysLeft = ctx.daysUntilDue ?? 5
    subject = `Podsetnik za dospeće rate: ${ctx.obligationLabel} - American Adventure`
    urgencyNotice = `Podsećamo vas na predstojeće dospeće rate "${ctx.obligationLabel}" za ${daysLeft} dan(a), sa rokom do ${ctx.dueAtDateFormatted}.`
  }

  const rsdFormatted = formatRsdAmount(ctx.amountRsd)
  const customSection = ctx.customNote ? `\nNapomena: ${ctx.customNote}\n` : ''

  const text = `Zdravo ${ctx.firstName},

${urgencyNotice}
${customSection}
PODACI ZA UPLATU:
- Rata: ${ctx.obligationLabel}
- Iznos: ${ctx.amountUsd.toFixed(2)} USD (${rsdFormatted} RSD)
- Rok dospeća: ${ctx.dueAtDateFormatted}
- Primalac: ${ctx.recipientName}
- Račun primaoca: ${ctx.recipientAccount}
- Model: ${ctx.paymentModel}
- Poziv na broj: ${ctx.paymentReference}
- Svrha uplate: Uplata za program Work and Travel - ${ctx.obligationLabel} - ${ctx.candidateName}

Preuzmite pripremljenu uplatnicu sa NBS IPS QR kodom:
${ctx.paymentSlipUrl}

Pregledajte status svih uplata na svom kandidatskom portalu:
${ctx.portalUrl}

Ukoliko ste već izvršili uplatu u prethodnih 24-48h, molimo vas da zanemarite ovu poruku.

Srdačan pozdrav,
American Adventure tim`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color: ${ctx.trigger === 'OVERDUE' ? '#b91c1c' : '#0369a1'}; padding: 20px; color: #ffffff; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600;">American Adventure</h2>
      <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Podsetnik za plaćanje programa</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-top: 0;">Zdravo <strong>${ctx.firstName}</strong>,</p>
      <p style="font-size: 15px; color: #334155;">${urgencyNotice}</p>
      ${ctx.customNote ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 14px; color: #92400e;"><strong>Napomena:</strong> ${ctx.customNote}</div>` : ''}
      
      <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #0f172a;">Detalji obaveze i instrukcije za uplatu:</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #64748b;">Rata:</td><td style="padding: 4px 0; font-weight: 600; text-align: right;">${ctx.obligationLabel}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Iznos za uplatu:</td><td style="padding: 4px 0; font-weight: 700; color: #0f172a; text-align: right;">${ctx.amountUsd.toFixed(2)} USD (${rsdFormatted} RSD)</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Rok dospeća:</td><td style="padding: 4px 0; font-weight: 600; text-align: right; color: ${ctx.trigger === 'OVERDUE' ? '#b91c1c' : '#0f172a'};">${ctx.dueAtDateFormatted}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Primalac:</td><td style="padding: 4px 0; text-align: right;">${ctx.recipientName}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Račun primaoca:</td><td style="padding: 4px 0; font-family: monospace; text-align: right; font-weight: 600;">${ctx.recipientAccount}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Model i poziv na broj:</td><td style="padding: 4px 0; font-family: monospace; text-align: right; font-weight: 600;">${ctx.paymentModel} ${ctx.paymentReference}</td></tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${ctx.paymentSlipUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 8px;">Preuzmi uplatnicu (PDF sa NBS IPS QR kodom)</a>
        <a href="${ctx.portalUrl}" style="display: inline-block; background-color: #f1f5f9; color: #334155; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">Kandidatski portal</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center;">
        Ukoliko ste uplatu već izvršili, obrada bankarskog izvoda može potrajati 24-48h.
      </p>
    </div>
  </div>
</body>
</html>`

  return { html, subject, text }
}

export function renderPaymentReminderSms(ctx: PaymentReminderContext): string {
  const usd = ctx.amountUsd.toFixed(0)
  if (ctx.trigger === 'OVERDUE') {
    return `American Adventure OPOMENA: Rata '${ctx.obligationLabel}' (${usd} USD) je dospela ${ctx.dueAtDateFormatted}. Molimo izvrsite uplatu. Uplatnica i detalji: ${ctx.portalUrl}`
  }
  if (ctx.trigger === 'ON_DUE') {
    return `American Adventure: Zdravo ${ctx.firstName}, danas dospeva rata '${ctx.obligationLabel}' (${usd} USD). Detalji i uplatnica: ${ctx.portalUrl}`
  }
  return `American Adventure: Zdravo ${ctx.firstName}, podsecamo vas na dospece rate '${ctx.obligationLabel}' (${usd} USD) do ${ctx.dueAtDateFormatted}. Uplatnica: ${ctx.portalUrl}`
}

export function renderPaymentReminderInApp(ctx: PaymentReminderContext): {
  body: string
  title: string
} {
  const rsd = formatRsdAmount(ctx.amountRsd)
  if (ctx.trigger === 'OVERDUE') {
    return {
      body: `Rok za uplatu rate "${ctx.obligationLabel}" (${ctx.amountUsd.toFixed(2)} USD / ${rsd} RSD) je istekao ${ctx.dueAtDateFormatted}. Molimo vas da preuzmete nalog za uplatu i izmirite obavezu.`,
      title: `Opomena za plaćanje: ${ctx.obligationLabel}`,
    }
  }
  if (ctx.trigger === 'ON_DUE') {
    return {
      body: `Danas (${ctx.dueAtDateFormatted}) dospeva uplata rate "${ctx.obligationLabel}" u iznosu od ${ctx.amountUsd.toFixed(2)} USD (${rsd} RSD). Uplatnica sa IPS QR kodom je dostupna.`,
      title: `Danas dospeva rata: ${ctx.obligationLabel}`,
    }
  }
  return {
    body: `Podsećamo vas na dospeće rate "${ctx.obligationLabel}" (${ctx.amountUsd.toFixed(2)} USD / ${rsd} RSD) sa rokom do ${ctx.dueAtDateFormatted}.`,
    title: `Podsetnik za uplatu: ${ctx.obligationLabel}`,
  }
}
