"use client";

import { Banknote, HandCoins, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { Alert, Kpi, KpiGrid, LinkButton, PageHeader } from "@/components/ui/primitives";
import { EXPENSE_BUDGET, MONTHLY_BUDGET } from "@/lib/catalog";
import { compact, CURRENCY, pct, ratio } from "@/lib/format";
import { agingTotals, periodPnl, receivables, rollingPeriod } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import { OwedCard, TodayCard, WeekCard } from "./_dashboard/cards";
import { LatestSales } from "./_dashboard/latest-sales";
import { attention, overdueCustomers } from "./_dashboard/summary";

export function Page() {
  const { state } = useStore();
  // Rolling 30 days, not the calendar month: on the 1st a month-to-date view is one day of sales against a month of costs.
  const pnl = periodPnl(state, rollingPeriod(state.today, 30));
  const owed = agingTotals(receivables(state.sales, state.today));
  const overdue = overdueCustomers(state);
  const alert = attention(state);

  return (
    <div className="flex flex-col gap-6">
      {alert && (
        <Alert
          tone={alert.tone}
          icon={TriangleAlert}
          title={alert.title}
          action={
            <LinkButton href={alert.href} size="sm" variant="secondary">
              Review
            </LinkButton>
          }
        >
          {alert.detail}
        </Alert>
      )}

      <PageHeader title="Dashboard" description="How the plant is doing today and over the last 30 days." />

      <KpiGrid>
        <Kpi
          label="Sales · 30 days"
          value={compact(pnl.revenue)}
          unit={CURRENCY}
          icon={Banknote}
          foot={<Foot a={`${pct(ratio(pnl.revenue, MONTHLY_BUDGET), 0)} of`} b={`${compact(MONTHLY_BUDGET)} target`} />}
          footTone={pnl.revenue >= MONTHLY_BUDGET ? "up" : "neutral"}
        />
        <Kpi
          label="Costs · 30 days"
          value={compact(pnl.expenses)}
          unit={CURRENCY}
          icon={Wallet}
          foot={<Foot a={`${pct(ratio(pnl.expenses, EXPENSE_BUDGET), 0)} of`} b={`${compact(EXPENSE_BUDGET)} budget`} />}
          footTone={pnl.expenses > EXPENSE_BUDGET ? "down" : "neutral"}
        />
        <Kpi
          label="Profit · 30 days"
          value={compact(pnl.net)}
          unit={CURRENCY}
          icon={TrendingUp}
          valueTone={pnl.net < 0 ? "danger" : "brand"}
          foot={<Foot a={`${pct(pnl.margin, 0)} margin`} />}
          footTone={pnl.net < 0 ? "down" : "up"}
        />
        <Kpi
          label="Money owed"
          value={compact(owed.total)}
          unit={CURRENCY}
          icon={HandCoins}
          valueTone={overdue > 0 ? "danger" : "ink"}
          foot={<Foot a={`${owed.accounts} customer${owed.accounts === 1 ? "" : "s"} ·`} b={`${overdue} overdue`} />}
          footTone={overdue > 0 ? "down" : "neutral"}
          href="/sales?show=owed"
        />
      </KpiGrid>

      {/*
        Desktop: main column (chart, latest sales) beside a narrow column (today, money owed).
        Phone: the wrappers dissolve (display: contents) and `order` puts today's numbers first.
      */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="contents lg:col-span-2 lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <WeekCard className="order-3 lg:order-none" />
          <LatestSales className="order-2 lg:order-none" />
        </div>
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <TodayCard className="order-1 lg:order-none" />
          <OwedCard className="order-4 lg:order-none" />
        </div>
      </div>
    </div>
  );
}

/** A KPI foot line in two halves that each wrap as a unit, so a phrase never breaks in the middle. */
function Foot({ a, b }: { a: string; b?: string }) {
  return (
    <>
      <span className="whitespace-nowrap">{a}</span>
      {b && (
        <>
          {" "}
          <span className="whitespace-nowrap">{b}</span>
        </>
      )}
    </>
  );
}
