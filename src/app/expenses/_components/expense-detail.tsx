"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, StatRow } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { EXPENSE_LABEL, EXPENSE_PAYMENT_LABEL } from "@/lib/catalog";
import { day, money, pct, ratio } from "@/lib/format";
import type { Expense } from "@/lib/types";

const dangerOutline = "border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-50";

/**
 * Details for one expense. Today's entries can be deleted (a mistake caught the same day);
 * older ones are part of the books and stay.
 */
export function ExpenseDetail({
  expense,
  today,
  periodTotal,
  periodLabel,
  onDelete,
  onClose,
}: {
  expense: Expense | null;
  today: string;
  periodTotal: number;
  periodLabel: string;
  onDelete: (e: Expense) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={expense !== null}
      onClose={onClose}
      title={expense?.description ?? "Expense"}
      description={expense ? `${expense.ref} · ${day(expense.day)}` : undefined}
    >
      {/* Keyed so an open confirm never carries over to another expense. */}
      {expense && <Body key={expense.id} expense={expense} canDelete={expense.day === today} periodTotal={periodTotal} periodLabel={periodLabel} onDelete={onDelete} />}
    </Sheet>
  );
}

function Body({
  expense,
  canDelete,
  periodTotal,
  periodLabel,
  onDelete,
}: {
  expense: Expense;
  canDelete: boolean;
  periodTotal: number;
  periodLabel: string;
  onDelete: (e: Expense) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
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
        <StatRow label="Recorded by" value={expense.recordedBy} />
        <StatRow label="Date" value={day(expense.day)} />
        <StatRow label="Reference" value={expense.ref} />
        <StatRow label={`Share of ${periodLabel} spending`} value={pct(ratio(expense.amount, periodTotal))} />
      </dl>

      <div className="border-t border-line pt-4">
        {!canDelete ? (
          <p className="text-[13px] text-slate-500">Only expenses logged today can be deleted.</p>
        ) : !confirming ? (
          <Button icon={Trash2} className={dangerOutline} onClick={() => setConfirming(true)}>
            Delete expense
          </Button>
        ) : (
          <div role="group" aria-label="Confirm delete" className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-ink">Delete {expense.ref}?</span> {money(expense.amount)} comes off the books. This cannot be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button icon={Trash2} className={dangerOutline} onClick={() => onDelete(expense)}>
                Yes, delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Keep it
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
