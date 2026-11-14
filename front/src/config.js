// config.js — podešavanja koja zavise od okruženja (Vite env promenljive).

/**
 * Prototip (demo) režim.
 *
 * Dok je uključen, važi demo administratorski nalog i na strani za prijavu se vidi
 * prečica za njega — zgodno za prezentacije, neprihvatljivo za produkciju.
 *
 * Za produkcioni build postaviti `VITE_DEMO_MODE=false`: demo nalog se tada uopšte
 * ne nalazi u paketu, a administrator se prijavljuje isključivo preko backenda
 * (Payload `/api/users/login`).
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

export const DEMO_ADMIN = DEMO_MODE ? { identifier: "slobodan", password: "1234" } : null;
