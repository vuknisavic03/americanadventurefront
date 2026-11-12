// front/src/components/dashboard/modals/ScheduleInterviewPrepModal.jsx
import React, { useState } from "react";
import { CloseIcon } from "../icons";
import { BRAND_YELLOW, INK } from "../constants";

export default function ScheduleInterviewPrepModal({
  isOpen,
  onClose,
  candidate,
  onSchedule = () => {},
}) {
  if (!isOpen) return null;

  const PRE_DEFINED_SLOTS = [
    { id: "slot-1", datetime: "2026-05-11T12:00", label: "Ponedeljak, 11. maj u 12:00 (Google Meet Online)", type: "ONLINE" },
    { id: "slot-2", datetime: "2026-05-11T16:30", label: "Ponedeljak, 11. maj u 16:30 (Google Meet Online)", type: "ONLINE" },
    { id: "slot-3", datetime: "2026-05-12T14:00", label: "Utorak, 12. maj u 14:00 (Uživo — Beograd, Jevremova 59/4)", type: "IN_PERSON" },
    { id: "slot-4", datetime: "2026-05-13T17:30", label: "Sreda, 13. maj u 17:30 (Google Meet Online)", type: "ONLINE" },
    { id: "custom", datetime: "", label: "Izaberi drugi datum i vreme...", type: "ONLINE" },
  ];

  const [selectedSlotId, setSelectedSlotId] = useState(PRE_DEFINED_SLOTS[0].id);
  const [customDatetime, setCustomDatetime] = useState(
    candidate?.interviewPrepScheduledAt ? candidate.interviewPrepScheduledAt.slice(0, 16) : "2026-05-14T15:00"
  );
  const [format, setFormat] = useState(candidate?.interviewPrepType || "ONLINE");
  const [notes, setNotes] = useState(candidate?.interviewPrepNotes || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const isCustom = selectedSlotId === "custom";
    const slot = PRE_DEFINED_SLOTS.find((s) => s.id === selectedSlotId);

    const scheduledAt = isCustom
      ? customDatetime
      : slot?.datetime || "2026-05-11T12:00";

    const slotLabel = isCustom
      ? `${new Date(customDatetime).toLocaleString("sr-RS", { dateStyle: "full", timeStyle: "short" })} (${format === "IN_PERSON" ? "Uživo" : "Online"})`
      : slot?.label || scheduledAt;

    onSchedule({
      scheduledAt,
      format: isCustom ? format : slot?.type || format,
      slotLabel,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-black/10 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black text-sm">
              ️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Priprema za intervju sa poslodavcem (TERM)
                </h3>
                <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 text-[10px] font-bold">
                  SIMULACIJA 1-NA-1
                </span>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5">
                American Adventure — Simulacija intervjua na engleskom jeziku pre razgovora sa američkim poslodavcem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto p-6 space-y-4 text-xs">
          {/* Info kartica */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 space-y-1.5 text-blue-950">
            <p className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
              <span></span> Zašto je simulacija intervjua obavezna?
            </p>
            <p className="text-[11px] text-blue-900/80 leading-relaxed">
              Tokom 20-minutne simulacije sa koordinatorom agencije proverićete nivo engleskog jezika, proći kroz najčešća pitanja američkih menadžera i dobiti konkretne smernice kako da ostavite najbolji utisak i odmah dobijete Job Offer.
            </p>
          </div>

          {/* Izbor termina */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
              Izaberite termin za pripremu (TERM):
            </label>
            <div className="space-y-2">
              {PRE_DEFINED_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedSlotId === slot.id
                      ? "border-blue-500 bg-blue-50/70 shadow-2xs font-bold text-blue-950"
                      : "border-black/10 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="prepSlot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                      className="h-4 w-4 text-blue-600 border-black/20"
                    />
                    <span>{slot.label}</span>
                  </div>
                  {slot.type && (
                    <span className="rounded-md bg-white border border-black/10 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {slot.type === "IN_PERSON" ? " Uživo" : " Online"}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Ako je izabran prilagođeni datum */}
          {selectedSlotId === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-black/10 bg-slate-50 p-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tačan datum i vreme:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customDatetime}
                  onChange={(e) => setCustomDatetime(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Format sastanka:
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="ONLINE"> Online (Google Meet)</option>
                  <option value="IN_PERSON"> Uživo (Beograd, Jevremova 59/4)</option>
                </select>
              </div>
            </div>
          )}

          {/* Pitanja ili željene pozicije */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Pozicije za koje želite pripremu ili dodatna pitanja (opciono):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="npr. Prijavljujem se za Server i Lifeguard pozicije, želim da provežbam opis prethodnog radnog iskustva..."
              className="w-full rounded-xl border border-black/15 bg-white p-3 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden resize-y"
            />
          </div>

          {/* Smernice za pripremu */}
          <div className="rounded-xl border border-black/10 bg-slate-50 p-4 space-y-2 text-slate-700">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
              Top 4 pitanja koja ćemo proći na pripremi:
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-[11px]">
              <li><strong>"Tell me about yourself":</strong> kratko i tečno predstavljanje (studije, hobi, motivacija).</li>
              <li><strong>"Why do you want to work for our company?":</strong> poznavanje poslodavca i pozicije.</li>
              <li><strong>"What is your previous work experience?":</strong> konkretna zaduženja i timski rad.</li>
              <li><strong>"Questions for the employer":</strong> pitanja o rasporedu, uniformi, smeštaju i obuci.</li>
            </ol>
          </div>

          {/* Footer akcije */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-black/5 transition-colors"
            >
              Odustani
            </button>

            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ backgroundColor: BRAND_YELLOW, color: INK }}
            >
               Potvrdi termin pripreme (TERM)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
