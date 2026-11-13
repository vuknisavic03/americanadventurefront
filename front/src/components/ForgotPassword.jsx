// ForgotPassword.jsx
import { useState } from "react";
import { Button, inputCls, labelCls } from "./ui";

/**
 * ForgotPassword — zahtev za novu lozinku (ruta /zaboravljena-lozinka).
 * Poziva postojeći endpoint POST /api/public/candidate-accounts/forgot-password.
 * Odgovor je namerno isti bez obzira da li nalog postoji (ne otkriva registrovane adrese).
 */
export default function ForgotPassword({ onNavigate = () => {}, loginHref = "/prijava" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/public/candidate-accounts/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "");
      setMessage(data?.message || "Ako nalog postoji, poslali smo ti uputstvo za novu lozinku.");
      setStatus("sent");
    } catch (err) {
      setMessage(err.message || "Zahtev nije poslat. Proveri internet vezu i pokušaj ponovo.");
      setStatus("error");
    }
  };

  return (
    <section className="bg-surface px-5 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-white p-7 sm:p-10">
        <h1 className="font-display text-3xl font-bold text-ink">Zaboravljena lozinka</h1>

        {status === "sent" ? (
          <>
            <p role="status" className="mt-4 text-[15px] leading-relaxed text-ink-2">
              {message}
            </p>
            <Button variant="outline" size="lg" block className="mt-8" href={loginHref} onClick={(e) => onNavigate(e, loginHref)}>
              Nazad na prijavu
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Unesi e-mail naloga. Poslaćemo ti uputstvo za novu lozinku.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {status === "error" && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                  {message}
                </p>
              )}
              <div>
                <label htmlFor="fp-email" className={labelCls}>
                  E-mail adresa
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputCls} mt-2`}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" size="lg" block disabled={status === "sending"}>
                Pošalji uputstvo
              </Button>
            </form>
            <p className="mt-6 text-center text-sm">
              <a href={loginHref} onClick={(e) => onNavigate(e, loginHref)} className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                Nazad na prijavu
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
