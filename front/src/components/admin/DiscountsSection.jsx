import { useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  getPromotions,
  getCandidates,
  updatePromotion,
  addPromotion,
  deletePromotion,
  linkAffiliateByEmail,
  updateCandidateStatusFlags,
  unlinkAffiliate,
  getCandidateAffiliateStats,
  getGroupDiscountStats,
} from "../../data/candidateStore";
import { PageHeader, PrimaryButton, Card, PlusIcon, SearchIcon } from "./ui";
import { PromotionModal, AddAffiliateModal } from "./modals/DiscountsModals";

export default function DiscountsSection() {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState(() => getPromotions());
  const [candidates, setCandidates] = useState(() => getCandidates());
  const [activeTab, setActiveTab] = useState("promotions"); // promotions | affiliates | groups
  const [filterTiming, setFilterTiming] = useState("all"); // all | immediate | end | active
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const refreshData = () => {
    setPromotions(getPromotions());
    setCandidates(getCandidates());
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPromo(p);
    setModalOpen(true);
  };

  const handleSavePromo = (promoData) => {
    if (editingPromo) {
      updatePromotion({ ...editingPromo, ...promoData });
      showToastMsg(`Uspešno ažurirana promocija: ${promoData.name}`);
    } else {
      addPromotion(promoData);
      showToastMsg(`Uspešno dodat novi popust: ${promoData.name}`);
    }
    setModalOpen(false);
    refreshData();
  };

  const handleToggleActive = (promo) => {
    updatePromotion({ ...promo, active: !promo.active });
    refreshData();
    showToastMsg(`Status promocije promenjen (${promo.active ? "deaktivirana" : "aktivirana"}).`);
  };

  const handleDeletePromo = (promoId, promoName) => {
    if (confirm(`Da li ste sigurni da želite da obrišete popust: "${promoName}"?`)) {
      deletePromotion(promoId);
      refreshData();
      showToastMsg(`Popust "${promoName}" je uklonjen.`);
    }
  };

  const handleSaveAffiliateLink = (data) => {
    const res = linkAffiliateByEmail(data.referrerEmail, data.referredEmail, {
      referredName: data.referredName,
      hasJob: data.hasJob,
      hasVisa: data.hasVisa,
    });
    if (res.success) {
      showToastMsg(res.message);
      setAffiliateModalOpen(false);
      refreshData();
    } else {
      alert(res.error || "Došlo je do greške prilikom povezivanja.");
    }
  };

  const handleToggleFriendFlag = (friendId, flagKey, currentVal) => {
    updateCandidateStatusFlags(friendId, { [flagKey]: !currentVal });
    refreshData();
    showToastMsg(`Ažuriran status ${flagKey === "hasJob" ? "posla" : "vize"} za kandidata.`);
  };

  const handleUnlinkFriend = (friendId, friendName) => {
    if (confirm(`Da li ste sigurni da želite da uklonite afilijate vezu za "${friendName}"?`)) {
      unlinkAffiliate(friendId);
      refreshData();
      showToastMsg(`Afilijate veza uklonjena za ${friendName}.`);
    }
  };

  // Filtrirane promocije
  const filteredPromos = promotions.filter((p) => {
    if (filterTiming === "immediate" && p.timing !== "immediate") return false;
    if (filterTiming === "end" && p.timing !== "end") return false;
    if (filterTiming === "active" && !p.active) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Afilijate agregacija
  const affiliateStatsList = candidates
    .map((c) => ({
      candidate: c,
      stats: getCandidateAffiliateStats(c.id || c.email),
    }))
    .filter((item) => item.stats.totalReferred > 0);

  const totalReferredCount = affiliateStatsList.reduce((sum, item) => sum + item.stats.totalReferred, 0);
  const totalQualifiedReferrals = affiliateStatsList.reduce((sum, item) => sum + item.stats.qualifiedCount, 0);
  const totalAffiliateDiscounts = totalQualifiedReferrals * 100;

  // Grupni popust agregacija
  const groupCodesSet = new Set(
    candidates.map((c) => c.groupCode?.trim().toUpperCase()).filter(Boolean)
  );
  const groupStatsList = Array.from(groupCodesSet).map((code) => getGroupDiscountStats(code));
  const totalQualifiedGroups = groupStatsList.filter((g) => g.isGroupQualified).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Popusti, Promocije i Afilijati"
        subtitle="Upravljajte popustima (obračun odmah ili na kraju), ručno dodajte nove, i pratite ispunjenost uslova za grupe (5+) i preporuke."
        action={
          activeTab === "affiliates" ? (
            <PrimaryButton onClick={() => setAffiliateModalOpen(true)}>
              <PlusIcon /> Dodaj afilijata preko emaila
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleOpenAdd}>
              <PlusIcon /> Dodaj novi popust
            </PrimaryButton>
          )
        }
      />

      {toast && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-xs font-bold text-green-900 shadow-xs animate-in fade-in">
          ✓ {toast}
        </div>
      )}

      {/* GLAVNI TABOVI SEKCIJE */}
      <div className="flex border-b border-black/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab("promotions")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 ${
            activeTab === "promotions"
              ? "border-[var(--brand-ink)] text-[var(--brand-ink)] font-bold"
              : "border-transparent text-[var(--brand-ink)]/55 hover:text-[var(--brand-ink)]"
          }`}
        >
          <span>Sve promocije i popusti ({promotions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("affiliates")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 ${
            activeTab === "affiliates"
              ? "border-[var(--brand-ink)] text-[var(--brand-ink)] font-bold"
              : "border-transparent text-[var(--brand-ink)]/55 hover:text-[var(--brand-ink)]"
          }`}
        >
          <span>Afilijate / Preporuke ({affiliateStatsList.length})</span>
          {totalQualifiedReferrals > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
              {totalQualifiedReferrals} kvalifikovano
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 ${
            activeTab === "groups"
              ? "border-[var(--brand-ink)] text-[var(--brand-ink)] font-bold"
              : "border-transparent text-[var(--brand-ink)]/55 hover:text-[var(--brand-ink)]"
          }`}
        >
          <span>Grupe (Uslov 5+) ({groupStatsList.length})</span>
          {totalQualifiedGroups > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
              {totalQualifiedGroups} odobreno
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: PROMOCIJE I POPUSTI
      ======================================================== */}
      {activeTab === "promotions" && (
        <div className="space-y-4">
          {/* Filteri i pretraga */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-black/10 bg-white p-1">
              {[
                ["all", `Svi (${promotions.length})`],
                ["immediate", `Obračun odmah (${promotions.filter((p) => p.timing === "immediate").length})`],
                ["end", `Na kraju / poslednja rata (${promotions.filter((p) => p.timing === "end").length})`],
                ["active", `Aktivni (${promotions.filter((p) => p.active).length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterTiming(key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filterTiming === key
                      ? "bg-[var(--brand-ink)] text-white shadow-xs"
                      : "text-[var(--brand-ink)]/60 hover:bg-black/[0.04]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-ink)]/40">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži popust..."
                className="w-full rounded-lg border border-black/15 bg-white py-2 pl-9 pr-3 text-xs placeholder:text-black/35 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/10"
              />
            </div>
          </div>

          {/* Grid kartica promocija */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPromos.map((promo) => {
              const usingCount = candidates.filter((c) => c.discountId === promo.id).length;
              return (
                <Card key={promo.id} className="flex flex-col justify-between p-5 hover:border-black/25 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold rounded-md bg-black/[0.06] px-2 py-0.5 text-[var(--brand-ink)]/70">
                          {promo.code || promo.id}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            promo.timing === "immediate"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {promo.timing === "immediate" ? "Obračun: Odmah" : "Obračun: Na kraju"}
                        </span>
                      </div>

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          promo.active ? "bg-emerald-500" : "bg-black/20"
                        }`}
                        title={promo.active ? "Aktivan" : "Neaktivan"}
                      />
                    </div>

                    <h3 className="mt-3 text-base font-extrabold text-[var(--brand-ink)] leading-snug">
                      {promo.name || promo.title}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-[var(--brand-ink)]">
                        {promo.amount > 0 ? `-${promo.amount} $` : "Pogodnost"}
                      </span>
                      {promo.timing === "end" && (
                        <span className="text-[11px] font-semibold text-[var(--brand-ink)]/50">
                          (poslednja rata)
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--brand-ink)]/70 line-clamp-3">
                      {promo.description}
                    </p>

                    {promo.conditionText && (
                      <div className="mt-3 rounded-md bg-black/[0.03] p-2 text-[11px] font-medium text-[var(--brand-ink)]/75">
                        <strong>Uslov:</strong> {promo.conditionText}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--brand-ink)]/60">
                      {usingCount} kandidat(a)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(promo)}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                          promo.active
                            ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        }`}
                      >
                        {promo.active ? "Pauziraj" : "Aktiviraj"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(promo)}
                        className="rounded-md border border-black/15 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-black/[0.03]"
                      >
                        Izmeni
                      </button>

                      {promo.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(promo.id, promo.name)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Obriši
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: AFILIJATE I PREPORUKE
      ======================================================== */}
      {activeTab === "affiliates" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[var(--brand-ink)]">Afilijate program i preporuke</h3>
              <p className="text-xs text-[var(--brand-ink)]/60">
                Povežite preporučioca i dovedenog kandidata preko emaila ili pratite automatske registracije.
              </p>
            </div>
            <PrimaryButton onClick={() => setAffiliateModalOpen(true)}>
              <PlusIcon /> Dodaj afilijata preko emaila
            </PrimaryButton>
          </div>

          <div className="rounded-xl border border-black/10 bg-sky-50/50 p-4 text-xs leading-relaxed text-sky-950">
            <strong>Pravilo Afilijate programa (Cashback):</strong> Kandidat ostvaruje popust od <strong>$100 po dovedenom prijatelju</strong> na poslednjoj rati. Popust se stiče <strong>ISKLJUČIVO ukoliko prijatelj uspešno prođe viziranje i obezbedi posao</strong>.
          </div>

          {/* KPI zbirni podaci */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50">Ukupno dovedenih</span>
              <p className="mt-1 text-2xl font-black text-[var(--brand-ink)]">{totalReferredCount}</p>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50">Dobili posao</span>
              <p className="mt-1 text-2xl font-black text-blue-700">
                {affiliateStatsList.reduce((sum, i) => sum + i.stats.withJobCount, 0)}
              </p>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-ink)]/50">Dobili vizu</span>
              <p className="mt-1 text-2xl font-black text-amber-700">
                {affiliateStatsList.reduce((sum, i) => sum + i.stats.withVisaCount, 0)}
              </p>
            </Card>
            <Card className="p-4 bg-emerald-50/60 border-emerald-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/60">Kvalifikovani popust</span>
              <p className="mt-1 text-2xl font-black text-emerald-900">
                ${totalAffiliateDiscounts} <span className="text-xs font-semibold">({totalQualifiedReferrals} prijatelja)</span>
              </p>
            </Card>
          </div>

          {/* Lista afilijata */}
          {affiliateStatsList.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[var(--brand-ink)]/50 space-y-3">
              <p>Trenutno nijedan kandidat nema evidentirane preporuke prijatelja sa afilijate kodom.</p>
              <div>
                <PrimaryButton onClick={() => setAffiliateModalOpen(true)}>
                  <PlusIcon /> Dodaj afilijata preko emaila
                </PrimaryButton>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {affiliateStatsList.map(({ candidate, stats }) => (
                <Card key={candidate.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--brand-ink)]">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <p className="text-xs text-[var(--brand-ink)]/60">{candidate.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold rounded-lg bg-black/[0.05] px-2.5 py-1">
                        Kod: {stats.referralCode}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">
                        Popust: ${stats.earnedDiscount} ({stats.qualifiedCount} kvalifikovanih)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/40 mb-2">
                      Dovedeni prijatelji ({stats.totalReferred}):
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.06] text-[var(--brand-ink)]/50">
                            <th className="py-2">Prijatelj</th>
                            <th className="py-2">Posao</th>
                            <th className="py-2">Viza</th>
                            <th className="py-2">Status kvalifikacije</th>
                            <th className="py-2 text-right">Akcije</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {stats.referrals.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 font-semibold text-[var(--brand-ink)]">
                                <div>{r.name}</div>
                                <div className="text-[10px] text-black/50 font-normal">{r.email}</div>
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFriendFlag(r.id, "hasJob", r.hasJob)}
                                  title="Kliknite za brzu promenu statusa posla"
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer hover:opacity-80 ${
                                    r.hasJob ? "bg-green-100 text-green-800 border border-green-300" : "bg-black/[0.05] text-black/60 hover:bg-black/10"
                                  }`}
                                >
                                  {r.hasJob ? "✓ Posao potvrđen" : "○ U proceduri (klikni)"}
                                </button>
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFriendFlag(r.id, "hasVisa", r.hasVisa)}
                                  title="Kliknite za brzu promenu statusa vize"
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer hover:opacity-80 ${
                                    r.hasVisa ? "bg-green-100 text-green-800 border border-green-300" : "bg-black/[0.05] text-black/60 hover:bg-black/10"
                                  }`}
                                >
                                  {r.hasVisa ? "✓ Viza odobrena" : "○ Čeka vizu (klikni)"}
                                </button>
                              </td>
                              <td className="py-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                  r.isQualified
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-amber-100 text-amber-900"
                                }`}>
                                  {r.isQualified ? "Kvalifikovan (-$100)" : "Čeka vizu & posao"}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkFriend(r.id, r.name)}
                                  className="rounded-md border border-red-200 bg-red-50/70 px-2 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-100 transition-colors"
                                  title="Ukloni afilijate vezu"
                                >
                                  Ukloni
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: GRUPE (USLOV 5+ POSAO I VIZA)
      ======================================================== */}
      {activeTab === "groups" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-amber-50/50 p-4 text-xs leading-relaxed text-amber-950">
            <strong>Pravilo za Grupni popust:</strong> Grupni popust od <strong>$100 po prijavljenom kandidatu</strong> ostvaruje se na poslednjoj rati <strong>SAMO AKO preko 5+ (najmanje 5) članova grupe uspešno obezbedi i vizu i posao</strong>.
          </div>

          {groupStatsList.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[var(--brand-ink)]/50">
              Trenutno nijedan kandidat nema dodeljenu šifru grupe. Šifru grupe možete uneti u profilu kandidata ili pri prijavi.
            </Card>
          ) : (
            <div className="space-y-4">
              {groupStatsList.map((g) => (
                <Card key={g.groupCode} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-[var(--brand-ink)]">
                          Šifra grupe: {g.groupCode}
                        </span>
                        <span className="text-xs font-semibold text-[var(--brand-ink)]/60">
                          ({g.totalMembers} prijavljenih članova)
                        </span>
                      </div>
                    </div>

                    <div>
                      {g.isGroupQualified ? (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-900">
                          ✓ USLOV ISPUNJEN (5+) — Popust $100 po članu ODOBREN!
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
                          ⚠ Na čekanju ({g.qualifiedCount}/5 sa vizom i poslom)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progres do 5 članova */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold text-[var(--brand-ink)]/70 mb-1">
                      <span>Kvalifikovani članovi sa vizom i poslom:</span>
                      <span>{g.qualifiedCount} od 5 (potrebno {Math.max(0, 5 - g.qualifiedCount)} još)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.08]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          g.isGroupQualified ? "bg-emerald-600" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, (g.qualifiedCount / 5) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Spisak članova grupe */}
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]/40 mb-2">
                      Članovi grupe:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.06] text-[var(--brand-ink)]/50">
                            <th className="py-2">Član grupe</th>
                            <th className="py-2">Posao</th>
                            <th className="py-2">Viza</th>
                            <th className="py-2">Ispunjen uslov</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {g.members.map((m) => (
                            <tr key={m.id}>
                              <td className="py-2 font-semibold text-[var(--brand-ink)]">{m.name}</td>
                              <td className="py-2">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  m.hasJob ? "bg-green-100 text-green-800" : "bg-black/[0.05] text-black/50"
                                }`}>
                                  {m.hasJob ? "✓ Posao potvrđen" : "U proceduri"}
                                </span>
                              </td>
                              <td className="py-2">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  m.hasVisa ? "bg-green-100 text-green-800" : "bg-black/[0.05] text-black/50"
                                }`}>
                                  {m.hasVisa ? "✓ Viza odobrena" : "Čeka viziranje"}
                                </span>
                              </td>
                              <td className="py-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  m.isQualified ? "bg-emerald-100 text-emerald-900" : "bg-black/[0.05] text-black/40"
                                }`}>
                                  {m.isQualified ? "✓ Viza & Posao OK" : "Čeka uslov"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL ZA KREIRANJE / IZMENU POPUSTA */}
      {modalOpen && (
        <PromotionModal
          promo={editingPromo}
          onSave={handleSavePromo}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* MODAL ZA POVEZIVANJE AFILIJATA PREKO EMAILA */}
      {affiliateModalOpen && (
        <AddAffiliateModal
          open={affiliateModalOpen}
          candidates={candidates}
          onClose={() => setAffiliateModalOpen(false)}
          onSave={handleSaveAffiliateLink}
        />
      )}
    </div>
  );
}
