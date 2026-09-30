import { salesOn } from "@/lib/ledger";
import type { Sale } from "@/lib/types";

export interface SoldSplit {
  /** Refills plus exchanges: the customer brought a container back. */
  refills: number;
  /** New containers sold with water. */
  newBottles: number;
  receipts: number;
}

/** Units sold on `day`, split the way the floor talks about them. */
export function soldSplit(sales: Sale[], day: string): SoldSplit {
  const s: SoldSplit = { refills: 0, newBottles: 0, receipts: 0 };
  for (const sale of salesOn(sales, day)) {
    s.receipts += 1;
    if (sale.kind === "new") s.newBottles += sale.qty;
    else s.refills += sale.qty;
  }
  return s;
}
