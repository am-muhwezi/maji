import { CURRENCY } from "@/lib/format";
import { describe, expect, it } from "vitest";
import { salesOn } from "@/lib/ledger";
import { seed } from "@/lib/seed";
import type { Sale } from "@/lib/types";
import {
  NO_FILTERS,
  byProduct,
  csvFilename,
  filterSales,
  hasFilters,
  newestFirst,
  salesCsv,
  totalAmount,
} from "./sales-data";

const today = "2026-09-30";
const todays = salesOn(seed(today).sales, today);

const base: Sale = {
  id: "x1",
  receipt: "SL-1",
  day: today,
  time: "09:00",
  customer: "A",
  productId: "b20",
  kind: "refill",
  qty: 1,
  amount: 5_000,
  payment: "cash",
};

describe("filterSales", () => {
  it("returns everything with no filters", () => {
    expect(filterSales(todays, NO_FILTERS)).toHaveLength(todays.length);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });
  it("matches customer, note, receipt and product name case-insensitively", () => {
    const byCustomer = todays.find((s) => s.customer === "Kireka Supermarket")!;
    const withNote = todays.find((s) => s.customerNote)!;
    const any = todays[3];
    expect(filterSales(todays, { ...NO_FILTERS, query: "kireka" })).toEqual([
      byCustomer,
    ]);
    expect(
      filterSales(todays, {
        ...NO_FILTERS,
        query: withNote.customerNote!.toUpperCase(),
      }),
    ).toContain(withNote);
    expect(
      filterSales(todays, { ...NO_FILTERS, query: any.receipt.toLowerCase() }),
    ).toEqual([any]);
    const packs = filterSales(todays, { ...NO_FILTERS, query: "5L pack" });
    expect(packs.length).toBeGreaterThan(0);
    expect(packs.every((s) => s.productId === "p5")).toBe(true);
  });
  it("combines type and payment filters", () => {
    const r = filterSales(todays, { query: "", kind: "new", payment: "mtn" });
    const expected = todays.filter(
      (s) => s.kind === "new" && s.payment === "mtn",
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(r).toEqual(expected);
  });
  it("returns an empty list when nothing matches", () => {
    expect(
      filterSales(todays, { query: "zzz", kind: "all", payment: "all" }),
    ).toEqual([]);
  });
});

describe("newestFirst", () => {
  it("orders by time descending, receipt as tie-break, without mutating input", () => {
    const a = { ...base, id: "a", receipt: "SL-10", time: "09:00" };
    const b = { ...base, id: "b", receipt: "SL-11", time: "09:00" };
    const c = { ...base, id: "c", receipt: "SL-9", time: "14:00" };
    const input = [a, b, c];
    expect(newestFirst(input).map((s) => s.id)).toEqual(["c", "b", "a"]);
    expect(input.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});

describe("byProduct", () => {
  it("sums amount and units per product; shares add to 1", () => {
    const rows = byProduct(todays);
    expect(rows.reduce((a, r) => a + r.value, 0)).toBe(totalAmount(todays));
    expect(rows.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1, 10);
    expect(rows[0].value).toBeGreaterThanOrEqual(rows[rows.length - 1].value);
    for (const r of rows) {
      const own = todays.filter((s) => s.productId === r.productId);
      expect(r.units).toBe(own.reduce((a, s) => a + s.qty, 0));
      expect(r.value).toBe(totalAmount(own));
    }
  });
  it("handles no sales without NaN", () => {
    expect(byProduct([])).toEqual([]);
  });
});

describe("salesCsv", () => {
  it("writes a header, one row per sale and escapes commas and quotes", () => {
    const csv = salesCsv([
      { ...base, customer: 'Hotel "Nile", Jinja', customerNote: "Line\nbreak" },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      `Receipt,Date,Time,Customer,Note,Product,Type,Qty,Amount (${CURRENCY}),Payment,Status`,
    );
    expect(csv).toContain('"Hotel ""Nile"", Jinja"');
    expect(csv).toContain('"Line\nbreak"');
    expect(csv).toContain(",1,5000,Cash,Paid");
    expect(csv.endsWith("\r\n")).toBe(true);
  });
  it("marks unpaid credit as owed with its due day", () => {
    const csv = salesCsv([
      { ...base, payment: "credit", dueDay: "2026-10-30" },
    ]);
    expect(csv).toContain('Credit,"Owed, due 2026-10-30"');
  });
  it("names the file by day", () => {
    expect(csvFilename(today)).toBe("aquaflow-sales-2026-09-30.csv");
  });
});
