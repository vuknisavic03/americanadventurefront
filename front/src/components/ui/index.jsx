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
    <div className={cx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props}>
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
            "font-display font-bold leading-[1.08]",
            Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
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

/** PageHeader — zaglavlje unutrašnjih stranica (Programi, Akcije, Novosti…). */
export function PageHeader({ title, lead, children }) {
  return (
    <header className="border-b border-line bg-white">
      <Container className="py-12 sm:py-16">
        <SectionHeading as="h1" title={title} lead={lead} />
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
