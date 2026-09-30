import { describe, expect, it } from "vitest";
import { expensesByCategory, expensesIn, monthPeriod, periodByProduct, periodPnl, type Period } from "@/lib/ledger";
import { seed } from "@/lib/seed";
import { monthCsv, monthCsvFilename } from "./report-csv";

const TODAY = "2026-10-01";
const state = seed(TODAY);
const periods: [string, Period][] = [
  ["this month (day 1)", monthPeriod(TODAY, 0)],
  ["last month", monthPeriod(TODAY, -1)],
];

function lines(p: Period) {
  return monthCsv(state, p).trimEnd().split("\n");
}

function valueOf(p: Period, label: string): number {
  const row = lines(p).find((l) => l.split(",")[0] === label);
  if (!row) throw new Error(`missing row ${label}`);
  return Number(row.split(",")[1]);
}

describe.each(periods)("monthCsv, %s", (_name, p) => {
  it("matches ledger totals for the period exactly", () => {
    const pnl = periodPnl(state, p);
    expect(valueOf(p, "Sales")).toBe(pnl.revenue);
    expect(valueOf(p, "Total costs")).toBe(-pnl.expenses);
    expect(valueOf(p, "Net income")).toBe(pnl.net);
  });

  it("cost lines add up to total costs", () => {
    const costRows = lines(p).filter((l) => l.startsWith("Cost: "));
    expect(costRows).toHaveLength(expensesByCategory(expensesIn(state, p)).length);
    const sum = costRows.reduce((a, l) => a + Number(l.split(",").at(-1)), 0);
    expect(sum).toBe(valueOf(p, "Total costs"));
  });

  it("lists every product with its revenue", () => {
    for (const r of periodByProduct(state, p)) expect(valueOf(p, r.name)).toBe(r.amount);
  });

  it("has only machine-readable numbers (no NaN, undefined or unicode minus)", () => {
    const csv = monthCsv(state, p);
    expect(csv).not.toMatch(/NaN|undefined|−/);
    expect(lines(p)[0]).toBe(`Monthly report,${p.label},from,${p.from},to,${p.to}`);
  });
});

describe("periods differ", () => {
  it("last month is a full month and differs from this month", () => {
    const [, cur] = periods[0];
    const [, last] = periods[1];
    expect(last.from).toBe("2026-09-01");
    expect(last.to).toBe("2026-09-30");
    expect(cur.days).toBe(1);
    expect(monthCsv(state, cur)).not.toBe(monthCsv(state, last));
  });

  it("names the file by the period's month", () => {
    expect(monthCsvFilename(monthPeriod(TODAY, 0))).toBe("monthly-report-2026-10.csv");
    expect(monthCsvFilename(monthPeriod(TODAY, -1))).toBe("monthly-report-2026-09.csv");
  });
});
