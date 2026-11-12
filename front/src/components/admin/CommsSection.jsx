import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { syncFromBackend, saveAnnouncementWithBackend } from "../../data/candidateStore";
import { PageHeader, Card, Badge, PrimaryButton } from "./ui";

export default function CommsSection() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("email");
  const [recipient, setRecipient] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3/70 focus:border-ink focus:outline-hidden focus:ring-2 focus:ring-ink/10";

  const recipients = [
    ["all", t("admin.commsAll")],
    ["review", t("admin.statusReview")],
    ["job", t("admin.statusJob")],
    ["departure", t("admin.statusDeparture")],
    ["ready", t("admin.statusReady")],
  ];

  const [recentList, setRecentList] = useState([
    { id: 1, channel: "E-mail", subject: "Dobrodošli u program 2026", to: t("admin.commsAll"), date: "03.06." },
    { id: 2, channel: "SMS", subject: "Podsetnik: dokumentacija za vizu", to: t("admin.statusDeparture"), date: "01.06." },
    { id: 3, channel: "E-mail", subject: "Potrebna dopuna uverenja", to: t("admin.statusDocs"), date: "28.05." },
  ]);

  useEffect(() => {
    syncFromBackend().then((data) => {
      if (data?.announcements && Array.isArray(data.announcements)) {
        setRecentList(data.announcements);
      }
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const item = {
      channel: mode === "sms" ? "SMS" : "E-mail",
      subject: mode === "sms" ? message.slice(0, 30) + "..." : subject,
      message,
      to: recipient,
      date: new Date().toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" }),
    };
    setRecentList((prev) => [item, ...prev]);
    await saveAnnouncementWithBackend(item);
    setSent(true);
    setSubject("");
    setMessage("");
  };

  return (
    <>
      <PageHeader title={t("admin.commsTitle")} subtitle={t("admin.commsSubtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="inline-flex rounded-lg bg-surface-2 p-1">
            {[
              ["email", "E-mail"],
              ["sms", "SMS"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setSent(false);
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                  mode === id ? "bg-white text-ink" : "text-ink-3"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">{t("admin.commsRecipients")}</label>
              <select className={`${inputCls} mt-1.5 appearance-none`} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                {recipients.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            {mode === "email" && (
              <div>
                <label className="block text-sm font-medium text-ink">{t("admin.commsSubject")}</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`${inputCls} mt-1.5`} required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink">{t("admin.commsMessage")}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className={`${inputCls} mt-1.5 resize-y`} required />
            </div>

            {sent && <p className="text-sm font-medium text-emerald-600">{t("admin.commsSent")}</p>}

            <PrimaryButton type="submit">{t("admin.commsSend")}</PrimaryButton>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-3">{t("admin.commsRecent")}</h2>
          <div className="space-y-2.5">
            {recentList.map((r, idx) => (
              <button
                key={r.id || idx}
                type="button"
                onClick={() => {
                  setMode(r.channel === "SMS" ? "sms" : "email");
                  setSubject(r.subject);
                  setSent(false);
                }}
                className="w-full text-left"
              >
                <Card className="p-4 transition-colors hover:bg-surface">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={r.channel === "SMS" ? "blue" : "slate"}>{r.channel}</Badge>
                    <span className="text-xs text-ink-3">{r.date}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-ink">{r.subject}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{r.to}</p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
