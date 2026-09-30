"use client";

import { Download, Droplets, Printer, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Legend, RankedBars, SERIES, StackedColumns } from "@/components/ui/charts";
import { Button, Card, CardHeader, Kpi, KpiGrid, PageHeader } from "@/components/ui/primitives";
import { MONTHLY_BUDGET } from "@/lib/catalog";
import { compact, monthName, num, pct, ratio, weekday } from "@/lib/format";
import { agingTotals, expensesByCategory, inMonth, monthByProduct, monthPnl, receivables, weekVolumes } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import { MoneyOwedCard } from "./_components/money-owed-card";
import { PnlCard } from "./_components/pnl-card";
import { monthCsv, monthCsvFilename } from "./_components/report-csv";

/** Cards keep their border on paper and never split across pages. */
const PRINT_CARD = "break-inside-avoid print:border-slate-300 print:shadow-none";

export function Page() {
  const { state, notify } = useStore();

  const pnl = useMemo(() => monthPnl(state), [state]);
  const costs = useMemo(
    () => expensesByCategory(state.expenses.filter((e) => inMonth(e.day, state.today))),
    [state.expenses, state.today],
  );
  const products = useMemo(() => monthByProduct(state), [state]);
  const week = useMemo(() => weekVolumes(state), [state]);
  const owed = useMemo(() => agingTotals(receivables(state.sales, state.today)), [state.sales, state.today]);

  const dayOfMonth = Number(state.today.slice(8, 10));
  const weekRefill = week.reduce((a, d) => a + d.refill, 0);
  const weekNew = week.reduce((a, d) => a + d.newBottle, 0);
  const targetShare = ratio(pnl.revenue, MONTHLY_BUDGET);

  function downloadCsv() {
    try {
      const blob = new Blob([monthCsv(state)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = monthCsvFilename(state.today);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify(`Saved ${a.download}`);
    } catch {
      notify("Could not create the CSV file", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monthly report"
        description={`${monthName(state.today)}, month to date: profit, what sold, and where the money went.`}
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

      <div className="print:[&>div]:grid-cols-4">
        <KpiGrid>
          <Kpi
            label="Sales"
            value={compact(pnl.revenue)}
            unit="RWF"
            icon={TrendingUp}
            foot={`${pct(targetShare)} of ${compact(MONTHLY_BUDGET)} target`}
            footTone={targetShare >= 1 ? "up" : "neutral"}
          />
          <Kpi
            label="Costs"
            value={compact(pnl.expenses)}
            unit="RWF"
            icon={Receipt}
            foot={`${pct(ratio(pnl.expenses, pnl.revenue))} of sales`}
          />
          <Kpi
            label="Net income"
            value={compact(pnl.net)}
            unit="RWF"
            icon={Wallet}
            valueTone={pnl.net < 0 ? "danger" : "brand"}
            foot={`${pct(pnl.margin)} margin`}
            footTone={pnl.net < 0 ? "down" : "up"}
          />
          <Kpi
            label="Litres sold"
            value={num(pnl.litres)}
            unit="L"
            icon={Droplets}
            foot={`About ${num(ratio(pnl.litres, dayOfMonth))} L a day`}
          />
        </KpiGrid>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2 print:grid-cols-2">
        <PnlCard pnl={pnl} costs={costs} className={PRINT_CARD} />

        <div className="flex flex-col gap-6">
          <Card className={PRINT_CARD}>
            <CardHeader title="Sales by product" hint="Which products brought in the money this month." />
            <div className="px-5 pb-5">
              <RankedBars rows={products.map((p) => ({ label: p.name, value: p.amount, share: p.share }))} format={num} />
            </div>
          </Card>

          <MoneyOwedCard totals={owed} className={PRINT_CARD} />
        </div>
      </div>

      <Card className={PRINT_CARD}>
        <CardHeader
          title="Sales, last 7 days"
          hint="Daily sales in RWF. Hover or tap a day for the split."
          action={
            <Legend
              items={[
                { color: SERIES.primary, label: "Refills", value: compact(weekRefill) },
                { color: SERIES.secondary, label: "New bottles", value: compact(weekNew) },
              ]}
            />
          }
        />
        <div className="px-5 pb-5">
          <StackedColumns
            seriesA="Refills"
            seriesB="New bottles"
            data={week.map((d) => ({
              label: d.day === state.today ? "Today" : weekday(d.day),
              a: d.refill,
              b: d.newBottle,
              highlight: d.day === state.today,
            }))}
          />
        </div>
      </Card>
    </div>
  );
}
