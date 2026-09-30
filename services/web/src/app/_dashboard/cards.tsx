"use client";

import { ArrowRight, CircleCheck, Factory, Receipt, ShoppingCart, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useQuickEntry, type EntryKind } from "@/components/entry/quick-entry";
import { Legend, SERIES, StackedColumns } from "@/components/ui/charts";
import { Card, CardHeader, Empty, LinkButton, Progress, StatRow } from "@/components/ui/primitives";
import { SaleStatus } from "@/components/ui/status";
import { compact, num, money, weekday } from "@/lib/format";
import { agingTotals, canCloseDay, monthPnl, receivables, salesOn, salesSummary, stockTotals, weekVolumes } from "@/lib/ledger";
import { useStore } from "@/lib/store";

/* ---------- Sales, last 7 days ---------- */

export function WeekCard({ className }: { className?: string }) {
  const { state } = useStore();
  const week = weekVolumes(state);
  const refills = week.reduce((a, d) => a + d.refill, 0);
  const newBottles = week.reduce((a, d) => a + d.newBottle, 0);
  const litres = monthPnl(state).litres;

  return (
    <Card className={className}>
      <CardHeader
        title="Sales, last 7 days"
        hint="Refills and new bottles, in RWF. Today is in bold."
        action={
          <Legend
            items={[
              { color: SERIES.primary, label: "Refills", value: compact(refills) },
              { color: SERIES.secondary, label: "New bottles", value: compact(newBottles) },
            ]}
          />
        }
      />
      <div className="px-5 pb-4">
        <StackedColumns
          seriesA="Refills"
          seriesB="New bottles"
          data={week.map((d) => ({ label: weekday(d.day), a: d.refill, b: d.newBottle, highlight: d.day === state.today }))}
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-soft px-5 py-3.5 text-sm">
        <span className="text-slate-600">
          Week total <span className="tnum font-semibold text-brand">{money(refills + newBottles)}</span>
        </span>
        <span className="tnum text-[13px] text-slate-500">{num(litres)} litres sold this month</span>
      </div>
    </Card>
  );
}

/* ---------- Today ---------- */

export function TodayCard({ className }: { className?: string }) {
  const { state } = useStore();
  const sold = salesSummary(salesOn(state.sales, state.today));
  const stock = stockTotals(state.lines);
  const close = canCloseDay(state);
  const allCounted = stock.counted === stock.lines;

  return (
    <Card className={clsx("flex flex-col", className)}>
      <CardHeader title="Today" hint="Resets every morning." />
      <dl className="divide-y divide-line-soft px-5">
        <StatRow label="Collected today" value={money(sold.collected)} strong />
        <StatRow label="Receipts today" value={num(sold.receipts)} />
        <StatRow label="Units produced today" value={num(stock.production)} />
      </dl>
      <div className="mt-auto border-t border-line-soft px-5 pt-4 pb-5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-slate-600">Stock counted</span>
          <span className="tnum font-medium text-ink">
            {stock.counted} of {stock.lines}
          </span>
        </div>
        <div className="mt-2">
          <Progress value={stock.lines === 0 ? 0 : stock.counted / stock.lines} tone={allCounted ? "success" : "brand"} label="Stock counted" />
        </div>
        {state.dayClosed ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CircleCheck className="size-4 shrink-0" aria-hidden />
            Day closed{state.closedBy ? ` by ${state.closedBy}` : ""}.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[13px] text-slate-500">
              {close.ok ? "Everything is counted. You can close the day." : `Before closing: ${close.reason}.`}
            </p>
            <LinkButton href="/daily-log" variant="secondary" icon={ArrowRight} className="mt-3 w-full">
              {allCounted ? "Close the day" : "Finish count"}
            </LinkButton>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------- Quick actions ---------- */

const ACTIONS: { kind: EntryKind; label: string; hint: string; icon: LucideIcon }[] = [
  { kind: "sale", label: "Record a sale", hint: "Refills, new bottles, credit", icon: ShoppingCart },
  { kind: "production", label: "Add production", hint: "A batch off the line", icon: Factory },
  { kind: "expense", label: "Log an expense", hint: "Fuel, power, wages", icon: Receipt },
];

export function QuickActions({ className }: { className?: string }) {
  const { openEntry } = useQuickEntry();
  const { state } = useStore();
  return (
    <Card className={className}>
      <CardHeader title="Record something" hint={state.dayClosed ? "The day is closed. Reopen it in Daily Log to add entries." : "The three things you log all day."} />
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
        {ACTIONS.map(({ kind, label, hint, icon: Icon }, i) => {
          const primary = i === 0;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => openEntry(kind)}
              className={clsx(
                "flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left sm:flex-col sm:items-start xl:flex-row xl:items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                primary
                  ? "border-brand bg-brand text-white shadow-tier1 hover:bg-brand-hover active:bg-brand-active"
                  : "border-line bg-white hover:border-sky-300 hover:bg-sky-50",
              )}
            >
              <span className={clsx("grid size-10 shrink-0 place-items-center rounded-lg", primary ? "bg-white/15 text-white" : "bg-sky-100 text-brand")}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={clsx("block text-sm font-semibold", primary ? "text-white" : "text-ink")}>{label}</span>
                <span className={clsx("block text-[12px]", primary ? "text-sky-100" : "text-slate-500")}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Money owed ---------- */

export function OwedCard({ className }: { className?: string }) {
  const { state } = useStore();
  const list = receivables(state.sales, state.today);
  const totals = agingTotals(list);

  return (
    <Card className={className}>
      <CardHeader
        title="Money owed"
        hint={list.length ? `${money(totals.total)} across ${totals.accounts} customer${totals.accounts === 1 ? "" : "s"}` : "Unpaid credit sales."}
      />
      {list.length === 0 ? (
        <Empty icon={CircleCheck} title="Nobody owes you money">Credit sales show up here until they are paid.</Empty>
      ) : (
        <ul className="divide-y divide-line-soft border-t border-line-soft">
          {list.slice(0, 3).map((r) => (
            <li key={r.sale.id} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{r.sale.customer}</div>
                <div className="mt-1">
                  <SaleStatus sale={r.sale} today={state.today} />
                </div>
              </div>
              <span className="tnum shrink-0 text-sm font-semibold text-ink">{money(r.sale.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line-soft px-5 py-3">
        <LinkButton href="/sales?show=owed" variant="ghost" size="sm" icon={ArrowRight} className="-ml-3 flex-row-reverse">
          {list.length > 3 ? `See all ${list.length} invoices` : "See all"}
        </LinkButton>
      </div>
    </Card>
  );
}
