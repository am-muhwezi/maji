"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { num } from "@/lib/format";
import { openShortages, stockTotals } from "@/lib/ledger";
import type { OpsState } from "@/lib/types";

interface Step {
  label: string;
  /** Label for the 2x2 phone grid, where half-width cells truncate long words. */
  short: string;
  status: string;
  done: boolean;
}

/** The four jobs of a shift, in order. Pure: derived from state only. */
export function daySteps(state: OpsState): Step[] {
  const t = stockTotals(state.lines);
  const open = openShortages(state).length;
  const allCounted = t.counted === t.lines;
  return [
    {
      label: "Produce",
      short: "Produce",
      done: t.production > 0,
      status: t.production > 0 ? `${num(t.production)} units made` : "Nothing recorded yet",
    },
    {
      label: "Count stock",
      short: "Count",
      done: allCounted,
      status: `${t.counted} of ${t.lines} counted`,
    },
    {
      label: "Explain shortages",
      short: "Explain",
      done: allCounted && open === 0,
      status: open > 0 ? `${open} to explain` : allCounted ? (t.shortLines > 0 ? "All explained" : "No shortages") : "After counting",
    },
    {
      label: "Close day",
      short: "Close day",
      done: state.dayClosed,
      status: state.dayClosed ? "Closed" : "Not closed yet",
    },
  ];
}

export function DaySteps({ state }: { state: OpsState }) {
  const steps = daySteps(state);
  const current = steps.findIndex((s) => !s.done);
  return (
    <nav aria-label="Today's progress">
      <ol className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-2 shadow-tier1 md:grid-cols-4 md:gap-0 md:p-0">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={s.label}
              aria-current={isCurrent ? "step" : undefined}
              className={clsx(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 md:rounded-none md:px-4 md:py-3.5",
                i > 0 && "md:border-l md:border-line",
                isCurrent && "bg-sky-50 md:shadow-[inset_0_-2px_0_0_var(--color-brand)]",
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
                  s.done && "bg-emerald-500 text-white",
                  !s.done && isCurrent && "bg-brand text-white",
                  !s.done && !isCurrent && "border border-slate-300 bg-white text-slate-500",
                )}
              >
                {s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={clsx("block truncate text-sm font-semibold", isCurrent ? "text-brand-active" : "text-ink")}>
                  <span className="md:hidden">{s.short}</span>
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="sr-only">{s.done ? " (done)" : isCurrent ? " (current step)" : ""}</span>
                </span>
                <span className={clsx("block truncate text-[12px]", s.done ? "text-emerald-700" : "text-slate-500")}>{s.status}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
