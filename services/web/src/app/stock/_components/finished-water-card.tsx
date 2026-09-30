import { Card, CardHeader } from "@/components/ui/primitives";
import { CountStatus } from "@/components/ui/status";
import { Cell2, Table, TFoot, THead, Td, Th, Tr } from "@/components/ui/table";
import { product } from "@/lib/catalog";
import { num } from "@/lib/format";
import { lineStatus } from "@/lib/ledger";
import type { StockLine } from "@/lib/types";
import { onHand, type StockSummary } from "./stock-math";

/** Main table: filled bottles on hand per product, counted or expected. */
export function FinishedWaterCard({ lines, summary }: { lines: StockLine[]; summary: StockSummary }) {
  const uncounted = summary.products - summary.counted;
  return (
    <Card aria-labelledby="finished-title">
      <CardHeader
        title={<span id="finished-title">Finished water</span>}
        hint={
          uncounted === 0
            ? `All ${summary.products} products counted today.`
            : `${summary.counted} of ${summary.products} counted today. Uncounted rows show the expected number.`
        }
      />
      <Table>
        <THead>
          <tr>
            <Th>Product</Th>
            <Th num>On hand</Th>
            <Th num className="hidden sm:table-cell">Litres</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <tbody>
          {lines.map((l) => {
            const p = product(l.productId);
            const n = onHand(l);
            const status = lineStatus(l);
            return (
              <Tr key={l.productId} tone={status === "short" ? "danger" : undefined}>
                <Td>
                  <Cell2 primary={<span className="whitespace-nowrap">{p.name}</span>} secondary={<span className="hidden sm:inline">{p.detail}</span>} />
                </Td>
                <Td num>
                  <span className="font-semibold text-ink">{num(n)}</span>
                  {l.physical === null && <span className="mt-0.5 block text-[11px] font-medium text-slate-400">expected</span>}
                </Td>
                <Td num className="hidden text-slate-600 sm:table-cell">{num(n * p.litres)} L</Td>
                <Td>
                  <CountStatus line={l} />
                </Td>
              </Tr>
            );
          })}
        </tbody>
        <TFoot>
          <tr>
            <Td>Total</Td>
            <Td num>{num(summary.bottles)}</Td>
            <Td num className="hidden sm:table-cell">{num(summary.litres)} L</Td>
            <Td />
          </tr>
        </TFoot>
      </Table>
    </Card>
  );
}
