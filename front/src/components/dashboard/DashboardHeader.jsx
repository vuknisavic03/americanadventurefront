// front/src/components/dashboard/DashboardHeader.jsx
// Vrh portala: traka naloga, pozdrav, jedan "sledeći korak" i sekcije portala.
// Navigacija kroz korake (StageNav) prikazuje se samo u sekciji "Moj put".
import Logo from "../Logo";
import { LogoutIcon } from "./icons";
import { Button, cx, CheckIcon } from "../ui";

const DOT = {
  wait: "bg-amber-400",
  danger: "bg-red-500",
  current: "bg-brand ring-4 ring-brand/25",
  locked: "bg-neutral-300",
};

function StepTab({ label, title, note, state, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "group flex min-w-44 flex-1 flex-col border-t-2 pt-3 text-left transition-colors sm:min-w-0",
        active ? "border-ink" : "border-line-strong hover:border-ink/50"
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-ink-3">
        {state === "done" ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
            <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
          </span>
        ) : (
          <span className="flex h-4 w-4 items-center justify-center">
            <span className={cx("h-2 w-2 rounded-full", DOT[state] || DOT.locked)} />
          </span>
        )}
        {label}
      </span>
      <span className={cx("mt-1.5 text-sm font-semibold", state === "locked" ? "text-ink-3" : "text-ink")}>{title}</span>
      <span className={cx("mt-0.5 text-[13px] leading-snug", state === "danger" ? "text-red-700" : "text-ink-3")}>{note}</span>
    </button>
  );
}

/** Četiri koraka procesa — ujedno i izbor prikaza u sekciji "Moj put". */
export function StageNav({ stages, activeStepTab, setActiveStepTab }) {
  return (
    <nav aria-label="Koraci prijave" className="mb-8">
      <div className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        {stages.map((s) => (
          <StepTab key={s.id} {...s} active={activeStepTab === s.id} onClick={() => setActiveStepTab(s.id)} />
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setActiveStepTab(activeStepTab === "all" ? stages.find((s) => s.state !== "done")?.id || "step3" : "all")}
          className="text-[13px] font-medium text-ink-3 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          {activeStepTab === "all" ? "Prikaži samo jedan korak" : "Prikaži sve korake"}
        </button>
      </div>
    </nav>
  );
}

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
  { id: "podaci", label: "Moji podaci" },
];

export default function DashboardHeader({ candidate, logoHref, goHome, onLogout, t, statusBadgeText, next, view, setView, badges = {} }) {
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
        <p className="text-sm text-ink-3">{candidate.packageName || "Work & Travel USA"}</p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl">Zdravo, {candidate.firstName}</h1>
        <p className="mt-2 text-base text-ink-2">{statusBadgeText}</p>

        <NextCard next={next} />

        <div role="tablist" aria-label="Sekcije portala" className="no-scrollbar -mx-5 mt-10 flex gap-7 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
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
                {badges[s.id] ? (
                  <span className="rounded-full bg-brand px-1.5 text-xs tabular-nums text-ink">{badges[s.id]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
