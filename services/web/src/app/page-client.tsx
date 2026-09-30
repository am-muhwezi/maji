"use client";

import { Banknote, HandCoins, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { Alert, Kpi, KpiGrid, LinkButton, PageHeader } from "@/components/ui/primitives";
import { EXPENSE_BUDGET, MONTHLY_BUDGET } from "@/lib/catalog";
import { compact, pct, ratio } from "@/lib/format";
import { agingTotals, monthPnl, receivables } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import { OwedCard, QuickActions, TodayCard, WeekCard } from "./_dashboard/cards";
import { LatestSales } from "./_dashboard/latest-sales";
import { attention, overdueCustomers } from "./_dashboard/summary";

export function Page() {
  const { state } = useStore();
  const pnl = monthPnl(state);
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
            <LinkButton href={alert.href} size="sm" variant={alert.tone === "danger" ? "danger" : "secondary"}>
              Review
            </LinkButton>
          }
        >
          {alert.detail}
        </Alert>
      )}

      <PageHeader title="Dashboard" description="How the plant is doing today and this month." />

      <KpiGrid>
        <Kpi
          label="Sales this month"
          value={compact(pnl.revenue)}
          unit="RWF"
          icon={Banknote}
          foot={`${pct(ratio(pnl.revenue, MONTHLY_BUDGET))} of ${compact(MONTHLY_BUDGET)} target`}
          footTone={pnl.revenue >= MONTHLY_BUDGET ? "up" : "neutral"}
        />
        <Kpi
          label="Expenses this month"
          value={compact(pnl.expenses)}
          unit="RWF"
          icon={Wallet}
          foot={`${pct(ratio(pnl.expenses, EXPENSE_BUDGET))} of ${compact(EXPENSE_BUDGET)} budget`}
          footTone={pnl.expenses > EXPENSE_BUDGET ? "down" : "neutral"}
        />
        <Kpi
          label="Net income"
          value={compact(pnl.net)}
          unit="RWF"
          icon={TrendingUp}
          valueTone={pnl.net < 0 ? "danger" : "brand"}
          foot={`${pct(pnl.margin)} margin`}
          footTone={pnl.net < 0 ? "down" : "up"}
        />
        <Kpi
          label="Money owed"
          value={compact(owed.total)}
          unit="RWF"
          icon={HandCoins}
          valueTone={overdue > 0 ? "danger" : "ink"}
          foot={`${owed.accounts} customer${owed.accounts === 1 ? "" : "s"} · ${overdue} overdue`}
          footTone={overdue > 0 ? "down" : "neutral"}
          href="/sales?show=owed"
        />
      </KpiGrid>

      {/*
        Desktop: main column (chart, actions, latest sales) beside a narrow column (today, money owed).
        Phone: the wrappers dissolve (display: contents) and `order` puts today's numbers first.
      */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="contents lg:col-span-2 lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <WeekCard className="order-4 lg:order-none" />
          <QuickActions className="order-2 lg:order-none" />
          <LatestSales className="order-3 lg:order-none" />
        </div>
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <TodayCard className="order-1 lg:order-none" />
          <OwedCard className="order-5 lg:order-none" />
        </div>
      </div>
    </div>
  );
}
