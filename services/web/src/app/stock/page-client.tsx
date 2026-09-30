"use client";

import { ClipboardList, Droplets, PackagePlus, Recycle, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { ExplainShortageSheet } from "@/components/explain-shortage";
import { Kpi, KpiGrid, LinkButton, PageHeader } from "@/components/ui/primitives";
import { num, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ProductId } from "@/lib/types";
import { FinishedWaterCard } from "./_components/finished-water-card";
import { MaterialsCard } from "./_components/materials-card";
import { ShortagesCard } from "./_components/shortages-card";
import { stockSummary } from "./_components/stock-math";

export function Page() {
  const { state } = useStore();
  const [explaining, setExplaining] = useState<ProductId | null>(null);
  const summary = useMemo(() => stockSummary(state.lines, state.materials), [state.lines, state.materials]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock"
        description="What's on hand right now, and anything that doesn't add up."
        actions={
          state.dayClosed ? (
            <LinkButton href="/daily-log" variant="secondary" icon={ClipboardList}>
              Open daily log
            </LinkButton>
          ) : (
            <LinkButton href="/daily-log#count" variant="primary" icon={ClipboardList}>
              Count stock
            </LinkButton>
          )
        }
      />

      <KpiGrid>
        <Kpi
          label="Bottles ready to sell"
          value={num(summary.bottles)}
          icon={Droplets}
          foot={
            summary.expectedBottles === 0 ? (
              `All ${summary.products} products counted`
            ) : (
              <>
                <span className="whitespace-nowrap">{num(summary.countedBottles)} counted</span>{" "}
                <span className="whitespace-nowrap">+ {num(summary.expectedBottles)} expected</span>
              </>
            )
          }
        />
        <Kpi label="Empty shells" value={num(summary.empties)} icon={Recycle} foot="waiting to be refilled" />
        <Kpi
          label="To reorder"
          value={num(summary.reorder.length)}
          icon={PackagePlus}
          footTone={summary.reorder.length === 0 ? "neutral" : "warning"}
          foot={summary.reorder.length === 0 ? "All stocked" : summary.reorder.map((m) => m.name).join(", ")}
        />
        <Kpi
          label="Missing today"
          value={summary.missing < 0 ? `+${num(-summary.missing)}` : num(summary.missing)}
          unit="bottles"
          icon={TriangleAlert}
          valueTone={summary.missing > 0 ? "danger" : "ink"}
          footTone={summary.missing > 0 ? "down" : "neutral"}
          foot={
            summary.counted === 0
              ? "Nothing counted yet"
              : summary.missing > 0
                ? `Worth ${money(summary.missingValue)}`
                : summary.missing < 0
                  ? "More than expected"
                  : "Counts match so far"
          }
        />
      </KpiGrid>

      <ShortagesCard state={state} onExplain={setExplaining} />

      <FinishedWaterCard lines={state.lines} summary={summary} />
      <MaterialsCard materials={state.materials} />

      <ExplainShortageSheet productId={explaining} onClose={() => setExplaining(null)} />
    </div>
  );
}
