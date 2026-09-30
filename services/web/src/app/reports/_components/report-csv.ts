import { expensesByCategory, inMonth, monthByProduct, monthPnl } from "@/lib/ledger";
import type { OpsState } from "@/lib/types";

/** Quote a CSV field only when it needs it (comma, quote, newline). */
function field(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/**
 * Month-to-date summary as CSV: profit and loss, sales per product, costs per category.
 * Plain integers (RWF, no separators) so Excel reads them as numbers.
 */
export function monthCsv(state: OpsState): string {
  const pnl = monthPnl(state);
  const products = monthByProduct(state);
  const costs = expensesByCategory(state.expenses.filter((e) => inMonth(e.day, state.today)));
  const rows: (string | number)[][] = [
    ["Monthly report", state.today.slice(0, 7), "month to date, up to", state.today],
    [],
    ["Profit and loss", "RWF"],
    ["Sales", pnl.revenue],
    ...costs.map((c) => [`Cost: ${c.label}`, -c.amount]),
    ["Total costs", -pnl.expenses],
    ["Net income", pnl.net],
    ["Margin %", Math.round(pnl.margin * 1000) / 10],
    ["Litres sold", Math.round(pnl.litres)],
    [],
    ["Sales by product", "RWF", "Share %"],
    ...products.map((p) => [p.name, p.amount, Math.round(p.share * 1000) / 10]),
    [],
    ["Costs by category", "RWF", "Share %"],
    ...costs.map((c) => [c.label, c.amount, Math.round(c.share * 1000) / 10]),
  ];
  return rows.map((r) => r.map(field).join(",")).join("\n") + "\n";
}

export function monthCsvFilename(today: string): string {
  return `monthly-report-${today.slice(0, 7)}.csv`;
}
