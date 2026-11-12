// front/src/components/admin/modals/DiscountsModals.jsx
import { useState } from "react";
import {
  Modal,
  Field,
  FIELD_CLS,
  PrimaryButton,
  SecondaryButton,
} from "../ui";

export function PromotionModal({ promo, onSave, onClose }) {
  const [f, setF] = useState({
    id: promo?.id || "",
    code: promo?.code || "",
    name: promo?.name || promo?.title || "",
    title: promo?.title || promo?.name || "",
    description: promo?.description || "",
    amount: promo?.amount ?? 100,
    currency: promo?.currency || "USD",
    timing: promo?.timing || "end", // 'immediate' | 'end'
    conditionType: promo?.conditionType || "none", // 'none' | 'group' | 'affiliate' | 'family' | 'club_card' | 'custom'
    conditionText: promo?.conditionText || "",
    minMembers: promo?.minMembers || 5,
    active: promo?.active !== false,
  });

  const upd = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSave({
      ...f,
      name: f.name.trim(),
      title: f.title.trim() || f.name.trim(),
      code: (f.code || f.name.slice(0, 6).toUpperCase()).trim().toUpperCase(),
      amount: Math.max(0, Number(f.amount) || 0),
      timingLabel:
        f.timing === "immediate"
          ? "Obračunava se odmah"
          : "Obračunava se na kraju (poslednja rata)",
      minMembers: f.conditionType === "group" ? Number(f.minMembers) || 5 : undefined,
    });
  };

  return (
    <Modal
      title={promo ? "Izmena popusta / promocije" : "Dodaj novi popust u ponudu"}
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between w-full">
          <SecondaryButton onClick={onClose}>Odustani</SecondaryButton>
          <PrimaryButton type="submit" onClick={handleSubmit}>
            {promo ? "Sačuvaj izmene" : "Kreiraj popust"}
          </PrimaryButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naziv popusta / promocije">
            <input
              value={f.name}
              onChange={upd("name")}
              placeholder="npr. Sajamski rana prijava popust"
              className={FIELD_CLS}
              required
            />
          </Field>
          <Field label="Šifra / Promo kod">
            <input
              value={f.code}
              onChange={(e) => setF((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="npr. SAJAM-100"
              className={FIELD_CLS}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Iznos popusta ($ / €)">
            <input
              type="number"
              min="0"
              step="10"
              value={f.amount}
              onChange={upd("amount")}
              className={FIELD_CLS}
            />
          </Field>
          <Field label="Valuta">
            <select value={f.currency} onChange={upd("currency")} className={`${FIELD_CLS} appearance-none`}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </Field>
        </div>

        {/* VRSTA OBRAČUNA: ODMAH VS NA KRAJU */}
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70">
            Vrsta obračuna popusta:
          </label>
          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <label
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                f.timing === "immediate"
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-black/10 bg-white hover:bg-black/[0.02]"
              }`}
            >
              <input
                type="radio"
                name="promo_timing"
                value="immediate"
                checked={f.timing === "immediate"}
                onChange={() => setF((prev) => ({ ...prev, timing: "immediate" }))}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <span className="block text-xs font-bold text-emerald-950">
                  Obračunava se odmah
                </span>
                <span className="block text-[11px] text-emerald-900/70">
                  Popust se odmah odbija od osnovne cene programa pri potpisivanju / prvoj uplati.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                f.timing === "end"
                  ? "border-sky-500 bg-sky-50/50"
                  : "border-black/10 bg-white hover:bg-black/[0.02]"
              }`}
            >
              <input
                type="radio"
                name="promo_timing"
                value="end"
                checked={f.timing === "end"}
                onChange={() => setF((prev) => ({ ...prev, timing: "end" }))}
                className="mt-0.5 accent-sky-600"
              />
              <div>
                <span className="block text-xs font-bold text-sky-950">
                  Na kraju (poslednja rata)
                </span>
                <span className="block text-[11px] text-sky-900/70">
                  Popust se realizuje na poslednjoj rati (npr. grupni, afilijate, family, club card).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* POSEBAN USLOV */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Uslov za sticanje prava na popust">
            <select
              value={f.conditionType}
              onChange={upd("conditionType")}
              className={`${FIELD_CLS} appearance-none font-semibold`}
            >
              <option value="none">Bez posebnog uslova</option>
              <option value="group">Grupni popust (zahteva 5+ kandidata sa vizom i poslom)</option>
              <option value="affiliate">Afilijate / Dovedi prijatelja (zahteva vizu i posao za dovedenog)</option>
              <option value="family">Family Discount (krvni srodnici prvog kolena)</option>
              <option value="club_card">Adventure Club Card (raniji učesnik SWT)</option>
              <option value="custom">Prilagođeni uslov</option>
            </select>
          </Field>

          {f.conditionType === "group" ? (
            <Field label="Minimalan broj kandidata sa vizom i poslom">
              <input
                type="number"
                min="2"
                max="50"
                value={f.minMembers}
                onChange={upd("minMembers")}
                className={FIELD_CLS}
              />
            </Field>
          ) : (
            <Field label="Kratak opis uslova (prikazuje se na kartici)">
              <input
                value={f.conditionText}
                onChange={upd("conditionText")}
                placeholder="npr. Za studente istog fakulteta..."
                className={FIELD_CLS}
              />
            </Field>
          )}
        </div>

        <Field label="Detaljan opis i napomene o promociji">
          <textarea
            value={f.description}
            onChange={upd("description")}
            rows={3}
            placeholder="Unesite zvaničan tekst pravila promocije..."
            className={`${FIELD_CLS} resize-y`}
          />
        </Field>

        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={f.active}
            onChange={upd("active")}
            className="h-4 w-4 rounded accent-[var(--brand-ink)]"
          />
          <span>Promocija je trenutno aktivna i vidljiva kandidatima</span>
        </label>
      </form>
    </Modal>
  );
}

