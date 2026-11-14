// dashboard/ui.jsx
// Primitivi kandidatskog portala. Hijerarhija je uvek ista:
//   strana (bg-surface) → Panel (bela kartica, tanka linija) → Field (tonirana pločica)
// Status se uvek prikazuje istom značkom (StatusPill), a poruke istim blokom (Notice).

import { useEffect, useState } from "react";
import { cx, CheckIcon } from "../ui";

/* ---------- Status ---------- */
const PILL_DOT = {
  neutral: "bg-neutral-400",
  done: "bg-emerald-500",
  wait: "bg-amber-500",
  danger: "bg-red-500",
  dark: "bg-ink",
};

/** StatusPill — mala oznaka sa tačkom boje statusa. tone: neutral | done | wait | danger | dark */
export function StatusPill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-2",
        className
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", PILL_DOT[tone] || PILL_DOT.neutral)} />
      {children}
    </span>
  );
}

/* ---------- Korak ---------- */
/** Napredak koraka: "3 od 6" i tanka traka. */
export function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] tabular-nums text-ink-3">
        <span className="font-semibold text-ink">{done}</span> od {total}
      </span>
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
        <span className="block h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

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
export function StepShell({ index, state = "current", kicker, title, description, status, compact = false, progress, children }) {
  // Prikaz trenutnog koraka: samo naziv i status, bez opisa.
  if (compact)
    return (
      <section>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            {kicker && <p className="text-[13px] font-medium text-ink-3">{kicker}</p>}
            <h2 className="mt-0.5 text-xl font-semibold text-ink [font-stretch:100%] tracking-[-0.015em]">{title}</h2>
          </div>
          {progress ? <Progress {...progress} /> : status?.props?.tone !== "neutral" && status}
        </div>
        <div className="mt-5 space-y-4">{children}</div>
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
/** Panel — bela kartica; naslov i akcija u istom redu, opis ispod. */
export function Panel({ title, description, aside, className = "", children }) {
  return (
    <div className={cx(cardCls, "p-5 sm:p-6", className)}>
      {(title || aside) && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            {title && <h3 className="text-base font-semibold leading-snug text-ink">{title}</h3>}
            {aside}
          </div>
          {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-3">{description}</p>}
        </div>
      )}
      {children}
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
  done: "text-ink-3",
  wait: "text-amber-700",
  danger: "text-red-700",
  current: "text-ink-3",
  locked: "text-ink-3",
  info: "text-ink-3",
};

/** Ikonica stanja zadatka (20 px) — isti jezik kao u alatima za upravljanje zadacima. */
export function TaskIcon({ state, isNext, className = "" }) {
  const cls = cx("h-5 w-5 shrink-0", className);
  if (state === "done")
    return (
      <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
        <circle cx="10" cy="10" r="10" className="fill-ink" />
        <path d="M6 10.4l2.6 2.5L14 7.6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "danger")
    return (
      <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
        <circle cx="10" cy="10" r="10" className="fill-red-600" />
        <path d="M10 5.5v5.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="14.2" r="1.15" fill="white" />
      </svg>
    );
  if (state === "wait")
    return (
      <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
        <circle cx="10" cy="10" r="8.75" fill="none" className="stroke-amber-500" strokeWidth="1.5" />
        <path d="M10 4.5a5.5 5.5 0 0 1 0 11z" className="fill-amber-500" />
      </svg>
    );
  if (state === "locked")
    return (
      <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
        <circle cx="10" cy="10" r="8.75" fill="none" className="stroke-neutral-300" strokeWidth="1.5" strokeDasharray="2.6 2.4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" className={cls} aria-hidden="true">
      <circle cx="10" cy="10" r="8.75" fill="none" className={isNext ? "stroke-ink" : "stroke-neutral-400"} strokeWidth="1.5" />
      {isNext && <circle cx="10" cy="10" r="3.25" className="fill-ink" />}
    </svg>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cx("h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200", open && "rotate-180")}
      aria-hidden="true"
    >
      <path d="M5.5 8l4.5 4.5L14.5 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Vraća id sledećeg zadatka u listi (ili null). */
export function nextTaskId(tasks) {
  return tasks.find((t) => t.state === "current" || t.state === "danger")?.id || null;
}

/** Otvara zadatak sa datim id-jem (iz zaglavlja, "Dokumenata" itd.). */
export function openTask(id) {
  window.dispatchEvent(new CustomEvent("portal:open-task", { detail: id }));
}

export const cardCls =
  "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(35,31,32,0.04),0_10px_30px_-18px_rgba(35,31,32,0.18)]";

/**
 * TaskList — tasks: [{ id, title, desc, state, status, render(isNext) }]
 * Otvoren je samo sledeći zadatak; ostali se otvaraju klikom (harmonika).
 *  quiet: korak još nije na redu — nijedan zadatak se ne ističe kao sledeći.
 */
export function TaskList({ tasks, quiet = false }) {
  const nextId = quiet ? null : nextTaskId(tasks);
  const [openIds, setOpenIds] = useState(() => new Set(nextId ? [nextId] : []));

  // Kad se zadatak završi, sledeći se sam otvara.
  useEffect(() => {
    if (nextId) setOpenIds((prev) => (prev.has(nextId) ? prev : new Set(prev).add(nextId)));
  }, [nextId]);

  useEffect(() => {
    const onOpen = (e) => {
      if (tasks.some((t) => t.id === e.detail)) setOpenIds((prev) => new Set(prev).add(e.detail));
    };
    window.addEventListener("portal:open-task", onOpen);
    return () => window.removeEventListener("portal:open-task", onOpen);
  }, [tasks]);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <ol className={cx(cardCls, "divide-y divide-line overflow-hidden")}>
      {tasks.map((t) => {
        const isNext = t.id === nextId;
        const muted = t.state === "locked";
        const body = t.desc || (t.render && !muted);
        const hasBody = Boolean(body);
        const isOpen = hasBody && openIds.has(t.id);
        const content = t.render && !muted ? t.render(isNext) : null;
        const expandable = hasBody && (t.desc || content);
        return (
          <li key={t.id} id={`task-${t.id}`} className={cx("scroll-mt-28 transition-colors", isOpen && isNext && "bg-[#fffdf3]")}>
            <button
              type="button"
              onClick={() => expandable && toggle(t.id)}
              aria-expanded={expandable ? isOpen : undefined}
              disabled={!expandable}
              className={cx(
                "flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6",
                expandable ? "hover:bg-surface/60" : "cursor-default"
              )}
            >
              <TaskIcon state={t.state} isNext={isNext} />
              <span
                className={cx(
                  "min-w-0 flex-1 truncate text-[15px] font-medium",
                  muted ? "text-ink-3" : t.state === "done" ? "text-ink-2" : "text-ink"
                )}
              >
                {t.title}
              </span>
              {t.status && (
                <span className={cx("hidden shrink-0 text-[13px] sm:inline", STATUS_TONE[t.state] || STATUS_TONE.current)}>
                  {t.status}
                </span>
              )}
              {expandable ? <Chevron open={isOpen} /> : <span className="w-4 shrink-0" />}
            </button>
            {isOpen && (
              <div className="pb-5 pl-[3.375rem] pr-5 sm:pl-[3.625rem] sm:pr-6">
                {t.status && (
                  <p className={cx("mb-1 text-[13px] sm:hidden", STATUS_TONE[t.state] || STATUS_TONE.current)}>{t.status}</p>
                )}
                {t.desc && <p className="max-w-2xl text-sm leading-relaxed text-ink-2">{t.desc}</p>}
                {content && <div className={t.desc ? "mt-4" : ""}>{content}</div>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Red akcija ispod zadatka. */
export function Actions({ className = "", children }) {
  // Telefon: dugmad jedno ispod drugog, cele širine (lakše za palac). Desktop: u redu.
  return (
    <div className={cx("grid gap-2.5 sm:flex sm:flex-wrap sm:items-center [&>button]:w-full sm:[&>button]:w-auto", className)}>
      {children}
    </div>
  );
}

/** Tekstualni link-dugme (sekundarna radnja: zameni, izmeni, demo…). */
export function LinkButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "justify-self-start text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink disabled:opacity-50",
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

/** Lista "oznaka — vrednost". Na telefonu oznaka stoji iznad vrednosti, na desktopu u istom redu. */
export function DataList({ items, cols = 2, className = "" }) {
  return (
    <dl
      className={cx(
        "grid gap-x-8",
        cols === 3 ? "grid-cols-2 gap-x-4 sm:gap-x-8 lg:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "",
        className
      )}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
        >
          <dt className="shrink-0 text-[13px] text-ink-3 sm:text-sm">{label}</dt>
          <dd className="min-w-0 break-words text-[15px] font-medium text-ink sm:truncate sm:text-right sm:text-sm">{value}</dd>
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
