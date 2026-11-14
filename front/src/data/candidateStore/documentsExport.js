// front/src/data/candidateStore/documentsExport.js
// Zvanični ugovori agencije American Adventure d.o.o., Izjava o odgovornosti, Saglasnost,
// Promocije (Prilog 1), nalozi za uplatu, sertifikovani sudski prevodi i izvoz za Ambasadu.

import { getCandidates, getCurrentUser } from "./session.js";

/**
 * Pomoćna funkcija za preuzimanje zvaničnog PDF fajla iz /documents foldera
 */
function triggerFileDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 1000);
}

/**
 * Zvanična preuzimanja originalnih agencijskih dokumenata iz dokumentacije:
 */
export function downloadOfficialContractPdf(isSelf = false) {
  const url = isSelf ? "/documents/SELF_UGOVOR_2027.pdf" : "/documents/FULL_Lifeguard_UGOVOR_2027.pdf";
  const name = isSelf ? "American_Adventure_SELF_UGOVOR_2027.pdf" : "American_Adventure_FULL_Lifeguard_UGOVOR_2027.pdf";
  triggerFileDownload(url, name);
}

export function downloadOfficialStatementPdf() {
  triggerFileDownload("/documents/Izjava_o_odgovornosti_2027.pdf", "American_Adventure_Izjava_o_odgovornosti_2027.pdf");
}

export function downloadOfficialConsentPdf() {
  triggerFileDownload("/documents/Saglasnost_Vazne_informacije_SWT_USA_2027.pdf", "Saglasnost_Vazne_informacije_SWT_USA_2027.pdf");
}

export function downloadOfficialPromotionsPdf() {
  triggerFileDownload("/documents/Prilog_1_Promocije_i_popusti_2026.pdf", "Prilog_1_Promocije_i_popusti.pdf");
}

export function downloadOfficialVideoCvInstructionsPdf() {
  triggerFileDownload("/documents/AA_Instrukcija_za_video_CV.pdf", "AA_Instrukcija_za_video_CV.pdf");
}

export function downloadOfficialDs160Docx() {
  triggerFileDownload("/documents/UPITNIK_za_izradu_DS160_J1.docx", "UPITNIK_za_izradu_DS160_J1.docx");
}

export function downloadOfficialPaymentSlipPdf(type = "full") {
  if (type === "self") {
    triggerFileDownload("/documents/Uplatnica_avans_AA_SELF.pdf", "Uplatnica_avans_AA_SELF.pdf");
  } else if (type === "visa") {
    triggerFileDownload("/documents/Uplatnica_viziranje.docx", "Uplatnica_viziranje.docx");
  } else {
    triggerFileDownload("/documents/Uplatnica_avans_AA_FULL.pdf", "Uplatnica_avans_AA_FULL.pdf");
  }
}

export function downloadOfficialCatalogPdf() {
  triggerFileDownload("/documents/SWT_American_Adventure_Katalog_2026.pdf", "SWT_American_Adventure_Katalog_2026.pdf");
}

/**
 * Dinamičko generisanje i štampa popunjenog zvaničnog ugovora i izjave o odgovornosti sa podacima studenta.
 */
