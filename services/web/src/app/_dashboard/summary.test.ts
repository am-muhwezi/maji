import { describe, expect, it } from "vitest";
import { seed } from "@/lib/seed";
import type { OpsState } from "@/lib/types";
import { attention, dueText, latestSales, overdueCustomers } from "./summary";

const TODAY = "2026-09-30";
const base = (): OpsState => seed(TODAY);

describe("attention", () => {
  it("names the product when exactly one line is short", () => {
    const s = base();
    // Resolve every shortage except d19 (expected 212, counted 200).
    s.resolutions = s.lines.filter((l) => l.productId !== "d19").map((l) => ({ productId: l.productId, kind: "recount" as const, note: "", day: TODAY }));
    const a = attention(s);
    expect(a?.tone).toBe("danger");
    expect(a?.title).toBe("18.9L Dispenser is 12 short, 1 customer overdue.");
    expect(a?.href).toBe("/stock");
  });

  it("counts products when several lines are short", () => {
    expect(attention(base())?.title).toBe("2 products are short, 1 customer overdue.");
  });

  it("falls back to a warning pointing at money owed when only credit is overdue", () => {
    const s = base();
    s.resolutions = s.lines.map((l) => ({ productId: l.productId, kind: "recount" as const, note: "", day: TODAY }));
    expect(attention(s)).toEqual({ tone: "warning", title: "1 customer overdue.", detail: "Follow up on payment.", href: "/sales?show=owed" });
  });

  it("returns null when nothing needs a human", () => {
    const s = base();
    s.resolutions = s.lines.map((l) => ({ productId: l.productId, kind: "recount" as const, note: "", day: TODAY }));
    s.sales = s.sales.filter((x) => x.customer !== "Hotel Africana" || x.day === TODAY);
    expect(overdueCustomers(s)).toBe(0);
    expect(attention(s)).toBeNull();
  });

  it("ignores resolutions from another day", () => {
    const s = base();
    s.resolutions = s.lines.map((l) => ({ productId: l.productId, kind: "recount" as const, note: "", day: "2026-09-29" }));
    expect(attention(s)?.tone).toBe("danger");
  });
});

describe("overdueCustomers", () => {
  it("counts distinct customers, not invoices", () => {
    const s = base();
    const od = s.sales.find((x) => x.id === "s1041")!;
    s.sales.push({ ...od, id: "dup", receipt: "SL-9999" });
    expect(overdueCustomers(s)).toBe(1);
  });
});

describe("latestSales", () => {
  it("returns today's five newest, newest first", () => {
    const rows = latestSales(base().sales, TODAY);
    expect(rows.map((r) => r.time)).toEqual(["14:22", "13:50", "13:45", "12:40", "12:15"]);
  });

  it("breaks same-minute ties by receipt number, numerically", () => {
    const s = base().sales;
    const a = { ...s[4], id: "a", receipt: "SL-9", time: "23:00" };
    const b = { ...s[4], id: "b", receipt: "SL-10", time: "23:00" };
    expect(latestSales([a, b], TODAY).map((r) => r.receipt)).toEqual(["SL-10", "SL-9"]);
  });

  it("excludes other days and handles an empty day", () => {
    expect(latestSales(base().sales, "2026-10-01")).toEqual([]);
  });
});

describe("dueText", () => {
  it("words late, today and future due dates with correct plurals", () => {
    expect(dueText(-34)).toBe("34 days late");
    expect(dueText(-1)).toBe("1 day late");
    expect(dueText(0)).toBe("due today");
    expect(dueText(1)).toBe("due in 1 day");
    expect(dueText(12)).toBe("due in 12 days");
  });
});

describe("dashboard KPIs on the 1st of a month", () => {
  it("rolling 30-day P&L stays sane (round-1 bug: -969% margin)", async () => {
    const { periodPnl, rollingPeriod } = await import("@/lib/ledger");
    const s = seed("2026-10-01");
    const pnl = periodPnl(s, rollingPeriod(s.today, 30));
    expect(pnl.revenue).toBeGreaterThan(pnl.expenses);
    expect(pnl.margin).toBeGreaterThan(0);
    expect(pnl.margin).toBeLessThan(1);
  });
});
