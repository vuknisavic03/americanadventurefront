// Footer.jsx
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import defaultNavItems from "../data/navItems";
import programItems from "../data/programItems";

// Ikonice za društvene mreže (Prilog 1B, Sekcija 6: Google+ uklonjen, TikTok dodat, Twitter zamenjen sa X)
function InstagramIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-2.9h-2.9V8.7c0-.84.26-1.4 1.46-1.4H16.5V4.7c-.27-.04-1.2-.12-2.27-.12-2.25 0-3.79 1.37-3.79 3.89v2.17H8v2.9h2.44V21h3.06z" />
    </svg>
  );
}

function TiktokIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14 3c.3 2.3 1.9 4 4.2 4.2v2.6c-1.3 0-2.6-.4-3.7-1.1v5.6a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.07v2.7a2.6 2.6 0 1 0 1.8 2.5V3H14z" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.6 7.2a2.4 2.4 0 0 0-1.7-1.7C18.3 5 12 5 12 5s-6.3 0-7.9.5A2.4 2.4 0 0 0 2.4 7.2 25 25 0 0 0 2 12a25 25 0 0 0 .4 4.8 2.4 2.4 0 0 0 1.7 1.7C5.7 19 12 19 12 19s6.3 0 7.9-.5a2.4 2.4 0 0 0 1.7-1.7A25 25 0 0 0 22 12a25 25 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V21a1 1 0 0 1-1 1A16 16 0 0 1 4 6a1 1 0 0 1 1-2z" />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 5 8-5" />
    </svg>
  );
}

const DEFAULT_CONTACT = {
  city: "Beograd",
  address: "Gospodar Jevremova 59/4, 11000, Srbija",
  phones: ["+381 11 4527 320", "+381 64 107 2004"],
  email: "beograd@workandtravel.rs",
};

const DEFAULT_SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/americanadventure/", Icon: InstagramIcon },
  { name: "Facebook", href: "https://www.facebook.com/AmericanAdventure/", Icon: FacebookIcon },
  { name: "TikTok", href: "https://www.tiktok.com/@americanadventure", Icon: TiktokIcon },
  { name: "X", href: "https://x.com/americanadv", Icon: XIcon },
  { name: "YouTube", href: "https://www.youtube.com/@AmericanAdventureAgency", Icon: YoutubeIcon },
];

const telHref = (phone) => "tel:" + phone.replace(/[^\d+]/g, "");

export default function Footer({
  navItems = defaultNavItems,
  programs = programItems,
  contact = DEFAULT_CONTACT,
  socials = DEFAULT_SOCIALS,
  onNavigate = () => {},
  logoHref = "/",
}) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  return (
    <footer className="bg-ink text-white">
      {/* Najkraći put do nas */}
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-6 border-b border-white/15 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[15px] text-white/60">Imaš pitanje? Pozovi, radnim danima od 9 do 17.</p>
            <a href={telHref(contact.phones[1] || contact.phones[0])} className="font-sign mt-2 block text-[clamp(3rem,8vw,6rem)] font-extrabold leading-none text-brand hover:underline hover:decoration-4 hover:underline-offset-8">
              {contact.phones[1] || contact.phones[0]}
            </a>
          </div>
          <a href={`mailto:${contact.email}`} className="text-lg font-semibold text-white underline decoration-white/30 decoration-2 underline-offset-[6px] hover:decoration-brand">
            {contact.email}
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brend + social */}
          <div className="lg:col-span-4">
            <a
              href={logoHref}
              onClick={go(logoHref)}
              aria-label={t("a11y.home") || "Početna"}
              className="inline-flex text-white"
            >
              <Logo className="h-14 w-auto" />
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              {t("footer.tagline") ||
                "Vodeća agencija za Work and Travel USA i programe međunarodne razmene sa tradicijom dužom od 15 godina."}
            </p>

            <p className="mt-8 text-sm text-white/55">
              {t("footer.followTitle") || "Pratite nas na mrežama"}
            </p>
            <div className="mt-3 flex gap-2.5">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-150 hover:border-brand hover:bg-brand hover:text-ink"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Glavni meni */}
          <nav className="lg:col-span-2" aria-label="Navigacija">
            <h3 className="text-sm text-white/55">{t("footer.navTitle")}</h3>
            <ul className="mt-4 space-y-2.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={go(item.href)}
                    className="text-sm text-white/85 transition-colors duration-150 hover:text-brand"
                  >
                    {item.key ? t(item.key) : item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Svi programi (Prilog 1B) */}
          <nav className="lg:col-span-3" aria-label="Programi">
            <h3 className="text-sm text-white/55">{t("footer.programsTitle")}</h3>
            <ul className="mt-4 space-y-2.5">
              {programs.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={go(item.href)}
                    className="text-sm text-white/85 transition-colors duration-150 hover:text-brand"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kontakt */}
          <div className="lg:col-span-3">
            <h3 className="text-sm text-white/55">{t("footer.contactTitle")}</h3>
            <ul className="mt-4 space-y-4 text-sm text-white/85">
              <li className="flex gap-3">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>
                  <span className="block font-semibold text-white">{contact.city}</span>
                  {contact.address}
                </span>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span className="flex flex-col">
                  {contact.phones.map((phone) => (
                    <a key={phone} href={telHref(phone)} className="transition-colors duration-150 hover:text-brand">
                      {phone}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a href={`mailto:${contact.email}`} className="break-all transition-colors duration-150 hover:text-brand">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Donja linija */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-5 py-6 text-[13px] text-white/55 sm:flex-row sm:items-center sm:px-8">
          <p>
            © {year} American Adventure DOO. {t("footer.rights")}
          </p>
          <a href="/admin" onClick={go("/admin")} className="transition-colors duration-150 hover:text-white">
            {t("footer.staff")}
          </a>
        </div>
      </div>
    </footer>
  );
}
