// front/src/components/dashboard/modals/ChangeDiscountModal.jsx
import { useState } from "react";
import { getPromotions } from "../../../data/candidateStore";
import { BRAND_YELLOW } from "../constants";

export default function ChangeDiscountModal({ candidate, onClose, onSave }) {
  const promotions = getPromotions();
  const [selectedId, setSelectedId] = useState(candidate?.discountId || "none");
  const [groupCode, setGroupCode] = useState(candidate?.groupCode || candidate?.discountDetails?.groupCode || "");
  const [familyMember, setFamilyMember] = useState(candidate?.discountDetails?.familyMember || "");
  const [clubCardNumber, setClubCardNumber] = useState(candidate?.discountDetails?.clubCardNumber || "");
  const [error, setError] = useState("");

  const selectedPromo = promotions.find((p) => p.id === selectedId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (selectedPromo?.conditionType === "group" && !groupCode.trim()) {
      setError("Molimo unesite šifru grupe (npr. 'BG-SUMMER-2026') kako bismo evidentirali vašu grupu.");
      return;
    }
    if (selectedPromo?.conditionType === "family" && !familyMember.trim()) {
      setError("Molimo unesite ime i prezime brata ili sestre.");
      return;
    }
    if (selectedPromo?.conditionType === "club_card" && !clubCardNumber.trim()) {
      setError("Molimo unesite broj Loyalty ili Alumni kartice.");
      return;
    }

    onSave(selectedId, {
      groupCode: groupCode.trim().toUpperCase(),
      familyMember: familyMember.trim(),
      clubCardNumber: clubCardNumber.trim(),
    });
  };

  const inputCls =
    "mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs text-[var(--brand-ink)] placeholder:text-black/30 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--brand-ink)]/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-xl font-bold text-black/40 hover:text-black"
          aria-label="Zatvori"
        >
          ✕
        </button>

        <div className="border-b border-black/[0.08] pb-4">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900">
            Pravilnik o popustima
          </span>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-2xl">
            Promena ugovorenog popusta / promocije
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-black/65">
            <strong>Pravilo agencije:</strong> Može se koristiti <strong>samo jedan popust</strong>. Ako ste izabrali popust na početku, a kasnije želite da ga zamenite za popust na kraju programa (ili obrnuto), ovde možete slobodno napraviti promenu pre konačnog obračuna.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2.5">
            {/* Opcija: Bez popusta */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                selectedId === "none"
                  ? "border-[var(--brand-ink)] bg-black/[0.03] shadow-xs"
                  : "border-black/10 hover:border-black/20"
              }`}
            >
              <input
                type="radio"
                name="chosenPromo"
                value="none"
                checked={selectedId === "none"}
                onChange={() => setSelectedId("none")}
                className="mt-1 accent-[var(--brand-ink)]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--brand-ink)]">Standardna cena programa (Bez popusta)</p>
                  <span className="text-xs font-semibold text-black/50">$0</span>
                </div>
                <p className="mt-0.5 text-xs text-black/55">Puna ugovorena cena programa bez specijalnih olakšica.</p>
              </div>
            </label>

            {/* Sve dostupne promocije */}
            {promotions.map((promo) => {
              const isSelected = selectedId === promo.id;
              const isImmediate = promo.timing === "immediate";

              return (
                <label
                  key={promo.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-[var(--brand-ink)] bg-amber-500/[0.04] shadow-xs"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="chosenPromo"
                    value={promo.id}
                    checked={isSelected}
                    onChange={() => setSelectedId(promo.id)}
                    className="mt-1 accent-[var(--brand-ink)]"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--brand-ink)]">{promo.name}</p>
                        <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-black tracking-wider text-black/70">
                          {promo.code}
                        </span>
                      </div>
                      <span className="text-sm font-black text-emerald-700">
                        -{promo.amountFormatted || `$${promo.amount}`}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          isImmediate
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-900"
                        }`}
                      >
                        {isImmediate ? "Obračun: Odmah" : "Obračun: Na kraju (poslednja rata)"}
                      </span>
                      {promo.conditionType === "group" && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                          Uslov: 5+ viza & posao
                        </span>
                      )}
                      {promo.conditionType === "affiliate" && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                          Uslov: Prijatelj prolazi vizu & posao
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-black/70 leading-relaxed">
                      {promo.description}
                    </p>

                    {promo.conditionText && (
                      <p className="mt-1 text-[11px] font-semibold text-black/50">
                        Uslov: {promo.conditionText}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Dinamička polja za uslove izabrane promocije */}
          {selectedPromo?.conditionType === "group" && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
              <label className="block text-xs font-bold text-purple-950">
                Šifra vaše grupe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="npr. BG-SUMMER-2026"
                className={inputCls}
                required
              />
              <p className="mt-1.5 text-[11px] text-purple-900/80 leading-relaxed">
                <strong>Važno:</strong> Popust za grupu od $150 se obračunava na kraju programa i dobija se samo ako preko 5+ članova vaše grupe dobije posao i prođe viziranje u ambasadi.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "affiliate" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950">
              <p className="font-bold">Afilijate program — Dovedi prijatelja</p>
              <p className="mt-1 text-blue-900/80 leading-relaxed">
                Popust od $100 po svakom dovedenom prijatelju obračunava se na poslednjoj rati. Priznaje se isključivo za prijatelje koji prođu viziranje i dobiju posao. Detaljan uvid u status prijavljenih prijatelja imate na svom kandidatskom nalogu.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "family" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <label className="block text-xs font-bold text-amber-950">
                Ime i prezime brata / sestre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                placeholder="npr. Ana Jovanović"
                className={inputCls}
                required
              />
              <p className="mt-1.5 text-[11px] text-amber-900/80">
                Popust od $100 se primenjuje kada se brat i sestra zajedno prijave za istu sezonu.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "club_card" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <label className="block text-xs font-bold text-emerald-950">
                Broj Loyalty / Alumni kartice <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clubCardNumber}
                onChange={(e) => setClubCardNumber(e.target.value)}
                placeholder="npr. CC-88492"
                className={inputCls}
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-black/[0.08] pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-xs font-bold text-black/70 hover:bg-black/5"
            >
              Odustani
            </button>
            <button
              type="submit"
              className="rounded-full px-7 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] shadow-md hover:brightness-105"
              style={{ backgroundColor: BRAND_YELLOW }}
            >
              Potvrdi promenu popusta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
