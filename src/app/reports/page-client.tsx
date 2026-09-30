"use client";

import { Download, Droplets, Printer, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Legend, RankedBars, SERIES } from "@/components/ui/charts";
import { Button, Card, CardHeader, Kpi, KpiGrid, PageHeader, Segmented } from "@/components/ui/primitives";
import { MONTHLY_BUDGET } from "@/lib/catalog";
import { compact, CURRENCY, num, pct, ratio } from "@/lib/format";
import {
  agingTotals,
  dailyVolumes,
  expensesByCategory,
  expensesIn,
  monthPeriod,
  periodByProduct,
  periodPnl,
  receivables,
} from "@/lib/ledger";
import { useStore } from "@/lib/store";
import { DailyChart } from "./_components/daily-chart";
import { MoneyOwedCard } from "./_components/money-owed-card";
import { PnlCard } from "./_components/pnl-card";
import { monthCsv, monthCsvFilename } from "./_components/report-csv";

/** Cards keep their border on paper and never split across pages. */
const PRINT_CARD = "break-inside-avoid print:border-slate-300 print:shadow-none";

type Which = "this" | "last";

/** A month this young gives odd ratios; below this many days we point to last month. */
const FEW_DAYS = 3;

export function Page() {
  const { state, notify } = useStore();
  const [which, setWhich] = useState<Which>("this");

  const period = useMemo(() => monthPeriod(state.today, which === "this" ? 0 : -1), [state.today, which]);
  const current = which === "this";
  const pnl = useMemo(() => periodPnl(state, period), [state, period]);
  const costs = useMemo(() => expensesByCategory(expensesIn(state, period)), [state, period]);
  const products = useMemo(() => periodByProduct(state, period), [state, period]);
  const daily = useMemo(() => dailyVolumes(state, period), [state, period]);
  const owed = useMemo(() => agingTotals(receivables(state.sales, state.today)), [state.sales, state.today]);

  const refillTotal = daily.reduce((a, d) => a + d.refill, 0);
  const newTotal = daily.reduce((a, d) => a + d.newBottle, 0);
  const targetShare = ratio(pnl.revenue, MONTHLY_BUDGET);
  const costShare = ratio(pnl.expenses, pnl.revenue);
  const fewDays = current && period.days <= FEW_DAYS;

  function downloadCsv() {
    try {
      const name = monthCsvFilename(period);
      const blob = new Blob([monthCsv(state, period)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify(`Saved ${name}`);
    } catch {
      notify("Could not create the CSV file", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Monthly report: ${period.label}`}
        description={`${current ? "Month to date" : "Full month"}: profit, what sold, and where the money went.`}
        actions={
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap print:hidden">
            <Button icon={Download} onClick={downloadCsv}>
              Download CSV
            </Button>
            <Button variant="primary" icon={Printer} onClick={() => window.print()}>
              Print or save PDF
            </Button>
          </div>
        }
      />

      <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden">
        <Segmented<Which>
          label="Which month"
          value={which}
          onChange={setWhich}
          options={[
            { value: "this", label: "This month" },
            { value: "last", label: "Last month" },
          ]}
        />
        {fewDays && (
          <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500" role="status">
            <span>
              Only {period.days} day{period.days === 1 ? "" : "s"} so far, so totals are small.
            </span>
            <Button variant="ghost" size="sm" onClick={() => setWhich("last")} className="-ml-2 text-brand">
              See {monthPeriod(state.today, -1).label}
            </Button>
          </p>
        )}
      </div>

      <KpiGrid className="print:grid-cols-4">
        <Kpi
          label="Sales"
          value={compact(pnl.revenue)}
          unit={CURRENCY}
          icon={TrendingUp}
          foot={
            <>
              <span className="whitespace-nowrap">{pct(targetShare)}</span>{" "}
              <span className="whitespace-nowrap">of {compact(MONTHLY_BUDGET)} target</span>
            </>
          }
          footTone={targetShare >= 1 ? "up" : "neutral"}
        />
        <Kpi
          label="Costs"
          value={compact(pnl.expenses)}
          unit={CURRENCY}
          icon={Receipt}
          foot={costShare > 1 ? "More than sales" : `${pct(costShare)} of sales`}
          footTone={costShare > 1 ? "warning" : "neutral"}
        />
        <Kpi
          label="Net income"
          value={compact(pnl.net)}
          unit={CURRENCY}
          icon={Wallet}
          valueTone={pnl.net < 0 ? "danger" : "brand"}
          foot={pnl.net < 0 ? (current ? "Loss so far" : "Loss for the month") : `${pct(pnl.margin)} margin`}
          footTone={pnl.net < 0 ? "down" : "up"}
        />
        <Kpi
          label="Litres sold"
          value={num(pnl.litres)}
          unit="L"
          icon={Droplets}
          foot={`About ${num(ratio(pnl.litres, period.days))} L a day`}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2 print:grid-cols-2">
        <PnlCard pnl={pnl} costs={costs} current={current} label={period.label} className={PRINT_CARD} />

        <div className="flex flex-col gap-6">
          <Card className={PRINT_CARD}>
            <CardHeader title="Sales by product" hint={`Which products brought in the money ${current ? "so far this month" : `in ${period.label}`}.`} />
            <div className="px-5 pb-5">
              <RankedBars rows={products.map((p) => ({ label: p.name, value: p.amount, share: p.share }))} format={num} />
            </div>
          </Card>

          <MoneyOwedCard totals={owed} className={PRINT_CARD} />
        </div>
      </div>

      <Card className={PRINT_CARD}>
        <CardHeader
          title="Daily sales"
          hint={`Each day of ${period.label} in ${CURRENCY}. Hover or tap a day for the split.`}
          action={
            <Legend
              items={[
                { color: SERIES.primary, label: "Refills", value: compact(refillTotal) },
                { color: SERIES.secondary, label: "New bottles", value: compact(newTotal) },
              ]}
            />
          }
        />
        <div className="px-5 pb-5">
          <DailyChart data={daily} today={state.today} />
        </div>
      </Card>
    </div>
  );
}
