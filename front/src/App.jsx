import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Stats from "./components/Stats";
import Experiences from "./components/Experiences";
import Discounts from "./components/Discounts";
import Cooperation from "./components/Cooperation";
import ExperiencesPage from "./components/ExperiencesPage";
import News from "./components/News";
import NewsArticle from "./components/NewsArticle";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Register from "./components/Register";
import OnlinePrijava from "./components/OnlinePrijava";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import ChatWidget from "./components/ChatWidget";
import Footer from "./components/Footer";
import TimeZones from "./components/TimeZones";
import UsaHighlights from "./components/UsaHighlights";
import ProgramsPage from "./components/ProgramsPage";
import navItems from "./data/navItems";
import { getCurrentUser, clearCurrentUser, getCandidates, setCurrentUser, syncFromBackend } from "./data/candidateStore";

const ADMIN_CREDENTIALS_LIST = [
  { identifier: "slobodan", password: "1234" },
  { identifier: "admin@americanadventure.rs", password: "Admin2026!" },
];

const ADMIN_SESSION_KEY = "aa_is_admin_v4";

function getInitialHref() {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname || "/";
  const search = window.location.search || "";
  const hash = window.location.hash || "";
  const full = `${path}${search}${hash}`;
  return full || "/";
}

export default function App() {
  const [activeHref, setActiveHref] = useState(getInitialHref);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return Boolean(getCurrentUser()) || localStorage.getItem(ADMIN_SESSION_KEY) === "true";
    } catch {
      return Boolean(getCurrentUser());
    }
  });
  const [currentCandidate, setCurrentCandidate] = useState(getCurrentUser);
  const [appliedProgram, setAppliedProgram] = useState("");
  const [accountProgram, setAccountProgram] = useState("");

  useEffect(() => {
    syncFromBackend(currentCandidate?.email).then((data) => {
      if (data?.candidate) {
        setCurrentCandidate((prev) => (prev ? { ...prev, ...data.candidate } : prev));
      }
    });
  }, []);

  const navigateTo = (href, { replace = false } = {}) => {
    if (!href) return;
    if (typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search + window.location.hash;
      if (current !== href) {
        if (replace) {
          window.history.replaceState({ href }, "", href);
        } else {
          window.history.pushState({ href }, "", href);
        }
      }
    }
    setActiveHref(href);
  };

  const handleNavigate = (e, href) => {
    if (e && e.preventDefault) e.preventDefault();
    navigateTo(href);
  };

  const goTo = (href) => navigateTo(href);

  // Sinhronizacija kada korisnik klikne Back / Forward u browseru
  useEffect(() => {
    const handlePopState = () => {
      const current = window.location.pathname + window.location.search + window.location.hash;
      setActiveHref(current || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = (creds = {}) => {
    const id = (creds.identifier || "").trim().toLowerCase();
    const admin = ADMIN_CREDENTIALS_LIST.some(
      (a) => a.identifier.toLowerCase() === id && a.password === creds.password
    );

    if (admin) {
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, "true");
      } catch {}
      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: id.includes("@") ? id : "admin@americanadventure.rs", password: creds.password }),
      }).catch(() => {});
      setIsAdmin(true);
      setCurrentCandidate(null);
      setLoggedIn(true);
      navigateTo("/admin");
      return { success: true };
    }

    const candidates = getCandidates();
    const found = candidates.find(
      (c) => c.email.toLowerCase() === id || (c.phone && c.phone.trim() === id)
    );

    if (found) {
      try {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      } catch {}
      setIsAdmin(false);
      setCurrentCandidate(found);
      setCurrentUser(found);
      setLoggedIn(true);
      navigateTo("/profil");
      return { success: true };
    } else {
      return {
        success: false,
        error:
          "Nalog sa ovom email adresom ne postoji. Prijaviti se može samo korisnik na čiji je email poslat verifikacioni kod i koji je registrovao nalog.",
      };
    }
  };

  const handleRegisterSubmit = (candidateProfile) => {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    setCurrentCandidate(candidateProfile);
    setIsAdmin(false);
    setLoggedIn(true);
    navigateTo("/profil");
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setIsAdmin(false);
    setCurrentCandidate(null);
    clearCurrentUser();
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    navigateTo("/");
  };

  // Skrol na vrh ili na anker element pri promeni rute
  useEffect(() => {
    if (activeHref.includes("#")) {
      const hash = activeHref.split("#")[1];
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeHref]);

  // Ekstrakcija bazne putanje i query parametara
  const basePath = activeHref.split("?")[0].split("#")[0];
  const queryStr = activeHref.includes("?") ? activeHref.split("?")[1].split("#")[0] : "";
  const params = new URLSearchParams(queryStr);
  const programParam = params.get("program") || params.get("p") || "";

  // Dinamički naslov taba u pregledaču
  useEffect(() => {
    const titles = {
      "/": "American Adventure",
      "/programi": "Programi",
      "/akcije": "Akcije i popusti",
      "/popusti": "Akcije i popusti",
      "/saradnja": "Saradnja",
      "/foto-story": "Foto-story i iskustva",
      "/iskustva": "Foto-story i iskustva",
      "/novosti": "Novosti i vesti",
      "/vesti": "Novosti i vesti",
      "/kontakt": "Kontakt",
      "/prijava": "Prijava na nalog",
      "/registracija": "Registracija naloga",
      "/prijava-online": "Online prijava za Work & Travel",
      "/nalog": "Moj profil",
      "/profil": "Moj profil",
      "/admin": "Admin portal",
    };
    document.title = titles[basePath] || "American Adventure — Work & Travel";
  }, [basePath]);

  // Provera aktivnih ruta (usklađeno sa Prilogom 1B)
  const isPrograms = basePath === "/programi";
  const isDiscounts = basePath === "/akcije" || basePath === "/popusti";
  const isCooperation = basePath === "/saradnja";
  const isExperiences = basePath === "/foto-story" || basePath === "/iskustva";
  const isNews = basePath === "/novosti" || basePath === "/vesti";
  const newsSlug =
    basePath.startsWith("/novosti/")
      ? basePath.slice("/novosti/".length)
      : basePath.startsWith("/vesti/")
      ? basePath.slice("/vesti/".length)
      : null;
  const isContact = basePath === "/kontakt";
  const isLogin = basePath === "/prijava";
  const isRegister = basePath === "/registracija";
  const isOnlineApply = basePath === "/prijava-online";
  const isProfile = basePath === "/profil" || basePath === "/nalog";
  const isAdminRoute = basePath === "/admin";

  // Direktan pristup adminu (/admin) ili prijavljen admin na ruti profila/naloga
  if (isAdminRoute || (loggedIn && isAdmin && isProfile)) {
    return <AdminPanel onLogout={handleLogout} onNavigate={handleNavigate} logoHref="/" />;
  }

  // Studentski nalog / Profil — Dashboard
  if (isProfile) {
    if (loggedIn && !isAdmin) {
      return (
        <>
          <Dashboard
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            logoHref="/"
            candidateData={currentCandidate}
            initialProgram={appliedProgram || accountProgram}
            onProgramChange={setAccountProgram}
          />
          <ChatWidget />
        </>
      );
    }

    // Ako student nije prijavljen a poseti /profil ili /nalog, prikazujemo formu za prijavu
    return (
      <>
        <Header
          navItems={navItems}
          activeHref={activeHref}
          onSearch={(query) => goTo(`/programi?search=${encodeURIComponent(query)}`)}
          onNavigate={handleNavigate}
          onLogin={() => goTo("/prijava")}
          onRegister={() => goTo("/registracija")}
          onApply={() => goTo("/prijava-online?program=work-and-travel")}
          loggedIn={false}
          appHref="/profil"
          appLabelKey="auth.myApp"
          logoHref="/"
        />
        <main>
          <Login
            onNavigate={handleNavigate}
            onSubmit={handleLogin}
            registerHref="/registracija"
            applyHref="/prijava-online"
          />
        </main>
        <Footer onNavigate={handleNavigate} />
        <ChatWidget />
      </>
    );
  }

  return (
    <>
      <Header
        navItems={navItems}
        activeHref={activeHref}
        onSearch={(query) => {
          console.log("search ->", query);
          goTo(`/programi?search=${encodeURIComponent(query)}`);
        }}
        onNavigate={handleNavigate}
        onLogin={() => goTo("/prijava")}
        onRegister={() => goTo("/registracija")}
        onApply={() => goTo("/prijava-online?program=work-and-travel")}
        loggedIn={loggedIn}
        appHref={isAdmin ? "/admin" : "/profil"}
        appLabelKey={isAdmin ? "dash.adminBadge" : "auth.myApp"}
        logoHref="/"
      />

      <main>
        {isPrograms ? (
          <ProgramsPage
            onNavigate={handleNavigate}
            initialProgramId={programParam || "work-and-travel"}
          />
        ) : isDiscounts ? (
          <Discounts onRegister={() => goTo("/prijava-online")} onNavigate={handleNavigate} />
        ) : isCooperation ? (
          <Cooperation />
        ) : isExperiences ? (
          <ExperiencesPage />
        ) : newsSlug ? (
          <NewsArticle slug={newsSlug} onNavigate={handleNavigate} />
        ) : isNews ? (
          <News onNavigate={handleNavigate} />
        ) : isContact ? (
          <Contact onSubmit={(c) => console.log("Kontakt upit poslat:", c)} />
        ) : isLogin ? (
          <Login
            onNavigate={handleNavigate}
            onSubmit={handleLogin}
            registerHref="/registracija"
            applyHref="/prijava-online"
          />
        ) : isRegister ? (
          <Register
            onNavigate={handleNavigate}
            onSubmit={handleRegisterSubmit}
            loginHref="/prijava"
            applyHref="/prijava-online"
          />
        ) : isOnlineApply ? (
          <OnlinePrijava
            onNavigate={handleNavigate}
            loginHref="/prijava"
            initialProgram={programParam || "work-and-travel"}
            onSubmit={(data) => {
              setAppliedProgram(data.program || "");
              console.log("online prijava ->", data);
            }}
          />
        ) : (
          <>
            {/* POČETNA STRANICA */}
            <Hero
              onNavigate={handleNavigate}
              primaryHref="/programi"
              secondaryHref="/prijava-online?program=work-and-travel"
            />
            {/* 1. VREMENSKE ZONE U SAD U REALNOM VREMENU (Prilog 1B, tačka 7) */}
            <TimeZones />
            <About />
            {/* 2. ZANIMLJIVOSTI O USA I DRŽAVE SAD (Prilog 1B, tačka 7) */}
            <UsaHighlights onNavigate={handleNavigate} />
            <Stats />
            <Experiences />
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Chat bot za kandidate i posetioce */}
      <ChatWidget />
    </>
  );
}