export function AddAffiliateModal({ open, onClose, onSave, candidates }) {
  const [referrerEmail, setReferrerEmail] = useState("");
  const [referredEmail, setReferredEmail] = useState("");
  const [referredName, setReferredName] = useState("");
  const [hasJob, setHasJob] = useState(false);
  const [hasVisa, setHasVisa] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const normReferrer = referrerEmail.trim().toLowerCase();
  const matchedReferrer = candidates.find((c) => c.email?.toLowerCase() === normReferrer);

  const normReferred = referredEmail.trim().toLowerCase();
  const matchedReferred = candidates.find((c) => c.email?.toLowerCase() === normReferred);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!referrerEmail.trim() || !referrerEmail.includes("@")) {
      setError("Unesite ispravnu email adresu preporučioca.");
      return;
    }
    if (!referredEmail.trim() || !referredEmail.includes("@")) {
      setError("Unesite ispravnu email adresu dovedenog kandidata.");
      return;
    }
    if (normReferrer === normReferred) {
      setError("Preporučilac i dovedeni kandidat ne mogu imati istu email adresu.");
      return;
    }

    onSave({
      referrerEmail: normReferrer,
      referredEmail: normReferred,
      referredName: referredName.trim(),
      hasJob,
      hasVisa,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Poveži afilijat preporuku preko emaila"
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-950 leading-relaxed">
          <strong>Afilijate pravilo ($100 popust na poslednjoj rati):</strong> Preporučilac ostvaruje popust od $100 po dovedenom studentu <strong>samo ako taj student obezbedi posao i prođe viziranje u ambasadi</strong>.
        </div>

        {/* 1. Preporučilac */}
        <div>
          <label className="block text-xs font-bold text-[var(--brand-ink)]">
            Email preporučioca (Kome se pripisuje popust) <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            list="referrer-candidates-datalist"
            value={referrerEmail}
            onChange={(e) => setReferrerEmail(e.target.value)}
            placeholder="npr. petar@example.com"
            className={FIELD_CLS}
          />
          <datalist id="referrer-candidates-datalist">
            {candidates.map((c) => (
              <option key={c.id} value={c.email}>
                {c.firstName} {c.lastName} ({c.referralCode || "Nema kod"})
              </option>
            ))}
          </datalist>

          {matchedReferrer ? (
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-800">
              ✓ Preporučilac pronađen: <strong>{matchedReferrer.firstName} {matchedReferrer.lastName}</strong> (Kod: <span className="font-mono">{matchedReferrer.referralCode}</span>)
            </p>
          ) : referrerEmail.includes("@") ? (
            <p className="mt-1.5 text-[11px] text-amber-800">
              ℹ Kandidat sa ovim emailom još nije u bazi — sistem će mu automatski kreirati profil i referral kod.
            </p>
          ) : null}
        </div>

        {/* 2. Dovedeni student */}
        <div>
          <label className="block text-xs font-bold text-[var(--brand-ink)]">
            Email dovedenog kandidata (Prijatelj koji se vezuje) <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            list="referred-candidates-datalist"
            value={referredEmail}
            onChange={(e) => setReferredEmail(e.target.value)}
            placeholder="npr. marko@example.com"
            className={FIELD_CLS}
          />
          <datalist id="referred-candidates-datalist">
            {candidates
              .filter((c) => c.email?.toLowerCase() !== normReferrer)
              .map((c) => (
                <option key={c.id} value={c.email}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
          </datalist>

          {matchedReferred ? (
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-800">
              ✓ Dovedeni kandidat postoji u bazi: <strong>{matchedReferred.firstName} {matchedReferred.lastName}</strong> (Status: {matchedReferred.status})
            </p>
          ) : (
            <div className="mt-2 space-y-1">
              <span className="block text-[11px] text-black/55">
                Kandidat još nije u sistemu. Unesite ime i prezime za evidenciju:
              </span>
              <input
                type="text"
                value={referredName}
                onChange={(e) => setReferredName(e.target.value)}
                placeholder="Ime i prezime dovedenog prijatelja"
                className={FIELD_CLS}
              />
            </div>
          )}
        </div>

        {/* Uslovi: Posao i Viza */}
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-2.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/70">
            Status dovedenog kandidata (Posao & Viza)
          </span>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-[var(--brand-ink)] cursor-pointer">
            <input
              type="checkbox"
              checked={hasJob}
              onChange={(e) => setHasJob(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--brand-ink)]"
            />
            <span>Dovedeni kandidat ima obezbeđen posao (Job Offer)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-[var(--brand-ink)] cursor-pointer">
            <input
              type="checkbox"
              checked={hasVisa}
              onChange={(e) => setHasVisa(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--brand-ink)]"
            />
            <span>Dovedeni kandidat je prošao viziranje (Visa Approved)</span>
          </label>

          <div className="pt-1.5">
            <span
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                hasJob && hasVisa
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {hasJob && hasVisa
                ? "✓ Ispunjena oba uslova — popust $100 se odmah odobrava"
                : "Čeka uslove — popust se odobrava čim kandidat dobije posao i vizu"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.08] pt-4 mt-6">
          <SecondaryButton type="button" onClick={onClose}>
            Odustani
          </SecondaryButton>
          <PrimaryButton type="submit">
            Poveži afilijata
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
