/** Number and date formatting. All money is Rwandan francs (RWF, no minor units). */

/** ISO 4217 code shown next to every amount. Change it here to switch the whole app. */
export const CURRENCY = "RWF";

// "en-US" grouping (1,234,567) is present in every ICU build, so server and browser agree.
const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 1234567 -> "1,234,567" */
export function num(n: number): string {
  return grouped.format(Math.round(n));
}

/** 1234567 -> "RWF 1,234,567" */
export function money(n: number): string {
  return `${CURRENCY} ${num(n)}`;
}

/** True minus sign (U+2212): same width as "+", no gap like a hyphen in tabular figures. */
export const MINUS = "\u2212";

/**
 * Short money for KPI tiles: 48_500_000 -> "48.5M", 850_000 -> "850K", 900 -> "900".
 * One decimal, trailing ".0" dropped.
 */
export function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? MINUS : "";
  const fmt = (v: number, unit: string) => `${sign}${trimZero(v.toFixed(1))}${unit}`;
  if (abs >= 1_000_000_000) return fmt(abs / 1_000_000_000, "B");
  if (abs >= 1_000_000) return fmt(abs / 1_000_000, "M");
  if (abs >= 1_000) return fmt(abs / 1_000, "K");
  return `${sign}${num(abs)}`;
}

function trimZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Signed with explicit "+" and a true minus, e.g. 250 -> "+250", -2 -> "−2", 0 -> "0". */
export function signed(n: number): string {
  if (n > 0) return `+${num(n)}`;
  if (n < 0) return `${MINUS}${num(-n)}`;
  return "0";
}

/** 0.357 -> "35.7%" (one decimal, trailing ".0" dropped). */
export function pct(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "0%";
  return `${trimZero((ratio * 100).toFixed(digits))}%`;
}

/** Safe ratio: returns 0 when the denominator is 0. */
export function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/*
 * Dates are formatted from fixed tables, not toLocaleDateString: ICU builds differ
 * between Node and browsers ("Sep" vs "Sept", commas), which breaks hydration.
 */

/** ISO date "2026-09-30" -> "30 Sep 2026". */
export function day(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** ISO date "2026-09-30" -> "30 Sep". */
export function shortDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

/** ISO date -> three-letter weekday, e.g. "Wed". */
export function weekday(iso: string): string {
  return WEEKDAYS[new Date(utcMs(iso)).getUTCDay()].slice(0, 3);
}

/** ISO date -> "September 2026". */
export function monthName(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Local calendar day as ISO "YYYY-MM-DD". */
export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift an ISO day by whole days. */
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + delta));
  return t.toISOString().slice(0, 10);
}

/** "Wednesday, 30 September" */
export function longDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${WEEKDAYS[new Date(utcMs(iso)).getUTCDay()]}, ${d} ${MONTHS[m - 1]}`;
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcMs(toIso) - utcMs(fromIso)) / 86_400_000);
}

function utcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
