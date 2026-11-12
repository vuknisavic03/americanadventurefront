type Appointment = {
  attemptNumber: number
  candidateInstructions?: string
  deliveryMode: 'IN_PERSON' | 'ONLINE'
  endsAt?: string
  id: number
  locationDetails: string
  startsAt: string
  status: 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'SCHEDULED'
  timeZone: string
}

const statusLabels = {
  CANCELLED: 'Termin je otkazan',
  COMPLETED: 'Priprema je završena',
  NO_SHOW: 'Evidentiran je izostanak',
  SCHEDULED: 'Termin je zakazan',
} as const

const orientationStatusLabels = {
  CANCELLED: 'Orijentacioni sastanak je otkazan',
  COMPLETED: 'Orijentacija je završena',
  NO_SHOW: 'Evidentiran je izostanak',
  SCHEDULED: 'Orijentacioni sastanak je zakazan',
} as const

function dateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value))
}

type MeetingPurpose = 'JOB_INTERVIEW' | 'EMBASSY' | 'ORIENTATION'

export function InterviewPreparationPanel({ appointments, purpose = 'JOB_INTERVIEW' }: { appointments: Appointment[]; purpose?: MeetingPurpose }) {
  const embassy = purpose === 'EMBASSY'
  const orientation = purpose === 'ORIENTATION'
  const labels = orientation ? orientationStatusLabels : statusLabels
  const headingId = orientation ? 'orientation-meeting-heading' : embassy ? 'embassy-preparation-heading' : 'interview-preparation-heading'
  const heading = orientation ? 'Orijentacioni sastanak pred putovanje' : embassy ? 'Priprema za razgovor u ambasadi' : 'Priprema za razgovor za posao'
  const current = appointments.find((appointment) => appointment.status === 'SCHEDULED') ?? appointments[0]
  return (
    <section className="portal-subsection interview-preparation" aria-labelledby={headingId}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{orientation ? 'Priprema putovanja' : embassy ? 'Viza' : 'Posao i intervju'}</p>
          <h2 id={headingId}>{heading}</h2>
        </div>
        <p>{current ? labels[current.status] : 'Termin još nije zakazan'}</p>
      </div>
      {!current ? (
        <p>Agencija će ovde objaviti datum, način održavanja i instrukcije za pripremu.</p>
      ) : (
        <div className={`interview-preparation__appointment interview-preparation__appointment--${current.status.toLowerCase()}`}>
          {embassy ? <p>Ovo je priprema sa agencijom, ne zvaničan razgovor u ambasadi. Za promenu termina kontaktirajte agenciju.</p> : null}
          {orientation ? <p>Agencija će ovde objaviti sve detalje sastanka pred putovanje. Za promenu termina kontaktirajte agenciju.</p> : null}
          <strong>{labels[current.status]}</strong>
          <dl className="portal-details">
            <div><dt>Datum i vreme</dt><dd>{dateTime(current.startsAt, current.timeZone)}</dd></div>
            {current.endsAt ? <div><dt>Planirani kraj</dt><dd>{dateTime(current.endsAt, current.timeZone)}</dd></div> : null}
            <div><dt>Način održavanja</dt><dd>{current.deliveryMode === 'ONLINE' ? 'Onlajn' : 'U prostorijama agencije'}</dd></div>
            <div><dt>Lokacija ili link</dt><dd>{current.locationDetails}</dd></div>
            <div><dt>Vremenska zona</dt><dd>{current.timeZone}</dd></div>
          </dl>
          {current.candidateInstructions ? <div><h3>Kako da se pripremite</h3><p>{current.candidateInstructions}</p></div> : null}
          {embassy && current.status === 'SCHEDULED' ? <p><a href={`/api/candidate/embassy-preparation?calendar=${current.id}`}>Preuzmi termin za kalendar (.ics)</a> — posle promene preuzmite novi fajl; kalendar se ne osvežava automatski.</p> : null}
          {orientation && current.status === 'SCHEDULED' ? <p><a href={`/api/candidate/orientation-meeting?calendar=${current.id}`}>Preuzmi termin za kalendar (.ics)</a> — posle promene preuzmite novi fajl; kalendar se ne osvežava automatski.</p> : null}
        </div>
      )}
      {appointments.length > 1 ? (
        <details className="interview-preparation__history">
          <summary>Prethodni termini</summary>
          <ul>{appointments.filter((appointment) => appointment.id !== current?.id).map((appointment) => <li key={appointment.id}>Termin {appointment.attemptNumber}: {labels[appointment.status]} — {dateTime(appointment.startsAt, appointment.timeZone)}</li>)}</ul>
        </details>
      ) : null}
    </section>
  )
}
