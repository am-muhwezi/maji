import type { Expense, ExpenseCategory } from "@/lib/types";

/** "EXP-041" -> 41. Refs are the only tie-breaker we have within a day. */
function refNumber(ref: string): number {
  const n = Number(ref.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Newest first: later day first, then the higher voucher number. */
export function newestFirst(list: Expense[]): Expense[] {
  return [...list].sort((a, b) => (a.day === b.day ? refNumber(b.ref) - refNumber(a.ref) : a.day < b.day ? 1 : -1));
}

export type CategoryFilter = "all" | ExpenseCategory;

/** Case-insensitive match on description, vendor, or ref, plus an optional category. */
export function filterExpenses(list: Expense[], query: string, category: CategoryFilter): Expense[] {
  const q = query.trim().toLowerCase();
  return list.filter(
    (e) =>
      (category === "all" || e.category === category) &&
      (!q || e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.ref.toLowerCase().includes(q)),
  );
}

export function sumAmount(list: Expense[]): number {
  return list.reduce((a, e) => a + e.amount, 0);
}
