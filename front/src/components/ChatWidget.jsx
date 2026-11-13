// ChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";


function ChatIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </svg>
  );
}
function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
function SendIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" />
    </svg>
  );
}

/**
 * ChatWidget — chat bot u donjem desnom uglu (za krajnje korisnike).
 *
 * Samostalan UI: dugme + panel sa porukama i poljem za unos. Trenutno bot
 * vraća placeholder odgovor; kasnije se preko `getReply` propsa povezuje sa
 * podacima iz admin panela (može biti i async).
 *
 * Props:
 *  - getReply: (text) => string | Promise<string>  — odgovor bota (default: chat.fallback)
 *
 * Gde se ubacuje: globalno, u main.jsx (prikazuje se na svim stranicama).
 */
export default function ChatWidget({ getReply }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // { from: "bot" | "user", text }
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // Skrol na dno pri novim porukama / otvaranju.
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);

    let reply;
    try {
      reply = getReply ? await getReply(text) : null;
    } catch {
      reply = null;
    }
    const answer = reply || t("chat.fallback");

    // Mala pauza radi prirodnog osećaja.
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: answer }]);
    }, 500);
  };

  return (
    <>
      {/* Panel */}
      <div
        role="dialog"
        aria-label={t("chat.title")}
        className={`fixed bottom-24 right-4 z-[60] flex w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-line transition-all duration-300 sm:right-6 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{ height: "min(32rem, calc(100vh - 8rem))" }}
      >
        {/* Zaglavlje */}
        <div className="bg-ink flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand text-ink flex h-9 w-9 items-center justify-center rounded-full">
              <ChatIcon className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">{t("chat.title")}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/55">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                {t("chat.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("chat.close")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Poruke */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink/[0.02] px-4 py-4">
          {/* Uvodna poruka bota */}
          <Bubble from="bot">{t("chat.welcome")}</Bubble>
          {messages.map((m, i) => (
            <Bubble key={i} from={m.from}>
              {m.text}
            </Bubble>
          ))}
          {typing && (
            <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-black/[0.06] px-4 py-3">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </div>
          )}
        </div>

        {/* Unos */}
        <form onSubmit={send} className="flex items-center gap-2 border-t border-line bg-white px-3 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.placeholder")}
            className="min-w-0 flex-1 rounded-full bg-black/[0.04] px-4 py-2.5 text-sm text-ink placeholder:text-ink-3/70 focus:outline-hidden focus:ring-2 focus:ring-ink/15"
          />
          <button
            type="submit"
            aria-label={t("chat.send")}
            className="bg-brand text-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 disabled:opacity-40"
           
            disabled={!input.trim()}
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {/* Dugme (FAB) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("chat.close") : t("chat.open")}
        aria-expanded={open}
        className="chat-fab fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-brand shadow-lg ring-2 ring-brand transition-colors duration-150 hover:bg-neutral-950 sm:right-6"
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>
    </>
  );
}

function Bubble({ from, children }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-surface-2 text-ink"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: delay }} />;
}
