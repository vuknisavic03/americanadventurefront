// NewsImage.jsx
import { useState } from "react";


// Tematske ikonice za placeholder (dok prava fotka ne postoji ili se ne učita).
function PlaneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.2 13.8L3 12l1-2 6 1 4.5-4.5a2 2 0 0 1 2.8 2.8L13 14l1 6-2 1-1.8-7.2z" />
    </svg>
  );
}
function DocIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v4h4" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}
function SchoolIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 9l10-4 10 4-10 4L2 9z" />
      <path d="M6 11v4c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-4" />
      <path d="M22 9v5" />
    </svg>
  );
}
const THEME_ICONS = { plane: PlaneIcon, document: DocIcon, school: SchoolIcon };

/**
 * NewsImage — prava fotka ako se učita, inače neutralna podloga sa ikonicom po `theme`.
 * `className` kontroliše dimenzije/odnos (npr. "aspect-[16/9] w-full").
 */
export default function NewsImage({ src, theme, alt, className = "", eager = false }) {
  const [err, setErr] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  const Icon = THEME_ICONS[theme] || PlaneIcon;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-surface-2 text-ink-3 ${className}`}>
      {/* Ikonica samo kad slika ne postoji ili ne može da se učita — ne i dok se učitava. */}
      {err && <Icon className="h-14 w-14 opacity-40" />}
      {src && !err && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
