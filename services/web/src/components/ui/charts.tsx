"use client";

import clsx from "clsx";
import { useState } from "react";
import { compact, pct, ugx } from "@/lib/format";

/**
 * Series colors validated with the dataviz skill's validate_palette.js (light mode):
 * #075985 / #38bdf8 pass lightness, chroma, CVD and normal-vision checks.
 * #38bdf8 is below 3:1 on white, so every chart ships relief: legend with values,
 * per-mark tooltip, and a visible total.
 */
export const SERIES = { primary: "#075985", secondary: "#38bdf8" } as const;

export interface StackDatum {
  label: string;
  a: number;
  b: number;
  highlight?: boolean;
}

/** Stacked two-series column chart with a per-column hover/focus tooltip. */
export function StackedColumns({
  data,
  seriesA,
  seriesB,
  height = 200,
}: {
  data: StackDatum[];
  seriesA: string;
  seriesB: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.a + d.b));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];

  return (
    <figure>
      <figcaption className="sr-only">
        {data.map((d) => `${d.label}: ${seriesA} ${ugx(d.a)}, ${seriesB} ${ugx(d.b)}`).join("; ")}
      </figcaption>
      <div className="flex gap-3" style={{ height }}>
        <div className="tnum relative w-9 shrink-0 text-right text-[11px] text-slate-400" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / top) * 100}%` }}>
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} aria-hidden className={clsx("absolute inset-x-0 border-t", t === 0 ? "border-slate-300" : "border-dashed border-line-soft")} style={{ top: `${(1 - t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-2">
            {data.map((d, i) => {
              const total = d.a + d.b;
              return (
                <button
                  key={d.label}
                  type="button"
                  aria-label={`${d.label}: total ${ugx(total)}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="group relative flex h-full w-full max-w-12 flex-col justify-end focus:outline-none"
                >
                  {/* 2px surface gap between stacked segments; 4px rounding on the data end only. */}
                  <span className="block w-full rounded-t-[4px]" style={{ height: `${(d.b / top) * 100}%`, background: SERIES.secondary, opacity: hover === null || hover === i ? 1 : 0.45 }} />
                  <span className="block h-[2px] w-full bg-white" aria-hidden />
                  <span className="block w-full" style={{ height: `${(d.a / top) * 100}%`, background: SERIES.primary, opacity: hover === null || hover === i ? 1 : 0.45 }} />
                  {hover === i && (
                    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-44 -translate-x-1/2 rounded-md border border-slate-300 bg-white p-2.5 text-left shadow-tier2">
                      <span className="block text-[12px] font-semibold text-ink">{d.label}</span>
                      <TipRow color={SERIES.primary} label={seriesA} value={ugx(d.a)} />
                      <TipRow color={SERIES.secondary} label={seriesB} value={ugx(d.b)} />
                      <span className="mt-1 flex justify-between border-t border-line-soft pt-1 text-[12px] font-semibold text-ink">
                        <span>Total</span>
                        <span className="tnum">{compact(total)}</span>
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-3 pl-12" aria-hidden>
        {data.map((d) => (
          <span key={d.label} className={clsx("flex-1 text-center text-[11px]", d.highlight ? "font-semibold text-ink" : "text-slate-500")}>
            {d.label}
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
        <span className="size-2 rounded-sm" style={{ background: color }} />
        {label}
      </span>
      <span className="tnum text-ink">{value}</span>
    </span>
  );
}

export function Legend({ items }: { items: { color: string; label: string; value?: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-[12px] text-slate-600">
          <span className="size-2.5 rounded-sm" style={{ background: it.color }} aria-hidden />
          {it.label}
          {it.value && <span className="tnum font-semibold text-ink">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Ranked horizontal bars in a single hue: length encodes magnitude, labels carry identity.
 * Used for "share of total" breakdowns instead of a donut or a multi-hue stacked bar.
 */
export function RankedBars({ rows, format = ugx }: { rows: { label: string; value: number; share: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-slate-700">
              {r.label}
              {r.note && <span className="ml-1.5 text-[12px] text-slate-400">{r.note}</span>}
            </span>
            <span className="tnum shrink-0 font-semibold text-ink">
              {format(r.value)} <span className="ml-1 w-11 text-[12px] font-medium text-slate-500">{pct(r.share)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div className="h-full rounded-full bg-brand" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 0, and 3-4 round steps covering max. */
export function niceTicks(max: number): number[] {
  const rough = max / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const ticks: number[] = [];
  for (let t = 0; t < max + step; t += step) ticks.push(t);
  return ticks;
}
