// front/src/components/dashboard/ProfileView.jsx
// Podaci koji ti ne trebaju svaki dan: program, lični podaci (isti su kao u DS-160) i profil za poslodavce.
import { Panel, DataList, LinkButton } from "./ui";

export default function ProfileView({ ctx }) {
  const { candidate, setShowDs160Modal, setShowProfileBuilderModal } = ctx;
  const d = candidate.ds160 || {};
  const first = candidate.firstName || (candidate.name ? candidate.name.split(" ")[0] : "") || d.firstName || "—";
  const last = candidate.lastName || (candidate.name ? candidate.name.split(" ").slice(1).join(" ") : "") || d.lastNameAndMaiden || "—";
  const av = candidate.availability || {};
  const pref = candidate.preferences || {};
  const code = `WT-${String(candidate.id || "2576").replace(/[^0-9]/g, "").slice(-4) || "2576"}`;

  return (
    <div className="space-y-4">
      <Panel title="Program">
        <DataList
          items={[
            ["Program", candidate.programName || candidate.packageName || "Work & Travel USA 2026 — Full Placement"],
            ["Šifra prijave", <span className="tabular-nums">{code}</span>],
            ["Uključeno", "Smeštaj, američki poslodavac i DS-2019"],
            [
              "Plaćanje",
              candidate.paymentMethod === "pkz"
                ? "PKZ — treća rata iz zarade u SAD"
                : candidate.paymentMethod === "installments"
                ? "U tri rate"
                : candidate.paymentMethod === "later"
                ? "Plati kad se vratiš (uz jemca)"
                : "U celosti",
            ],
          ]}
        />
      </Panel>

      <Panel
        title="Lični podaci"
        aside={<LinkButton onClick={() => setShowDs160Modal(true)}>Izmeni</LinkButton>}
      >
        <DataList
          cols={3}
          items={[
            ["Ime", first],
            ["Prezime", last],
            ["Pol", candidate.gender || d.gender || "—"],
            ["Datum rođenja", candidate.birthDate || candidate.dateOfBirth || d.dateOfBirth || "—"],
            ["Mesto rođenja", candidate.birthPlace || candidate.city || candidate.studyCity || d.birthPlace || "—"],
            ["Državljanstvo", candidate.citizenship || d.citizenship || "Republika Srbija"],
            ["JMBG", <span className="tabular-nums">{candidate.jmbg || d.jmbg || "—"}</span>],
            ["Broj pasoša", <span className="tabular-nums">{candidate.passportNumber || candidate.idCardNumber || d.passportNumber || "—"}</span>],
            ["Pasoš važi do", candidate.passportExpiryDate || candidate.passportExpiry || d.passportExpiryDate || "—"],
            ["Telefon", candidate.phone || d.mobilePhone || "—"],
            ["E-mail", candidate.email || d.primaryEmail || "—"],
            ["Adresa", candidate.address || d.homeAddress || "—"],
          ]}
        />
      </Panel>

      <Panel
        title="Profil za poslodavce"
        aside={<LinkButton onClick={() => setShowProfileBuilderModal(true)}>Izmeni</LinkButton>}
      >
        <DataList
          items={[
            ["Status", candidate.profileCompleted ? "Popunjen" : "Nije popunjen"],
            ["Dostupnost za rad", `${av.startDate || "25.05.2026"} – ${av.endDate || "25.09.2026"}`],
            ["Putovanje do", av.travelUntil || "20.10.2026"],
            ["Radno iskustvo", `${candidate.workExperience?.length || 0} pozicija`],
            ["Željena pozicija", pref.position || "Nije navedeno"],
            ["Željena lokacija", pref.location || pref.locationType || "Nije navedeno"],
            ["Nivo engleskog", candidate.englishLevel || pref.englishLevel || "B2"],
            ["Video", candidate.youtubeUrl ? "Sačuvan" : "Nedostaje"],
            ...(pref.testLink
              ? [
                  [
                    "Test engleskog",
                    <a href={pref.testLink} target="_blank" rel="noopener noreferrer" className="underline">
                      Rezultat
                    </a>,
                  ],
                ]
              : []),
          ]}
        />
      </Panel>
    </div>
  );
}
