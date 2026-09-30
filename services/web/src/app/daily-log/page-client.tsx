"use client";

import { Factory, Plus, Scale, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useQuickEntry } from "@/components/entry/quick-entry";
import { ExplainShortageSheet } from "@/components/explain-shortage";
import { Button, Kpi, KpiGrid, PageHeader } from "@/components/ui/primitives";
import { num, pct, ratio, signed, money } from "@/lib/format";
import { stockTotals, varianceValue } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import type { ProductId } from "@/lib/types";
import { CloseDay } from "./_components/close-day";
import { DaySteps } from "./_components/steps";
import { StockCount } from "./_components/stock-count";

export function Page() {
  const { state } = useStore();
  const { openEntry } = useQuickEntry();
  const [explaining, setExplaining] = useState<ProductId | null>(null);

  const totals = stockTotals(state.lines);
  const differenceValue = state.lines.reduce((sum, l) => sum + varianceValue(l), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Daily Log"
          description="Record production as it happens, count stock at shift end, then close the day."
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => openEntry("production")}
              disabled={state.dayClosed}
              title={state.dayClosed ? "Reopen the day to add production" : undefined}
            >
              Add production
            </Button>
          }
        />
        <DaySteps state={state} />
      </div>

      <KpiGrid cols={3}>
        <Kpi
          label="Produced today"
          value={num(totals.production)}
          unit="units"
          icon={Factory}
          foot={`${num(totals.litresProduced)} litres of water`}
        />
        <Kpi
          label="Sold today"
          value={num(totals.sales)}
          unit="units"
          icon={ShoppingCart}
          foot={`${pct(ratio(totals.sales, totals.opening + totals.production))} of stock on hand`}
        />
        <div className="col-span-2 lg:col-span-1">
          <Kpi
            label="Difference"
            value={totals.counted === 0 ? "0" : signed(totals.variance)}
            unit="units"
            icon={Scale}
            valueTone={totals.variance < 0 ? "danger" : "ink"}
            footTone={differenceValue < 0 ? "down" : "neutral"}
            foot={
              totals.counted === 0
                ? "Nothing counted yet"
                : differenceValue !== 0
                  ? `${money(Math.abs(differenceValue))} ${differenceValue < 0 ? "missing" : "extra"} at refill price`
                  : totals.variance === 0
                    ? `Balanced on ${totals.counted} of ${totals.lines} products`
                    : "Shortages and extras cancel out in value"
            }
          />
        </div>
      </KpiGrid>

      <StockCount totals={totals} onExplain={setExplaining} />
      <CloseDay />

      <ExplainShortageSheet productId={explaining} onClose={() => setExplaining(null)} />
    </div>
  );
}
