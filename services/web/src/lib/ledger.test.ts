import { describe, expect, it } from "vitest";
import {
  agingTotals,
  canCloseDay,
  expected,
  expensesByCategory,
  lineStatus,
  materialStatus,
  monthByProduct,
  monthPnl,
  openShortages,
  receivables,
  salesSummary,
  stockTotals,
  variance,
  varianceValue,
  weekVolumes,
} from "./ledger";
import { seed } from "./seed";
import type { Sale, StockLine } from "./types";

const TODAY = "2026-09-30";
const line = (over: Partial<StockLine> = {}): StockLine => ({ productId: "b20", opening: 340, production: 250, sales: 240, physical: 348, ...over });

describe("stock reconciliation", () => {
  it("expected = opening + production - sales", () => {
    expect(expected(line())).toBe(350);
  });

  it("variance is physical - expected, null when uncounted", () => {
    expect(variance(line())).toBe(-2);
    expect(variance(line({ physical: 350 }))).toBe(0);
    expect(variance(line({ physical: 352 }))).toBe(2);
    expect(variance(line({ physical: null }))).toBeNull();
  });

  it("classifies every state, including a count of zero", () => {
    expect(lineStatus(line({ physical: null }))).toBe("uncounted");
    expect(lineStatus(line({ physical: 350 }))).toBe("balanced");
    expect(lineStatus(line())).toBe("short");
    expect(lineStatus(line({ physical: 351 }))).toBe("over");
    expect(lineStatus(line({ physical: 0 }))).toBe("short");
  });

  it("values a variance at refill price", () => {
    expect(varianceValue(line())).toBe(-10_000);
    expect(varianceValue(line({ physical: null }))).toBe(0);
  });

  it("totals only counted lines for physical and variance", () => {
    const t = stockTotals([line(), line({ productId: "d19", physical: null })]);
    expect(t.expected).toBe(700);
    expect(t.physical).toBe(348);
    expect(t.variance).toBe(-2);
    expect(t.counted).toBe(1);
    expect(t.shortLines).toBe(1);
    expect(t.litresProduced).toBe(250 * 20 + 250 * 18.9);
  });
});

describe("closing the day", () => {
  it("blocks while products are uncounted", () => {
    const s = seed(TODAY);
    expect(canCloseDay(s)).toEqual({ ok: false, reason: "2 products still to count" });
  });

  it("blocks while shortages are unexplained, then allows once resolved", () => {
    const s = seed(TODAY);
    s.lines = s.lines.map((l) => ({ ...l, physical: l.physical ?? expected(l) }));
    expect(openShortages(s).map((l) => l.productId)).toEqual(["b20", "d19"]);
    expect(canCloseDay(s)).toEqual({ ok: false, reason: "2 shortages to explain" });
    s.resolutions = [
      { productId: "b20", kind: "spillage", note: "", day: TODAY },
      { productId: "d19", kind: "driver", note: "", day: TODAY },
    ];
    expect(canCloseDay(s)).toEqual({ ok: true });
  });

  it("ignores resolutions from other days", () => {
    const s = seed(TODAY);
    s.resolutions = [{ productId: "d19", kind: "spillage", note: "", day: "2026-09-29" }];
    expect(openShortages(s).map((l) => l.productId)).toEqual(["b20", "d19"]);
  });
});

describe("sales", () => {
  const sale = (over: Partial<Sale>): Sale => ({
    id: "x", receipt: "SL-1", day: TODAY, time: "10:00", customer: "A", productId: "b20",
    kind: "refill", qty: 10, amount: 50_000, payment: "cash", ...over,
  });

  it("splits totals by method and excludes unpaid credit from collected", () => {
    const s = salesSummary([
      sale({ amount: 50_000 }),
      sale({ amount: 30_000, payment: "mtn" }),
      sale({ amount: 20_000, payment: "credit", dueDay: TODAY }),
      sale({ amount: 10_000, payment: "credit", dueDay: TODAY, paidDay: TODAY }),
    ]);
    expect(s.total).toBe(110_000);
    expect(s.collected).toBe(90_000);
    expect(s.byMethod).toEqual({ cash: 50_000, mtn: 30_000, airtel: 0, credit: 30_000 });
    expect(s.units).toBe(40);
    expect(s.litres).toBe(800);
  });

  it("ages receivables and sorts most urgent first", () => {
    const list = receivables(
      [
        sale({ id: "a", payment: "credit", dueDay: "2026-10-20", amount: 1 }),
        sale({ id: "b", payment: "credit", dueDay: "2026-09-20", amount: 10 }),
        sale({ id: "c", payment: "credit", dueDay: "2026-10-07", amount: 100 }),
        sale({ id: "d", payment: "credit", dueDay: "2026-09-01", paidDay: TODAY, amount: 1000 }),
        sale({ id: "e", payment: "cash", amount: 5000 }),
      ],
      TODAY,
    );
    expect(list.map((r) => [r.sale.id, r.dueIn, r.bucket])).toEqual([
      ["b", -10, "overdue"],
      ["c", 7, "due-soon"],
      ["a", 20, "current"],
    ]);
    expect(agingTotals(list)).toMatchObject({ overdue: 10, "due-soon": 100, current: 1, total: 111, accounts: 1 });
  });
});

