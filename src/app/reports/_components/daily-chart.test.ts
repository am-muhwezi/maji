import { describe, expect, it } from "vitest";
import { showDayLabel } from "./daily-chart";

const labelled = (month: string, days: number, today: string) =>
  Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)
    .filter((d) => showDayLabel(d, today))
    .map((d) => Number(d.slice(8)));

describe("showDayLabel", () => {
  it("labels 1 and every 5th day in a past month", () => {
    expect(labelled("2026-09", 30, "2026-10-01")).toEqual([1, 5, 10, 15, 20, 25, 30]);
  });
  it("always labels today and drops neighbours within 2 days", () => {
    expect(labelled("2026-10", 31, "2026-10-31")).toEqual([1, 5, 10, 15, 20, 25, 31]);
    expect(labelled("2026-10", 12, "2026-10-12")).toEqual([1, 5, 12]);
  });
  it("on the 1st only today is labelled", () => {
    expect(labelled("2026-10", 1, "2026-10-01")).toEqual([1]);
  });
});
