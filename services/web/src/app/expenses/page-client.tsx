"use client";

import { CalendarDays, ChartBar, Plus, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuickEntry } from "@/components/entry/quick-entry";
import { RankedBars } from "@/components/ui/charts";
import { Button, Card, CardHeader, Empty, Kpi, KpiGrid, PageHeader, Segmented } from "@/components/ui/primitives";
import { EXPENSE_BUDGET } from "@/lib/catalog";
import { compact, CURRENCY, pct, ratio } from "@/lib/format";
import { expensesByCategory, expensesIn, monthPeriod } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import type { Expense } from "@/lib/types";
import { ExpenseDetail } from "./_components/expense-detail";
import { ExpenseTable } from "./_components/expense-table";
import { newestFirst, sumAmount } from "./_components/month-expenses";

type Which = "this" | "last";

/** When the current month is this young, point people at last month for a fuller picture. */
const THIN_MONTH_DAYS = 3;

const nowrap = (s: string) => <span className="whitespace-nowrap">{s}</span>;

export function Page() {
  const { state, dispatch, notify } = useStore();
  const { openEntry } = useQuickEntry();
  const [which, setWhich] = useState<Which>("this");
  const [openId, setOpenId] = useState<string | null>(null);

  const period = useMemo(() => monthPeriod(state.today, which === "this" ? 0 : -1), [state.today, which]);
  const list = useMemo(() => newestFirst(expensesIn(state, period)), [state, period]);
  const categories = useMemo(() => expensesByCategory(list), [list]);
  const todays = useMemo(() => list.filter((e) => e.day === state.today), [list, state.today]);

  const isThis = which === "this";
  const spent = sumAmount(list);
  const budgetUsed = ratio(spent, EXPENSE_BUDGET);
  const biggest = categories[0];
  const bars = categories.map((c) => ({ label: c.label, value: c.amount, share: c.share }));
  const half = Math.ceil(bars.length / 2);
  const opened: Expense | null = list.find((e) => e.id === openId) ?? null;
  const logExpense = () => openEntry("expense");

  const remove = (e: Expense) => {
    if (dispatch({ type: "deleteExpense", expenseId: e.id })) {
      notify(`Deleted ${e.ref} (${compact(e.amount)} ${CURRENCY})`);
      setOpenId(null);
    } else {
      notify("Only expenses logged today can be deleted.", "error");
    }
  };

  const thin = isThis && period.days <= THIN_MONTH_DAYS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <PageHeader
          title="Expenses"
          description={`Money the plant spent in ${period.label}, by category.`}
          actions={
            <>
              <Segmented<Which>
                label="Month"
                value={which}
                onChange={setWhich}
                options={[
                  { value: "this", label: "This month" },
                  { value: "last", label: "Last month" },
                ]}
              />
              <Button variant="primary" icon={Plus} onClick={logExpense}>
                Log expense
              </Button>
            </>
          }
        />
        {thin && (
          <p className="text-[13px] text-slate-500">
            Only {period.days} {period.days === 1 ? "day" : "days"} so far.{" "}
            <button
              type="button"
              onClick={() => setWhich("last")}
              className="rounded-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              See last month
            </button>
          </p>
        )}
      </div>

      <KpiGrid>
        <Kpi
          label={isThis ? "Spent this month" : "Spent last month"}
          value={compact(spent)}
          unit={CURRENCY}
          icon={Wallet}
          foot={
            <>
              {nowrap(`${pct(budgetUsed)} of`)} {nowrap(`${CURRENCY} ${compact(EXPENSE_BUDGET)} budget`)}
            </>
          }
          footTone={budgetUsed > 1 ? "down" : "neutral"}
        />
        <Kpi
          label={biggest ? `Biggest: ${biggest.label}` : "Biggest cost"}
          value={compact(biggest?.amount ?? 0)}
          unit={CURRENCY}
          icon={ChartBar}
          foot={biggest ? `${pct(biggest.share)} of spending` : "No spending yet"}
        />
        {isThis ? (
          <Kpi
            label="Spent today"
            value={compact(sumAmount(todays))}
            unit={CURRENCY}
            icon={CalendarDays}
            foot={todays.length === 0 ? "Nothing logged yet" : `${todays.length} ${todays.length === 1 ? "entry" : "entries"}`}
          />
        ) : (
          <Kpi
            label="Per day"
            value={compact(ratio(spent, period.days))}
            unit={CURRENCY}
            icon={CalendarDays}
            foot={`Average over ${period.days} days`}
          />
        )}
        <Kpi
          label="Entries"
          value={String(list.length)}
          icon={Receipt}
          foot={list.length === 0 ? "None yet" : `avg ${compact(ratio(spent, list.length))} ${CURRENCY} each`}
        />
      </KpiGrid>

      {/* Table first everywhere; at xl the category card moves to the right third. */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2 xl:col-start-1 xl:row-start-1">
          <ExpenseTable
            key={period.from}
            title={`Expenses in ${period.label}`}
            periodLabel={period.label}
            expenses={list}
            categories={categories}
            onOpen={(e) => setOpenId(e.id)}
            onLog={logExpense}
          />
        </div>
        <Card className="xl:col-start-3 xl:row-start-1">
          <CardHeader title="Where the money goes" hint={`${CURRENCY} spent per category, ${period.label}`} />
          <div className="px-5 pb-5">
            {categories.length === 0 ? (
              <Empty icon={ChartBar} title={`Nothing spent in ${period.label} yet`} />
            ) : (
              // Two columns on tablet, one beside the table at xl. One shared max keeps bar lengths comparable across columns.
              <div className="grid gap-x-10 gap-y-3.5 md:grid-cols-2 xl:grid-cols-1">
                <RankedBars rows={bars.slice(0, half)} format={compact} max={bars[0].value} />
                {bars.length > half && <RankedBars rows={bars.slice(half)} format={compact} max={bars[0].value} />}
              </div>
            )}
          </div>
        </Card>
      </div>

      <ExpenseDetail
        expense={opened}
        today={state.today}
        periodTotal={spent}
        periodLabel={period.label}
        onDelete={remove}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
