"use client";

import { Badge, StatRow } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { EXPENSE_LABEL, EXPENSE_PAYMENT_LABEL } from "@/lib/catalog";
import { day, pct, ratio, money } from "@/lib/format";
import type { Expense } from "@/lib/types";

/** Read-only details for one expense. `monthTotal` gives the share line. */
export function ExpenseDetail({ expense, monthTotal, onClose }: { expense: Expense | null; monthTotal: number; onClose: () => void }) {
  return (
    <Sheet
      open={expense !== null}
      onClose={onClose}
      title={expense?.description ?? "Expense"}
      description={expense ? `${expense.ref} · ${day(expense.day)}` : undefined}
    >
      {expense && (
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-line bg-canvas px-4 py-4">
            <p className="text-xs font-medium text-slate-500">Amount paid</p>
            <p className="tnum mt-1 text-[28px] leading-9 font-semibold tracking-tight text-ink">{money(expense.amount)}</p>
            <div className="mt-2">
              <Badge>{EXPENSE_LABEL[expense.category]}</Badge>
            </div>
          </div>
          <dl className="divide-y divide-line-soft">
            <StatRow label="Paid to" value={expense.vendor} />
            <StatRow label="Paid by" value={EXPENSE_PAYMENT_LABEL[expense.payment]} />
            <StatRow label="Approved by" value={expense.approvedBy} />
            <StatRow label="Date" value={day(expense.day)} />
            <StatRow label="Reference" value={expense.ref} />
            <StatRow label="Share of this month's spending" value={pct(ratio(expense.amount, monthTotal))} />
          </dl>
        </div>
      )}
    </Sheet>
  );
}
