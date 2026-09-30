"use client";

import clsx from "clsx";
import { useState } from "react";
import { SERIES, niceTicks } from "@/components/ui/charts";
import { compact, money, shortDay } from "@/lib/format";
import type { DayVolume } from "@/lib/types";

/**
 * Day numbers that get an axis label: the 1st, every 5th, and today.
 * A regular label within 2 days of today is dropped so the two never overlap.
 */
export function showDayLabel(iso: string, today: string): boolean {
  if (iso === today) return true;
  const d = Number(iso.slice(8, 10));
  const nearToday = iso.slice(0, 7) === today.slice(0, 7) && Math.abs(Number(today.slice(8, 10)) - d) <= 2;
  return !nearToday && (d === 1 || d % 5 === 0);
}

/**
 * Stacked daily columns for up to 31 days. Local variant of the kit's StackedColumns:
 * tighter gaps so a full month fits at 390px, sparse day-number labels, edge-aware tooltip.
 */
export function DailyChart({ data, today, height = 200 }: { data: DayVolume[]; today: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.refill + d.newBottle));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const n = data.length;

  return (
    <figure>
      <figcaption className="sr-only">
        Daily sales. {data.map((d) => `${shortDay(d.day)}: refills ${money(d.refill)}, new bottles ${money(d.newBottle)}`).join("; ")}
      </figcaption>
      <div className="flex gap-2 sm:gap-3" style={{ height }}>
        <div className="tnum relative w-8 shrink-0 text-right text-[11px] text-slate-400 sm:w-9" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / top) * 100}%` }}>
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <div key={t} aria-hidden className={clsx("absolute inset-x-0 border-t", t === 0 ? "border-slate-300" : "border-dashed border-line-soft")} style={{ top: `${(1 - t / top) * 100}%` }} />
          ))}
          <div className={clsx("absolute inset-0 flex items-end", n > 10 ? "gap-[2px] sm:gap-1" : "justify-around gap-2")}>
            {data.map((d, i) => {
              const total = d.refill + d.newBottle;
              const dim = hover !== null && hover !== i ? 0.45 : 1;
              const tipSide = i < n / 3 ? "left-0" : i >= (2 * n) / 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <button
                  key={d.day}
                  type="button"
                  aria-label={`${shortDay(d.day)}: total ${money(total)}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-t-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
                  style={{ maxWidth: 48 }}
                >
                  <span className="block w-full rounded-t-[3px]" style={{ height: `${(d.newBottle / top) * 100}%`, background: SERIES.secondary, opacity: dim }} />
                  {d.newBottle > 0 && d.refill > 0 && <span className="block h-px w-full bg-white" aria-hidden />}
                  <span className={clsx("block w-full", d.newBottle === 0 && "rounded-t-[3px]")} style={{ height: `${(d.refill / top) * 100}%`, background: SERIES.primary, opacity: dim }} />
                  {hover === i && (
                    <span role="tooltip" className={clsx("pointer-events-none absolute bottom-full z-10 mb-2 w-52 rounded-md border border-slate-300 bg-white p-2.5 text-left shadow-tier2", tipSide)}>
                      <span className="block text-[12px] font-semibold text-ink">{d.day === today ? `Today, ${shortDay(d.day)}` : shortDay(d.day)}</span>
                      <TipRow color={SERIES.primary} label="Refills" value={money(d.refill)} />
                      <TipRow color={SERIES.secondary} label="New bottles" value={money(d.newBottle)} />
                      <span className="mt-1 flex justify-between border-t border-line-soft pt-1 text-[12px] font-semibold text-ink">
                        <span>Total</span>
                        <span className="tnum">{money(total)}</span>
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className={clsx("mt-2 flex h-4 pl-10 sm:pl-12", n > 10 ? "gap-[2px] sm:gap-1" : "justify-around gap-2")} aria-hidden>
        {data.map((d) => (
          <span key={d.day} className={clsx("tnum relative min-w-0 flex-1 text-center text-[11px] whitespace-nowrap", d.day === today ? "font-semibold text-ink" : "text-slate-500")} style={{ maxWidth: 48 }}>
            {(n <= 10 || showDayLabel(d.day, today)) && <span className="absolute left-1/2 -translate-x-1/2">{Number(d.day.slice(8, 10))}</span>}
          </span>
        ))}
      </div>
    </figure>
  );
}

function TipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-sm" style={{ background: color }} aria-hidden />
        {label}
      </span>
      <span className="tnum text-ink">{value}</span>
    </span>
  );
}
