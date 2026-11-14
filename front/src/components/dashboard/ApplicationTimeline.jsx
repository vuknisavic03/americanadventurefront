// front/src/components/dashboard/ApplicationTimeline.jsx
// "Moja aplikacija" — ceo put kandidata kao timeline u bočnom panelu.
// Klik na korak ga otvara na stranici.
import { useEffect } from "react";
import { cx, CheckIcon } from "../ui";
import { CloseIcon } from "./icons";

const TASK_TONE = {
  done: "text-emerald-700",
  wait: "text-amber-700",
  danger: "text-red-700",
};

function StageMarker({ state, isCurrent }) {
  const base = "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
  if (state === "done")
    return (
      <span className={cx(base, "bg-ink text-white")}>
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  if (state === "danger") return <span className={cx(base, "bg-red-600 text-xs font-bold text-white")}>!</span>;
  if (state === "wait") return <span className={cx(base, "border-2 border-amber-400 bg-white")}><span className="h-2 w-2 rounded-full bg-amber-400" /></span>;
  if (isCurrent) return <span className={cx(base, "bg-brand")}><span className="h-2 w-2 rounded-full bg-ink" /></span>;
  return <span className={cx(base, "border border-line-strong bg-white")} />;
}

function TaskDot({ state }) {
  if (state === "done") return <CheckIcon className="h-3.5 w-3.5 shrink-0 text-ink" strokeWidth={3} />;
  return (
    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          state === "wait" ? "bg-amber-400" : state === "danger" ? "bg-red-500" : state === "current" ? "bg-ink" : "bg-neutral-300"
        )}
      />
    </span>
  );
}

export default function ApplicationTimeline({ open, onClose, stages, currentId, onOpenStage }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Zatvori" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Moja aplikacija"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Moja aplikacija</h2>
          <button type="button" onClick={onClose} aria-label="Zatvori" className="rounded-full p-2 text-ink-3 hover:bg-surface hover:text-ink">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <ol className="flex-1 overflow-y-auto px-6 py-6">
          {stages.map((s, i) => {
            const isCurrent = s.id === currentId;
            const last = i === stages.length - 1;
            return (
              <li key={s.id} className="relative flex gap-4 pb-8 last:pb-0">
                {!last && <span aria-hidden="true" className="absolute left-[13px] top-7 bottom-0 w-px bg-line-strong" />}
                <StageMarker state={s.state} isCurrent={isCurrent} />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onOpenStage(s.id)} className="group block w-full text-left">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium text-ink-3">{s.label}</span>
                      {isCurrent && <span className="text-xs font-medium text-ink">Trenutno</span>}
                    </span>
                    <span
                      className={cx(
                        "mt-0.5 block text-[15px] font-semibold underline-offset-4 group-hover:underline",
                        s.state === "locked" ? "text-ink-3" : "text-ink"
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                  <ul className="mt-3 space-y-2">
                    {s.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5 text-sm">
                        <TaskDot state={t.state} />
                        <span className={cx("min-w-0 flex-1 truncate", t.state === "locked" ? "text-ink-3" : "text-ink-2")}>{t.title}</span>
                        {t.state !== "locked" && t.state !== "current" && t.state !== "info" && t.status && (
                          <span className={cx("shrink-0 text-xs", TASK_TONE[t.state] || "text-ink-3")}>{t.status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
