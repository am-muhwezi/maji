/**
 * Dashboard view-model: picks and phrases numbers that ledger.ts already computes.
 * No business math lives here, only selection, ordering and wording.
 */
import { product } from "@/lib/catalog";
import { openShortages, receivables, variance } from "@/lib/ledger";
import type { Tone } from "@/components/ui/primitives";
import type { AgingBucket } from "@/lib/ledger";
import type { OpsState, Sale } from "@/lib/types";

export interface AttentionSummary {
  tone: "danger" | "warning";
  title: string;
  detail: string;
  href: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Distinct customers with at least one overdue invoice. */
export function overdueCustomers(state: OpsState): number {
  const list = receivables(state.sales, state.today).filter((r) => r.bucket === "overdue");
  return new Set(list.map((r) => r.sale.customer)).size;
}

/** One sentence for the top-of-page alert, or null when nothing needs a human. */
export function attention(state: OpsState): AttentionSummary | null {
  const short = openShortages(state);
  const overdue = overdueCustomers(state);
  if (short.length === 0 && overdue === 0) return null;

  const parts: string[] = [];
  if (short.length === 1) {
    const v = Math.abs(variance(short[0]) ?? 0);
    parts.push(`${product(short[0].productId).name} is ${v} short`);
  } else if (short.length > 1) {
    parts.push(`${short.length} products are short`);
  }
  if (overdue > 0) parts.push(`${plural(overdue, "customer", "customers")} overdue`);

  return {
    tone: short.length > 0 ? "danger" : "warning",
    title: `${parts.join(", ")}.`,
    detail: short.length > 0 ? "Explain the gap before you close the day." : "Follow up on payment.",
    href: short.length > 0 ? "/stock" : "/sales?show=owed",
  };
}

/** Today's sales, newest first (time, then receipt number as tie-break). */
export function latestSales(sales: Sale[], today: string, limit = 5): Sale[] {
  return sales
    .filter((s) => s.day === today)
    .sort((a, b) => b.time.localeCompare(a.time) || b.receipt.localeCompare(a.receipt, undefined, { numeric: true }))
    .slice(0, limit);
}

/** Badge colour per money-owed bucket: only overdue is alarming. */
export const BUCKET_TONE: Record<AgingBucket, Tone> = {
  overdue: "danger",
  "due-soon": "warning",
  current: "neutral",
};

/** Plain-words distance to the due date: "34 days late", "due today", "due in 1 day". */
export function dueText(dueIn: number): string {
  if (dueIn < 0) return `${plural(-dueIn, "day", "days")} late`;
  if (dueIn === 0) return "due today";
  return `due in ${plural(dueIn, "day", "days")}`;
}