describe("expenses and roll-ups", () => {
  it("groups by category, largest first, shares sum to 1", () => {
    const s = seed(TODAY);
    const cats = expensesByCategory(s.expenses);
    expect(cats[0].category).toBe("power");
    expect(cats.map((c) => c.amount)).toEqual([...cats.map((c) => c.amount)].sort((a, b) => b - a));
    expect(cats.reduce((a, c) => a + c.share, 0)).toBeCloseTo(1, 10);
    expect(cats.reduce((a, c) => a + c.amount, 0)).toBe(31_200_000);
    expect(expensesByCategory([])).toEqual([]);
  });

  it("computes the month P&L from baseline plus recorded sales in this month", () => {
    const s = seed(TODAY);
    const p = monthPnl(s);
    // 29 prior days × 1.55M + today's receipts (2.918M) + in-month older credit (0.52M + 0.23M + 0.38M).
    expect(p.revenue).toBe(29 * 1_550_000 + 2_918_000 + 1_130_000);
    expect(p.expenses).toBe(31_200_000);
    expect(p.net).toBe(p.revenue - p.expenses);
    expect(p.margin).toBeCloseTo(p.net / p.revenue, 10);
  });

  it("splits month revenue by product and reconciles to the P&L total", () => {
    const s = seed(TODAY);
    const rows = monthByProduct(s);
    const sum = rows.reduce((a, r) => a + r.amount, 0);
    // Baseline shares are rounded per product, so allow a few francs of drift.
    expect(Math.abs(sum - monthPnl(s).revenue)).toBeLessThan(5);
    expect(rows[0].productId).toBe("b20");
    expect(rows.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1, 10);
    expect(Object.values(s.monthMixBefore).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("seed ledger agrees with today's receipts and keeps the sample shortages", () => {
    const s = seed(TODAY);
    for (const l of s.lines) {
      const sold = s.sales.filter((x) => x.day === TODAY && x.productId === l.productId).reduce((a, x) => a + x.qty, 0);
      expect(l.sales).toBe(sold);
    }
    expect(s.lines.map((l) => variance(l))).toEqual([-2, 0, -12, null, null]);
    const receipts = s.sales.filter((x) => x.day === TODAY).map((x) => [x.time, Number(x.receipt.slice(3))]);
    const byTime = [...receipts].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    expect(byTime.map((r) => r[1])).toEqual([...byTime.map((r) => r[1])].sort((a, b) => Number(a) - Number(b)));
  });

  it("keeps expenses inside the current month early in a month", () => {
    const s = seed("2026-10-02");
    expect(s.expenses.every((e) => e.day >= "2026-10-01")).toBe(true);
    expect(monthPnl(s).expenses).toBe(31_200_000);
  });

  it("builds a 7-day week ending today with today's sales split by kind", () => {
    const s = seed(TODAY);
    const w = weekVolumes(s);
    expect(w).toHaveLength(7);
    expect(w[6].day).toBe(TODAY);
    expect(w[0].day).toBe("2026-09-24");
    expect(w[6].newBottle).toBe(70_000 + 700_000 + 140_000);
    expect(w[6].refill + w[6].newBottle).toBe(2_918_000);
  });

  it("flags materials at or below reorder level", () => {
    const s = seed(TODAY);
    const flagged = s.materials.filter((m) => materialStatus(m) === "reorder").map((m) => m.id);
    expect(flagged).toEqual(["wrap"]);
    expect(materialStatus({ ...s.materials[0], onHand: s.materials[0].reorderAt })).toBe("reorder");
  });
});
