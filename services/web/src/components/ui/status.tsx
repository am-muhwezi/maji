import { daysBetween, signed } from "@/lib/format";
import { isOutstanding, lineStatus } from "@/lib/ledger";
import { PAYMENT_LABEL } from "@/lib/catalog";
import type { Sale, StockLine } from "@/lib/types";
import { Badge } from "./primitives";

/** One badge per sale that answers "has this money arrived?" */
export function SaleStatus({ sale, today }: { sale: Sale; today: string }) {
  if (!isOutstanding(sale)) {
    return <Badge tone={sale.payment === "cash" ? "neutral" : "info"}>{sale.payment === "credit" ? "Paid · Credit" : `Paid · ${PAYMENT_LABEL[sale.payment]}`}</Badge>;
  }
  const dueIn = daysBetween(today, sale.dueDay ?? sale.day);
  if (dueIn < 0) return <Badge tone="danger">{-dueIn}d overdue</Badge>;
  if (dueIn === 0) return <Badge tone="warning">Due today</Badge>;
  return <Badge tone="warning">Due in {dueIn}d</Badge>;
}

/** Stock-count result for one product line. */
export function CountStatus({ line }: { line: StockLine }) {
  const s = lineStatus(line);
  if (s === "uncounted") return <Badge tone="neutral">Not counted</Badge>;
  if (s === "balanced") return <Badge tone="success">Balanced</Badge>;
  const v = (line.physical ?? 0) - (line.opening + line.production - line.sales);
  return <Badge tone={s === "short" ? "danger" : "warning"}>{signed(v)} {s === "short" ? "short" : "over"}</Badge>;
}
