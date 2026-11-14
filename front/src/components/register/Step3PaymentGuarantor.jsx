// front/src/components/register/Step3PaymentGuarantor.jsx
// Korak 3: Izbor modela plaćanja (odmah, na rate ili odloženo PKZ) i podaci o jemcu

import { labelCls, inputCls, BackIcon } from "./ui";

export default function Step3PaymentGuarantor({
  matchedInvitation,
  paymentMethod,
  setPaymentMethod,
  guarantorName,
  setGuarantorName,
  guarantorIdCard,
  setGuarantorIdCard,
  guarantorJmbg,
  setGuarantorJmbg,
  promissoryNotesCount,
  setPromissoryNotesCount,
  onBack,
  onSubmit,
  t,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink"
      >
        <BackIcon /> {t("reg.back")}
      </button>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {t("reg.paymentTitle")}
      </h1>
      <p className="mt-2 text-sm text-ink-2">
        {t("reg.paymentSubtitle")}
      </p>

      {/* Sažetak paketa */}
      <div className="rounded-2xl border border-line bg-white p-5 text-sm sm:p-6">
        <div className="flex items-center justify-between font-semibold text-ink">
          <span>{matchedInvitation?.packageName || "Work & Travel USA — Full Placement"}</span>
          <span className="text-base">{matchedInvitation?.finalPrice || 1750} €</span>
        </div>
        {matchedInvitation?.discount > 0 && (
          <p className="mt-1 text-xs text-emerald-700">
            Uračunat popust: -{matchedInvitation.discount} € ({matchedInvitation.discountNote || "Odobren popust"})
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Opcija 1: Odmah */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
            paymentMethod === "now"
              ? "border-ink bg-brand/10"
              : "border-line-strong hover:bg-surface"
          }`}
        >
          <input
            type="radio"
            name="pm"
            value="now"
            checked={paymentMethod === "now"}
            onChange={() => setPaymentMethod("now")}
            className="mt-1 accent-ink"
          />
          <div>
            <p className="text-sm font-semibold text-ink">{t("reg.payNow")}</p>
            <p className="text-xs text-ink-3">{t("reg.payNowDesc")}</p>
          </div>
        </label>

        {/* Opcija 2: Na rate */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
            paymentMethod === "installments"
              ? "border-ink bg-brand/10"
              : "border-line-strong hover:bg-surface"
          }`}
        >
          <input
            type="radio"
            name="pm"
            value="installments"
            checked={paymentMethod === "installments"}
            onChange={() => setPaymentMethod("installments")}
            className="mt-1 accent-ink"
          />
          <div>
            <p className="text-sm font-semibold text-ink">{t("reg.payInstallments")}</p>
            <p className="text-xs text-ink-3">{t("reg.payInstallmentsDesc")}</p>
          </div>
        </label>

        {/* Opcija 3: Kad se vrati sa programa (Jemac) */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
            paymentMethod === "later"
              ? "border-ink bg-brand/10"
              : "border-line-strong hover:bg-surface"
          }`}
        >
          <input
            type="radio"
            name="pm"
            value="later"
            checked={paymentMethod === "later"}
            onChange={() => setPaymentMethod("later")}
            className="mt-1 accent-ink"
          />
          <div>
            <p className="text-sm font-semibold text-ink">{t("reg.payLaterGuarantor")}</p>
            <p className="text-xs text-ink-3">{t("reg.payLaterDesc")}</p>
          </div>
        </label>

        {/* Forma za jemca (prikazuje se samo ako je izabrano 'later') */}
        {paymentMethod === "later" && (
          <div className="mt-5 space-y-4 rounded-2xl border border-line-strong bg-amber-50/40 p-5">
            <p className="text-sm font-semibold text-ink">
              {t("reg.guarantorHeading")}
            </p>
            <div>
              <label htmlFor="g-name" className={labelCls}>
                {t("reg.guarantorName")}
              </label>
              <input
                id="g-name"
                type="text"
                required
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                placeholder="Ime i prezime jemca"
                className={inputCls}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="g-idcard" className={labelCls}>
                  {t("reg.guarantorIdCard")}
                </label>
                <input
                  id="g-idcard"
                  type="text"
                  required
                  value={guarantorIdCard}
                  onChange={(e) => setGuarantorIdCard(e.target.value)}
                  placeholder="Broj lične karte jemca"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="g-jmbg" className={labelCls}>
                  {t("reg.guarantorJmbg")}
                </label>
                <input
                  id="g-jmbg"
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  required
                  value={guarantorJmbg}
                  onChange={(e) => setGuarantorJmbg(e.target.value.replace(/\D/g, ""))}
                  placeholder="JMBG jemca (13 cifara)"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="g-notes" className={labelCls}>
                {t("reg.promissoryNotes")}
              </label>
              <input
                id="g-notes"
                type="text"
                required
                value={promissoryNotesCount}
                onChange={(e) => setPromissoryNotesCount(e.target.value)}
                placeholder="npr. 2 menice (serijski brojevi ili komada)"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-ink-3">
                {t("reg.promissoryNotesHint")}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="bg-brand text-ink mt-6 w-full rounded-full px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-brand-strong"
        >
          {t("reg.continue")}
        </button>
      </form>
    </div>
  );
}
