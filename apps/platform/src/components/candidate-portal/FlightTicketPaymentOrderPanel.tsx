import './FlightTicketPaymentOrderPanel.scss'

type Order = {
  airlineName: string
  dueAt: string
  exchangeRateDate: string
  exchangeRateScaled: number
  exchangeRateSource: string
  id: number
  orderNumber: string
  originalAmountMinor: number
  originalCurrency: 'EUR' | 'RSD' | 'USD'
  outboundRoute: string
  overdue: boolean
  paidAt?: string
  paymentReference: string
  settlementAmountMinor: number
  status: 'CANCELLED' | 'ISSUED' | 'PAID'
}
const money = (minor: number, currency: string) => new Intl.NumberFormat('sr-Latn-RS', { currency, style: 'currency' }).format(minor / 100)
const date = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long' }).format(new Date(value))

export function FlightTicketPaymentOrderPanel({ orders }: { orders: Order[] }) {
  if (!orders.length) return null
  const current = orders.find((order) => order.status === 'ISSUED') ?? orders.find((order) => order.status === 'PAID')
  if (!current) return null
  return <section className="portal-card flight-payment" aria-labelledby="flight-payment-heading">
    <div className="section-heading"><div><p className="eyebrow">Putovanje</p><h2 id="flight-payment-heading">Uplata avionske karte</h2></div><span className={`status-chip status-chip--${current.status === 'PAID' ? 'success' : current.overdue ? 'danger' : 'pending'}`}>{current.status === 'PAID' ? 'Uplata evidentirana' : current.overdue ? 'Rok je istekao' : 'Čeka uplatu'}</span></div>
    <p>Nalog je napravljen iz opcije leta koju ste prihvatili. Pre uplate proverite podatke u PDF dokumentu.</p>
    <dl className="portal-details">
      <div><dt>Broj naloga</dt><dd>{current.orderNumber}</dd></div>
      <div><dt>Avionska karta</dt><dd>{current.airlineName} · {current.outboundRoute}</dd></div>
      <div><dt>Cena iz ponude</dt><dd>{money(current.originalAmountMinor, current.originalCurrency)}</dd></div>
      <div><dt>Iznos za uplatu</dt><dd>{money(current.settlementAmountMinor, 'RSD')}</dd></div>
      <div><dt>Rok</dt><dd>{date(current.dueAt)}</dd></div>
      <div><dt>Poziv na broj</dt><dd>{current.paymentReference}</dd></div>
      {current.originalCurrency !== 'RSD' ? <><div><dt>Kurs</dt><dd>{(current.exchangeRateScaled / 1_000_000).toFixed(6).replace(/0+$/, '')} RSD</dd></div><div><dt>Izvor i datum kursa</dt><dd>{current.exchangeRateSource} · {date(current.exchangeRateDate)}</dd></div></> : null}
      {current.paidAt ? <div><dt>Uplata evidentirana</dt><dd>{date(current.paidAt)}</dd></div> : null}
    </dl>
    <a className="button-link" href={`/api/flight-ticket-payment-orders/${current.id}/download`}>Preuzmi nalog u PDF-u</a>
    {orders.length > 1 ? <details><summary>Prethodne verzije ({orders.length - 1})</summary><ul>{orders.filter((order) => order.id !== current.id).map((order) => <li key={order.id}>{order.orderNumber} · {order.status === 'CANCELLED' ? 'otkazan' : order.status.toLowerCase()}</li>)}</ul></details> : null}
  </section>
}
