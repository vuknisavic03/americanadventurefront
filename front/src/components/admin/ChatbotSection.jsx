import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { syncFromBackend, saveFaqWithBackend } from "../../data/candidateStore";
import {
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  GhostIconButton,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "./ui";

const KB_SEED = [
  { id: 101, q: "Koliko traje Work & Travel program?", a: "Program traje do 4 meseca rada uz dodatni period za putovanje po SAD." },
  { id: 102, q: "Koji su uslovi za prijavu?", a: "Status redovnog studenta, poznavanje engleskog i važeći pasoš." },
  { id: 103, q: "Da li agencija obezbeđuje posao?", a: "Da, predlažemo proverene poslodavce i pomažemo oko celokupne dokumentacije." },
];

export default function ChatbotSection() {
  const { t } = useTranslation();
  const [items, setItems] = useState(KB_SEED);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    syncFromBackend().then((data) => {
      if (data?.faqItems && Array.isArray(data.faqItems)) {
        setItems(data.faqItems);
      }
    });
  }, []);

  const inputCls =
    "w-full rounded-lg border border-black/[0.12] bg-white px-3.5 py-2.5 text-sm text-[var(--brand-ink)] transition-colors duration-150 placeholder:text-black/35 focus:border-[var(--brand-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-ink)]/10";

  const reset = () => {
    setQ("");
    setA("");
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!q.trim() || !a.trim()) return;
    let next;
    if (editingId) {
      next = items.map((i) => (i.id === editingId ? { ...i, q: q.trim(), a: a.trim() } : i));
    } else {
      next = [...items, { id: Date.now(), q: q.trim(), a: a.trim() }];
    }
    setItems(next);
    await saveFaqWithBackend(next);
    reset();
  };

  const edit = (item) => {
    setEditingId(item.id);
    setQ(item.q);
    setA(item.a);
  };

  const remove = async (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    await saveFaqWithBackend(next);
    if (editingId === id) reset();
  };

  return (
    <>
      <PageHeader title={t("admin.chatTitle")} subtitle={t("admin.chatSubtitle")} />

      <Card className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--brand-ink)]">{t("admin.chatQuestion")}</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} mt-1.5`} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-ink)]">{t("admin.chatAnswer")}</label>
            <textarea value={a} onChange={(e) => setA(e.target.value)} rows={4} className={`${inputCls} mt-1.5 resize-y`} required />
          </div>
          <div className="flex items-center gap-2">
            <PrimaryButton type="submit">
              {editingId ? t("admin.save") : <><PlusIcon /> {t("admin.chatAdd")}</>}
            </PrimaryButton>
            {editingId && <SecondaryButton onClick={reset}>{t("admin.cancel")}</SecondaryButton>}
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState>{t("admin.chatEmpty")}</EmptyState>
        ) : (
          items.map((item) => (
            <Card key={item.id} className={`flex items-start justify-between gap-4 p-5 ${editingId === item.id ? "ring-2 ring-[var(--brand-yellow)]" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--brand-ink)]">{item.q}</p>
                <p className="mt-1 text-sm text-[var(--brand-ink)]/60">{item.a}</p>
              </div>
              <div className="flex shrink-0 items-center">
                <GhostIconButton label={t("admin.edit")} onClick={() => edit(item)}><EditIcon /></GhostIconButton>
                <GhostIconButton label={t("admin.delete")} danger onClick={() => remove(item.id)}><TrashIcon /></GhostIconButton>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
