/**
 * Pure business math. Every number the UI shows about stock, money, or credit
 * comes from a function in this file, so it is tested once and never re-derived in JSX.
 */
import { EXPENSE_LABEL, product } from "./catalog";
import { addDays, daysBetween, monthName } from "./format";
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

export interface Collected {
  /** Paid at the counter today (cash + mobile money). */
  atSale: number;
  /** Old credit sales that customers paid today. */
  creditRepaid: number;
  total: number;
  cash: number;
  mobile: number;
}

/**
 * Money that actually came in on `day`: today's non-credit sales plus any credit sale
 * marked paid today (whatever day it was sold). This is what the cash drawer should hold.
 */
export function collectedOn(sales: Sale[], day: string): Collected {
  const c: Collected = { atSale: 0, creditRepaid: 0, total: 0, cash: 0, mobile: 0 };
  for (const s of sales) {
    if (s.day === day && s.payment !== "credit") {
      c.atSale += s.amount;
      if (s.payment === "cash") c.cash += s.amount;
      else c.mobile += s.amount;
    }
    if (s.payment === "credit" && s.paidDay === day) c.creditRepaid += s.amount;
  }
  c.total = c.atSale + c.creditRepaid;
  return c;
}

/* ---------- Credit ---------- */

export type AgingBucket = "current" | "due-soon" | "overdue";

/** Display order and wording for money-owed buckets. Every page uses these. */
export const AGING_ORDER: AgingBucket[] = ["overdue", "due-soon", "current"];
export const AGING_LABEL: Record<AgingBucket, { label: string; hint: string }> = {
  overdue: { label: "Overdue", hint: "Past the due date" },
  "due-soon": { label: "Due within 7 days", hint: "Follow up this week" },
  current: { label: "Not due yet", hint: "More than 7 days left" },
};

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


/* ---------- Periods ---------- */

/** An inclusive range of ISO days with a human label. */
export interface Period {
  from: string;
  to: string;
  label: string;
  /** Days in the range so far (for "per day" figures). */
  days: number;
}

export function inPeriod(day: string, p: Pick<Period, "from" | "to">): boolean {
  return day >= p.from && day <= p.to;
}

/** Calendar month containing today (offset 0) or the one before (offset -1). Never runs past today. */
export function monthPeriod(today: string, offset: 0 | -1 = 0): Period {
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + offset, 1));
  const from = first.toISOString().slice(0, 10);
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const to = last < today ? last : today;
  return { from, to, label: monthName(from), days: daysBetween(from, to) + 1 };
}

/** The last `n` days ending today. */
export function rollingPeriod(today: string, n: number): Period {
  return { from: addDays(today, -(n - 1)), to: today, label: `Last ${n} days`, days: n };
}

export function inMonth(day: string, today: string): boolean {
  return inPeriod(day, monthPeriod(today));
}

/** @deprecated name kept for existing imports. */
export type MonthPnl = PeriodPnl;

export interface PeriodPnl {
  revenue: number;
  expenses: number;
  net: number;
  margin: number;
  litres: number;
}

/** Profit and loss for a period: history + itemised sales in range, minus expenses in range. */
export function periodPnl(state: OpsState, p: Period): PeriodPnl {
  let revenue = 0;
  let litres = 0;
  for (const h of state.history) {
    if (inPeriod(h.day, p)) {
      revenue += h.refill + h.newBottle;
      litres += h.litres;
    }
  }
  const itemised = salesSummary(state.sales.filter((s) => inPeriod(s.day, p)));
  revenue += itemised.total;
  litres += itemised.litres;
  const expenses = state.expenses.filter((e) => inPeriod(e.day, p)).reduce((a, e) => a + e.amount, 0);
  const net = revenue - expenses;
  return { revenue, expenses, net, margin: revenue === 0 ? 0 : net / revenue, litres };
}

export function expensesIn(state: OpsState, p: Period): Expense[] {
  return state.expenses.filter((e) => inPeriod(e.day, p));
}

export interface ProductRevenue {
  productId: ProductId;
  name: string;
  amount: number;
  share: number;
}

/** Revenue per product for a period (history split by `historyMix` + itemised sales). Largest first. */
export function periodByProduct(state: OpsState, p: Period): ProductRevenue[] {
  const historyTotal = state.history
    .filter((h) => inPeriod(h.day, p))
    .reduce((a, h) => a + h.refill + h.newBottle, 0);
  const sums = new Map<ProductId, number>();
  for (const [id, share] of Object.entries(state.historyMix) as [ProductId, number][]) {
    sums.set(id, Math.round(historyTotal * share));
  }
  for (const s of state.sales) {
    if (inPeriod(s.day, p)) sums.set(s.productId, (sums.get(s.productId) ?? 0) + s.amount);
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()]
    .map(([productId, amount]) => ({ productId, name: product(productId).name, amount, share: total === 0 ? 0 : amount / total }))
    .sort((a, b) => b.amount - a.amount);
}

/** One entry per day of the period (oldest first), history plus itemised sales split by kind. */
export function dailyVolumes(state: OpsState, p: Period): DayVolume[] {
  const byDay = new Map<string, DayVolume>();
  for (let d = p.from; d <= p.to; d = addDays(d, 1)) byDay.set(d, { day: d, refill: 0, newBottle: 0 });
  for (const h of state.history) {
    const v = byDay.get(h.day);
    if (v) {
      v.refill += h.refill;
      v.newBottle += h.newBottle;
    }
  }
  for (const s of state.sales) {
    const v = byDay.get(s.day);
    if (!v) continue;
    if (s.kind === "new") v.newBottle += s.amount;
    else v.refill += s.amount;
  }
  return [...byDay.values()];
}

/* ---------- Shorthands used by pages ---------- */

/** Calendar month to date. */
export function monthPnl(state: OpsState): PeriodPnl {
  return periodPnl(state, monthPeriod(state.today));
}

export function monthByProduct(state: OpsState): ProductRevenue[] {
  return periodByProduct(state, monthPeriod(state.today));
}

/** Last 7 days ending today, oldest first. */
export function weekVolumes(state: OpsState): DayVolume[] {
  return dailyVolumes(state, rollingPeriod(state.today, 7));
}
