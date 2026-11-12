// Header.jsx
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";

// Brand tokens — keep in one place so the rest of the site can reuse them.
const BRAND_YELLOW = "#FDD503";
const INK = "#231f20";

// Default navigation. `key` -> prevod, `label` -> SR fallback. Override via prop.
export const NAV_ITEMS = [
  { key: "nav.programi", label: "Programi", href: "/programi" },
  { key: "nav.akcije", label: "Akcije", href: "/akcije" },
  { key: "nav.novosti", label: "Novosti", href: "/novosti" },
  { key: "nav.saradnja", label: "Saradnja", href: "/saradnja" },
  { key: "nav.fotostory", label: "Foto-story", href: "/foto-story" },
  { key: "nav.kontakt", label: "Kontakt", href: "/kontakt" },
];

// Brzi predlozi u pretrazi (ključevi prevoda; backend kasnije servira prave).
const SEARCH_SUGGESTION_KEYS = ["sug.amerika", "sug.leto", "sug.viza", "sug.smestaj", "sug.cene"];

// Ručno crtane ikonice (bez icon biblioteka), nasleđuju boju preko currentColor.
function SearchIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function ChevronIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export default function Header({
  navItems = NAV_ITEMS,
  activeHref = "",
  logoHref = "/",
  onSearch, // (query) => void
  onNavigate, // (event, href) => void  — hook your router here; call e.preventDefault() inside
  onLogin, // () => void
  onRegister, // () => void
  onApply, // ()=> void — online prijava / pre-prijava (najvažnija CTA)
  loggedIn = false, // kad je true: umesto Prijavi/Registruj prikazuje dugme za nalog
  appHref = "/nalog", // ruta naloga (klik na to dugme)
  appLabelKey = "auth.myApp", // tekst dugmeta za nalog (npr. „Admin" za admina)
}) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false); // mobilni meni
  const [searchOpen, setSearchOpen] = useState(false); // traka za pretragu
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [openSub, setOpenSub] = useState(null); // href otvorenog mobilnog podmenija
  const searchInputRef = useRef(null);

  // Load the Archivo display font once.
  useEffect(() => {
    const id = "ga-font-archivo";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Subtle elevation once the page scrolls under the bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape zatvara pretragu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Fokusiraj polje kad se pretraga otvori.
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleNav = (e, href) => {
    setOpen(false);
    setSearchOpen(false);
    if (onNavigate) onNavigate(e, href);
  };

  const toggleSearch = () => {
    setOpen(false);
    setSearchOpen((v) => !v);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (onSearch) onSearch(q);
  };

  return (
    <header
      style={{ fontFamily: "'Archivo', system-ui, sans-serif", backgroundColor: "#ffffff" }}
      className={`sticky top-0 z-50 w-full border-b border-black/10 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.14)]" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex h-24 max-w-[1680px] items-center justify-between gap-8 px-6 sm:px-10 lg:px-16">
        {/* Logo */}
        <a
          href={logoHref}
          onClick={(e) => handleNav(e, logoHref)}
          aria-label={t("a11y.home")}
          className="flex shrink-0 items-center transition-transform duration-200 hover:scale-[1.03]"
          style={{ color: INK }}
        >
          <Logo className="h-16 w-auto sm:h-[72px]" />
        </a>

        {/* Desktop navigation */}
        <nav aria-label="American Adventure" className="hidden items-center gap-9 xl:flex 2xl:gap-11">
          {navItems.map((item) => {
            const active =
              activeHref === item.href ||
              (item.children && item.children.some((c) => c.href === activeHref));
            const label = item.key ? t(item.key) : item.label;
            const underline = (
              <span
                className={`pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left bg-current transition-transform duration-300 ease-out ${
                  active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            );

            // Stavka sa padajućim podmenijem (npr. Programi)
            if (item.children) {
              return (
                <div key={item.href} className="group relative">
                  <a
                    href={item.href}
                    onClick={(e) => handleNav(e, item.href)}
                    aria-current={active ? "page" : undefined}
                    aria-haspopup="true"
                    className="relative flex items-center gap-1.5 py-1 text-[0.95rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200"
                    style={{ color: INK }}
                  >
                    {label}
                    <ChevronIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                    {underline}
                  </a>

                  {/* Dropdown (otvara se na hover/fokus; pt-4 pravi most ka panelu) */}
                  <div className="invisible absolute left-0 top-full z-50 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <ul className="w-[22rem] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                      {item.children.map((child) => {
                        const childActive = activeHref === child.href;
                        return (
                          <li key={child.href}>
                            <a
                              href={child.href}
                              onClick={(e) => handleNav(e, child.href)}
                              aria-current={childActive ? "page" : undefined}
                              className={`block rounded-xl px-4 py-2.5 text-sm font-medium leading-snug transition-colors duration-150 hover:bg-black/5 ${
                                childActive ? "bg-black/5" : ""
                              }`}
                              style={{ color: INK }}
                            >
                              {child.key ? t(child.key) : child.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            }

            // Obična stavka
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNav(e, item.href)}
                aria-current={active ? "page" : undefined}
                className="group relative py-1 text-[0.95rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200"
                style={{ color: INK }}
              >
                {label}
                {underline}
              </a>
            );
          })}
        </nav>

        {/* Desktop right cluster: search, jezik, auth */}
        <div className="hidden shrink-0 items-center gap-4 xl:flex" style={{ color: INK }}>
          {/* Search toggle */}
          <button
            type="button"
            onClick={toggleSearch}
            aria-label={searchOpen ? t("a11y.closeSearch") : t("a11y.search")}
            aria-expanded={searchOpen}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 active:scale-90 ${
              searchOpen ? "bg-black/5" : ""
            }`}
          >
            {searchOpen ? <CloseIcon className="h-[18px] w-[18px]" /> : <SearchIcon />}
          </button>

          {/* Auth */}
          {loggedIn ? (
            <a
              href={appHref}
              onClick={(e) => handleNav(e, appHref)}
              style={{ backgroundColor: BRAND_YELLOW, color: INK }}
              className="rounded-full px-7 py-3 text-[0.95rem] font-bold uppercase tracking-[0.08em] shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              {t(appLabelKey)}
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={onLogin}
                className="px-2 text-[0.95rem] font-semibold uppercase tracking-[0.08em] transition-opacity duration-200 hover:opacity-65"
              >
                {t("auth.loginAccount")}
              </button>
              <button
                type="button"
                onClick={onRegister || onApply}
                style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                className="rounded-full px-7 py-3 text-[0.95rem] font-bold uppercase tracking-[0.08em] shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              >
                {t("auth.activateAccount")}
              </button>
            </>
          )}
        </div>

        {/* Mobile: search + hamburger */}
        <div className="flex shrink-0 items-center gap-1 xl:hidden" style={{ color: INK }}>
          <button
            type="button"
            onClick={toggleSearch}
            aria-label={searchOpen ? t("a11y.closeSearch") : t("a11y.search")}
            aria-expanded={searchOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 active:scale-90"
          >
            {searchOpen ? <CloseIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setOpen((v) => !v);
            }}
            aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 items-center justify-center"
          >
            <span className="flex flex-col gap-[6px]">
              <span className={`block h-[2px] w-6 rounded-full bg-current transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-[2px] w-6 rounded-full bg-current transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`block h-[2px] w-6 rounded-full bg-current transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Traka za pretragu — bela podloga, spušta se preko cele širine */}
      <div
        className={`grid overflow-hidden bg-white transition-all duration-300 ease-out ${
          searchOpen ? "grid-rows-[1fr] opacity-100 shadow-[0_12px_24px_rgba(0,0,0,0.10)]" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-[1680px] px-6 py-5 sm:px-10 lg:px-16" style={{ color: INK }}>
            <form onSubmit={submitSearch} className="flex items-center gap-3">
              <SearchIcon className="h-6 w-6 shrink-0 opacity-60" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("a11y.search")}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-lg font-medium placeholder:text-black/40 focus:outline-hidden sm:text-xl"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("a11y.clear")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/5"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                style={{ backgroundColor: INK, color: BRAND_YELLOW }}
                className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("search.button")}
              </button>
            </form>

            {/* Brzi predlozi */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] opacity-50">{t("search.popular")}</span>
              {SEARCH_SUGGESTION_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setQuery(label);
                      if (onSearch) onSearch(label);
                    }}
                    className="rounded-full border border-black/15 px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-black/5"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div
        id="mobile-menu"
        className={`grid overflow-hidden transition-all duration-300 ease-out xl:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <nav aria-label="American Adventure" className="flex flex-col gap-1 border-t border-black/10 px-4 pb-4 pt-3 sm:px-6">
            {navItems.map((item) => {
              const active =
                activeHref === item.href ||
                (item.children && item.children.some((c) => c.href === activeHref));
              const label = item.key ? t(item.key) : item.label;
              const linkClass = `rounded-lg px-3 py-3 text-base font-semibold uppercase tracking-[0.06em] transition-colors duration-150 hover:bg-black/5 ${
                active ? "bg-black/5" : ""
              }`;

              // Stavka sa podmenijem -> accordion
              if (item.children) {
                const expanded = openSub === item.href;
                return (
                  <div key={item.href}>
                    <div className="flex items-stretch">
                      <a
                        href={item.href}
                        onClick={(e) => handleNav(e, item.href)}
                        aria-current={active ? "page" : undefined}
                        className={`flex-1 ${linkClass}`}
                        style={{ color: INK }}
                      >
                        {label}
                      </a>
                      <button
                        type="button"
                        onClick={() => setOpenSub(expanded ? null : item.href)}
                        aria-label={t("a11y.toggleSubmenu")}
                        aria-expanded={expanded}
                        className="flex w-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                        style={{ color: INK }}
                      >
                        <ChevronIcon className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    <div
                      className={`grid overflow-hidden transition-all duration-300 ease-out ${
                        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mb-1 ml-1 mt-1 flex flex-col gap-0.5 rounded-xl bg-white p-1.5 shadow-xs">
                          {item.children.map((child) => {
                            const childActive = activeHref === child.href;
                            return (
                              <a
                                key={child.href}
                                href={child.href}
                                onClick={(e) => handleNav(e, child.href)}
                                aria-current={childActive ? "page" : undefined}
                                className={`rounded-lg px-3 py-2.5 text-sm font-medium leading-snug transition-colors duration-150 hover:bg-black/5 ${
                                  childActive ? "bg-black/5" : ""
                                }`}
                                style={{ color: INK }}
                              >
                                {child.key ? t(child.key) : child.label}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Obična stavka
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  aria-current={active ? "page" : undefined}
                  className={linkClass}
                  style={{ color: INK }}
                >
                  {label}
                </a>
              );
            })}

          </nav>

          {/* Donji deo — kompletno bela podloga (od jezika naniže) */}
          <div className="bg-white px-4 py-6 sm:px-6">
            {/* Auth */}
            <div className="flex flex-col gap-3">
              {loggedIn ? (
                <a
                  href={appHref}
                  onClick={(e) => handleNav(e, appHref)}
                  className="rounded-full px-6 py-3 text-center text-base font-bold uppercase tracking-[0.06em] shadow-xs transition-all duration-200 active:translate-y-0"
                  style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                >
                  {t(appLabelKey)}
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onLogin && onLogin();
                    }}
                    className="rounded-full border-2 px-6 py-3 text-base font-bold uppercase tracking-[0.06em] transition-colors duration-200 hover:bg-black/5"
                    style={{ borderColor: INK, color: INK }}
                  >
                    {t("auth.loginAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      (onRegister || onApply) && (onRegister || onApply)();
                    }}
                    className="rounded-full px-6 py-3 text-base font-bold uppercase tracking-[0.06em] shadow-xs transition-all duration-200 active:translate-y-0"
                    style={{ backgroundColor: BRAND_YELLOW, color: INK }}
                  >
                    {t("auth.activateAccount")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
