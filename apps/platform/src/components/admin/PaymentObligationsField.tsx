'use client'

import { useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

import './PaymentObligationsField.scss'

type Obligation = {
  amountCents: number
  dueAt: null | string
  key: string
  kind: 'DEFERRED' | 'INITIAL' | 'INSTALLMENT'
  label: string
}

const kindLabels: Record<Obligation['kind'], string> = {
  DEFERRED: 'Odloženo plaćanje',
  INITIAL: 'Početna obaveza',
  INSTALLMENT: 'Rata',
}

const amountFormatter = new Intl.NumberFormat('sr-Latn-RS', {
  currency: 'USD',
  currencyDisplay: 'code',
  style: 'currency',
})
const dateFormatter = new Intl.DateTimeFormat('sr-Latn-RS', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
  year: 'numeric',
})

function isObligation(value: unknown): value is Obligation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return Number.isSafeInteger(item.amountCents)
    && typeof item.key === 'string'
    && typeof item.label === 'string'
    && (item.dueAt === null || typeof item.dueAt === 'string')
    && (item.kind === 'DEFERRED' || item.kind === 'INITIAL' || item.kind === 'INSTALLMENT')
}

function dueDate(value: null | string) {
  if (!value) return 'Po dogovorenom uslovu'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Neispravan datum' : dateFormatter.format(date)
}

export const PaymentObligationsField: JSONFieldClientComponent = ({ path }) => {
  const { value } = useField<unknown>({ path })
  const obligations = Array.isArray(value) ? value.filter(isObligation) : []

  return (
    <section className="payment-obligations">
      <span className="payment-obligations__heading">Nepromenljivi plan obaveza</span>
      {obligations.length === 0 ? (
        <p className="payment-obligations__empty">Plan obaveza nije dostupan.</p>
      ) : (
        <div className="payment-obligations__table-wrap">
          <table>
            <thead><tr><th>Obaveza</th><th>Vrsta</th><th>Dospeće</th><th>Iznos</th></tr></thead>
            <tbody>
              {obligations.map((obligation) => (
                <tr key={obligation.key}>
                  <td>{obligation.label}</td>
                  <td>{kindLabels[obligation.kind]}</td>
                  <td>{dueDate(obligation.dueAt)}</td>
                  <td>{amountFormatter.format(obligation.amountCents / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
