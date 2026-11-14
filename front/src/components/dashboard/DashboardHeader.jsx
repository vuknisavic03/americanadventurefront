// front/src/components/dashboard/DashboardHeader.jsx
// Vrh portala. Telefon i desktop su namerno različiti:
//  - telefon: kompaktna traka, kartica "sledeći korak" kao jedan dodir, sekcije u donjoj navigaciji (MobileNav)
//  - desktop: pozdrav, kartica sa dugmetom, sekcije kao kartice u redu sa dugmetom "Moja aplikacija"
import Logo from "../Logo";
import { LogoutIcon } from "./icons";
import { Button, cx } from "../ui";

/* ---------- Ikonice sekcija ---------- */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const SectionIcon = {
  put: (p) => (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="6" cy="18" r="2.2" {...ic} />
      <circle cx="18" cy="6" r="2.2" {...ic} />
      <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" {...ic} />
    </svg>
  ),
  dokumenta: (p) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...ic} />
      <path d="M14 3v5h5M9 13h6M9 17h4" {...ic} />
    </svg>
  ),
  uplate: (p) => (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" {...ic} />
      <path d="M3 10h18M7 15h3" {...ic} />
    </svg>
  ),
  podaci: (p) => (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="8.5" r="3.5" {...ic} />
      <path d="M5 20a7 7 0 0 1 14 0" {...ic} />
    </svg>
  ),
};

function TimelineIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="5" cy="6" r="1.6" fill="currentColor" />
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="5" cy="18" r="1.6" fill="currentColor" />
      <path d="M10 6h10M10 12h10M10 18h10" {...ic} strokeWidth={2} />
    </svg>
  );
}

const SECTIONS = [
  { id: "put", label: "Moj put" },
  { id: "dokumenta", label: "Dokumenta" },
  { id: "uplate", label: "Uplate" },
  { id: "podaci", label: "Moji podaci", short: "Podaci" },
];

/* ---------- Sledeći korak ---------- */
function NextCard({ next }) {
  if (!next) return null;
  const quiet = next.kind === "wait" || next.kind === "done";
  const eyebrow = next.kind === "done" ? "Sve je spremno" : next.kind === "wait" ? "Sada je red na nama" : `Sledeći korak · ${next.stageLabel}`;

  return (
    <div
      className={cx(
        "rounded-2xl",
        quiet
          ? "border border-line bg-white shadow-[0_1px_2px_rgba(35,31,32,0.04),0_10px_30px_-18px_rgba(35,31,32,0.18)]"
          : "bg-ink text-white shadow-[0_18px_40px_-22px_rgba(35,31,32,0.6)]"
      )}
    >
      {/* Telefon: cela kartica je jedno dugme */}
      <button type="button" onClick={next.onGo} className="flex w-full items-center gap-4 p-4 text-left sm:hidden">
        <span className="min-w-0 flex-1">
          <span className={cx("flex items-center gap-1.5 text-xs font-medium", quiet ? "text-ink-3" : "text-white/55")}>
            {!quiet && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            {eyebrow}
          </span>
          <span className={cx("mt-1 block text-[17px] font-semibold leading-snug", quiet ? "text-ink" : "text-white")}>
            {next.title}
          </span>
          {quiet && next.desc && <span className="mt-1 block text-[13px] leading-snug text-ink-3">{next.desc}</span>}
        </span>
        <span
          aria-hidden="true"
          className={cx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg",
            quiet ? "border border-line-strong text-ink" : "bg-brand text-ink"
          )}
        >
          →
        </span>
      </button>

      {/* Desktop */}
      <div className="hidden items-center justify-between gap-6 p-6 sm:flex">
        <div className="min-w-0">
          <p className={cx("flex items-center gap-2 text-[13px] font-medium", quiet ? "text-ink-3" : "text-white/55")}>
            {!quiet && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            {eyebrow}
          </p>
          <p className={cx("mt-1.5 text-xl font-semibold leading-snug tracking-[-0.01em]", quiet ? "text-ink" : "text-white")}>
            {next.title}
          </p>
          {next.desc && <p className={cx("mt-1 max-w-2xl text-sm", quiet ? "text-ink-2" : "text-white/70")}>{next.desc}</p>}
        </div>
        {next.onGo && (
          <Button variant={quiet ? "outline" : "primary"} onClick={next.onGo}>
            {next.cta}
            {!quiet && <span aria-hidden="true">→</span>}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- Donja navigacija (telefon) ---------- */
export function MobileNav({ view, setView, badges = {} }) {
  return (
    <nav
      aria-label="Sekcije portala"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-4">
        {SECTIONS.map((s) => {
          const active = view === s.id;
          const Icon = SectionIcon[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setView(s.id)}
              aria-current={active ? "page" : undefined}
              className={cx("relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium", active ? "text-ink" : "text-ink-3")}
            >
              <span className="relative">
                <Icon className="h-6 w-6" aria-hidden="true" />
                {badges[s.id] ? (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold tabular-nums text-ink">
                    {badges[s.id]}
                  </span>
                ) : null}
              </span>
              {s.short || s.label}
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Zaglavlje ---------- */
export default function DashboardHeader({ candidate, logoHref, goHome, onLogout, t, next, view, setView, onOpenTimeline, badges = {} }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-8">
          <a href={logoHref} onClick={goHome} className="flex items-center" aria-label="American Adventure — početna">
            <Logo className="h-8 w-auto sm:h-9" />
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-xs text-ink-3">{candidate.email}</p>
            </div>
            <button
              type="button"
              onClick={onOpenTimeline}
              aria-label="Moja aplikacija"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface sm:hidden"
            >
              <TimelineIcon className="h-5 w-5" />
            </button>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink sm:flex">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} aria-label={t("dash.logout")} className="h-10 w-10 px-0! sm:w-auto sm:px-3!">
              <LogoutIcon />
              <span className="hidden sm:inline">{t("dash.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-8 sm:pt-12">
        <h1 className="font-display text-2xl font-bold leading-[1.1] text-ink sm:text-4xl">Zdravo, {candidate.firstName}</h1>

        <div className="mt-4 sm:mt-8">
          <NextCard next={next} />
        </div>

        {/* Desktop: sekcije + Moja aplikacija */}
        <div className="mt-10 hidden items-center gap-4 border-b border-line sm:flex">
          <div role="tablist" aria-label="Sekcije portala" className="flex min-w-0 flex-1 gap-7 self-end">
            {SECTIONS.map((s) => {
              const active = view === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(s.id)}
                  className={cx(
                    "-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-[15px] font-semibold transition-colors",
                    active ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
                  )}
                >
                  {s.label}
                  {badges[s.id] ? <span className="rounded-full bg-brand px-1.5 text-xs tabular-nums text-ink">{badges[s.id]}</span> : null}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={onOpenTimeline} className="mb-2.5">
            <TimelineIcon />
            Moja aplikacija
          </Button>
        </div>
      </div>
    </>
  );
}
