/**
 * Stock-page roll-ups built only from ledger.ts primitives, so the page never re-derives math in JSX.
 * Kept local to the route (brief rule 1); a candidate for src/lib/ledger.ts if another page needs it.
 */
import { product } from "@/lib/catalog";
import { expected, materialStatus, stockTotals, varianceValue } from "@/lib/ledger";
import type { Material, MaterialKind, StockLine } from "@/lib/types";

export const KIND_LABEL: Record<MaterialKind, string> = {
  empties: "Empties",
  packaging: "Packaging",
  raw: "Raw material",
};

/** Best current number for a product: the count if someone counted, else the expected figure. */
export function onHand(line: StockLine): number {
  return line.physical ?? expected(line);
}

export interface StockSummary {
  bottles: number;
  /** Bottles on counted lines (their count). */
  countedBottles: number;
  /** Bottles on uncounted lines (their expected figure). */
  expectedBottles: number;
  litres: number;
  products: number;
  counted: number;
  empties: number;
  reorder: Material[];
  /** Net units missing (positive = missing, negative = more than expected). */
  missing: number;
  /** Net money value of the difference at refill price (positive = lost). */
  missingValue: number;
}

export function stockSummary(lines: StockLine[], materials: Material[]): StockSummary {
  const totals = stockTotals(lines);
  let bottles = 0;
  let countedBottles = 0;
  let litres = 0;
  let value = 0;
  for (const l of lines) {
    const n = onHand(l);
    bottles += n;
    if (l.physical !== null) countedBottles += n;
    litres += n * product(l.productId).litres;
    value += varianceValue(l);
  }
  return {
    bottles,
    countedBottles,
    expectedBottles: bottles - countedBottles,
    litres,
    products: lines.length,
    counted: totals.counted,
    empties: materials.filter((m) => m.kind === "empties").reduce((a, m) => a + m.onHand, 0),
    reorder: materials.filter((m) => materialStatus(m) === "reorder"),
    missing: -totals.variance,
    missingValue: -value,
  };
}
