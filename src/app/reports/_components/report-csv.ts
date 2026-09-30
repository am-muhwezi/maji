import { expensesByCategory, expensesIn, periodByProduct, periodPnl, type Period } from "@/lib/ledger";
import { CURRENCY } from "@/lib/format";
import type { OpsState } from "@/lib/types";

/** Quote a CSV field only when it needs it (comma, quote, newline). */
function field(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Percent with one decimal as a plain number (0.357 -> 35.7). */
function share(r: number): number {
  return Math.round(r * 1000) / 10;
}

/**
 * Period summary as CSV: profit and loss, sales per product, costs per category.
 * Plain integers with an ASCII minus so Excel and Sheets read them as numbers.
 */
export function monthCsv(state: OpsState, period: Period): string {
  const pnl = periodPnl(state, period);
  const products = periodByProduct(state, period);
  const costs = expensesByCategory(expensesIn(state, period));
  const rows: (string | number)[][] = [
    ["Monthly report", period.label, "from", period.from, "to", period.to],
    [],
    ["Profit and loss", CURRENCY],
    ["Sales", pnl.revenue],
    ...costs.map((c) => [`Cost: ${c.label}`, -c.amount]),
    ["Total costs", -pnl.expenses],
    ["Net income", pnl.net],
    ["Margin %", share(pnl.margin)],
    ["Litres sold", Math.round(pnl.litres)],
    [],
    ["Sales by product", CURRENCY, "Share %"],
    ...products.map((p) => [p.name, p.amount, share(p.share)]),
    [],
    ["Costs by category", CURRENCY, "Share %"],
    ...costs.map((c) => [c.label, c.amount, share(c.share)]),
  ];
  return rows.map((r) => r.map(field).join(",")).join("\n") + "\n";
}

/** "monthly-report-2026-09.csv", named after the month the period covers. */
export function monthCsvFilename(period: Period): string {
  return `monthly-report-${period.from.slice(0, 7)}.csv`;
}
