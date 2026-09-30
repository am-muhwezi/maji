"use client";

import clsx from "clsx";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { Button, Card, CardHeader, Empty } from "@/components/ui/primitives";
import { Cell2, TFoot, Table, Td, THead, Th, Tr } from "@/components/ui/table";
import { SaleStatus } from "@/components/ui/status";
import { useStore } from "@/lib/store";
import { compact, day, num, money } from "@/lib/format";
import { agingTotals, type AgingBucket, type Receivable } from "@/lib/ledger";

const TILES: {
  bucket: AgingBucket;
  label: string;
  hint: string;
  cls: string;
  valueCls: string;
}[] = [
  {
    bucket: "overdue",
    label: "Overdue",
    hint: "Past the due date. Call these first.",
    cls: "border-rose-200 bg-rose-50",
    valueCls: "text-rose-700",
  },
  {
    bucket: "due-soon",
    label: "Due within 7 days",
    hint: "Remind them before it is late.",
    cls: "border-amber-200 bg-amber-50",
    valueCls: "text-amber-700",
  },
  {
    bucket: "current",
    label: "Later",
    hint: "Due in more than a week.",
    cls: "border-line bg-canvas",
    valueCls: "text-ink",
  },
];

/** Unpaid credit sales, most urgent first, with an inline two-step "Mark paid". */
export function OwedView({
  list,
  today,
}: {
  list: Receivable[];
  today: string;
}) {
  const { dispatch, notify } = useStore();
  const [confirming, setConfirming] = useState<string | null>(null);
  const totals = agingTotals(list);
  const counts = { overdue: 0, "due-soon": 0, current: 0 } as Record<
    AgingBucket,
    number
  >;
  for (const r of list) counts[r.bucket] += 1;

  const markPaid = (r: Receivable) => {
    const ok = dispatch({ type: "markPaid", saleId: r.sale.id });
    setConfirming(null);
    if (ok)
      notify(
        `${r.sale.customer} paid ${money(r.sale.amount)} · ${r.sale.receipt}`,
      );
    else notify(`Could not mark ${r.sale.receipt} as paid`, "error");
  };

  return (
    <Card>
      <CardHeader
        title="Money owed"
        hint={
          list.length
            ? `${money(totals.total)} across ${totals.accounts} customer${totals.accounts === 1 ? "" : "s"}. Mark a sale paid when the money arrives.`
            : undefined
        }
      />
      {list.length === 0 ? (
        <div className="border-t border-line">
          <Empty icon={CircleCheck} title="Nobody owes you money">
            Credit sales show up here until the customer pays.
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 px-4 pb-5 sm:gap-3 sm:px-5">
            {TILES.map((t) => (
              <div
                key={t.bucket}
                className={clsx("min-w-0 rounded-lg border p-3 sm:p-4", t.cls)}
              >
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="text-[12px] leading-4 font-medium text-slate-700 sm:text-[13px]">
                    {t.label}
                  </span>
                  <span className="tnum text-[11px] text-slate-500 sm:text-[12px]">
                    {counts[t.bucket]} sale{counts[t.bucket] === 1 ? "" : "s"}
                  </span>
                </div>
                <p
                  className={clsx(
                    "tnum mt-1 text-lg font-semibold tracking-tight sm:text-2xl",
                    t.valueCls,
                  )}
                >
                  {compact(totals[t.bucket])}{" "}
                  <span className="text-[12px] font-medium text-slate-500 sm:text-sm">
                    RWF
                  </span>
                </p>
                <p className="mt-0.5 hidden text-[12px] text-slate-500 sm:block">
                  {t.hint}
                </p>
              </div>
            ))}
          </div>
          <ul
            className="border-t border-line md:hidden"
            aria-label="Unpaid credit sales, most urgent first"
          >
            {list.map((r) => {
              const s = r.sale;
              return (
                <li
                  key={s.id}
                  className={clsx(
                    "flex flex-col gap-2 border-b border-line-soft px-4 py-3",
                    r.bucket === "overdue" && "bg-rose-50/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Cell2
                      primary={s.customer}
                      secondary={`${s.receipt} · sold ${day(s.day)}`}
                    />
                    <span className="tnum shrink-0 text-sm font-semibold text-ink">
                      {num(s.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <SaleStatus sale={s} today={today} />
                    <PayAction
                      r={r}
                      confirming={confirming === s.id}
                      onAsk={() => setConfirming(s.id)}
                      onCancel={() => setConfirming(null)}
                      onConfirm={() => markPaid(r)}
                    />
                  </div>
                </li>
              );
            })}
            <li className="flex items-center justify-between bg-canvas px-4 py-3 text-sm font-semibold">
              <span className="text-slate-600">
                {list.length} unpaid sale{list.length === 1 ? "" : "s"}
              </span>
              <span className="tnum text-ink">{money(totals.total)}</span>
            </li>
          </ul>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">
                Unpaid credit sales, most urgent first.
              </caption>
              <THead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Sold on</Th>
                  <Th>Due</Th>
                  <Th num>Amount</Th>
                  <Th className="text-right">
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </THead>
              <tbody>
                {list.map((r) => {
                  const s = r.sale;
                  const isConfirming = confirming === s.id;
                  return (
                    <Tr
                      key={s.id}
                      interactive={false}
                      tone={r.bucket === "overdue" ? "danger" : undefined}
                    >
                      <Td>
                        <Cell2
                          primary={s.customer}
                          secondary={
                            <>
                              {s.receipt}
                              {s.customerNote && <> · {s.customerNote}</>}
                            </>
                          }
                        />
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {day(s.day)}
                      </Td>
                      <Td>
                        <SaleStatus sale={s} today={today} />
                      </Td>
                      <Td num className="font-semibold text-ink">
                        {num(s.amount)}
                      </Td>
                      <Td className="text-right">
                        <PayAction
                          r={r}
                          confirming={isConfirming}
                          onAsk={() => setConfirming(s.id)}
                          onCancel={() => setConfirming(null)}
                          onConfirm={() => markPaid(r)}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
              <TFoot>
                <tr>
                  <Td className="text-slate-600">
                    {list.length} unpaid sale{list.length === 1 ? "" : "s"}
                  </Td>
                  <Td />
                  <Td />
                  <Td num className="text-ink">
                    {money(totals.total)}
                  </Td>
                  <Td />
                </tr>
              </TFoot>
            </Table>
          </div>
        </>
      )}
    </Card>
  );
}

function PayAction({
  r,
  confirming,
  onAsk,
  onCancel,
  onConfirm,
}: {
  r: Receivable;
  confirming: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const s = r.sale;
  if (!confirming) {
    return (
      <Button
        size="sm"
        onClick={onAsk}
        aria-label={`Mark ${s.receipt} from ${s.customer} as paid`}
      >
        Mark paid
      </Button>
    );
  }
  return (
    <div
      className="flex items-center justify-end gap-1.5"
      role="group"
      aria-label={`Confirm payment for ${s.receipt}`}
    >
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        size="sm"
        variant="primary"
        onClick={onConfirm}
        aria-label={`Confirm ${s.customer} paid ${money(s.amount)}`}
        autoFocus
      >
        Confirm
      </Button>
    </div>
  );
}
