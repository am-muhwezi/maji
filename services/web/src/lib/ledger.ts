/**
 * Pure business math. Every number the UI shows about stock, money, or credit
 * comes from a function in this file, so it is tested once and never re-derived in JSX.
 */
import { EXPENSE_LABEL, product } from "./catalog";
import { daysBetween } from "./format";
import type {
  DayVolume,
  Expense,
  ExpenseCategory,
  Material,
  OpsState,
  PaymentMethod,
  ProductId,
  Sale,
  StockLine,
} from "./types";

/* ---------- Stock reconciliation ---------- */

/** Expected closing stock: opening + production − sales. */
export function expected(line: StockLine): number {
  return line.opening + line.production - line.sales;
}

/** Physical minus expected. `null` until the line is counted. Negative = shortage. */
export function variance(line: StockLine): number | null {
  return line.physical === null ? null : line.physical - expected(line);
}

export type LineStatus = "uncounted" | "balanced" | "short" | "over";

export function lineStatus(line: StockLine): LineStatus {
  const v = variance(line);
  if (v === null) return "uncounted";
  if (v === 0) return "balanced";
  return v < 0 ? "short" : "over";
}

/** Money lost (negative) or gained on a line at refill price. 0 when uncounted. */
export function varianceValue(line: StockLine): number {
  const v = variance(line);
  return v === null ? 0 : v * product(line.productId).refillPrice;
}

export interface StockTotals {
  opening: number;
  production: number;
  sales: number;
  expected: number;
  /** Sum of counted lines only. */
  physical: number;
  /** Sum of variances over counted lines. */
  variance: number;
  counted: number;
  lines: number;
  shortLines: number;
  litresProduced: number;
}

export function stockTotals(lines: StockLine[]): StockTotals {
  const t: StockTotals = {
    opening: 0, production: 0, sales: 0, expected: 0, physical: 0,
    variance: 0, counted: 0, lines: lines.length, shortLines: 0, litresProduced: 0,
  };
  for (const l of lines) {
    t.opening += l.opening;
    t.production += l.production;
    t.sales += l.sales;
    t.expected += expected(l);
    t.litresProduced += l.production * product(l.productId).litres;
    const v = variance(l);
    if (v !== null) {
      t.counted += 1;
      t.physical += l.physical ?? 0;
      t.variance += v;
      if (v < 0) t.shortLines += 1;
    }
  }
  return t;
}

/** Lines with an unexplained shortage (short and not yet resolved). */
export function openShortages(state: Pick<OpsState, "lines" | "resolutions" | "today">): StockLine[] {
  const resolved = new Set(
    state.resolutions.filter((r) => r.day === state.today).map((r) => r.productId),
  );
  return state.lines.filter((l) => lineStatus(l) === "short" && !resolved.has(l.productId));
}

/** A day can be closed once every line is counted and every shortage has a resolution. */
export function canCloseDay(state: Pick<OpsState, "lines" | "resolutions" | "today">): {
  ok: boolean;
  reason?: string;
} {
  const uncounted = state.lines.filter((l) => l.physical === null).length;
  if (uncounted > 0) return { ok: false, reason: `${uncounted} product${uncounted > 1 ? "s" : ""} still to count` };
  const open = openShortages(state).length;
  if (open > 0) return { ok: false, reason: `${open} shortage${open > 1 ? "s" : ""} to explain` };
  return { ok: true };
}

/* ---------- Materials ---------- */

export type MaterialStatus = "ok" | "reorder";

export function materialStatus(m: Material): MaterialStatus {
  return m.onHand <= m.reorderAt ? "reorder" : "ok";
}

/* ---------- Sales ---------- */

export function salesOn(sales: Sale[], day: string): Sale[] {
  return sales.filter((s) => s.day === day);
}

export function isOutstanding(s: Sale): boolean {
  return s.payment === "credit" && !s.paidDay;
}

export interface SalesSummary {
  total: number;
  /** Money actually received (everything except unpaid credit). */
  collected: number;
  byMethod: Record<PaymentMethod, number>;
  units: number;
  receipts: number;
  litres: number;
}

