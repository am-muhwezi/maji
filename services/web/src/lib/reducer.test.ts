import { describe, expect, it } from "vitest";
import { expected } from "./ledger";
import { CREDIT_TERMS_DAYS, reduce } from "./reducer";
import { seed } from "./seed";
import { loadSaved } from "./store";

const TODAY = "2026-09-30";

describe("recordSale", () => {
  it("prices the sale, numbers the receipt, and moves stock", () => {
    const s = seed(TODAY);
    const next = reduce(s, { type: "recordSale", customer: "  Kisenyi Shop ", productId: "b20", kind: "new", qty: 3, payment: "cash", time: "15:00" });
    const sale = next.sales.at(-1)!;
    expect(sale).toMatchObject({ receipt: "SL-1091", customer: "Kisenyi Shop", amount: 105_000, day: TODAY, dueDay: undefined });
    expect(next.lines.find((l) => l.productId === "b20")!.sales).toBe(184);
    expect(s.lines.find((l) => l.productId === "b20")!.sales).toBe(181); // original untouched
  });

  it("sets a due date on credit sales", () => {
    const next = reduce(seed(TODAY), { type: "recordSale", customer: "Hotel", productId: "d19", kind: "refill", qty: 1, payment: "credit", time: "15:00" });
    expect(next.sales.at(-1)!.dueDay).toBe("2026-10-30");
    expect(CREDIT_TERMS_DAYS).toBe(30);
  });

  it("rejects bad input and closed days by returning the same object", () => {
    const s = seed(TODAY);
    const base = { type: "recordSale" as const, customer: "A", productId: "b20" as const, kind: "refill" as const, payment: "cash" as const, time: "1" };
    expect(reduce(s, { ...base, qty: 0 })).toBe(s);
    expect(reduce(s, { ...base, qty: 1.5 })).toBe(s);
    expect(reduce(s, { ...base, qty: 1, customer: "   " })).toBe(s);
    const closed = { ...s, dayClosed: true };
    expect(reduce(closed, { ...base, qty: 1 })).toBe(closed);
  });
});

describe("production and counts", () => {
  it("adds production to the right line", () => {
    const next = reduce(seed(TODAY), { type: "recordProduction", productId: "b10", qty: 40 });
    expect(next.lines.find((l) => l.productId === "b10")!.production).toBe(100);
  });

  it("accepts a zero count, clears a count with null, rejects negatives", () => {
    const s = seed(TODAY);
    expect(reduce(s, { type: "setCount", productId: "b10", physical: 0 }).lines.find((l) => l.productId === "b10")!.physical).toBe(0);
    expect(reduce(s, { type: "setCount", productId: "b20", physical: null }).lines.find((l) => l.productId === "b20")!.physical).toBeNull();
    expect(reduce(s, { type: "setCount", productId: "b20", physical: -1 })).toBe(s);
  });

  it("a recount clears today's explanation for that product", () => {
    let s = reduce(seed(TODAY), { type: "resolveVariance", productId: "d19", kind: "spillage", note: "dropped pallet" });
    expect(s.resolutions).toHaveLength(1);
    s = reduce(s, { type: "setCount", productId: "d19", physical: 205 });
    expect(s.resolutions).toHaveLength(0);
  });
});

describe("closing the day", () => {
  it("only closes once everything is counted and explained, then locks edits", () => {
    let s = seed(TODAY);
    expect(reduce(s, { type: "closeDay", by: "DM" })).toBe(s);
    for (const l of s.lines) if (l.physical === null) s = reduce(s, { type: "setCount", productId: l.productId, physical: expected(l) });
    s = reduce(s, { type: "resolveVariance", productId: "b20", kind: "spillage", note: "" });
    s = reduce(s, { type: "resolveVariance", productId: "d19", kind: "driver", note: "Route 4" });
    s = reduce(s, { type: "closeDay", by: "David Mugisha" });
    expect(s.dayClosed).toBe(true);
    expect(s.closedBy).toBe("David Mugisha");
    expect(reduce(s, { type: "recordProduction", productId: "b20", qty: 1 })).toBe(s);
    expect(reduce(s, { type: "setCount", productId: "b20", physical: 1 })).toBe(s);
    const reopened = reduce(s, { type: "reopenDay" });
    expect(reopened.dayClosed).toBe(false);
  });
});

describe("expenses and payments", () => {
  it("records an expense with the next reference at the top", () => {
    const next = reduce(seed(TODAY), { type: "recordExpense", category: "transport", description: "Diesel", vendor: "", amount: 200_000, payment: "cash", approvedBy: "Ops" });
    expect(next.expenses[0]).toMatchObject({ ref: "EXP-042", vendor: "Not specified", day: TODAY, amount: 200_000 });
  });

  it("rejects zero amounts and blank descriptions", () => {
    const s = seed(TODAY);
    const base = { type: "recordExpense" as const, category: "power" as const, vendor: "", payment: "cash" as const, approvedBy: "" };
    expect(reduce(s, { ...base, description: "x", amount: 0 })).toBe(s);
    expect(reduce(s, { ...base, description: " ", amount: 10 })).toBe(s);
  });

  it("marks credit paid once, ignores cash sales and repeats", () => {
    const s = seed(TODAY);
    const paid = reduce(s, { type: "markPaid", saleId: "s1041" });
    expect(paid.sales.find((x) => x.id === "s1041")!.paidDay).toBe(TODAY);
    expect(reduce(paid, { type: "markPaid", saleId: "s1041" })).toBe(paid);
    expect(reduce(s, { type: "markPaid", saleId: "s1080" })).toBe(s);
    expect(reduce(s, { type: "markPaid", saleId: "nope" })).toBe(s);
  });
});

describe("persistence", () => {
  it("loads same-day state and discards stale, corrupt, or missing data", () => {
    const s = seed(TODAY);
    expect(loadSaved(JSON.stringify(s), TODAY)).toEqual(s);
    expect(loadSaved(JSON.stringify(s), "2026-10-01")).toBeNull();
    expect(loadSaved("{not json", TODAY)).toBeNull();
    expect(loadSaved(null, TODAY)).toBeNull();
    expect(loadSaved(JSON.stringify({ today: TODAY }), TODAY)).toBeNull();
  });
});

describe("store load/save ordering", () => {
  it("applies saved data exactly once and never before load", async () => {
    const { storeReduce } = await import("./store");
    const fresh = { ops: seed(TODAY), loaded: false };
    const saved = reduce(seed(TODAY), { type: "markPaid", saleId: "s1041" });
    const loaded = storeReduce(fresh, { type: "load", saved });
    expect(loaded).toEqual({ ops: saved, loaded: true });
    // StrictMode runs the load effect twice; the second load must not clobber later edits.
    const edited = storeReduce(loaded, { type: "recordProduction", productId: "b20", qty: 5 });
    expect(storeReduce(edited, { type: "load", saved: seed(TODAY) })).toBe(edited);
    // No saved data: keep the seed but mark loaded so saving can start.
    expect(storeReduce(fresh, { type: "load", saved: null })).toEqual({ ops: fresh.ops, loaded: true });
    // Invalid actions are still no-ops by identity.
    expect(storeReduce(loaded, { type: "recordProduction", productId: "b20", qty: 0 })).toBe(loaded);
  });
});
