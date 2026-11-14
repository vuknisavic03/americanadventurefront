// front/src/components/dashboard/modals/ChangeDiscountModal.jsx
import { useState } from "react";
import { getPromotions } from "../../../data/candidateStore";

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
    "mt-1 w-full rounded-xl border border-line-strong bg-white px-3.5 py-2 text-xs text-ink placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden focus:ring-1 focus:ring-ink/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-xl font-semibold text-ink-3 hover:text-ink"
          aria-label="Zatvori"
        >
          ✕
        </button>

        <div className="border-b border-line pb-4">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Pravilnik o popustima
          </span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Promena ugovorenog popusta / promocije
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            <strong>Pravilo agencije:</strong> Može se koristiti <strong>samo jedan popust</strong>. Ako ste izabrali popust na početku, a kasnije želite da ga zamenite za popust na kraju programa (ili obrnuto), ovde možete slobodno napraviti promenu pre konačnog obračuna.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2.5">
            {/* Opcija: Bez popusta */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                selectedId === "none"
                  ? "border-ink bg-surface"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="chosenPromo"
                value="none"
                checked={selectedId === "none"}
                onChange={() => setSelectedId("none")}
                className="mt-1 accent-ink"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Standardna cena programa (Bez popusta)</p>
                  <span className="text-xs font-semibold text-ink-3">$0</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-3">Puna ugovorena cena programa bez specijalnih olakšica.</p>
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
                      ? "border-ink bg-amber-500/[0.04]"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="chosenPromo"
                    value={promo.id}
                    checked={isSelected}
                    onChange={() => setSelectedId(promo.id)}
                    className="mt-1 accent-ink"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{promo.name}</p>
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-2xs font-bold tracking-wider text-ink-2">
                          {promo.code}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">
                        -{promo.amountFormatted || `$${promo.amount}`}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          isImmediate
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-surface-2 text-ink"
                        }`}
                      >
                        {isImmediate ? "Obračun: Odmah" : "Obračun: Na kraju (poslednja rata)"}
                      </span>
                      {promo.conditionType === "group" && (
                        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink">
                          Uslov: 5+ viza & posao
                        </span>
                      )}
                      {promo.conditionType === "affiliate" && (
                        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink">
                          Uslov: Prijatelj prolazi vizu & posao
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-ink-2 leading-relaxed">
                      {promo.description}
                    </p>

                    {promo.conditionText && (
                      <p className="mt-1 text-xs font-semibold text-ink-3">
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
            <div className="rounded-2xl border border-line bg-surface p-4">
              <label className="block text-xs font-semibold text-ink">
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
              <p className="mt-1.5 text-xs text-ink leading-relaxed">
                <strong>Važno:</strong> Popust za grupu od $150 se obračunava na kraju programa i dobija se samo ako preko 5+ članova vaše grupe dobije posao i prođe viziranje u ambasadi.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "affiliate" && (
            <div className="rounded-2xl border border-line bg-surface p-4 text-xs text-ink">
              <p className="font-semibold">Afilijate program — Dovedi prijatelja</p>
              <p className="mt-1 text-ink leading-relaxed">
                Popust od $100 po svakom dovedenom prijatelju obračunava se na poslednjoj rati. Priznaje se isključivo za prijatelje koji prođu viziranje i dobiju posao. Detaljan uvid u status prijavljenih prijatelja imate na svom kandidatskom nalogu.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "family" && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <label className="block text-xs font-semibold text-amber-950">
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
              <p className="mt-1.5 text-xs text-amber-900/80">
                Popust od $100 se primenjuje kada se brat i sestra zajedno prijave za istu sezonu.
              </p>
            </div>
          )}

          {selectedPromo?.conditionType === "club_card" && (
            <div className="rounded-2xl bg-emerald-50 p-4">
              <label className="block text-xs font-semibold text-emerald-950">
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

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line-strong bg-white px-5 py-2.5 text-xs font-semibold text-ink-2 hover:bg-surface-2"
            >
              Odustani
            </button>
            <button
              type="submit"
              className="bg-brand rounded-full px-7 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-strong"
            >
              Potvrdi promenu popusta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