export function salesSummary(sales: Sale[]): SalesSummary {
  const s: SalesSummary = {
    total: 0, collected: 0, units: 0, receipts: sales.length, litres: 0,
    byMethod: { cash: 0, mtn: 0, airtel: 0, credit: 0 },
  };
  for (const sale of sales) {
    s.total += sale.amount;
    s.byMethod[sale.payment] += sale.amount;
    if (!isOutstanding(sale)) s.collected += sale.amount;
    s.units += sale.qty;
    s.litres += sale.qty * product(sale.productId).litres;
  }
  return s;
}

/* ---------- Credit ---------- */

export type AgingBucket = "current" | "due-soon" | "overdue";

export interface Receivable {
  sale: Sale;
  /** Days until due (negative = days overdue). */
  dueIn: number;
  bucket: AgingBucket;
}

/** Unpaid credit sales, most urgent first. "due-soon" = due within 7 days. */
export function receivables(sales: Sale[], today: string): Receivable[] {
  return sales
    .filter(isOutstanding)
    .map((sale) => {
      const dueIn = daysBetween(today, sale.dueDay ?? sale.day);
      const bucket: AgingBucket = dueIn < 0 ? "overdue" : dueIn <= 7 ? "due-soon" : "current";
      return { sale, dueIn, bucket };
    })
    .sort((a, b) => a.dueIn - b.dueIn);
}

export function agingTotals(list: Receivable[]): Record<AgingBucket, number> & { total: number; accounts: number } {
  const t = { current: 0, "due-soon": 0, overdue: 0, total: 0, accounts: 0 };
  const customers = new Set<string>();
  for (const r of list) {
    t[r.bucket] += r.sale.amount;
    t.total += r.sale.amount;
    customers.add(r.sale.customer);
  }
  t.accounts = customers.size;
  return t;
}

/* ---------- Expenses ---------- */

export interface CategoryTotal {
  category: ExpenseCategory;
  label: string;
  amount: number;
  share: number;
}

/** Totals per category, largest first. Categories with no spend are omitted. */
export function expensesByCategory(expenses: Expense[]): CategoryTotal[] {
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const sums = new Map<ExpenseCategory, number>();
  for (const e of expenses) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  return [...sums.entries()]
    .map(([category, amount]) => ({
      category,
      label: EXPENSE_LABEL[category],
      amount,
      share: total === 0 ? 0 : amount / total,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function inMonth(day: string, today: string): boolean {
  return day.slice(0, 7) === today.slice(0, 7);
}

/* ---------- Month / week roll-ups ---------- */

export interface MonthPnl {
  revenue: number;
  expenses: number;
  net: number;
  margin: number;
  litres: number;
}

export function monthPnl(state: OpsState): MonthPnl {
  const monthSales = state.sales.filter((s) => inMonth(s.day, state.today));
  const sum = salesSummary(monthSales);
  const revenue = state.monthRevenueBefore + sum.total;
  const expenses = state.expenses
    .filter((e) => inMonth(e.day, state.today))
    .reduce((a, e) => a + e.amount, 0);
  const net = revenue - expenses;
  return {
    revenue,
    expenses,
    net,
    margin: revenue === 0 ? 0 : net / revenue,
    litres: state.monthLitresBefore + sum.litres,
  };
}

export interface ProductRevenue {
  productId: ProductId;
  name: string;
  amount: number;
  share: number;
}

/** Month revenue per product: baseline mix plus recorded sales this month. Largest first. */
export function monthByProduct(state: OpsState): ProductRevenue[] {
  const sums = new Map<ProductId, number>();
  for (const [id, share] of Object.entries(state.monthMixBefore) as [ProductId, number][]) {
    sums.set(id, Math.round(state.monthRevenueBefore * share));
  }
  for (const s of state.sales) {
    if (inMonth(s.day, state.today)) sums.set(s.productId, (sums.get(s.productId) ?? 0) + s.amount);
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()]
    .map(([productId, amount]) => ({ productId, name: product(productId).name, amount, share: total === 0 ? 0 : amount / total }))
    .sort((a, b) => b.amount - a.amount);
}

/** Last 7 days (oldest first) with today computed live from recorded sales. */
export function weekVolumes(state: OpsState): DayVolume[] {
  const todays = salesOn(state.sales, state.today);
  const today: DayVolume = { day: state.today, refill: 0, newBottle: 0 };
  for (const s of todays) {
    if (s.kind === "new") today.newBottle += s.amount;
    else today.refill += s.amount;
  }
  return [...state.weekBefore.slice(-6), today];
}
