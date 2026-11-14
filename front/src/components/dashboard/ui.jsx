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
export function StepShell({ index, state = "current", kicker, title, description, status, compact = false, children }) {
  // Prikaz trenutnog koraka: samo naziv i status, bez opisa.
  if (compact)
    return (
      <section>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 className="text-lg font-semibold text-ink">
            {kicker && <span className="font-normal text-ink-3">{kicker} · </span>}
            {title}
          </h2>
          {status?.props?.tone !== "neutral" && status}
        </div>
        <div className="mt-4 space-y-4">{children}</div>
      </section>
    );
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

/* ---------- Zadaci ---------- */
// Jedan korak procesa = lista zadataka. Svaki zadatak ima jedno stanje i najviše jednu glavnu akciju.
//   state: done | current | wait | danger | locked | info
// Prvi zadatak koji traži akciju ("current" ili "danger") je "sledeći" — dobija žuti broj i žuto dugme.

const STATUS_TONE = {
  done: "text-emerald-700",
  wait: "text-amber-700",
  danger: "text-red-700",
  current: "text-ink-3",
  locked: "text-ink-3",
  info: "text-ink-3",
};

function TaskMarker({ n, state, isNext }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums";
  if (state === "done")
    return (
      <span className={cx(base, "bg-ink text-white")}>
        <CheckIcon className="h-4 w-4" strokeWidth={2.75} />
      </span>
    );
  if (state === "danger") return <span className={cx(base, "bg-red-600 text-white")}>!</span>;
  if (state === "wait")
    return (
      <span className={cx(base, "border-2 border-amber-400 bg-white text-amber-700")}>
        <span className="h-2 w-2 rounded-full bg-amber-400" />
      </span>
    );
  if (isNext) return <span className={cx(base, "bg-brand text-ink")}>{n}</span>;
  if (state === "locked") return <span className={cx(base, "bg-surface-2 text-ink-3")}>{n}</span>;
  return <span className={cx(base, "border border-line-strong bg-white text-ink")}>{n}</span>;
}

/** Vraća id sledećeg zadatka u listi (ili null). */
export function nextTaskId(tasks) {
  return tasks.find((t) => t.state === "current" || t.state === "danger")?.id || null;
}

/**
 * TaskList — tasks: [{ id, title, desc, state, status, render(isNext) }]
 *  quiet: korak još nije na redu — nijedan zadatak se ne ističe kao sledeći.
 */
export function TaskList({ tasks, quiet = false }) {
  const nextId = quiet ? null : nextTaskId(tasks);
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {tasks.map((t, i) => {
        const isNext = t.id === nextId;
        const muted = t.state === "locked";
        return (
          <li key={t.id} id={`task-${t.id}`} className="scroll-mt-28 flex gap-4 px-5 py-5 sm:gap-5 sm:px-6">
            <TaskMarker n={i + 1} state={t.state} isNext={isNext} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className={cx("text-[15px] font-semibold leading-snug", muted ? "text-ink-3" : "text-ink")}>
                  {t.title}
                </h3>
                {t.status && (
                  <span className={cx("text-[13px] font-medium", STATUS_TONE[t.state] || STATUS_TONE.current)}>
                    {t.status}
                  </span>
                )}
              </div>
              {t.desc && (
                <p className={cx("mt-1 max-w-2xl text-sm leading-relaxed", muted ? "text-ink-3" : "text-ink-2")}>
                  {t.desc}
                </p>
              )}
              {t.render && !muted && <div className="mt-4">{t.render(isNext)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Red akcija ispod zadatka. */
export function Actions({ className = "", children }) {
  return <div className={cx("flex flex-wrap items-center gap-2.5", className)}>{children}</div>;
}

/** Tekstualni link-dugme (sekundarna radnja: zameni, izmeni, demo…). */
export function LinkButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Ime okačenog fajla sa kvačicom. */
export function FileLine({ name, className = "", children }) {
  return (
    <span className={cx("flex min-w-0 items-center gap-2 text-sm text-ink-2", className)}>
      <CheckIcon className="h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.5} />
      <span className="truncate">{name}</span>
      {children}
    </span>
  );
}

/** Lista "oznaka — vrednost" bez kartica. */
export function DataList({ items, cols = 2, className = "" }) {
  return (
    <dl
      className={cx(
        "grid gap-x-8",
        cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "",
        className
      )}
    >
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
          <dt className="shrink-0 text-sm text-ink-3">{label}</dt>
          <dd className="min-w-0 truncate text-right text-sm font-medium text-ink" title={typeof value === "string" ? value : undefined}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
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
