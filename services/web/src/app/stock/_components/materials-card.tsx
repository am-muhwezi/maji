import { Badge, Card, CardHeader, Progress } from "@/components/ui/primitives";
import { Cell2, Table, THead, Td, Th, Tr } from "@/components/ui/table";
import { num, ratio } from "@/lib/format";
import { materialStatus } from "@/lib/ledger";
import type { Material } from "@/lib/types";
import { KIND_LABEL } from "./stock-math";

/** Supporting table: empty shells, packaging and raw materials against their reorder level. */
export function MaterialsCard({ materials }: { materials: Material[] }) {
  const low = materials.filter((m) => materialStatus(m) === "reorder").length;
  return (
    <Card aria-labelledby="materials-title">
      <CardHeader
        title={<span id="materials-title">Empties & packaging</span>}
        hint={low === 0 ? "Everything is above its reorder level." : `${low} item${low > 1 ? "s are" : " is"} at or below the reorder level.`}
      />
      <Table>
        <THead>
          <tr>
            <Th>Item</Th>
            <Th num>On hand</Th>
            <Th num className="hidden sm:table-cell">Reorder at</Th>
            <Th className="hidden md:table-cell">Level</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <tbody>
          {materials.map((m) => {
            const reorder = materialStatus(m) === "reorder";
            return (
              <Tr key={m.id}>
                <Td>
                  <Cell2 primary={m.name} secondary={KIND_LABEL[m.kind]} />
                </Td>
                <Td num>
                  <span className="font-semibold text-ink">{num(m.onHand)}</span>
                  <span className="block text-[11px] font-medium text-slate-400">{m.unit}</span>
                </Td>
                <Td num className="hidden text-slate-600 sm:table-cell">{num(m.reorderAt)}</Td>
                <Td className="hidden md:table-cell">
                  <div className="w-32">
                    <Progress
                      value={ratio(m.onHand, m.capacity)}
                      tone={reorder ? "warning" : "brand"}
                      label={`${m.name}: ${num(m.onHand)} of ${num(m.capacity)} ${m.unit} storage`}
                    />
                  </div>
                </Td>
                <Td>{reorder ? <Badge tone="warning">Reorder</Badge> : <Badge tone="success">OK</Badge>}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
