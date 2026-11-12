// Login.jsx
import { useState } from "react";
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";

const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

function EyeIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4 4" />
      <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 3.9M6.1 6.1A16 16 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 3.3-.6" />
    </svg>
  );
}

/**
 * Login — stranica „Prijavi se".
 *
 * Prijava preko e-maila ILI telefona (jedno polje) + lozinka (sa show/hide).
 * Validacija je nativna (required). Akcija ide preko `onSubmit` propsa
 * (backend kači autentikaciju); trenutno placeholder (console.log).
 *
 * Props:
 *  - onSubmit:   ({ identifier, password }) => void
 *  - onNavigate: (event, href) => void — logo, „Registruj se", „Zaboravljena lozinka"
 *  - registerHref / forgotHref / logoHref
 *
 * Gde se ubacuje: ruta /prijava (vidi App.jsx — prebacivanje prikaza).
 */
export default function Login({
  onSubmit = () => {},
  onNavigate = () => {},
  registerHref = "/registracija",
  applyHref = "/prijava-online",
  forgotHref = "/zaboravljena-lozinka",
  logoHref = "/",
}) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const go = (href) => (e) => {
    e.preventDefault();
    onNavigate(e, href);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const res = onSubmit({ identifier, password });
    if (res && res.error) {
      setError(res.error);
    }
  };

  const inputCls =
    "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-[var(--brand-ink)] transition-colors duration-150 placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/15";

  return (
    <section className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-[var(--brand-ink)]/[0.03] px-6 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a
          href={logoHref}
          onClick={go(logoHref)}
          aria-label={t("a11y.home")}
          className="mx-auto flex w-fit text-[var(--brand-ink)] transition-opacity duration-200 hover:opacity-80"
        >
          <Logo className="h-12 w-auto" />
        </a>

        {/* Kartica */}
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-7 shadow-xs sm:p-9">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
            {t("login.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-ink)]/65">{t("login.subtitle")}</p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            {/* E-mail ili telefon */}
            <div>
              <label htmlFor="l-id" className="block text-sm font-semibold text-[var(--brand-ink)]">
                {t("login.identifier")}
              </label>
              <input
                id="l-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputCls}
                autoComplete="username"
              />
            </div>

            {/* Lozinka */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label htmlFor="l-pass" className="block text-sm font-semibold text-[var(--brand-ink)]">
                  {t("login.password")}
                </label>
                <a
                  href={forgotHref}
                  onClick={go(forgotHref)}
                  className="text-sm font-semibold text-[var(--brand-ink)]/55 transition-colors duration-150 hover:text-[var(--brand-ink)]"
                >
                  {t("login.forgot")}
                </a>
              </div>
              <div className="relative mt-2">
                <input
                  id="l-pass"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} !mt-0 pr-12`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--brand-ink)]/55 transition-colors duration-150 hover:bg-black/5 hover:text-[var(--brand-ink)]"
                >
                  {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-7 w-full rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              style={{ backgroundColor: BRAND_YELLOW, color: INK }}
            >
              {t("login.submit")}
            </button>
          </form>
        </div>

        {/* Registracija / Pomoć */}
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-center shadow-xs">
            <p className="text-sm font-semibold text-[var(--brand-ink)]">
              {t("login.noAccount")}
            </p>
            <a
              href={registerHref}
              onClick={go(registerHref)}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand-ink)] underline decoration-2 underline-offset-4 transition-opacity hover:opacity-75"
            >
              <span>{t("login.activateAccount")}</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <p className="text-center text-xs text-[var(--brand-ink)]/65">
            {t("login.notInterviewed")}{" "}
            <a
              href={applyHref}
              onClick={go(applyHref)}
              className="font-bold text-[var(--brand-ink)] underline underline-offset-2 transition-opacity hover:opacity-75"
            >
              {t("login.applyFree")}
            </a>
          </p>

          <div className="mt-4 rounded-xl border border-black/10 bg-black/5 p-4 text-xs text-[var(--brand-ink)]/75 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--brand-ink)]">Administratorski pristup:</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("slobodan");
                  setPassword("1234");
                }}
                className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-[var(--brand-ink)] shadow-xs transition-colors hover:bg-black/5"
              >
                Popuni admin nalog
              </button>
            </div>
            <p className="text-[11px] text-[var(--brand-ink)]/60">
              Korisničko ime: <strong className="text-black">slobodan</strong> (ili admin@americanadventure.rs) | Šifra: <strong className="text-black">1234</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
