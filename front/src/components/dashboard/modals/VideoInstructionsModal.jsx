// front/src/components/dashboard/modals/VideoInstructionsModal.jsx
import { CloseIcon } from "../icons";

export default function VideoInstructionsModal({ isOpen, onClose, t }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-ink text-white">
          <div className="flex items-center gap-2.5">
            <div>
              <h3 className="text-base font-bold text-white">
                Zvanična instrukcija za pravljenje video CV-a
              </h3>
              <p className="text-xs text-white/70">
                American Adventure — Work & Travel USA Video Resume Guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-4 text-xs text-ink-2 leading-relaxed">
          {/* Preuzimanje zvaničnog PDF-a */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3.5">
            <div>
              <span className="font-semibold text-ink block text-xs">
                Zvanični PDF agencijski dokument
              </span>
              <span className="text-xs text-ink">
                Preuzmite originalno uputstvo agencije sa svim smernicama i primerima.
              </span>
            </div>
            <a
              href="/documents/AA_Instrukcija_za_video_CV.pdf"
              download="AA_Instrukcija_za_video_CV.pdf"
              className="rounded-full bg-ink hover:bg-neutral-950 text-white font-semibold px-3 py-1.5 text-xs transition-colors shrink-0"
            >
              Preuzmi PDF
            </a>
          </div>

          {/* Opšta pravila */}
          <div className="rounded-2xl border border-line bg-white p-5 space-y-2 sm:p-6">
            <h4 className="font-bold text-ink text-[13px]">
              Trajanje videa, oblačenje, način govora, osmeh 
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-ink-2">
              <li><strong>Trajanje:</strong> Video <strong>ne bi trebalo da bude duži od 2 minuta</strong>.</li>
              <li><strong>Oblačenje:</strong> Obucite se poslovno (business casual) kao da idete na sastanak sa direktorom kompanije. <em>Muškarci:</em> košulja, farmerke i cipele; <em>Devojke:</em> bluza, farmerke i cipele.</li>
              <li><strong>Govor:</strong> Pričajte polako i razgovetno kako bi poslodavac mogao da razume svaku vašu reč/rečenicu.</li>
              <li><strong>Osmeh:</strong> Imajte konstantan osmeh na licu — u američkoj kulturi to je ključna odlika motivisanosti i ljubaznosti!</li>
            </ul>
          </div>

          {/* Obavezno odgovoriti */}
          <div className="space-y-2">
            <h4 className="font-bold text-ink text-[13px]">
              1. Obavezno je odgovoriti na sledeće:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-ink-2">
              <li><strong>Osnovne informacije o sebi:</strong> ime, prezime, grad iz kog dolazite, fakultet koji studirate...</li>
              <li><strong>Radno iskustvo:</strong> Ukoliko ste već bili na SWT programu, to je obavezno istaći; ukoliko niste, navedite radno iskustvo stečeno u Srbiji ili inostranstvu.</li>
              <li><strong>Ako nemate radnog iskustva:</strong> navedite da ste volontirali na nekom događaju ili učestvovali u organizaciji studentskih i školskih aktivnosti.</li>
            </ul>
          </div>

          {/* Dodatna pitanja */}
          <div className="space-y-2">
            <h4 className="font-bold text-ink text-[13px]">
              2. Dodatna pitanja (izaberite 3–5 pitanja — NE treba odgovoriti na sva):
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 bg-surface p-3 rounded-xl border border-line">
              <div className="space-y-1.5 text-ink-2">
                <p>• Šta za Vas znači odlazak na Work and Travel program / zašto želite da idete?</p>
                <p>• Šta želite da Amerikanci nauče o vašoj kulturi?</p>
                <p>• Koje su Vaše prednosti? <em>(izbegavajte opšta mesta poput samo "komunikativnost")</em></p>
                <p>• Koji su Vaši ciljevi u karijeri?</p>
                <p>• Šta Vas čini dobrim zaposlenim — zašto poslodavac treba baš Vas da zaposli?</p>
                <p>• Koji će vam biti najveći izazov života i rada u Americi?</p>
              </div>
              <div className="space-y-1.5 text-ink-2">
                <p>• Čemu se najviše radujete da vidite, posetite ili radite u Americi?</p>
                <p>• Koje 3 stvari biste preporučili strancima da vide ili rade u Srbiji?</p>
                <p>• Kako bi vaš karakter opisali rodbina ili prijatelji?</p>
                <p>• Koji je vaš omiljeni američki film / serija i zašto?</p>
                <p>• Kako pripremate vaše omiljeno tradicionalno srpsko jelo?</p>
                <p>• Da li trenirate neki sport i koji vam je omiljeni tim?</p>
              </div>
            </div>
          </div>

          {/* Obavezno finalno pitanje */}
          <div className="rounded-xl bg-amber-50 p-3 text-amber-950 font-semibold">
            <strong>Obavezno finalno pitanje na kraju videa:</strong><br />
            <em>"Šta bi još kompanija koja Vas zapošljava trebalo da zna o vama?"</em>
          </div>

          {/* Pravi primeri studentskih video CV-ja */}
          <div>
            <h4 className="font-bold text-ink text-[13px] mb-2">
              Zvanični primeri studentskih video CV snimaka:
            </h4>
            <div className="overflow-hidden rounded-xl border border-line bg-ink">
              <iframe
                src="https://www.youtube.com/embed/5nfIF6QW3RM"
                title="Primer zvaničnog video CV-a - American Adventure"
                className="aspect-video w-full"
                allowFullScreen
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
              <span className="text-ink-3 font-semibold">Dodatni primeri na YouTube:</span>
              <a href="https://youtu.be/PhtfiddS9P8" target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">Primer 2 ↗</a>
              <a href="https://youtu.be/GN8l0aBMz5I" target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">Primer 3 ↗</a>
              <a href="https://youtu.be/gxBT9ZUC93w" target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">Primer 4 ↗</a>
              <a href="https://youtu.be/ZULkNRep1HA" target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">Primer 5 ↗</a>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-line">
            <span className="text-xs text-ink-3">American Adventure 2027</span>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand text-ink rounded-full px-6 py-2.5 text-[13px] font-semibold transition-colors hover:bg-brand-strong"
            >
              Razumem, zatvori uputstvo ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
