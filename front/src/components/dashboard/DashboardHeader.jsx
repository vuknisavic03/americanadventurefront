// front/src/components/dashboard/DashboardHeader.jsx
// Vrh portala: traka naloga, pozdrav, jedan "sledeći korak" i sekcije portala.
// Pregled svih koraka je iza dugmeta "Moja aplikacija" (ApplicationTimeline).
import Logo from "../Logo";
import { LogoutIcon } from "./icons";
import { Button, cx } from "../ui";

/** Jedna stvar koju student sada treba da uradi (ili poruka da je red na nama). */
function NextCard({ next }) {
  if (!next) return null;
  const waiting = next.kind === "wait";
  const finished = next.kind === "done";
  return (
    <div
      className={cx(
        "mt-8 flex flex-col gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        waiting || finished ? "border border-line bg-white" : "bg-ink text-white"
      )}
    >
      <div className="min-w-0">
        <p className={cx("text-[13px] font-medium", waiting || finished ? "text-ink-3" : "text-white/60")}>
          {finished ? "Sve je spremno" : waiting ? "Sada je red na nama" : `Sledeće · ${next.stageLabel}`}
        </p>
        <p className={cx("mt-1 text-xl font-semibold leading-snug", waiting || finished ? "text-ink" : "text-white")}>{next.title}</p>
        {next.desc && (
          <p className={cx("mt-1 max-w-2xl text-sm leading-relaxed", waiting || finished ? "text-ink-2" : "text-white/75")}>
            {next.desc}
          </p>
        )}
      </div>
      {next.onGo && (
        <Button variant={waiting || finished ? "outline" : "primary"} onClick={next.onGo} className="w-full sm:w-auto">
          {next.cta}
        </Button>
      )}
    </div>
  );
}

const SECTIONS = [
  { id: "put", label: "Moj put" },
  { id: "dokumenta", label: "Dokumenta" },
  { id: "uplate", label: "Uplate" },
  { id: "podaci", label: "Moji podaci", short: "Podaci" },
];

export default function DashboardHeader({ candidate, logoHref, goHome, onLogout, t, next, view, setView, onOpenTimeline, badges = {} }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href={logoHref} onClick={goHome} className="flex items-center" aria-label="American Adventure — početna">
            <Logo className="h-9 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-xs text-ink-3">{candidate.email}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="px-3">
              <LogoutIcon />
              <span className="hidden sm:inline">{t("dash.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-9 sm:px-8 sm:pt-12">
        <h1 className="font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl">Zdravo, {candidate.firstName}</h1>

        <NextCard next={next} />

        <div className="mt-10 flex items-center gap-4 border-b border-line">
        <div role="tablist" aria-label="Sekcije portala" className="no-scrollbar -ml-5 flex min-w-0 flex-1 gap-5 self-end sm:gap-7 overflow-x-auto pl-5 sm:ml-0 sm:pl-0">
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
                {s.short ? (
                  <>
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </>
                ) : (
                  s.label
                )}
                {badges[s.id] ? (
                  <span className="rounded-full bg-brand px-1.5 text-xs tabular-nums text-ink">{badges[s.id]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
          <Button variant="outline" size="sm" onClick={onOpenTimeline} aria-label="Moja aplikacija" className="mb-2.5 w-9 px-0! sm:w-auto sm:px-4!">
            <svg className="h-4 w-4 shrink-0 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="5" cy="6" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="5" cy="18" r="1.5" />
              <path d="M10 6h10M10 12h10M10 18h10" />
            </svg>
            <span className="hidden sm:inline">Moja aplikacija</span>
          </Button>
        </div>
      </div>
    </>
  );
}
