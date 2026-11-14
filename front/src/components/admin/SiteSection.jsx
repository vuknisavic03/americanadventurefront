import { useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { saveSiteContentWithBackend } from "../../data/candidateStore";
import {
  Modal,
  SecondaryButton,
  PrimaryButton,
  Field,
  FIELD_CLS,
  PageHeader,
  Card,
  EditIcon,
} from "./ui";

function SiteEditModal({ itemKey, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(t(itemKey));
  const [content, setContent] = useState("");

  const save = async (e) => {
    e.preventDefault();
    await saveSiteContentWithBackend(itemKey, title, content);
    onClose();
  };

  return (
    <Modal
      title={`${t("admin.edit")} — ${t(itemKey)}`}
      onClose={onClose}
      wide
      footer={
        <>
          <span />
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onClose}>{t("admin.cancel")}</SecondaryButton>
            <PrimaryButton type="submit" onClick={save}>{t("admin.save")}</PrimaryButton>
          </div>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <Field label={t("admin.fieldTitle")}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD_CLS} />
        </Field>
        <Field label={t("admin.fieldContent")}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className={`${FIELD_CLS} resize-y`}
            placeholder="—"
          />
        </Field>
      </form>
    </Modal>
  );
}

export default function SiteSection() {
  const { t } = useTranslation();
  const items = [
    { key: "nav.vesti", descKey: "admin.siteDescNews" },
    { key: "nav.saradnja", descKey: "admin.siteDescCoop" },
    { key: "nav.kontakt", descKey: "admin.siteDescContact" },
    { key: "nav.programi", descKey: "admin.siteDescPrograms" },
    { key: "nav.popusti", descKey: "admin.siteDescDiscounts" },
    { key: "nav.iskustva", descKey: "admin.siteDescExperiences" },
  ];
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader title={t("admin.siteTitle")} subtitle={t("admin.siteSubtitle")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, descKey }) => (
          <Card key={key} className="flex flex-col p-5">
            <span className="text-sm font-semibold text-ink">{t(key)}</span>
            <span className="mt-1 flex-1 text-sm text-ink-3">{t(descKey)}</span>
            <button
              type="button"
              onClick={() => setEditing(key)}
              className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
            >
              <EditIcon className="h-3.5 w-3.5" /> {t("admin.edit")}
            </button>
          </Card>
        ))}
      </div>

      {editing && <SiteEditModal itemKey={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
