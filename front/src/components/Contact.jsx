// Contact.jsx
import { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import programItems from "../data/programItems";
import { Button, Container, SectionHeading, inputCls, labelCls } from "./ui";

const DEFAULT_CONTACT = {
  agencyName: "American Adventure DOO",
  city: "Beograd",
  address: "Gospodar Jevremova 59/4, 11000 Beograd, Srbija",
  workingHours: "Ponedeljak – Petak: 09:00 – 17:00 h",
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

export default function Contact({ programs = programItems, contact = DEFAULT_CONTACT, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", program: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | mail | error

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const programLabel = (value) => {
    const p = programs.find((item) => (item.key || item.label) === value);
    return p ? (p.key ? t(p.key) : p.label) : t("contact.programOther") || "Drugo / Opšti upit";
  };

  // Dok backend nema endpoint za kontakt, upit ide kroz e-mail program posetioca — poruka
  // se ne „šalje" u prazno. Kada endpoint postoji, proslediti `onSubmit` (async) i forma šalje sama.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      setStatus("sending");
      try {
        await onSubmit(form);
        setStatus("sent");
      } catch {
        setStatus("error");
      }
      return;
    }
    const to = contact.emails[0]?.email;
    const subject = `Upit sa sajta — ${programLabel(form.program)}`;
    const body = [form.message, "", `${form.name}`, form.email, form.phone].filter((line) => line !== undefined).join("\n");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("mail");
  };

  const reset = () => {
    setForm({ name: "", email: "", phone: "", program: "", message: "" });
    setStatus("idle");
  };

  const req = (
    <span className="text-red-600" aria-hidden="true">
      {" "}
      *
    </span>
  );
  const done = status === "sent" || status === "mail";

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionHeading
          as="h1"
          title={t("contact.title") || "Stupite u kontakt sa nama"}
          lead={
            t("contact.subtitle") ||
            "Naš tim je tu da odgovori na sva vaša pitanja u vezi sa programima, prijavama, terminima vize i poslovima u SAD."
          }
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Forma */}
          <div className="lg:col-span-3">
            {done ? (
              <div role="status" className="rounded-3xl bg-brand-soft p-8 sm:p-10">
                <h2 className="font-display text-2xl font-bold text-ink">
                  {status === "sent" ? "Poruka je poslata" : "Poruka je pripremljena u vašem e-mail programu"}
                </h2>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-2">
                  {status === "sent"
                    ? t("contact.success") || "Naš tim će vam odgovoriti u najkraćem roku."
                    : `Pošaljite je odatle da bi stigla do nas. Ako se e-mail program nije otvorio, pišite nam direktno na ${contact.emails[0]?.email}.`}
                </p>
                <Button variant="outline" className="mt-6" onClick={reset}>
                  Napiši novu poruku
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                {status === "error" && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
                    Poruka nije poslata. Proverite internet vezu i pokušajte ponovo.
                  </p>
                )}
                <div className="sm:col-span-2">
                  <label htmlFor="c-name" className={labelCls}>
                    {t("contact.name") || "Ime i prezime"}
                    {req}
                  </label>
                  <input id="c-name" type="text" required value={form.name} onChange={update("name")} className={`${inputCls} mt-2`} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="c-email" className={labelCls}>
                    {t("contact.email") || "Email adresa"}
                    {req}
                  </label>
                  <input id="c-email" type="email" required value={form.email} onChange={update("email")} className={`${inputCls} mt-2`} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="c-phone" className={labelCls}>
                    {t("contact.phone") || "Telefon"} <span className="font-normal text-ink-3">({t("contact.optional") || "opciono"})</span>
                  </label>
                  <input id="c-phone" type="tel" value={form.phone} onChange={update("phone")} className={`${inputCls} mt-2`} autoComplete="tel" placeholder="+381 6…" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-program" className={labelCls}>
                    {t("contact.program") || "Program koji vas zanima"}
                    {req}
                  </label>
                  <select id="c-program" required value={form.program} onChange={update("program")} className={`${inputCls} mt-2`}>
                    <option value="" disabled>
                      {t("contact.programPlaceholder") || "Izaberite program sa spiska"}
                    </option>
                    {programs.map((p) => (
                      <option key={p.href} value={p.key || p.label}>
                        {p.key ? t(p.key) : p.label}
                      </option>
                    ))}
                    <option value="other">{t("contact.programOther") || "Drugo / Opšti upit"}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-message" className={labelCls}>
                    {t("contact.message") || "Vaša poruka"}
                    {req}
                  </label>
                  <textarea id="c-message" required rows={5} value={form.message} onChange={update("message")} className={`${inputCls} mt-2 resize-y`} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" size="lg" disabled={status === "sending"}>
                    {t("contact.send") || "Pošalji upit"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Kontakt podaci */}
          <aside className="lg:col-span-2">
            <dl className="divide-y divide-line border-y border-line text-[15px]">
              <div className="py-5">
                <dt className="text-sm text-ink-3">{t("contact.infoTitle") || "Kancelarija u Beogradu"}</dt>
                <dd className="mt-1 text-ink">
                  <span className="block font-semibold">{contact.agencyName}</span>
                  {contact.address}
                </dd>
              </div>
              <div className="py-5">
                <dt className="text-sm text-ink-3">Radno vreme</dt>
                <dd className="mt-1 text-ink">{contact.workingHours}</dd>
              </div>
              <div className="py-5">
                <dt className="text-sm text-ink-3">Telefoni</dt>
                <dd className="mt-1 flex flex-col gap-1">
                  {contact.phones.map((phone) => (
                    <a key={phone} href={telHref(phone)} className="font-medium tabular-nums text-ink underline-offset-4 hover:underline">
                      {phone}
                    </a>
                  ))}
                </dd>
              </div>
              <div className="py-5">
                <dt className="text-sm text-ink-3">Email adrese</dt>
                <dd className="mt-2 space-y-3">
                  {contact.emails.map((item) => (
                    <p key={item.email}>
                      <span className="block text-sm text-ink-2">{item.label}</span>
                      <a href={`mailto:${item.email}`} className="break-all font-medium text-ink underline-offset-4 hover:underline">
                        {item.email}
                      </a>
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* Jedna mapa (Prilog 1B, Sekcija 6) */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-line">
          <iframe
            title={`Mapa: ${contact.address}`}
            src={contact.mapEmbedUrl}
            className="block h-80 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </section>
  );
}
