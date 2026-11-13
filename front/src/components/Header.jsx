// Header.jsx
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import defaultNavItems from "../data/navItems";
import { Button, ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon, cx } from "./ui";

// Brzi predlozi u pretrazi (ključevi prevoda; backend kasnije servira prave).
const SEARCH_SUGGESTION_KEYS = ["sug.amerika", "sug.leto", "sug.viza", "sug.smestaj", "sug.cene"];

const pathOf = (href = "") => href.split("?")[0].split("#")[0];

/**
 * Header — glavna navigacija sajta (sticky, bela podloga).
 *
 * Desna strana ima jednu jasnu hijerarhiju:
 *   posetilac  →  „Moj nalog" (tekstualni link)  +  „Prijavi se za program" (žuto, glavna akcija)
 *   prijavljen →  dugme ka nalogu (kandidat: profil, admin: admin portal)
 *
 * Props: navItems, activeHref, logoHref, onNavigate(e, href), onSearch(query),
 *        onLogin(), onApply(), loggedIn, appHref, appLabelKey
 */
export default function Header({
  navItems = defaultNavItems,
  activeHref = "",
  logoHref = "/",
  onSearch,
  onNavigate,
  onLogin,
  onApply,
  loggedIn = false,
  appHref = "/profil",
  appLabelKey = "auth.myApp",
}) {
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openSub, setOpenSub] = useState(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  const activePath = pathOf(activeHref);

  // Na početnoj zaglavlje je providno preko videa, dok se ne skroluje.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const overlay = activePath === "/" && !scrolled && !menuOpen && !searchOpen;
  const isActive = (item) =>
    pathOf(item.href) === activePath || Boolean(item.children?.some((c) => c.href === activeHref));

  // Zaključaj skrol dok je mobilni meni otvoren.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    document.body.dataset.menu = menuOpen ? "open" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.dataset.menu = "";
    };
  }, [menuOpen]);

  // Escape zatvara pretragu i meni.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSearchOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const handleNav = (e, href) => {
    closeAll();
    if (onNavigate) onNavigate(e, href);
  };

  const runSearch = (value) => {
    const q = value.trim();
    if (!q) return;
    closeAll();
    if (onSearch) onSearch(q);
  };

  const label = (item) => (item.key ? t(item.key) : item.label);

  return (
    <header className={cx("sticky top-0 z-50 w-full border-b transition-colors duration-200", overlay ? "border-white/15 bg-transparent text-white" : "border-line bg-white text-ink")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-[72px]">
        <a
          href={logoHref}
          onClick={(e) => handleNav(e, logoHref)}
          aria-label={t("a11y.home")}
          className="flex shrink-0 items-center"
        >
          <Logo className="h-11 w-auto lg:h-12" />
        </a>

        {/* Desktop navigacija */}
        <nav aria-label="American Adventure" className="hidden h-full items-stretch gap-x-6 lg:flex xl:gap-x-8">
          {navItems.map((item) => {
            const active = isActive(item);
            const linkCls = cx(
              "relative flex h-full items-center gap-1 text-[15px] font-medium transition-colors duration-150",
              overlay ? (active ? "text-white" : "text-white/80 hover:text-white") : active ? "text-ink" : "text-ink-2 hover:text-ink"
            );
            const indicator = (
              <span
                aria-hidden="true"
                className={cx(
                  "absolute inset-x-0 -bottom-px h-0.5 bg-brand transition-opacity duration-150",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
            );

            if (!item.children) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  aria-current={active ? "page" : undefined}
                  className={linkCls}
                >
                  {label(item)}
                  {indicator}
                </a>
              );
            }

            return (
              <div key={item.href} className="group relative flex h-full items-stretch">
                <a
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  aria-current={active ? "page" : undefined}
                  aria-haspopup="true"
                  className={linkCls}
                >
                  {label(item)}
                  <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-180" />
                  {indicator}
                </a>
                <div className="invisible absolute left-0 top-full z-50 -ml-3 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="w-72 rounded-2xl border border-line bg-white p-1.5 shadow-lg">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <a
                          href={child.href}
                          onClick={(e) => handleNav(e, child.href)}
                          aria-current={activeHref === child.href ? "page" : undefined}
                          className={cx(
                            "block rounded-xl px-3.5 py-2.5 text-sm leading-snug text-ink transition-colors duration-150 hover:bg-surface",
                            activeHref === child.href && "bg-surface font-medium"
                          )}
                        >
                          {label(child)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Desna strana */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen((v) => !v);
            }}
            aria-label={searchOpen ? t("a11y.closeSearch") : t("a11y.search")}
            aria-expanded={searchOpen}
            className={cx("flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150", overlay ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5")}
          >
            {searchOpen ? <CloseIcon className="h-[18px] w-[18px]" /> : <SearchIcon className="h-[18px] w-[18px]" />}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {loggedIn ? (
              <Button variant="dark" href={appHref} onClick={(e) => handleNav(e, appHref)}>
                {t(appLabelKey)}
              </Button>
            ) : (
              <>
                <Button variant={overlay ? "ghostInverse" : "ghost"} onClick={onLogin}>
                  {t("header.account")}
                </Button>
                <Button onClick={onApply}>{t("header.apply")}</Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setMenuOpen((v) => !v);
            }}
            aria-label={menuOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={cx("flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 lg:hidden", overlay ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5")}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Pretraga */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-white shadow-lg">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
              className="flex items-center gap-3"
            >
              <SearchIcon className="h-5 w-5 shrink-0 text-ink-3" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("a11y.search")}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-lg text-ink placeholder:text-ink-3/70 focus:outline-hidden"
              />
              <Button type="submit" variant="dark" size="sm">
                {t("search.button")}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-ink-3">{t("search.popular")}</span>
              {SEARCH_SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => runSearch(t(key))}
                  className="rounded-full border border-line-strong px-3 py-1.5 text-sm text-ink transition-colors duration-150 hover:bg-surface"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobilni meni */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-t border-line bg-white lg:hidden"
        >
          <nav aria-label="American Adventure" className="flex-1 px-5 py-4 sm:px-8">
            <ul className="divide-y divide-line border-b border-line">
              {navItems.map((item) => {
                const active = isActive(item);
                const expanded = openSub === item.href;
                return (
                  <li key={item.href}>
                    <div className="flex items-center">
                      <a
                        href={item.href}
                        onClick={(e) => handleNav(e, item.href)}
                        aria-current={active ? "page" : undefined}
                        className={cx("font-display flex-1 py-4 text-[1.7rem] font-extrabold leading-none", active ? "text-ink underline decoration-brand decoration-4 underline-offset-[6px]" : "text-ink")}
                      >
                        {label(item)}
                      </a>
                      {item.children && (
                        <button
                          type="button"
                          onClick={() => setOpenSub(expanded ? null : item.href)}
                          aria-label={t("a11y.toggleSubmenu")}
                          aria-expanded={expanded}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                        >
                          <ChevronDownIcon className={cx("h-4 w-4 transition-transform duration-150", expanded && "rotate-180")} />
                        </button>
                      )}
                    </div>
                    {item.children && expanded && (
                      <ul className="pb-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <a
                              href={child.href}
                              onClick={(e) => handleNav(e, child.href)}
                              className="block rounded-lg py-2.5 pl-4 text-[15px] text-ink-2 hover:text-ink"
                            >
                              {label(child)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 border-t border-line px-5 py-5 sm:px-8">
            {loggedIn ? (
              <Button variant="dark" size="lg" block href={appHref} onClick={(e) => handleNav(e, appHref)}>
                {t(appLabelKey)}
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  block
                  onClick={() => {
                    closeAll();
                    onApply?.();
                  }}
                >
                  {t("header.apply")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  block
                  onClick={() => {
                    closeAll();
                    onLogin?.();
                  }}
                >
                  {t("header.account")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
