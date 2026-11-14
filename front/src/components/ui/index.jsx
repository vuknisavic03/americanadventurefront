// ui/index.jsx
// Zajednički UI primitivi dizajn sistema. Sve što se ponavlja na više ekrana
// (dugme, polje, naslov sekcije, značka) živi ovde — jedan izgled, jedno mesto za izmenu.
// Tokeni (boje, radijusi, senke) su u src/index.css.

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Dugme ---------- */
const BTN_BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_SIZE = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

const BTN_VARIANT = {
  primary: "bg-brand text-ink hover:bg-brand-strong",
  dark: "bg-ink text-white hover:bg-neutral-950",
  outline: "border border-line-strong bg-white text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-ink/5",
  ghostInverse: "text-white hover:bg-white/10",
  inverse: "border border-white/40 text-white hover:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

/** Klase dugmeta — za elemente koji nisu <Button> (npr. <a>, <label>). */
export function buttonCls({ variant = "primary", size = "md", block = false, className = "" } = {}) {
  return cx(BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], block && "w-full", className);
}

/**
 * Button — jedino dugme u sistemu.
 *  variant: primary (žuto, jedna glavna akcija po ekranu) | dark | outline | ghost | inverse | danger
 *  size:    sm | md | lg
 *  href:    ako je zadat, renderuje se kao <a>
 */
export function Button({ variant, size, block, className, href, type = "button", children, ...props }) {
  const cls = buttonCls({ variant, size, block, className });
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}

/* ---------- Forme ---------- */
export const labelCls = "block text-sm font-medium text-ink";

export const inputCls =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-3/70 hover:border-ink/40 focus:border-ink focus:outline-hidden focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-3 sm:text-sm";

/** Kompaktno polje za guste ekrane (admin, modali). */
export const inputSmCls =
  "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3/70 hover:border-ink/40 focus:border-ink focus:outline-hidden focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-3";

/* ---------- Raspored ---------- */
export function Container({ className = "", children, ...props }) {
  return (
    <div className={cx("mx-auto w-full max-w-7xl px-5 sm:px-8", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SectionHeading — naslov sekcije (levo poravnat, bez dekoracije).
 *  as: h1 za naslov stranice, h2 (default) za sekciju
 */
export function SectionHeading({ as: Tag = "h2", title, lead, action, className = "", tone = "light" }) {
  const dark = tone === "dark";
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-x-10 gap-y-5", className)}>
      <div className="max-w-2xl">
        <Tag
          className={cx(
            "font-display font-extrabold leading-[0.98]",
            Tag === "h1" ? "text-[clamp(2.6rem,6vw,5rem)]" : "text-[clamp(2rem,4.2vw,3.2rem)]",
            dark ? "text-white" : "text-ink"
          )}
        >
          {title}
        </Tag>
        {lead && (
          <p className={cx("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-white/70" : "text-ink-2")}>{lead}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * PageHeader — zaglavlje unutrašnjih stranica: žuto polje kao putokaz, veliki naslov levo.
 * children (npr. tabovi, filteri) idu ispod naslova, i dalje na žutom.
 */
export function PageHeader({ title, lead, crumb, children }) {
  return (
    <header className="bg-brand">
      <Container className="pb-12 pt-10 sm:pb-16 sm:pt-14">
        {/* Ruta od početne do ove strane — ista oznaka kao u heroju */}
        <p className="font-sign flex max-w-sm items-center gap-3 text-base font-bold text-ink">
          <a href="/" className="hover:underline hover:decoration-2 hover:underline-offset-4">
            Početna
          </a>
          <span className="perforation flex-1 text-ink/35" aria-hidden="true" />
          <PlaneIcon className="h-4 w-4" />
          <span className="truncate">{crumb || title}</span>
        </p>
        <h1 className="font-display mt-8 max-w-5xl text-[clamp(2.6rem,6.4vw,5.4rem)] font-extrabold leading-[0.92] text-ink">{title}</h1>
        {lead && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">{lead}</p>}
        {children}
      </Container>
    </header>
  );
}

/* ---------- Značka ---------- */
const BADGE_TONE = {
  neutral: "bg-surface-2 text-ink-2",
  brand: "bg-brand text-ink",
  success: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-surface-2 text-ink",
};

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", BADGE_TONE[tone] || BADGE_TONE.neutral, className)}>
      {children}
    </span>
  );
}

/* ---------- Ikonice (ručno crtane, nasleđuju boju) ---------- */
function Svg({ className = "h-5 w-5", strokeWidth = 2, children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);
export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
);
export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Svg>
);
export const MoonIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);
export const PlaneIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.5 12.2c0-.6-.5-1-1.1-1H15L10.3 3.6a.8.8 0 0 0-.7-.4H8.4a.5.5 0 0 0-.5.6l2.2 7.4H5.6L3.9 8.9a.6.6 0 0 0-.5-.3H2.5a.4.4 0 0 0-.4.5l1 3.1-1 3.1a.4.4 0 0 0 .4.5h.9c.2 0 .4-.1.5-.3l1.7-2.3h4.5l-2.2 7.4a.5.5 0 0 0 .5.6h1.2c.3 0 .5-.1.7-.4L15 13.2h5.4c.6 0 1.1-.4 1.1-1z" />
  </svg>
);

/** Plus u žutom krugu — oznaka za otvaranje (pretvara se u minus kad je <details> otvoren; roditelj mora imati klasu `group`). */
export function PlusMark({ className = "" }) {
  return (
    <span className={cx("relative h-6 w-6 shrink-0 rounded-full bg-brand", className)} aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-ink" />
      <span className="absolute left-1/2 top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink transition-transform group-open:scale-y-0" />
    </span>
  );
}

/** Naslov bloka unutar stranice (manji od SectionHeading, isti glas). */
export function BlockTitle({ children, className = "" }) {
  return <h2 className={cx("font-display text-[clamp(1.8rem,3.2vw,2.5rem)] font-extrabold leading-[1] text-ink", className)}>{children}</h2>;
}

/**
 * SubNav — bela traka sa izborom (rubrike, programi, delovi strane) odmah ispod žutog zaglavlja.
 * Lepi se ispod glavnog menija dok se skroluje. items: [{ key, label, active, onClick?, href? }]
 */
export function SubNav({ label, items }) {
  return (
    <nav aria-label={label} className="sticky top-16 z-20 border-b border-line bg-white lg:top-[72px]">
      <Container>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-3 sm:mx-0 sm:px-0">
          {items.map((it) => {
            const cls = cx(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150",
              it.active ? "bg-ink text-white" : "border border-line-strong text-ink hover:border-ink"
            );
            return it.href ? (
              <a key={it.key} href={it.href} onClick={it.onClick} className={cls}>
                {it.label}
              </a>
            ) : (
              <button key={it.key} type="button" aria-pressed={it.active} onClick={it.onClick} className={cls}>
                {it.label}
              </button>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
