import { describe, expect, it } from "vitest";
import { CURRENCY, addDays, compact, day, daysBetween, isoDay, longDay, monthName, num, pct, ratio, shortDay, signed, money, weekday } from "./format";

describe("format", () => {
  it("groups thousands and rounds", () => {
    expect(num(1234567)).toBe("1,234,567");
    expect(num(0)).toBe("0");
    expect(num(999.6)).toBe("1,000");
    expect(money(75000)).toBe("RWF 75,000");
    expect(CURRENCY).toBe("RWF");
  });

  it("compacts money for tiles", () => {
    expect(compact(48_500_000)).toBe("48.5M");
    expect(compact(31_000_000)).toBe("31M");
    expect(compact(850_000)).toBe("850K");
    expect(compact(1_250)).toBe("1.3K");
    expect(compact(900)).toBe("900");
    expect(compact(-2_400_000)).toBe("-2.4M");
    expect(compact(2_100_000_000)).toBe("2.1B");
  });

  it("signs numbers", () => {
    expect(signed(250)).toBe("+250");
    expect(signed(-12)).toBe("-12");
    expect(signed(0)).toBe("0");
  });

  it("formats percentages and safe ratios", () => {
    expect(pct(0.357)).toBe("35.7%");
    expect(pct(0.5)).toBe("50%");
    expect(pct(Infinity)).toBe("0%");
    expect(ratio(1, 0)).toBe(0);
    expect(ratio(1, 4)).toBe(0.25);
  });

  it("handles calendar days without timezone drift", () => {
    expect(day("2026-09-30")).toBe("30 Sep 2026");
    expect(shortDay("2026-01-05")).toBe("5 Jan");
    expect(weekday("2026-09-30")).toBe("Wed");
    expect(weekday("2026-10-04")).toBe("Sun");
    expect(monthName("2026-12-31")).toBe("December 2026");
    expect(longDay("2026-09-30")).toBe("Wednesday, 30 September");
    expect(isoDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("does day arithmetic across month and year boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    // Regression: month index must be zero-based or boundaries drift.
    expect(daysBetween("2026-09-30", "2026-10-01")).toBe(1);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(daysBetween("2026-10-01", "2026-09-01")).toBe(-30);
  });
});
