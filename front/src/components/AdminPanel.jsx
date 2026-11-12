import { useState } from "react";
import Logo from "./Logo";
import { useTranslation } from "../i18n/LanguageContext";
import { NAV, LogoutIcon } from "./admin/ui";
import UsersSection from "./admin/UsersSection";
import JobsSection from "./admin/JobsSection";
import FinancesSection from "./FinancesSection";
import DiscountsSection from "./admin/DiscountsSection";
import SiteSection from "./admin/SiteSection";
import CommsSection from "./admin/CommsSection";
import ChatbotSection from "./admin/ChatbotSection";

/**
 * AdminPanel — admin panel za agenciju.
 * Sekcije: Korisnici i aplikacije, Finansije, Popusti i afilijati, Sajt (kontrola sadržaja), Komunikacija, Baza znanja.
 */
export default function AdminPanel({ onLogout = () => {}, onNavigate = () => {}, logoHref = "/" }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("users");

  const goHome = (e) => {
    e.preventDefault();
    onNavigate(e, logoHref);
  };

  const renderSection = () => {
    switch (section) {
      case "users":
        return <UsersSection />;
      case "jobs":
        return <JobsSection />;
      case "finances":
        return <FinancesSection />;
      case "discounts":
        return <DiscountsSection />;
      case "site":
        return <SiteSection />;
      case "comms":
        return <CommsSection />;
      case "chatbot":
        return <ChatbotSection />;
      default:
        return <UsersSection />;
    }
  };

  const NavButton = ({ item, className = "" }) => {
    const active = section === item.id;
    return (
      <button
        type="button"
        onClick={() => setSection(item.id)}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
          active
            ? "bg-black/[0.04] text-[var(--brand-ink)] font-bold"
            : "text-[var(--brand-ink)]/55 hover:bg-black/[0.03] hover:text-[var(--brand-ink)]"
        } ${className}`}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--brand-yellow)]"
            aria-hidden="true"
          />
        )}
        <item.Icon />
        <span>{t(item.labelKey) !== item.labelKey ? t(item.labelKey) : (item.defaultLabel || item.id)}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-[var(--brand-ink)]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/[0.06] bg-white md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <a
            href={logoHref}
            onClick={goHome}
            aria-label={t("a11y.home")}
            className="flex items-center text-[var(--brand-ink)] transition-opacity duration-200 hover:opacity-80"
          >
            <Logo className="h-7 w-auto" />
          </a>
          <span className="rounded-md bg-black/[0.05] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--brand-ink)]/60">
            {t("dash.adminBadge")}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavButton key={item.id} item={item} className="w-full" />
          ))}
        </nav>

        <div className="space-y-1 border-t border-black/[0.06] p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand-ink)]/60 transition-colors duration-150 hover:bg-black/[0.04] hover:text-[var(--brand-ink)]"
          >
            <LogoutIcon />
            <span>{t("dash.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Sadržaj */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobilni top bar */}
        <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-white/90 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <a href={logoHref} onClick={goHome} aria-label={t("a11y.home")} className="flex items-center">
              <Logo className="h-7 w-auto" />
            </a>
            <button
              type="button"
              onClick={onLogout}
              aria-label={t("dash.logout")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--brand-ink)]/60 hover:bg-black/[0.04]"
            >
              <LogoutIcon />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
            {NAV.map((item) => (
              <NavButton key={item.id} item={item} className="shrink-0" />
            ))}
          </nav>
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 xl:px-12 lg:py-10">
          <div className="mx-auto max-w-7xl 2xl:max-w-[1540px]">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
