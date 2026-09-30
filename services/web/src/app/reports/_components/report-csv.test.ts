import { describe, expect, it } from "vitest";
import { expensesByCategory, inMonth, monthByProduct, monthPnl } from "@/lib/ledger";
import { seed } from "@/lib/seed";
import { monthCsv, monthCsvFilename } from "./report-csv";

const state = seed("2026-09-30");

function lines() {
  return monthCsv(state).trimEnd().split("\n");
}

function valueOf(label: string): number {
  const row = lines().find((l) => l.split(",")[0] === label);
  if (!row) throw new Error(`missing row ${label}`);
  return Number(row.split(",")[1]);
}

describe("monthCsv", () => {
  it("matches ledger totals exactly", () => {
    const pnl = monthPnl(state);
    expect(valueOf("Sales")).toBe(pnl.revenue);
    expect(valueOf("Total costs")).toBe(-pnl.expenses);
    expect(valueOf("Net income")).toBe(pnl.net);
  });

  it("cost lines add up to total costs", () => {
    const costRows = lines().filter((l) => l.startsWith("Cost: "));
    const month = state.expenses.filter((e) => inMonth(e.day, state.today));
    expect(costRows).toHaveLength(expensesByCategory(month).length);
    const sum = costRows.reduce((a, l) => a + Number(l.split(",").at(-1)), 0);
    expect(sum).toBe(valueOf("Total costs"));
  });

  it("lists every product with its revenue", () => {
    for (const p of monthByProduct(state)) expect(valueOf(p.name)).toBe(p.amount);
  });

  it("contains no NaN or undefined and quotes commas", () => {
    const csv = monthCsv(state);
    expect(csv).not.toMatch(/NaN|undefined/);
    expect(lines()[0]).toBe('Monthly report,2026-09,"month to date, up to",2026-09-30');
  });

  it("names the file by month", () => {
    expect(monthCsvFilename("2026-09-30")).toBe("monthly-report-2026-09.csv");
  });
});
