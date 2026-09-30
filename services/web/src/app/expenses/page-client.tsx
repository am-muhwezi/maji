"use client";

import { CalendarDays, ChartBar, Plus, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuickEntry } from "@/components/entry/quick-entry";
import { RankedBars } from "@/components/ui/charts";
import { Button, Card, CardHeader, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui/primitives";
import { EXPENSE_BUDGET } from "@/lib/catalog";
import { compact, monthName, pct, ratio } from "@/lib/format";
import { expensesByCategory, inMonth } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import type { Expense } from "@/lib/types";
import { ExpenseDetail } from "./_components/expense-detail";
import { ExpenseTable } from "./_components/expense-table";
import { newestFirst, sumAmount } from "./_components/month-expenses";

export function Page() {
  const { state } = useStore();
  const { openEntry } = useQuickEntry();
  const [openId, setOpenId] = useState<string | null>(null);

  const month = useMemo(() => newestFirst(state.expenses.filter((e) => inMonth(e.day, state.today))), [state.expenses, state.today]);
  const categories = useMemo(() => expensesByCategory(month), [month]);
  const today = useMemo(() => month.filter((e) => e.day === state.today), [month, state.today]);

  const spent = sumAmount(month);
  const spentToday = sumAmount(today);
  const budgetUsed = ratio(spent, EXPENSE_BUDGET);
  const biggest = categories[0];
  const bars = categories.map((c) => ({ label: c.label, value: c.amount, share: c.share }));
  const opened: Expense | null = month.find((e) => e.id === openId) ?? null;
  const logExpense = () => openEntry("expense");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        description={`Money the plant spent in ${monthName(state.today)}, by category.`}
        actions={
          <Button variant="primary" icon={Plus} onClick={logExpense}>
            Log expense
          </Button>
        }
      />

      <KpiGrid>
        <Kpi
          label="Spent this month"
          value={compact(spent)}
          unit="RWF"
          icon={Wallet}
          foot={`${pct(budgetUsed)} of RWF ${compact(EXPENSE_BUDGET)} budget`}
          footTone={budgetUsed > 1 ? "down" : "neutral"}
        />
        <Kpi
          label={biggest ? `Biggest: ${biggest.label}` : "Biggest cost"}
          value={compact(biggest?.amount ?? 0)}
          unit="RWF"
          icon={ChartBar}
          foot={biggest ? `${pct(biggest.share)} of this month's spending` : "No spending yet"}
        />
        <Kpi
          label="Spent today"
          value={compact(spentToday)}
          unit="RWF"
          icon={CalendarDays}
          foot={today.length === 0 ? "Nothing logged yet today" : `${today.length} ${today.length === 1 ? "entry" : "entries"}`}
        />
        <Kpi
          label="Entries this month"
          value={String(month.length)}
          icon={Receipt}
          foot={month.length === 0 ? "No entries yet" : `avg ${compact(ratio(spent, month.length))} RWF per entry`}
        />
      </KpiGrid>

      {/* Phone/tablet: the category card sits under the KPIs. xl: table left (2/3), categories right (1/3). */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Card className="xl:col-start-3 xl:row-start-1">
          <CardHeader title="Where the money goes" hint={`RWF spent per category in ${monthName(state.today)}`} />
          <div className="px-5 pb-5">
            {categories.length === 0 ? (
              <Empty icon={ChartBar} title="Nothing spent yet this month" />
            ) : (
              // Two columns on tablet (card is full width), one column beside the table at xl.
              <div className="grid gap-x-10 gap-y-3.5 md:grid-cols-2 xl:grid-cols-1">
                {[bars.slice(0, Math.ceil(bars.length / 2)), bars.slice(Math.ceil(bars.length / 2))].map((half, i) =>
                  half.length ? <RankedBars key={i} rows={half} format={compact} /> : null,
                )}
              </div>
            )}
          </div>
        </Card>
        <div className="min-w-0 xl:col-span-2 xl:col-start-1 xl:row-start-1">
          <ExpenseTable expenses={month} categories={categories} onOpen={(e) => setOpenId(e.id)} onLog={logExpense} />
        </div>
      </div>

      <ExpenseDetail expense={opened} monthTotal={spent} onClose={() => setOpenId(null)} />
    </div>
  );
}
