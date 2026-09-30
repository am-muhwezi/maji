"use client";

import clsx from "clsx";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { type KeyboardEvent } from "react";
import { RESOLUTION_LABEL } from "@/components/explain-shortage";
import { CountStatus } from "@/components/ui/status";
import { Badge, Button, Card, CardHeader } from "@/components/ui/primitives";
import { Cell2, Table, TFoot, THead, Td, Th, Tr } from "@/components/ui/table";
import { product } from "@/lib/catalog";
import { num, signed } from "@/lib/format";
import { expected, lineStatus, openShortages, type StockTotals } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import type { ProductId, StockLine, VarianceResolution } from "@/lib/types";

type Variant = "table" | "card";

/** Parse what someone typed into a count box. `undefined` = not a valid count. */
export function parseCount(raw: string): number | null | undefined {
  const clean = raw.trim().replace(/[,\s]/g, "");
  if (clean === "") return null;
  if (!/^\d+$/.test(clean)) return undefined;
  return Number(clean);
}

/**
 * Inline count box. Uncontrolled and keyed on the stored value, so it resets to the
 * saved count whenever the store changes. Commits on blur; Enter jumps to the next product.
 */
function CountInput({ line, variant }: { line: StockLine; variant: Variant }) {
  const { state, dispatch, notify } = useStore();
  const name = product(line.productId).name;

  const commit = (el: HTMLInputElement) => {
    const next = parseCount(el.value);
    if (next === undefined) {
      el.value = line.physical === null ? "" : String(line.physical);
      notify(`${name}: type a whole number, like ${num(expected(line))}`, "error");
      return;
    }
    if (next === line.physical) {
      el.value = next === null ? "" : String(next);
      return;
    }
    if (!dispatch({ type: "setCount", productId: line.productId, physical: next })) return;
    notify(next === null ? `${name}: count cleared` : `${name}: counted ${num(next)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.value = line.physical === null ? "" : String(line.physical);
      e.currentTarget.blur();
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    const all = [...document.querySelectorAll<HTMLInputElement>(`input[data-count="${variant}"]:not(:disabled)`)];
    const next = all[all.indexOf(e.currentTarget) + 1];
    if (next) {
      next.focus();
      next.select();
    } else {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      key={String(line.physical)}
      id={`count-${variant}-${line.productId}`}
      data-count={variant}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="next"
      aria-label={`Counted, ${name}`}
      placeholder="Count"
      defaultValue={line.physical === null ? "" : String(line.physical)}
      disabled={state.dayClosed}
      onBlur={(e) => commit(e.currentTarget)}
      onKeyDown={onKeyDown}
      onFocus={(e) => e.currentTarget.select()}
      className={clsx(
        "tnum rounded-md border bg-white text-right font-semibold text-ink placeholder:font-normal placeholder:text-slate-400 transition-shadow focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 disabled:bg-slate-50 disabled:text-slate-500",
        line.physical === null ? "border-slate-300" : "border-slate-200",
        variant === "table" ? "h-9 w-24 px-2.5 text-sm" : "h-12 w-32 px-3 text-lg",
      )}
    />
  );
}

/** Badge plus the next thing to do about a shortage. */
function ResultCell({
  line,
  resolution,
  unexplained,
  onExplain,
  closed,
  stacked,
}: {
  line: StockLine;
  resolution?: VarianceResolution;
  unexplained: boolean;
  onExplain: (id: ProductId) => void;
  closed: boolean;
  stacked?: boolean;
}) {
  const name = product(line.productId).name;
  return (
    <div className={clsx("flex gap-2", stacked ? "flex-col items-stretch" : "flex-wrap items-center")}>
      {!stacked && <CountStatus line={line} />}
      {unexplained && !closed && (
        <Button
          size="sm"
          variant="secondary"
          icon={MessageSquareWarning}
          onClick={() => onExplain(line.productId)}
          aria-label={`Explain shortage for ${name}`}
          className={clsx(stacked && "h-10 w-full text-sm")}
        >
          Explain
        </Button>
      )}
      {resolution && lineStatus(line) === "short" && (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
          <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          <span>Explained: {RESOLUTION_LABEL[resolution.kind]}</span>
          {!closed && (
            <button
              type="button"
              onClick={() => onExplain(line.productId)}
              className="ml-1 rounded text-slate-500 underline underline-offset-2 hover:text-ink"
              aria-label={`Change explanation for ${name}`}
            >
              Change
            </button>
          )}
        </span>
      )}
    </div>
  );
}

function TotalBadge({ totals }: { totals: StockTotals }) {
  if (totals.counted === 0) return <Badge tone="neutral">Not counted</Badge>;
  if (totals.variance === 0) return <Badge tone="success">Balanced</Badge>;
  return <Badge tone={totals.variance < 0 ? "danger" : "warning"}>{signed(totals.variance)} {totals.variance < 0 ? "short" : "over"}</Badge>;
}

export function StockCount({ totals, onExplain }: { totals: StockTotals; onExplain: (id: ProductId) => void }) {
  const { state } = useStore();
  const open = new Set(openShortages(state).map((l) => l.productId));
  const resolutionFor = (id: ProductId) => state.resolutions.find((r) => r.productId === id && r.day === state.today);
  const closed = state.dayClosed;

  return (
    <Card id="count" className="scroll-mt-20">
      <CardHeader
        title="Stock count"
        hint={<>Expected = Opening + Produced − Sold. Type what you actually counted.</>}
        action={<span className="tnum text-[13px] font-medium text-slate-500">{totals.counted} of {totals.lines} counted</span>}
      />

      {/* Phone: one card per product, big count box. */}
      <ul className="flex flex-col gap-3 border-t border-line bg-canvas p-3 md:hidden">
        {state.lines.map((line) => {
          const p = product(line.productId);
          const unexplained = open.has(line.productId);
          return (
            <li
              key={line.productId}
              className={clsx("rounded-lg border bg-white p-4 shadow-tier1", unexplained ? "border-rose-200" : "border-line")}
            >
              <div className="flex items-start justify-between gap-3">
                <Cell2 primary={p.name} secondary={p.detail} />
                <CountStatus line={line} />
              </div>
              <p className="tnum mt-2 text-[13px] text-slate-500">
                Opening {num(line.opening)} · Produced <span className="text-brand">+{num(line.production)}</span> · Sold {num(line.sales)}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-slate-500">Expected</p>
                  <p className="tnum text-2xl font-semibold text-ink">{num(expected(line))}</p>
                </div>
                <label className="flex flex-col items-end gap-1">
                  <span className="text-[12px] font-medium text-slate-500" aria-hidden>Counted</span>
                  <CountInput line={line} variant="card" />
                </label>
              </div>
              {(unexplained || resolutionFor(line.productId)) && (
                <div className="mt-3">
                  <ResultCell
                    line={line}
                    resolution={resolutionFor(line.productId)}
                    unexplained={unexplained}
                    onExplain={onExplain}
                    closed={closed}
                    stacked
                  />
                </div>
              )}
            </li>
          );
        })}
        <li className="tnum flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-sm">
          <span className="font-semibold text-ink">All products</span>
          <span className="flex items-center gap-2 text-slate-600">
            Expected <span className="font-semibold text-ink">{num(totals.expected)}</span>
            <TotalBadge totals={totals} />
          </span>
        </li>
      </ul>

      {/* Tablet and desktop: the ledger table. */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th>Product</Th>
              <Th num>Opening</Th>
              <Th num>Produced</Th>
              <Th num>Sold</Th>
              <Th num>Expected</Th>
              <Th num>Counted</Th>
              <Th>Result</Th>
            </tr>
          </THead>
          <tbody>
            {state.lines.map((line) => {
              const p = product(line.productId);
              const unexplained = open.has(line.productId);
              return (
                <Tr key={line.productId} tone={unexplained ? "danger" : undefined}>
                  <Td><Cell2 primary={p.name} secondary={p.detail} /></Td>
                  <Td num className="text-slate-600">{num(line.opening)}</Td>
                  <Td num className="font-medium text-brand">+{num(line.production)}</Td>
                  <Td num className="text-slate-600">{num(line.sales)}</Td>
                  <Td num className="font-semibold text-ink">{num(expected(line))}</Td>
                  <Td num className="py-1.5"><CountInput line={line} variant="table" /></Td>
                  <Td>
                    <ResultCell
                      line={line}
                      resolution={resolutionFor(line.productId)}
                      unexplained={unexplained}
                      onExplain={onExplain}
                      closed={closed}
                    />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
          <TFoot>
            <tr>
              <Td>Total</Td>
              <Td num>{num(totals.opening)}</Td>
              <Td num className="text-brand">+{num(totals.production)}</Td>
              <Td num>{num(totals.sales)}</Td>
              <Td num>{num(totals.expected)}</Td>
              <Td num>
                {totals.counted === 0 ? (
                  <span className="font-normal text-slate-400">None yet</span>
                ) : (
                  <>
                    {num(totals.physical)}
                    {totals.counted < totals.lines && (
                      <span className="block text-[11px] font-normal text-slate-500">{totals.counted} of {totals.lines} products</span>
                    )}
                  </>
                )}
              </Td>
              <Td><TotalBadge totals={totals} /></Td>
            </tr>
          </TFoot>
        </Table>
      </div>
    </Card>
  );
}
