import { describe, expect, it } from "vitest";
import type { Expense } from "@/lib/types";
import { filterExpenses, newestFirst, sumAmount } from "./month-expenses";

const x = (ref: string, day: string, rest: Partial<Expense> = {}): Expense => ({
  id: ref, ref, day, category: "power", description: "Power token", vendor: "Umeme",
  amount: 100, payment: "bank", recordedBy: "Director", ...rest,
});

describe("month expenses", () => {
  it("sorts newest day first, then highest voucher number", () => {
    const list = [x("EXP-009", "2026-09-01"), x("EXP-041", "2026-09-30"), x("EXP-100", "2026-09-30"), x("EXP-040", "2026-09-29")];
    expect(newestFirst(list).map((e) => e.ref)).toEqual(["EXP-100", "EXP-041", "EXP-040", "EXP-009"]);
  });

  it("filters by text across description, vendor and ref, case-insensitive", () => {
    const list = [x("EXP-001", "2026-09-01"), x("EXP-002", "2026-09-02", { vendor: "TotalEnergies", description: "Diesel" })];
    expect(filterExpenses(list, "total", "all").map((e) => e.ref)).toEqual(["EXP-002"]);
    expect(filterExpenses(list, "exp-001", "all").map((e) => e.ref)).toEqual(["EXP-001"]);
    expect(filterExpenses(list, "  ", "all")).toHaveLength(2);
  });

  it("combines category and text, and can match nothing", () => {
    const list = [x("EXP-001", "2026-09-01"), x("EXP-002", "2026-09-02", { category: "transport" })];
    expect(filterExpenses(list, "", "transport").map((e) => e.ref)).toEqual(["EXP-002"]);
    expect(filterExpenses(list, "umeme", "repairs")).toEqual([]);
  });

  it("sums amounts, zero for empty", () => {
    expect(sumAmount([x("A", "2026-09-01", { amount: 250 }), x("B", "2026-09-01", { amount: 750 })])).toBe(1000);
    expect(sumAmount([])).toBe(0);
  });
});
