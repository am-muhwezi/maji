"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import clsx from "clsx";
import { Legend, SERIES, StackedColumns } from "@/components/ui/charts";
import { Badge, Card, CardHeader, Empty, LinkButton, Progress, StatRow } from "@/components/ui/primitives";
import { compact, CURRENCY, money, num, weekday } from "@/lib/format";
import { AGING_LABEL, AGING_ORDER, agingTotals, canCloseDay, collectedOn, periodPnl, receivables, rollingPeriod, salesOn, stockTotals, weekVolumes } from "@/lib/ledger";
import { BUCKET_TONE, dueText } from "./summary";
import { useStore } from "@/lib/store";

/* ---------- Sales, last 7 days ---------- */

export function WeekCard({ className }: { className?: string }) {
  const { state } = useStore();
  const week = weekVolumes(state);
  const refills = week.reduce((a, d) => a + d.refill, 0);
  const newBottles = week.reduce((a, d) => a + d.newBottle, 0);
  const litres = periodPnl(state, rollingPeriod(state.today, 30)).litres;

  return (
    <Card className={className}>
      <CardHeader
        title="Sales, last 7 days"
        hint={`Refills and new bottles, in ${CURRENCY}.`}
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
          data={week.map((d) => ({ label: d.day === state.today ? "Today" : weekday(d.day), a: d.refill, b: d.newBottle, highlight: d.day === state.today }))}
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-soft px-5 py-3.5 text-sm">
        <span className="text-slate-600">
          Week total <span className="tnum font-semibold text-brand">{money(refills + newBottles)}</span>
        </span>
        <span className="tnum text-[13px] text-slate-500">{num(litres)} litres sold in the last 30 days</span>
      </div>
    </Card>
  );
}

/* ---------- Today ---------- */

export function TodayCard({ className }: { className?: string }) {
  const { state } = useStore();
  const collected = collectedOn(state.sales, state.today);
  const receipts = salesOn(state.sales, state.today).length;
  const stock = stockTotals(state.lines);
  const close = canCloseDay(state);
  const allCounted = stock.counted === stock.lines;

  return (
    <Card className={clsx("flex flex-col", className)}>
      <CardHeader title="Today" hint="Resets every morning." />
      <dl className="divide-y divide-line-soft px-5">
        <StatRow
          label="Collected today"
          strong
          value={
            <>
              {money(collected.total)}
              {collected.creditRepaid > 0 && (
                <span className="block text-[12px] font-normal text-slate-500">incl. {money(collected.creditRepaid)} of old credit</span>
              )}
            </>
          }
        />
        <StatRow label="Receipts today" value={num(receipts)} />
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
        <>
          <dl className="divide-y divide-line-soft border-t border-line-soft px-5">
            {AGING_ORDER.map((b) => (
              <StatRow
                key={b}
                label={AGING_LABEL[b].label}
                value={money(totals[b])}
                tone={totals[b] > 0 && b === "overdue" ? "danger" : undefined}
              />
            ))}
          </dl>
          <h3 className="border-t border-line-soft bg-canvas px-5 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Most urgent</h3>
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            {list.slice(0, 3).map((r) => (
              <li key={r.sale.id} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{r.sale.customer}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={BUCKET_TONE[r.bucket]}>{AGING_LABEL[r.bucket].label}</Badge>
                    <span className="text-[12px] whitespace-nowrap text-slate-500">{dueText(r.dueIn)}</span>
                  </div>
                </div>
                <span className="tnum shrink-0 text-sm font-semibold text-ink">{money(r.sale.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="border-t border-line-soft px-5 py-3">
        <LinkButton href="/sales?show=owed" variant="ghost" size="sm" icon={ArrowRight} className="-ml-3 flex-row-reverse">
          {list.length > 3 ? `See all ${list.length} invoices` : "See all"}
        </LinkButton>
      </div>
    </Card>
  );
}
