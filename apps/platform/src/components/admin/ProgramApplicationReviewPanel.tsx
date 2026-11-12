'use client'

import { useFormFields } from '@payloadcms/ui'

import type { ProgramApplicationSchemaSnapshot } from '../../modules/program-applications/schema.ts'
import './ProgramApplicationPanel.scss'

function displayValue(value: unknown, fieldType: string) {
  if (value === undefined || value === null || value === '') return 'Nije uneto'
  if (fieldType === 'DATE') {
    const date = new Date(`${String(value)}T00:00:00Z`)
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
    }
  }
  return String(value)
}

export function ProgramApplicationReviewPanel() {
  const values = useFormFields(([fields]) => ({
    answers: fields.answers?.value,
    completionPercent: fields.completionPercent?.value,
    schemaSnapshot: fields.schemaSnapshot?.value,
    status: fields.status?.value,
    submittedAt: fields.submittedAt?.value,
  }))
  const snapshot = values.schemaSnapshot as ProgramApplicationSchemaSnapshot | undefined
  const answers = values.answers && typeof values.answers === 'object'
    ? values.answers as Record<string, unknown>
    : {}

  if (!snapshot || !Array.isArray(snapshot.fields)) {
    return <section className="program-application-panel"><p>Pregled odgovora trenutno nije dostupan.</p></section>
  }

  return (
    <section className="program-application-panel">
      <div className="program-application-panel__heading">
        <div>
          <h3>Odgovori kandidata</h3>
          <p>{snapshot.name} · verzija {snapshot.version}</p>
        </div>
        <div>
          <span>{values.status === 'SUBMITTED' ? 'Predato' : 'Nacrt'}</span>
          <strong>{String(values.completionPercent ?? 0)}%</strong>
        </div>
      </div>
      {values.submittedAt ? <p>Vreme predaje: {new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(values.submittedAt)))}</p> : null}
      <dl className="program-application-panel__answers">
        {snapshot.fields.map((field) => {
          const value = displayValue(answers[field.key], field.fieldType)
          return (
            <div key={field.key}>
              <dt>{field.label}{field.required ? ' *' : ''}</dt>
              <dd className={value === 'Nije uneto' ? 'program-application-panel__empty' : undefined}>{value}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
