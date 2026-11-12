// Contact.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import programItems from "../data/programItems";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

function PinIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function PhoneIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V21a1 1 0 0 1-1 1A16 16 0 0 1 4 6a1 1 0 0 1 1-2z" />
    </svg>
  );
}

function MailIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 5 8-5" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

const DEFAULT_CONTACT = {
  agencyName: "American Adventure DOO",
  city: "Beograd",
  address: "Gospodar Jevremova 59/4, 11000 Beograd, Srbija",
  workingHours: "Ponedeljak – Petak: 10:00 – 18:00 h",
  phones: ["+381 11 4527 320", "+381 64 107 2004"],
  emails: [
    { label: "Glavna kancelarija & SWT", email: "beograd@workandtravel.rs" },
    { label: "Internship & Training", email: "internship@workandtravel.rs" },
    { label: "Avio karte", email: "aviokarte@workandtravel.rs" },
    { label: "Opšti upiti", email: "office.americanadventure@gmail.com" },
  ],
  mapEmbedUrl:
    "https://maps.google.com/maps?q=Gospodar+Jevremova+59,+Belgrade,+Serbia&t=&z=16&ie=UTF8&iwloc=&output=embed",
};

const telHref = (phone) => "tel:" + phone.replace(/[^\d+]/g, "");

export default function Contact({
  programs = programItems,
  contact = DEFAULT_CONTACT,
  onSubmit = () => {},
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", program: "", message: "" });
  const [sent, setSent] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    console.log("Kontakt upit poslat ->", form);
    setSent(true);
  };

  const labelCls = "block text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70";
  const inputCls =
    "mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--brand-ink)] transition-colors duration-150 placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/15";
  const req = <span className="text-red-500 font-bold" aria-hidden="true"> *</span>;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* Zaglavlje */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-ink)]/50 sm:text-sm">
            {t("contact.kicker") || "Kontaktirajte nas"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-5xl">
            {t("contact.title") || "Stupite u kontakt sa nama"}
          </h1>
          <span className="mt-6 block h-1.5 w-16 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
          <p className="mt-6 text-base text-[var(--brand-ink)]/70 sm:text-lg">
            {t("contact.subtitle") ||
              "Naš tim je tu da odgovori na sva vaša pitanja u vezi sa programima, prijavama, terminima vize i poslovima u SAD."}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Forma */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10 p-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: BRAND_YELLOW, color: INK }}>
                  <CheckCircleIcon className="h-9 w-9" />
                </span>
                <p className="mt-5 max-w-sm text-lg font-bold text-[var(--brand-ink)]">
                  {t("contact.success") || "Vaša poruka je uspešno poslata! Naš tim će vam odgovoriti u najkraćem roku."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ name: "", email: "", phone: "", program: "", message: "" });
                    setSent(false);
                  }}
                  className="mt-6 rounded-full border border-black/15 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] hover:bg-black/5"
                >
                  Pošalji novu poruku
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate={false} className="rounded-3xl border border-black/10 bg-white p-7 shadow-xs sm:p-9">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="c-name" className={labelCls}>{t("contact.name") || "Ime i prezime"}{req}</label>
                    <input id="c-name" type="text" required value={form.name} onChange={update("name")} className={inputCls} autoComplete="name" placeholder="npr. Ana Jovanović" />
                  </div>

                  <div>
                    <label htmlFor="c-email" className={labelCls}>{t("contact.email") || "Email adresa"}{req}</label>
                    <input id="c-email" type="email" required value={form.email} onChange={update("email")} className={inputCls} autoComplete="email" placeholder="vas.email@example.com" />
                  </div>

                  <div>
                    <label htmlFor="c-phone" className={labelCls}>
                      {t("contact.phone") || "Telefon"} <span className="font-normal text-[var(--brand-ink)]/40">({t("contact.optional") || "opciono"})</span>
                    </label>
                    <input id="c-phone" type="tel" value={form.phone} onChange={update("phone")} className={inputCls} autoComplete="tel" placeholder="+381 6..." />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="c-program" className={labelCls}>{t("contact.program") || "Program koji vas zanima"}{req}</label>
                    <select id="c-program" required value={form.program} onChange={update("program")} className={`${inputCls} appearance-none`}>
                      <option value="" disabled>{t("contact.programPlaceholder") || "Izaberite program sa spiska"}</option>
                      {programs.map((p) => (
                        <option key={p.href} value={p.key || p.label}>
                          {p.label || (p.key ? t(p.key) : "")}
                        </option>
                      ))}
                      <option value="other">{t("contact.programOther") || "Drugo / Opšti upit"}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="c-message" className={labelCls}>{t("contact.message") || "Vaša poruka"}{req}</label>
                    <textarea id="c-message" required rows={4} value={form.message} onChange={update("message")} className={`${inputCls} resize-none`} placeholder="Postavite pitanje ili opišite šta vas zanima..." />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 sm:w-auto"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                >
                  {t("contact.send") || "Pošalji upit"}
                </button>
              </form>
            )}
          </div>

          {/* Kontakt podaci */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl p-7 text-white sm:p-8" style={{ backgroundColor: INK }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                {t("contact.infoTitle") || "Kancelarija u Beogradu"}
              </h2>

              <ul className="mt-6 space-y-6 text-sm">
                <li className="flex gap-4">
                  <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-yellow)]" />
                  <span>
                    <span className="block font-bold text-white">{contact.agencyName}</span>
                    <span className="text-white/70">{contact.address}</span>
                  </span>
                </li>

                <li className="flex gap-4">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-yellow)]" />
                  <span>
                    <span className="block font-bold text-white">Radno vreme</span>
                    <span className="text-white/70">{contact.workingHours}</span>
                  </span>
                </li>

                <li className="flex gap-4">
                  <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-yellow)]" />
                  <span className="flex flex-col gap-1">
                    <span className="block font-bold text-white">Telefoni</span>
                    {contact.phones.map((phone) => (
                      <a key={phone} href={telHref(phone)} className="text-white/85 transition-colors duration-150 hover:text-[var(--brand-yellow)]">
                        {phone}
                      </a>
                    ))}
                  </span>
                </li>

                <li className="flex gap-4">
                  <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-yellow)]" />
                  <span className="flex flex-col gap-1">
                    <span className="block font-bold text-white">Email adrese</span>
                    {contact.emails.map((item) => (
                      <div key={item.email} className="text-xs">
                        <span className="text-white/50 block">{item.label}:</span>
                        <a href={`mailto:${item.email}`} className="break-all text-white/90 hover:text-[var(--brand-yellow)]">
                          {item.email}
                        </a>
                      </div>
                    ))}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* JEDNA ČISTA GOOGLE MAPA (Prilog 1B, Sekcija 6: duplirana mapa uklonjena) */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-black/10 bg-black/[0.02] shadow-xs">
          <div className="border-b border-black/10 bg-white px-6 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70">
              Lokacija: Gospodar Jevremova 59/4, Beograd (Stari Grad / Dorćol)
            </h3>
          </div>
          <div className="relative h-80 w-full sm:h-96">
            <iframe
              title="American Adventure Lokacija"
              src={contact.mapEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
