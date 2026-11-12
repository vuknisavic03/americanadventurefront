import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">American Adventure</p>
        <h1>Vaša američka avantura počinje ovde.</h1>
        <p>
          Prijavite se za Work &amp; Travel USA program. Naš tim će pregledati osnovne podatke i
          kontaktirati vas u vezi sa narednim koracima.
        </p>
        <div className="actions">
          <Link className="primary" href="/prijava/work-and-travel">
            Započni prijavu
          </Link>
          <Link href="/admin">Administrativni portal</Link>
        </div>
      </section>
    </main>
  )
}
