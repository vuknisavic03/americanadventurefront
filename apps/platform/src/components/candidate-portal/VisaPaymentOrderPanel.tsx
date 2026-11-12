type Order = {
  amountMinor: number
  bankAccount: string
  beneficiaryAddress?: string
  beneficiaryName: string
  cancellationReason?: string
  candidateInstructions: string
  currency: 'RSD' | 'USD'
  dueAt: string
  id: number
  issuedAt: string
  orderNumber: string
  orderVersion: number
  overdue: boolean
  paidAt?: string
  paymentModel?: string
  paymentPurpose: string
  paymentReference: string
  status: 'CANCELLED' | 'ISSUED' | 'PAID'
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(value / 100)
}
function date(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(new Date(value))
}

export function VisaPaymentOrderPanel({ orders }: { orders: Order[] }) {
  const order = orders.find((entry) => entry.status === 'ISSUED') ?? orders.find((entry) => entry.status === 'PAID') ?? orders[0]
  return (
    <section className="profile-reference visa-payment-order" aria-labelledby="visa-payment-order-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Proces viziranja</p><h2 id="visa-payment-order-heading">Nalog za uplatu viznih troškova</h2></div>
        <p>{order?.status === 'PAID' ? 'Agencija je evidentirala prijem uplate.' : order?.status === 'ISSUED' ? 'Pre uplate pažljivo proverite sve podatke.' : 'Nalog će se pojaviti kada ga agencija izda.'}</p>
      </div>
      {!order ? <p className="payment-empty">Agencija još nije izdala nalog za uplatu viznih troškova.</p> : order.status === 'CANCELLED' ? (
        <div className="form-alert"><strong>Prethodni nalog je otkazan.</strong><p>{order.cancellationReason ?? 'Sačekajte ispravljenu verziju naloga.'}</p></div>
      ) : (
        <>
          <div className={`visa-payment-order__status visa-payment-order__status--${order.status.toLowerCase()}`}>
            <span>{order.status === 'PAID' ? 'Uplata evidentirana' : order.overdue ? 'Rok je istekao' : 'Čeka uplatu'}</span>
            <strong>{money(order.amountMinor, order.currency)}</strong>
            <small>{order.orderNumber} · verzija {order.orderVersion}</small>
          </div>
          <dl className="portal-details visa-payment-order__details">
            <div><dt>Primalac</dt><dd>{order.beneficiaryName}</dd></div>
            {order.beneficiaryAddress ? <div><dt>Adresa primaoca</dt><dd>{order.beneficiaryAddress}</dd></div> : null}
            <div><dt>Račun primaoca</dt><dd>{order.bankAccount}</dd></div>
            <div><dt>Model</dt><dd>{order.paymentModel ?? 'Nije naveden'}</dd></div>
            <div><dt>Poziv na broj</dt><dd>{order.paymentReference}</dd></div>
            <div><dt>Rok za uplatu</dt><dd>{date(order.dueAt)}</dd></div>
            <div><dt>Svrha uplate</dt><dd>{order.paymentPurpose}</dd></div>
            <div><dt>Nalog izdat</dt><dd>{date(order.issuedAt)}</dd></div>
          </dl>
          <div className="visa-payment-order__instructions"><h3>Uputstvo agencije</h3><p>{order.candidateInstructions}</p></div>
          {order.overdue && order.status === 'ISSUED' ? <div className="form-alert">Nemojte izvršavati uplatu po isteklom nalogu pre nego što kontaktirate agenciju.</div> : null}
          {order.status === 'PAID' ? <div className="form-success"><strong>Uplata je potvrđena</strong><p>Datum prijema: {order.paidAt ? date(order.paidAt) : 'evidentirano u administraciji'}</p></div> : null}
        </>
      )}
      {orders.length > 1 ? <details className="interview-preparation__history"><summary>Prethodne verzije</summary><ul>{orders.filter((entry) => entry.id !== order?.id).map((entry) => <li key={entry.id}>{entry.orderNumber} · {entry.status === 'PAID' ? 'plaćen' : entry.status === 'CANCELLED' ? 'otkazan' : 'čeka uplatu'}</li>)}</ul></details> : null}
    </section>
  )
}
