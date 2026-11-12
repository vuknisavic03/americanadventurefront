// dashboard/ui.jsx
// Primitivi kandidatskog portala. Hijerarhija je uvek ista:
//   strana (bg-surface) → Panel (bela kartica, tanka linija) → Field (tonirana pločica)
// Status se uvek prikazuje istom značkom (StatusPill), a poruke istim blokom (Notice).

import { cx, CheckIcon } from "../ui";

/* ---------- Status ---------- */
const PILL_TONE = {
  neutral: "bg-surface-2 text-ink-2",
  done: "bg-emerald-100 text-emerald-800",
  wait: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  dark: "bg-ink text-white",
};

/** StatusPill — tone: neutral | done | wait | danger | dark */
export function StatusPill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        PILL_TONE[tone] || PILL_TONE.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Korak ---------- */
const INDEX_STATE = {
  done: "bg-ink text-white",
  current: "bg-brand text-ink",
  locked: "bg-surface-2 text-ink-3",
};

/**
 * StepShell — okvir jednog koraka procesa (Registracija, Korak 1–3).
 *  index:  oznaka u krugu ("1", "2"…)
 *  state:  done | current | locked — boji krug
 *  status: gotov <StatusPill> (opciono)
 */
export function StepShell({ index, state = "current", kicker, title, description, status, children }) {
  return (
    <section className="mt-12 first:mt-0">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              INDEX_STATE[state] || INDEX_STATE.current
            )}
          >
            {state === "done" ? <CheckIcon className="h-4.5 w-4.5" strokeWidth={2.5} /> : index}
          </span>
          <div className="min-w-0">
            {kicker && <p className="text-xs font-medium text-ink-3">{kicker}</p>}
            <h2 className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl">{title}</h2>
            {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-2">{description}</p>}
          </div>
        </div>
        {status}
      </header>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/* ---------- Panel ---------- */
/** Panel — bela kartica sa naslovom; desno status ili akcija. */
export function Panel({ title, description, aside, className = "", children }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-white p-5 sm:p-6", className)}>
      {(title || aside) && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold leading-snug text-ink">{title}</h3>}
            {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-2">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children && <div className={title || aside ? "mt-4" : ""}>{children}</div>}
    </div>
  );
}

/** Field — par oznaka/vrednost na toniranoj pločici. */
export function Field({ label, hint, className = "", children }) {
  return (
    <div className={cx("rounded-xl bg-surface px-4 py-3", className)}>
      <p className="text-xs text-ink-3">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-ink">{children}</div>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

/* ---------- Poruka ---------- */
const NOTICE_TONE = {
  neutral: "bg-surface text-ink-2",
  done: "bg-emerald-50 text-emerald-900",
  wait: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-800",
};

/** Notice — poruka o stanju (bez okvira; ton nosi podloga). */
export function Notice({ tone = "neutral", title, aside, className = "", children }) {
  return (
    <div
      className={cx(
        "flex flex-col justify-between gap-3 rounded-xl px-4 py-3.5 text-sm sm:flex-row sm:items-center",
        NOTICE_TONE[tone] || NOTICE_TONE.neutral,
        className
      )}
    >
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx("leading-relaxed", title && "mt-0.5 opacity-85")}>{children}</div>}
      </div>
      {aside}
    </div>
  );
}