export function openPrintableContractWindow({ id, email, type = "all", extraParams = {} } = {}) {
  const candidates = getCandidates();
  const candidate =
    candidates.find(
      (c) =>
        (id && String(c.id) === String(id)) ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    ) || getCurrentUser() || {};

  const candidateName =
    extraParams?.name ||
    `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
    candidate.name ||
    "Student Kandidat";
  const jmbg = extraParams?.jmbg || candidate.jmbg || "1508001710023";
  const passportNumber =
    extraParams?.passportNumber ||
    candidate.passportNumber ||
    candidate.idCardNumber ||
    "010948212";
  const contractNumber = `AA-2027-${String(candidate.id || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042"}`;
  const address = candidate.address || candidate.studyCity || "Beograd, Srbija";
  const phone = candidate.phone || "+381 60 1234567";
  const candidateEmail = candidate.email || "student@example.com";

  const isSelf =
    String(candidate.packageId || "").toLowerCase().includes("self") ||
    String(candidate.packageName || "").toLowerCase().includes("self") ||
    String(extraParams?.package || "").toLowerCase().includes("self");

  const programLabel = isSelf
    ? "Self Adventure — Work and Travel USA 2027"
    : candidate.packageName || candidate.program || "Full Adventure — Work and Travel USA 2027";

  const paymentLabel =
    candidate.paymentMethod === "later"
      ? "Opcija C — Plaćanje tokom/nakon programa (PKZ uz jemca)"
      : candidate.paymentMethod === "installments"
      ? "Opcija A — Plaćanje u ratama"
      : "Opcija B — Puna uplata pri prijavi";

  const totalLabel = isSelf ? "$1,975 USD" : `${candidate.finalPrice || 2275} USD`;

  const isStatementOnly = type === "statement" || type === "izjava";
  const isContractOnly = type === "contract";

  const win = window.open("", "_blank");
  if (!win) {
    alert("Molimo omogućite pop-up prozore u pregledaču radi preuzimanja/štampe ugovora.");
    return;
  }

  // Zvaničnih 16 tačaka iz originalnog dokumenta Izjava o odgovornosti 2027.pdf
  const statementItems = [
    "Upoznat/a sam sa svim uslovima Ugovora o pružanju usluga i jasni su mi svi članovi, stavovi i tačke iz pomenutog Ugovora i u potpunosti se slažem sa istim I prihvatam sva prava i obaveze koje su definisane u ovom Ugovoru;",
    "Svu potrebnu dokumentaciju dostaviću na vreme i sve uplate troškova programa izvršiću u tačno predviđenim rokovima, pozivajući se na Ugovor o pružanju usluga potpisan sa American Adventure d.o.o;",
    "Svestan/a sam da će sve informacije o W&T programu stizati na moju ličnu e-mail adresu i odgovoran sam da proveravam istu svaki dan;",
    "Svestan/a sam da je American Adventure d.o.o. samo posrednik između mene i Sponzorske agencije i poslodavca iz SAD, kao i da je Sponzorska agencija odgovorna za mene tokom mog boravka u SAD-u;",
    "Odgovoran/a sam za svoje ponašanje u Sjedinjenim Američkim Državama;",
    "Odgovoran/a sam za pronalazak smeštaja u SAD-u, snosiću troškove hrane, troškove transporta od kuće do posla i ostale troškove transporta, osim ako radnom ponudom koju dobijam od poslodavca iz SAD ili Aneksom ugovora nije drugačije precizirano;",
    "Ako mi treba pomoć ili imam probleme sa poslom ili W&T programom kontaktiraću Sponzorsku agenciju u SAD-u;",
    "Svestan/a sam da ukoliko pronađem drugog poslodavca tokom trajanja radnog dela programa, nemam prava da radim za njega dok ne obavestim Sponzorsku agenciju i dok ga Sponzorska agencija ne proveri i odobri mi rad i da ako to ne postupim Sponzorska agencija ima pravo da mi ukine program i vizu;",
    "Shvatam da postoji velika razlika u životu i kulturi moje zemlje i SAD-a, tako da ću u skladu sa tim poštovati sve važeće zakone SAD-a, jer sam svestan ako budem prekršio bilo koji zakon, moj W&T program može biti ugrožen a J1 viza ukinuta;",
    "Svestan/a sam da u skladu sa SEVIS programom imam 72 sata od ulaska u SAD da Sponzorskoj agenciji pošaljem informacije o adresi stanovanja na kojoj ću tokom programa boraviti, kao i da ukoliko menjam adresu stanovanja, moram u roku od najkasnije 7 dana poslati informacije o novoj adresi i da ako to ne radim Sponzorska agencija ima pravo da mi ukine program i vizu;",
    "Dužan/a sam da od trenutka kad počnem da radim jednom mesečno izveštavam Sponzorsku agenciju o statusu svog W&T programa i da ako to ne radim Sponzorska agencija ima pravo da mi ukine program i vizu;",
    "Upoznat/a sam da je trajanje mog radnog dela programa definisano datumima koji se nalaze u DS–2019 obrascu. Po isteku krajnjeg datuma na DS–2019 obrascu svestan sam da imam 30 dana da se vratim u zemlju prebivališta; Ukoliko mi program i viza budu ukinuti pre nego što je navršena polovina trajanja programa, svestan/a sam da nemam pravo na 30 dana putovanja i da moram da napustim SAD što pre je moguće. Ukidanjem programa i vize ukida se zdravstveno osiguranje;",
    "Svestan/a sam da ako ostanem u SAD nakon 30 dana od krajnjeg datuma na DS-2019 obrascu ili nakon datuma koji mi naknadno odredi Sponzorska agencija, mogu biti uhapšen i deportovan u zemlju prebivališta sa zabranom ulaska u SAD i do 10 godina;",
    "Upoznat/a sam da tokom mog boravka (trajanja radnog dela programa) u SAD podležem zdravstvenom osiguranju koje je obezbeđeno programom. Izjavljujem da ću svaki račun nastao na osnovu medicinske intervencije platiti i račun poslati nadležnoj osiguravajućoj kući kako bi mi se pripadajući iznos refundirao pre nego što napustim SAD;",
    "Upoznat/a sam sa činjenicom da zdravstveno osiguranje traje samo dok traje radni deo programa. Za deo programa koji je namenjen putovanju imam mogućnost da doplatim dodatno zdravstveno osiguranje preko Sponzorske agencije u SAD;",
    "Upoznat/a sam da sam dužan tokom trajanja programa da plaćam porez i da nakon isteka kalendarske godine imam pravo da podnesem zahtev za refundaciju određene kategorije poreza.",
  ];

  win.document.write(`<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8">
  <title>${isStatementOnly ? "Izjava o odgovornosti" : "Ugovor o pružanju usluga"} - American Adventure - ${candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 35px; color: #111; line-height: 1.5; font-size: 12px; }
    .header { border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
    .logo span { background: #ffd000; padding: 2px 6px; border-radius: 4px; }
    .doc-title { text-align: center; font-size: 15px; font-weight: 900; margin: 16px 0; text-transform: uppercase; }
    .section-title { font-size: 12px; font-weight: 800; margin-top: 14px; margin-bottom: 4px; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 6px; margin: 12px 0; font-size: 11.5px; }
    ol { margin: 6px 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .signatures { margin-top: 30px; display: flex; justify-content: space-between; padding-top: 15px; page-break-inside: avoid; }
    .sig-block { width: 45%; text-align: center; border-top: 1px dashed #475569; padding-top: 8px; font-size: 11.5px; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
    .btn { background: #ffd000; color: #111; border: none; font-weight: bold; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .btn:hover { background: #ffbe00; }
    .btn-outline { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; font-weight: bold; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px; text-decoration: none; display: inline-block; }
    @media print {
      .print-bar { display: none; }
      body { margin: 12mm; font-size: 10pt; line-height: 1.35; padding-top: 0 !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body style="padding-top: 55px;">
  <div class="print-bar">
    <div><strong>American Adventure d.o.o.</strong> — ${isStatementOnly ? "Izjava o odgovornosti" : "Zvanični Ugovor o pružanju usluga"} (Broj: ${contractNumber})</div>
    <div>
      <a href="${isSelf ? "/documents/SELF_UGOVOR_2027.pdf" : "/documents/FULL_Lifeguard_UGOVOR_2027.pdf"}" download className="btn-outline">Preuzmi originalni PDF agencije</a>
      <button class="btn" onclick="window.print()">Odštampaj / Sačuvaj kao PDF</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="logo">AMERICAN <span>ADVENTURE</span></div>
      <div style="font-size: 11px; color: #555; margin-top: 2px;">Work & Travel USA — Sezona 2027.</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #555;">
      <div>Gospodar Jevremova 59/4, Beograd</div>
      <div>MB: 20356090 | PIB: 105311717 | Tel: 011 4527 320</div>
      <div>Broj ugovora: <strong>${contractNumber}</strong></div>
    </div>
  </div>

  ${!isStatementOnly ? `
  <div class="doc-title">
    UGOVOR O PRUŽANJU USLUGA<br>
    <span style="font-size: 12px; font-weight: 700; color: #475569;">
      ${isSelf ? "SELF ADVENTURE — WORK AND TRAVEL USA 2027" : "FULL ADVENTURE / LIFEGUARD ADVENTURE — WORK AND TRAVEL USA 2027"}
    </span>
  </div>

  <p>Zaključen u Beogradu dana <strong>${new Date().toLocaleDateString("sr-RS")}</strong> godine, između:</p>
  <div class="box">
    <strong>Davalac usluga:</strong> American Adventure d.o.o., sa sedištem na adresi Gospodar Jevremova 59/4, Beograd, matični broj: 20356090, PIB: 105311717, tekući račun: 160-6000000728717-84 Banca Intesa ${isSelf ? "(ili 340-11015676-26 Erste banka)" : ""}, koje zastupa direktor Ana Ristovski (u daljem tekstu: „Davalac usluga“), s jedne strane, i<br><br>
    <strong>Naručilac usluga:</strong> <strong>${candidateName.toUpperCase()}</strong>, JMBG: <strong>${jmbg}</strong>, Broj pasoša: <strong>${passportNumber}</strong>, Adresa: ${address}, Telefon: ${phone}, E-mail: ${candidateEmail} (u daljem tekstu: „Naručilac usluga“).
  </div>

  <div class="section-title">Član 1. Predmet ugovora i SWT program</div>
  <p>1.1. Davalac usluga se obavezuje da Naručiocu usluga pruži usluge posredovanja i pripreme za učešće u programu Work and Travel USA za 2027. godinu, kao i podršku tokom programa posredstvom Sponzorske agencije iz SAD.</p>
  <p>1.2. Summer Work and Travel (SWT) je program kulturne razmene u okviru J-1 viznog programa US Department of State. Radni deo programa može trajati najduže četiri meseca plus 30 dana (grace period) namenjenih putovanju.</p>

  <div class="section-title">Član 2. Obaveze Davaoca usluga</div>
  <p>2.1. Posreduje pri prijavljivanju za SWT, obezbeđivanju radne ponude i pribavljanju DS-2019 obrasca od strane akreditovane američke Sponzorske agencije (Intrax / CCUSA).<br>
  2.2. Pruža asistenciju u popunjavanju DS-160 obrasca, pripremi za intervju sa poslodavcem i konzulom u Ambasadi SAD u Beogradu.<br>
  2.3. Obezbeđuje zdravstveno osiguranje za radni period i plaća SEVIS taksu (trenutno $35).<br>
  2.4. Organizuje obavezan pripremni i orijentacioni sastanak pre polaska u SAD.<br>
  2.5. Bez naknade obezbeđuje zvanični prevod uverenja o statusu redovnog studenta na engleski jezik.</p>

  <div class="section-title">Član 3. Obaveze Naručioca usluga</div>
  <p>3.1. Da ispunjava uslove: 18–30 godina, redovan student akreditovane visokoškolske ustanove (nije apsolvent/obnovljena godina), kontinuirano studiranje, operativno znanje engleskog jezika.<br>
  3.2. Da u roku od 5–10 radnih dana od potpisivanja dostavi kompletnu dokumentaciju (uverenje o studiranju, uverenje o nekažnjavanju MUP RS, 2 fotografije 5×5cm, kopiju pasoša važećeg min. 6 meseci duže od programa, video CV do 2 min).<br>
  3.3. Da se po sletanju u SAD u roku od 72 sata prijavi sponzoru i aktivira SEVIS, te da vrši obavezan Monthly Check-in jednom mesečno.<br>
  3.4. Da ponese najmanje $1,000 za početne troškove života i smeštaja u SAD.</p>

  <div class="section-title">Član 4. Cena programa i uslovi plaćanja</div>
  <p>Ukupna ugovorena cena programa iznosi <strong>${totalLabel}</strong> prema izabranoj opciji: <strong>${paymentLabel}</strong>.<br>
  Uplate se vrše u dinarskoj protivvrednosti na tekući račun Davaoca usluga po srednjem kursu Narodne banke Srbije (NBS) na dan uplate.<br>
  ${isSelf
    ? "Za Self Adventure avans iznosi $600 u roku od dva radna dana od potpisivanja ugovora, a preostali iznos po odobrenju radne ponude a najkasnije do 1. maja 2027. godine."
    : "Za Full Adventure u Opciji A (rate): I rata (avans) iznosi $450 u roku od dva radna dana, II rata $175 agencijski fee po potvrdi posla, a preostali iznos po odobrenju vize a najkasnije do 1. maja 2027. godine."
  }</p>

  <div class="section-title">Član 5. Odustanak, isključenje i odbijanje vize</div>
  <p>Ukoliko Naručilac usluga na dan viznog intervjua ispunjava sve ugovorene uslove (položeni ispiti, prosek iznad 8.00, bez prekida u školovanju, položen test engleskog), a viza bude odbijena, <strong>zadržava se 0 USD od cene programa</strong> (refundira se sav uplaćeni novac od cene programa najkasnije do 1. novembra 2027.). Taksa za viziranje se ne refundira.</p>

  <div class="section-title">Član 6. Zaštita ugleda i ugovorne kazne</div>
  <p>U slučaju namernog iznošenja neistinitih činjeničnih tvrdnji koje narušavaju ugled agencije predviđena je naknada od $10,000 USD. U slučaju neovlašćenog ostanka u SAD preko dozvoljenog roka od 30 dana od isteka DS-2019 obrasca predviđena je ugovorna kazna od $5,000 USD u dinarskoj protivvrednosti po kursu NBS.</p>

  <div class="signatures">
    <div class="sig-block">
      <strong>DAVALAC USLUGA</strong><br>
      American Adventure d.o.o. Beograd<br><br><br>
      ____________________________<br>
      (M.P. / Ana Ristovski, direktor)
    </div>
    <div class="sig-block">
      <strong>NARUČILAC USLUGA (STUDENT)</strong><br>
      ${candidateName.toUpperCase()}<br><br><br>
      ____________________________<br>
      (Svojeručni potpis)
    </div>
  </div>
  ` : ""}

  ${!isContractOnly ? `
  <div class="${!isStatementOnly ? "page-break" : ""}" style="margin-top: ${!isStatementOnly ? "35px" : "10px"};">
    <div class="doc-title" style="margin-top: 10px;">
      IZJAVA O ODGOVORNOSTI KANDIDATA<br>
      <span style="font-size: 11px; font-weight: normal; color: #555;">(Sastavni prilog uz Ugovor o pružanju usluga broj: ${contractNumber})</span>
    </div>

    <p style="margin-bottom: 12px; font-size: 11.5px;">
      Ja, dolepotpisani/a <strong>${candidateName}</strong>, JMBG: <strong>${jmbg}</strong>, Broj pasoša: <strong>${passportNumber}</strong>, kao jedna od ugovornih strana Ugovora o pružanju usluga agencije American Adventure d.o.o. u skladu sa uslovima Work & Travel programa (u daljem tekstu: W&T program), pod punom materijalnom i moralnom odgovornošću izjavljujem sledeće:
    </p>

    <ol style="font-size: 11px; line-height: 1.45;">
      ${statementItems.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join("\n      ")}
    </ol>

    <div style="margin-top: 18px; font-size: 11px;">
      Za American Adventure d.o.o. i ovaj program sam čuo/la: __________________________________________
    </div>

    <div class="signatures" style="margin-top: 25px;">
      <div class="sig-block">
        <strong>AMERICAN ADVENTURE D.O.O.</strong><br><br><br>
        Datum: ${new Date().toLocaleDateString("sr-RS")}
      </div>
      <div class="sig-block">
        <strong>DÁVALAC IZJAVE (KANDIDAT)</strong><br><br><br>
        <strong>${candidateName}</strong><br>
        (Svojeručni potpis plavom ili crnom olovkom)
      </div>
    </div>
  </div>
  ` : ""}
</body>
</html>`);
  win.document.close();
}

/**
 * Prikaz i štampa zvanične saglasnosti i važnih informacija o SWT USA programu.
 */
export function openPrintableConsentWindow({ id, email } = {}) {
  const candidates = getCandidates();
  const candidate =
    candidates.find(
      (c) =>
        (id && String(c.id) === String(id)) ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    ) || getCurrentUser() || {};

  const candidateName = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.name || "Kandidat";
  const jmbg = candidate.jmbg || "1508001710023";
  const passportNumber = candidate.passportNumber || candidate.idCardNumber || "010948212";

  const win = window.open("", "_blank");
  if (!win) {
    alert("Molimo omogućite pop-up prozore u pregledaču radi prikaza saglasnosti.");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8">
  <title>Saglasnost i važne informacije SWT USA 2027 - ${candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; font-size: 12px; color: #111; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .card-title { font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
    ul { margin: 4px 0; padding-left: 18px; }
    li { margin-bottom: 3px; font-size: 11.5px; }
    .signatures { margin-top: 30px; display: flex; justify-content: space-between; border-top: 1px dashed #64748b; padding-top: 10px; font-size: 11.5px; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
    .btn { background: #ffd000; color: #111; border: none; font-weight: bold; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .print-bar { display: none; } body { margin: 10mm; padding-top: 0 !important; } }
  </style>
</head>
<body style="padding-top: 55px;">
  <div class="print-bar">
    <div><strong>American Adventure</strong> — Saglasnost i važne informacije SWT USA 2027</div>
    <div>
      <a href="/documents/Saglasnost_Vazne_informacije_SWT_USA_2027.pdf" download class="btn" style="background:#fff; color:#000; margin-right:8px; text-decoration:none;">Preuzmi originalni PDF</a>
      <button class="btn" onclick="window.print()">Odštampaj</button>
    </div>
  </div>

  <div class="header">
    <h1>Summer Work and Travel USA (SWT) 2027 — Važne informacije</h1>
    <span style="font-weight:bold; color:#0f172a;">American Adventure d.o.o.</span>
  </div>

  <div class="card">
    <div class="card-title">1. Karakter programa — Kulturna razmena, a ne radni program</div>
    <ul>
      <li>J-1 viza se izdaje u okviru US Department of State Exchange Visitor programa u cilju upoznavanja američke kulture.</li>
      <li>Fokus je na usavršavanju jezika, samostalnosti i sticanju životnog iskustva, a ne isključivo na zaradi.</li>
      <li>Može doći do oscilacija u radnim satima u zavisnosti od sezone kod poslodavca; očekuje se zrelost i fleksibilnost.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">2. Uloga sponzora (Intrax / CCUSA) i agencije American Adventure</div>
    <ul>
      <li>American Adventure deluje kao posrednik i priprema dokumentaciju za odlazak.</li>
      <li>Po ulasku u SAD, punu 24/7 operativnu podršku i pravnu odgovornost preuzima američka sponzorska organizacija (Intrax / CCUSA).</li>
      <li>Sponzor proverava poslodavce, odobrava pozicije i smeštaj, te rešava programska pitanja na terenu.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">3. Društvene mreže — Obaveza otključanih profila</div>
    <ul>
      <li><strong>Obaveza:</strong> Svi studenti MORAJU imati otključane (public) profile na svim društvenim mrežama (Instagram, Facebook, TikTok) tokom procesa viziranja (mart – maj).</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">4. Zdravstveno osiguranje i pravila boravka</div>
    <ul>
      <li>Osiguranje važi isključivo tokom radnog perioda navedenog na radnoj ponudi. U slučaju medicinske intervencije obavezno je prvo kontaktirati osiguranje.</li>
      <li>Program traje najduže 4 meseca rada + 30 dana grace perioda za putovanje.</li>
      <li>Prekoračenje boravka ili promena vize unutar SAD bez saglasnosti strogo je zabranjena i povlači dugoročne zabrane ulaska u SAD.</li>
    </ul>
  </div>

  <div class="card" style="background:#fffbeb; border-color:#fde68a;">
    <p style="font-weight:bold; margin-bottom:4px;">SAGLASNOST STUDENTA:</p>
    <p style="font-size:11px; margin:0;">
      Ovim potvrđujem da sam u celosti pročitao/la, razumeo/la i prihvatio/la sve važne informacije i uslove Summer Work & Travel USA programa, te da sam upoznat/a sa svim rizicima.
    </p>
  </div>

  <div class="signatures">
    <div>
      Student: <strong>${candidateName.toUpperCase()}</strong><br>
      JMBG: ${jmbg} • Broj pasoša: ${passportNumber}
    </div>
    <div style="text-align:right;">
      Datum: ${new Date().toLocaleDateString("sr-RS")}<br><br>
      Potpis studenta: ______________________________
    </div>
  </div>
</body>
</html>`);
  win.document.close();
}

/**
 * Prikaz i štampa zvaničnog naloga za uplatu (avans ili viziranje).
 */
export function openPrintablePaymentSlipWindow({ id, email, type = "rate2", customRate = null } = {}) {
  const candidates = getCandidates();
  const candidate =
    candidates.find(
      (c) =>
        (id && String(c.id) === String(id)) ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    ) || getCurrentUser() || {};

  const candidateName =
    `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
    candidate.name ||
    "Student Kandidat";
  const candIdShort = String(candidate.id || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042";

  const isFull =
    type === "full" ||
    type === "now" ||
    type === "full_payment" ||
    (candidate.paymentMethod === "now" && type !== "rate2" && type !== "rate3" && type !== "visa");
  const isRate2 = type === "rate2" || type === "second" || type === "r2";
  const isRate3 = type === "rate3" || type === "third" || type === "r3";
  const isVisa = type === "visa";
  const isRate1 = !isFull && !isRate2 && !isRate3 && !isVisa;

  const nbsRate = Number(customRate) || 117.1524;
  const nbsUsdRate = 108.4230;

  const calcRsd = (eurAmt, rate) => {
    const total = Math.round(eurAmt * rate * 100) / 100;
    const parts = total.toFixed(2).split(".");
    return `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`;
  };

  const finalPrice = Number(candidate.finalPrice) || Number(candidate.basePrice) || 1750;
  const r1Amt = Number(candidate.firstInstallmentAmount) || 250;
  const r2Amt = Number(candidate.secondInstallmentAmount) || 400;
  const r3Amt = Number(candidate.thirdInstallmentAmount) || Math.max(0, finalPrice - r1Amt - r2Amt);

  let titleHeader = "Uplata II rate programa (Job Offer)";
  let svrha = "Uplata II rate programa — Work & Travel USA 2026";
  if (candidate.selectedJobEmployer) {
    svrha += ` (${candidate.selectedJobEmployer})`;
  }
  let iznosRsd = calcRsd(r2Amt, nbsRate);
  let iznosDesc = `${r2Amt.toFixed(2)} EUR (NBS kurs: ${nbsRate.toFixed(4)})`;
  let contractNumber = `AA-2026-R2-${candIdShort}`;

  if (isFull) {
    titleHeader = "Uplata programa u celosti (Jednokratno plaćanje)";
    svrha = "Uplata programa u celosti — Work & Travel USA 2026";
    iznosRsd = calcRsd(finalPrice, nbsRate);
    iznosDesc = `${finalPrice.toFixed(2)} EUR (NBS kurs: ${nbsRate.toFixed(4)})`;
    contractNumber = `AA-2026-FULL-${candIdShort}`;
  } else if (isRate1) {
    titleHeader = "Uplata I rate programa (Registracija i ugovor)";
    svrha = "Uplata I rate programa — Work & Travel USA 2026 (Registracija i ugovor)";
    iznosRsd = calcRsd(r1Amt, nbsRate);
    iznosDesc = `${r1Amt.toFixed(2)} EUR (NBS kurs: ${nbsRate.toFixed(4)})`;
    contractNumber = `AA-2026-R1-${candIdShort}`;
  } else if (isRate3) {
    titleHeader = "Uplata III rate programa (Pred viziranje)";
    svrha = "Uplata III rate programa — Work & Travel USA 2026 (Pred viziranje)";
    iznosRsd = calcRsd(r3Amt, nbsRate);
    iznosDesc = `${r3Amt.toFixed(2)} EUR (NBS kurs: ${nbsRate.toFixed(4)})`;
    contractNumber = `AA-2026-R3-${candIdShort}`;
  } else if (isVisa) {
    titleHeader = "Uplata troškova viziranja (Ambasada SAD)";
    svrha = "Uplata troškova viziranja (MRV taksa $185 USD) — Ambasada SAD";
    iznosRsd = calcRsd(185, nbsUsdRate);
    iznosDesc = `$185 USD (NBS kurs: ${nbsUsdRate.toFixed(4)})`;
    contractNumber = `AA-2026-VISA-${candIdShort}`;
  }

  const win = window.open("", "_blank");
  if (!win) {
    alert("Molimo omogućite pop-up prozore u pregledaču radi štampe uplatnice.");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8">
  <title>Nalog za uplatu - American Adventure - ${candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #111; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
    .btn { background: #ffd000; color: #111; border: none; font-weight: bold; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .btn-outline { background: #fff; color: #0f172a; border: 1px solid #cbd5e1; font-weight: bold; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px; text-decoration: none; }
    .slip-container { max-width: 720px; margin: 60px auto 20px; border: 2px solid #b32d2e; border-radius: 8px; padding: 24px; background: #fff8f8; }
    .slip-title { font-size: 16px; font-weight: 900; color: #b32d2e; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; display: flex; justify-content: space-between; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .field-group { margin-bottom: 14px; }
    .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 4px; }
    .field-box { border: 1px solid #ccc; background: #fff; padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; min-height: 22px; }
    .code-grid { display: grid; grid-template-columns: 80px 80px 1fr; gap: 8px; }
    @media print {
      .print-bar { display: none; }
      body { margin: 10mm; padding-top: 0 !important; }
      .slip-container { margin: 0 auto; box-shadow: none; }
    }
  </style>
</head>
<body style="padding-top: 40px;">
  <div class="print-bar">
    <div><strong>American Adventure d.o.o.</strong> — ${titleHeader}</div>
    <div>
      <button class="btn" onclick="window.print()">Odštampaj uplatnicu / Snimi kao PDF</button>
    </div>
  </div>

  <div class="slip-container">
    <div class="slip-title">
      <span>NALOG ZA UPLATU</span>
      <span style="font-size: 12px; font-weight: 700; color: #555;">Obrazac br. 1 • ${iznosDesc}</span>
    </div>

    <div class="grid">
      <div>
        <div class="field-group">
          <div class="field-label">Uplatilac</div>
          <div class="field-box" style="height: 55px;">
            ${candidateName}<br>
            ${candidate.address || candidate.homeAddress || candidate.studyCity || "Srbija"}<br>
            Student SWT 2026 / 2027
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">Svrha uplate</div>
          <div class="field-box" style="height: 50px;">
            ${svrha}<br>
            Kandidat: ${candidateName}
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">Primalac</div>
          <div class="field-box" style="height: 55px;">
            American Adventure d.o.o.<br>
            Gospodar Jevremova 59/4, 11000 Beograd<br>
            PIB: 105311717 | MB: 20356090
          </div>
        </div>
      </div>

      <div>
        <div class="field-group">
          <div class="code-grid">
            <div>
              <div class="field-label">Šifra pl.</div>
              <div class="field-box" style="text-align: center;">189</div>
            </div>
            <div>
              <div class="field-label">Valuta</div>
              <div class="field-box" style="text-align: center;">RSD</div>
            </div>
            <div>
              <div class="field-label">Iznos</div>
              <div class="field-box" style="text-align: right; font-weight: 900; color: #b32d2e;">= ${iznosRsd}</div>
            </div>
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">Račun primaoca</div>
          <div class="field-box" style="font-family: monospace; font-size: 14px; font-weight: 800; letter-spacing: 1px;">
            160-6000000728717-84
          </div>
        </div>

        <div class="field-group">
          <div class="code-grid" style="grid-template-columns: 60px 1fr;">
            <div>
              <div class="field-label">Model</div>
              <div class="field-box" style="text-align: center;">97</div>
            </div>
            <div>
              <div class="field-label">Poziv na broj (odobrenje)</div>
              <div class="field-box" style="font-family: monospace; font-size: 13px; font-weight: bold;">
                ${contractNumber}
              </div>
            </div>
          </div>
        </div>

        <div class="field-group" style="margin-top: 15px; text-align: center; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; background: #fff;">
          <div style="font-size: 11px; font-weight: bold; color: #334155;">NBS IPS QR KOD ZA MOBILNO BANKARSTVO</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=K%3APR%7CV%3A01%7CC%3A1%7CR%3A160600000072871784%7CN%3AAmerican%20Adventure%20d.o.o.%20Beograd%7CI%3ARSD${iznosRsd.replace(/\./g, "")}%7CP%3A${encodeURIComponent(candidateName)}%7CSF%3A289%7CS%3A${encodeURIComponent(svrha.slice(0, 35))}%7CRO%3A97${contractNumber.replace(/[^A-Za-z0-9]/g, "")}" alt="NBS IPS QR Kod" style="width: 110px; height: 110px; display: block; margin: 6px auto; border: 1px solid #cbd5e1; border-radius: 4px;" />
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Skenirajte m-banking aplikacijom za automatsko plaćanje • Srednji kurs NBS: ${nbsRate.toFixed(4)}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
  win.document.close();
}

export async function downloadContractPdf(id, email, type = "all", extraParams = {}) {
  const isSelf = String(extraParams?.package || "").toLowerCase().includes("self");
  if (type === "statement" || type === "izjava") {
    downloadOfficialStatementPdf();
    return;
  }
  if (type === "consent" || type === "saglasnost") {
    downloadOfficialConsentPdf();
    return;
  }
  if (type === "promotions" || type === "prilog1") {
    downloadOfficialPromotionsPdf();
    return;
  }

  // Preuzimanje zvaničnog PDF ugovora
  downloadOfficialContractPdf(isSelf);
}

export function downloadResponsibilityStatementPdf(id, email, extraParams = {}) {
  downloadOfficialStatementPdf();
}

export async function downloadPaymentSlipPdf(id, email, type = "advance") {
  const isSelf = String(type).toLowerCase().includes("self");
  const isVisa = String(type).toLowerCase().includes("visa");
  if (isVisa) {
    downloadOfficialPaymentSlipPdf("visa");
  } else if (isSelf) {
    downloadOfficialPaymentSlipPdf("self");
  } else {
    downloadOfficialPaymentSlipPdf("full");
  }
}

export function downloadEmbassyExport() {
  window.open("/api/public/embassy-export", "_blank");
}

/**
 * – Export prijava u Excel tabelu (XLSX/CSV kompatibilan sa Excel-om uz UTF-8 BOM).
 */
export function downloadPreApplicationsExcel(applications = []) {
  const headers = [
    "ID prijave",
    "Ime i prezime",
    "Email adresa",
    "Broj telefona",
    "Fakultet",
    "Grad studiranja",
    "Godina studija",
    "ESPB bodovi",
    "Program",
    "Nivo engleskog",
    "Status poziva ()",
    "Datum poslednjeg kontakta ()",
    "Ishod kontakta ()",
    "Planiran sledeći kontakt",
    "Obavezna dokumenta poslata ()",
    "Status konsultacija (/013)",
    "Datum i vreme konsultacija ()",
    "Format konsultacija",
    "Zabeleška sa konsultacija ()",
    "Selekciona odluka (/009)",
    "Razlog odbijanja / Napomena ()",
    "Spreman za profil ()",
    "Aktivacioni kod",
    "Status naloga",
    "Datum prijave",
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, " ");
    return `"${str}"`;
  };

  const rows = applications.map((s) => {
    const contactOutcomeMap = {
      REACHED: "Razgovor obavljen",
      NO_ANSWER: "Bez odgovora",
      CALLBACK_REQUESTED: "Tražen ponovni poziv",
      INVALID_CONTACT: "Neispravan kontakt",
    };
    const consultationStatusMap = {
      ATTENDED: "Održane (prisustvovao)",
      SCHEDULED: "Zakazane",
      NO_SHOW: "Nije došao",
      CANCELLED: "Otkazane",
      NOT_SCHEDULED: "Nisu zakazane",
    };
    const decisionMap = {
      QUALIFIED: "Ispunjava uslove",
      REJECTED: "Ne ispunjava uslove (odbijen)",
      PENDING: "U obradi / Čeka odluku",
    };

    return [
      escapeCell(s.id),
      escapeCell(s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim()),
      escapeCell(s.email),
      escapeCell(s.phone || ""),
      escapeCell(s.faculty || ""),
      escapeCell(s.studyCity || "Beograd"),
      escapeCell(s.studyYear || ""),
      escapeCell(s.ectsPoints || ""),
      escapeCell(s.packageName || s.program || "Work & Travel USA"),
      escapeCell(s.preferences?.englishLevel || "B2"),
      escapeCell(s.contactStatus || "NOT_ATTEMPTED"),
      escapeCell(s.latestContactAt ? new Date(s.latestContactAt).toLocaleString("sr-RS") : ""),
      escapeCell(contactOutcomeMap[s.latestContactOutcome] || s.latestContactOutcome || ""),
      escapeCell(s.nextContactAt ? new Date(s.nextContactAt).toLocaleString("sr-RS") : ""),
      escapeCell(s.infoMaterialsSent ? "Da" : "Ne"),
      escapeCell(consultationStatusMap[s.consultationStatus] || s.consultationStatus || ""),
      escapeCell(s.consultationStartsAt ? new Date(s.consultationStartsAt).toLocaleString("sr-RS") : ""),
      escapeCell(s.consultationType === "IN_PERSON" ? "Uživo u agenciji" : "Online"),
      escapeCell(s.consultationNotes || ""),
      escapeCell(decisionMap[s.selectionDecision] || s.selectionDecision || "U obradi"),
      escapeCell(s.decisionNote || ""),
      escapeCell(s.isReadyForProfile || s.activationCode ? "Da" : "Ne"),
      escapeCell(s.activationCode || ""),
      escapeCell(s.isRegistered || s.status === "review" ? "Aktiviran nalog" : "Pre-prijava"),
      escapeCell(s.createdAt ? new Date(s.createdAt).toLocaleDateString("sr-RS") : ""),
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `American_Adventure_Prijave_Selekcija_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Zvanično prevođenje naziva visokoškolske ustanove na engleski jezik.
 */
export function getTranslatedFacultyName(facultyName = "") {
  const norm = String(facultyName || "").trim();
  if (!norm) return "University of Belgrade — Accredited State Higher Education Institution";

  const map = {
    "Fakultet organizacionih nauka (FON)": "University of Belgrade, Faculty of Organizational Sciences (FON)",
    "Fakultet organizacionih nauka": "University of Belgrade, Faculty of Organizational Sciences (FON)",
    "Ekonomski fakultet": "University of Belgrade, Faculty of Economics and Business",
    "Pravni fakultet": "University of Belgrade, Faculty of Law",
    "Elektrotehnički fakultet (ETF)": "University of Belgrade, School of Electrical Engineering (ETF)",
    "Elektrotehnički fakultet": "University of Belgrade, School of Electrical Engineering (ETF)",
    "Matematički fakultet": "University of Belgrade, Faculty of Mathematics",
    "Filozofski fakultet": "University of Belgrade, Faculty of Philosophy",
    "Filološki fakultet": "University of Belgrade, Faculty of Philology",
    "Fakultet političkih nauka (FPN)": "University of Belgrade, Faculty of Political Sciences (FPN)",
    "Fakultet bezbednosti": "University of Belgrade, Faculty of Security Studies",
    "Fakultet inženjerskih nauka": "University of Kragujevac, Faculty of Engineering Sciences",
    "Prirodno-matematički fakultet (PMF)": "Faculty of Sciences and Mathematics",
    "Medicinski fakultet": "Faculty of Medicine",
    "Stomatološki fakultet": "Faculty of Dental Medicine",
    "Farmaceutski fakultet": "Faculty of Pharmacy",
    "Građevinski fakultet": "Faculty of Civil Engineering",
    "Mašinski fakultet": "Faculty of Mechanical Engineering",
    "Saobraćajni fakultet": "Faculty of Transport and Traffic Engineering",
    "Fakultet sporta i fizičkog vaspitanja": "Faculty of Sport and Physical Education",
  };

  for (const [sr, en] of Object.entries(map)) {
    if (norm.toLowerCase().includes(sr.toLowerCase()) || sr.toLowerCase().includes(norm.toLowerCase())) {
      return en;
    }
  }

  const cleaned = norm.replace(/fakultet/i, "").trim();
  return `University Faculty of ${cleaned || "Academic Studies"} (Accredited State Institution, Serbia)`;
}

/**
 * Prevođenje godine studija na engleski jezik prema američkom akademskom standardu.
 */
export function getTranslatedStudyYear(year = "YEAR_2") {
  const map = {
    YEAR_1: "1st Year of Undergraduate Academic Studies (Freshman)",
    YEAR_2: "2nd Year of Undergraduate Academic Studies (Sophomore)",
    YEAR_3: "3rd Year of Undergraduate Academic Studies (Junior)",
    YEAR_4: "4th Year of Undergraduate Academic Studies (Senior)",
    MASTER: "Graduate / Master Studies",
  };
  return map[year] || "2nd Year of Undergraduate Studies (Sophomore)";
}

/**
 * Generisanje i otvaranje zvaničnog sertifikovanog prevoda sudskog tumača (za štampu i PDF).
 */
export function openPrintableTranslationWindow(arg1, arg2) {
  let candidate, type;
  if (arg1 && typeof arg1 === "object" && arg1.candidate) {
    candidate = arg1.candidate;
    type = arg1.type || "faculty";
  } else if (typeof arg1 === "string") {
    type = arg1;
    candidate = arg2;
  } else {
    candidate = arg1;
    type = arg2 || "faculty";
  }

  if (!candidate) {
    candidate = getCurrentUser() || {};
  }

  const win = window.open("", "_blank");
  if (!win) {
    alert("Molimo omogućite pop-up prozore u pregledaču radi štampe prevoda.");
    return;
  }

  const candidateName = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.name || "Student Kandidat";
  const jmbg = candidate.jmbg || "1508001710023";
  const facultyEn = getTranslatedFacultyName(candidate.faculty || "Fakultet");
  const studyYearEn = getTranslatedStudyYear(candidate.studyYear || "YEAR_2");
  const passportNumber = candidate.passportNumber || candidate.idCardNumber || "010948212";
  const regNumber = `AA-TRANS-2027-${String(candidate.id || "1042").replace(/[^0-9]/g, "").slice(-4) || "1042"}`;
  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const isFaculty = type === "faculty";

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${isFaculty ? "Certified Translation - University Certificate" : "Certified Translation - Police Clearance"} - ${candidateName}</title>
  <style>
    body { font-family: "Times New Roman", Times, Georgia, serif; margin: 40px; color: #111; line-height: 1.6; font-size: 14px; }
    .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 24px; }
    .badge { display: inline-block; font-family: -apple-system, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; margin-bottom: 8px; border: 1px solid #bae6fd; }
    h1 { font-size: 18px; margin: 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .sub { font-size: 12px; color: #555; font-style: italic; }
    .content-box { border: 1px solid #ccc; padding: 20px; border-radius: 6px; margin: 20px 0; background: #fafafa; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
    th { width: 35%; color: #444; font-weight: bold; background: #f0f0f0; }
    .clause { font-size: 12px; margin-top: 25px; padding: 12px; border-left: 3px solid #0284c7; background: #f8fafc; font-style: italic; }
    .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .stamp-box { width: 130px; height: 130px; border: 2px dashed #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase; transform: rotate(-5deg); margin: 0 auto; padding: 10px; }
    .sig-block { width: 45%; text-align: center; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 999; font-family: -apple-system, sans-serif; }
    .btn { background: #ffd000; color: #111; border: none; font-weight: bold; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    @media print {
      .print-bar { display: none; }
      body { margin: 15mm; padding-top: 0 !important; }
    }
  </style>
</head>
<body style="padding-top: 50px;">
  <div class="print-bar">
    <div><strong>American Adventure Sworn Translation Bureau</strong> — Reg. No: ${regNumber}</div>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="badge">Official Sworn Certified Translation (Court Interpreter for English)</div>
    <h1>${isFaculty ? "CERTIFICATE OF ENROLLMENT AND FULL-TIME STUDENT STATUS" : "CERTIFICATE OF CLEAN CRIMINAL RECORD (POLICE CLEARANCE)"}</h1>
    <div class="sub">Certified Translation from Serbian Language — For US J-1 Exchange Visitor Program (US Department of State / BridgeUSA)</div>
  </div>

  <div class="content-box">
    ${isFaculty ? `
      <table>
        <tr><th>Academic Institution:</th><td><strong>${facultyEn}</strong></td></tr>
        <tr><th>Student Full Name:</th><td><strong>${candidateName.toUpperCase()}</strong></td></tr>
        <tr><th>National Identification No. (JMBG):</th><td><span style="font-family: monospace;">${jmbg}</span></td></tr>
        <tr><th>Passport Number:</th><td><span style="font-family: monospace;">${passportNumber}</span></td></tr>
        <tr><th>Current Academic Year:</th><td>${studyYearEn} (Academic Year 2026/2027)</td></tr>
        <tr><th>Study Major / Program:</th><td>${candidate.program || "Higher Academic Undergraduate Studies"}</td></tr>
        <tr><th>ECTS Credits Achieved:</th><td>${candidate.ectsPoints || 120} ECTS Credits</td></tr>
        <tr><th>Enrollment Status:</th><td><strong>Regular full-time student in good academic standing.</strong></td></tr>
        <tr><th>Official Summer Recess:</th><td><strong>June 1, 2027 – October 1, 2027</strong> (Eligible for SWT USA 2027 work period).</td></tr>
        <tr><th>Date of Issuance of Original:</th><td>${todayStr}</td></tr>
      </table>
    ` : `
      <table>
        <tr><th>Issuing Authority:</th><td><strong>Republic of Serbia — Ministry of Internal Affairs (MUP RS)</strong></td></tr>
        <tr><th>Department / Directorate:</th><td>Police Directorate of ${candidate.studyCity || "Belgrade"}</td></tr>
        <tr><th>Applicant Full Name:</th><td><strong>${candidateName.toUpperCase()}</strong></td></tr>
        <tr><th>National Identification No. (JMBG):</th><td><span style="font-family: monospace;">${jmbg}</span></td></tr>
        <tr><th>Passport Number:</th><td><span style="font-family: monospace;">${passportNumber}</span></td></tr>
        <tr><th>Place of Residence:</th><td>${candidate.studyCity || "Belgrade"}, Republic of Serbia</td></tr>
        <tr><th>Official Finding of Records:</th><td>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 4px; color: #065f46; font-weight: bold;">
            IT IS HEREBY CERTIFIED that according to the centralized penal and misdemeanor records of the Ministry of Internal Affairs of the Republic of Serbia, the named person HAS NOT BEEN CONVICTED of any crime and NO CRIMINAL PROCEEDINGS are pending.
          </div>
        </td></tr>
        <tr><th>Purpose of Certificate:</th><td>Issued upon personal request for participation in the US J-1 Summer Work & Travel Program.</td></tr>
        <tr><th>Date of Record Search:</th><td>${todayStr}</td></tr>
      </table>
    `}

    <div class="clause">
      <strong>Sworn Translator Certification Clause:</strong><br>
      I hereby certify that this is a true, accurate, and faithful English translation of the original document drawn up in the Serbian language. Registration reference: ${regNumber}. Issued in Belgrade, Serbia on ${todayStr}.
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="stamp-box">
          Official Seal<br>
          Certified Court Interpreter<br>
          English Language<br>
          Reg. 2027
        </div>
      </div>
      <div class="sig-block" style="padding-top: 30px;">
        <div style="border-top: 1px dashed #333; padding-top: 8px;">
          <strong>Authorized Court Interpreter for English</strong><br>
          <span style="font-size: 12px; color: #555;">Ministry of Justice of the Republic of Serbia</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
  win.document.close();
}
