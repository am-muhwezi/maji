"use client";

import { CircleCheck, Lock } from "lucide-react";
import { RESOLUTION_LABEL } from "@/components/explain-shortage";
import { Badge, Button, Card, CardHeader } from "@/components/ui/primitives";
import { product } from "@/lib/catalog";
import { num, money } from "@/lib/format";
import { expected, lineStatus, variance, varianceValue } from "@/lib/ledger";
import type { OpsState, ProductId } from "@/lib/types";

/** One row per product that came up short today, with its explanation or an Explain button. */
export function ShortagesCard({ state, onExplain }: { state: OpsState; onExplain: (id: ProductId) => void }) {
  const short = state.lines.filter((l) => lineStatus(l) === "short");
  if (short.length === 0) return null;
  const resolutionFor = (id: ProductId) => state.resolutions.find((r) => r.productId === id && r.day === state.today);
  const open = short.filter((l) => !resolutionFor(l.productId)).length;

  return (
    <Card aria-labelledby="shortages-title">
      <CardHeader
        title={<span id="shortages-title">{open === 0 ? "Today's shortages" : "Shortages to explain"}</span>}
        hint={
          state.dayClosed ? (
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Lock className="size-4" aria-hidden />
              Day closed{state.closedBy ? ` by ${state.closedBy}` : ""}. These explanations are locked.
            </span>
          ) : open === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <CircleCheck className="size-4" aria-hidden />
              All explained. The day can be closed on the Daily Log.
            </span>
          ) : (
            `Pick a likely reason for each one. The day can't be closed until all ${short.length} are explained.`
          )
        }
      />
      <ul className="border-t border-line-soft">
        {short.map((l) => {
          const p = product(l.productId);
          const res = resolutionFor(l.productId);
          const missing = -(variance(l) ?? 0);
          return (
            <li
              key={l.productId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 border-b border-line-soft px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_10rem_300px] sm:items-center sm:gap-x-6"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{p.name}</p>
                <p className="tnum text-[13px] text-slate-500">
                  Expected {num(expected(l))} · Counted {num(l.physical ?? 0)}
                </p>
              </div>
              <div className="tnum text-right">
                <p className="font-semibold text-rose-600">{num(missing)} missing</p>
                <p className="text-[13px] text-slate-500">{money(-varianceValue(l))}</p>
              </div>
              <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1 sm:justify-end">
                {res ? (
                  <>
                    <div className="min-w-0 flex-1 sm:text-right">
                      <Badge tone="success">
                        <CircleCheck className="size-3" aria-hidden />
                        {RESOLUTION_LABEL[res.kind]}
                      </Badge>
                      {res.note && <p className="mt-1 truncate text-[13px] text-slate-500" title={res.note}>{res.note}</p>}
                    </div>
                    {!state.dayClosed && (
                      <Button size="sm" variant="ghost" onClick={() => onExplain(l.productId)} aria-label={`Change explanation for ${p.name}`}>
                        Change
                      </Button>
                    )}
                  </>
                ) : state.dayClosed ? (
                  <Badge tone="danger">Not explained</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onExplain(l.productId)} aria-label={`Explain shortage for ${p.name}`} className="w-full sm:w-auto">
                    Explain
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
