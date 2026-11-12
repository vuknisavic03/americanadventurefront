import { allocatePayments, type PaymentObligation } from '@/modules/payments/ledger.ts'

export type CandidateInvoiceView = {
  id: number
  invoiceNumber: string
  issueDate: string
  note?: string
  originalAmountCents: number
  originalCurrency: string
  settlementAmountRsdCents: number
}

type PaymentPlanView = {
  currency: 'USD'
  firstPaymentRequiredCents: number
  firstPaymentStatus: 'CONFIRMED' | 'NOT_REQUIRED' | 'PENDING'
  obligations: PaymentObligation[]
  paidCents: number
  remainingCents: number
  status: 'ACTIVE' | 'PAID'
  totalCents: number
}

type PaymentView = {
  amountCents: number
  entryType: 'PAYMENT' | 'REVERSAL'
  paymentReference: string
  receivedAt: string
}

function money(cents: number, currency: string) {
  return `${new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(cents / 100)} ${currency}`
}

function date(value: null | string) {
  if (!value) return 'Prema uslovima ugovora'
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long' }).format(new Date(value))
}

export function PaymentOverviewPanel({
  invoices = [],
  payments,
  plan,
}: {
  invoices?: CandidateInvoiceView[]
  payments: PaymentView[]
  plan: PaymentPlanView
}) {
  const obligations = allocatePayments(plan.obligations, plan.paidCents)
  const firstPaymentLabel = plan.firstPaymentStatus === 'CONFIRMED'
    ? 'Prva uplata je potvrđena'
    : plan.firstPaymentStatus === 'NOT_REQUIRED'
      ? 'Početna uplata nije potrebna'
      : 'Prva uplata čeka potvrdu'

  return (
    <section className="payment-overview" aria-labelledby="payment-overview-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Finansije</p><h2 id="payment-overview-heading">Pregled plaćanja</h2></div>
        <p>Prikaz je formiran iz prihvaćenog ugovora i uplata koje je agencija evidentirala.</p>
      </div>

      <div className={`payment-status payment-status--${plan.firstPaymentStatus.toLowerCase()}`}>
        <strong>{firstPaymentLabel}</strong>
        {plan.firstPaymentStatus === 'PENDING'
          ? <span>Za nastavak procesa potrebno je da agencija potvrdi ukupno {money(plan.firstPaymentRequiredCents, plan.currency)}.</span>
          : <span>{plan.status === 'PAID' ? 'Sve ugovorene obaveze su evidentirane kao plaćene.' : 'Nastavak programske aplikacije je omogućen.'}</span>}
      </div>

      <dl className="payment-summary">
        <div><dt>Ukupna obaveza</dt><dd>{money(plan.totalCents, plan.currency)}</dd></div>
        <div><dt>Evidentirano</dt><dd>{money(plan.paidCents, plan.currency)}</dd></div>
        <div><dt>Preostalo</dt><dd>{money(plan.remainingCents, plan.currency)}</dd></div>
      </dl>

      <h3>Plan obaveza i uplatnice</h3>
      <ol className="payment-obligations">
        {obligations.map((obligation) => (
          <li key={obligation.key}>
            <div>
              <strong>{obligation.label}</strong>
              <small>{date(obligation.dueAt)}</small>
              <div style={{ marginTop: '0.4rem' }}>
                <a
                  href={`/api/candidate/payment-slips/${encodeURIComponent(obligation.key)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--sm"
                  style={{ display: 'inline-block', fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                >
                  Preuzmi primer uplatnice (PDF)
                </a>
              </div>
            </div>
            <div className="payment-obligation-amount">
              <strong>{money(obligation.amountCents, plan.currency)}</strong>
              <small>{obligation.status === 'PAID' ? 'Plaćeno' : obligation.status === 'PARTIAL' ? `Preostalo ${money(obligation.remainingCents, plan.currency)}` : 'Čeka uplatu'}</small>
            </div>
          </li>
        ))}
      </ol>

      {invoices.length > 0 ? (
        <>
          <h3>Izdati računi i fakture (KIR)</h3>
          <div className="payment-history">
            {invoices.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>Faktura {inv.invoiceNumber}</strong>
                  <small>{date(inv.issueDate)} · {inv.originalAmountCents / 100} {inv.originalCurrency} ({money(inv.settlementAmountRsdCents, 'RSD')})</small>
                </span>
                <a
                  href={`/api/candidate/invoices/${inv.id}/download`}
                  download
                  className="btn btn--primary btn--sm"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                >
                  Preuzmi račun (PDF)
                </a>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {payments.length > 0 ? (
        <>
          <h3>Istorija evidencije uplata</h3>
          <div className="payment-history">
            {payments.map((payment) => (
              <div key={payment.paymentReference}>
                <span><strong>{payment.entryType === 'PAYMENT' ? 'Primljena uplata' : 'Poništenje uplate'}</strong><small>{date(payment.receivedAt)} · {payment.paymentReference}</small></span>
                <b className={payment.entryType === 'REVERSAL' ? 'payment-history__negative' : undefined}>{payment.entryType === 'REVERSAL' ? '−' : '+'}{money(payment.amountCents, plan.currency)}</b>
              </div>
            ))}
          </div>
        </>
      ) : <p className="payment-empty">Još nema evidentiranih uplata.</p>}
    </section>
  )
}
