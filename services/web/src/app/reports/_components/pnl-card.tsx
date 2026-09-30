import { Card, CardHeader, StatRow } from "@/components/ui/primitives";
import { CURRENCY, num, pct, signed } from "@/lib/format";
import type { CategoryTotal, PeriodPnl } from "@/lib/ledger";

/** Costs read as money going out: signed() gives a true minus sign. */
function out(n: number): string {
  return signed(-n);
}

/** The accountant's view: sales, each cost line, total costs, net income. */
export function PnlCard({ pnl, costs, current, label, className }: { pnl: PeriodPnl; costs: CategoryTotal[]; current: boolean; label: string; className?: string }) {
  const span = current ? "so far this month" : `in ${label}`;
  return (
    <Card className={className}>
      <CardHeader
        title="Profit and loss"
        hint={`Money in from sales, minus every cost ${span}.`}
        action={<span className="text-[12px] font-medium text-slate-500">Amounts in {CURRENCY}</span>}
      />
      <div className="px-5 pb-5">
        <dl className="divide-y divide-line-soft">
          <StatRow label={<span className="font-medium text-ink">Sales</span>} value={num(pnl.revenue)} strong />
        </dl>

        <p className="mt-4 mb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Costs</p>
        {costs.length === 0 ? (
          <p className="py-2 text-sm text-slate-500">No costs recorded {span}.</p>
        ) : (
          <dl className="divide-y divide-line-soft">
            {costs.map((c) => (
              <StatRow
                key={c.category}
                label={
                  <>
                    {c.label}
                    <span className="tnum ml-1.5 text-[12px] text-slate-400">{pct(c.share)}</span>
                  </>
                }
                value={out(c.amount)}
              />
            ))}
          </dl>
        )}
        <dl className="border-t border-line">
          <StatRow label={<span className="font-medium text-ink">Total costs</span>} value={out(pnl.expenses)} strong />
        </dl>

        <div className="mt-3 rounded-lg bg-sky-50 px-4 py-3 print:border print:border-slate-300 print:bg-white">
          <dl>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm font-semibold text-ink">Net income</dt>
              <dd className={`tnum text-right text-xl font-semibold ${pnl.net < 0 ? "text-rose-600" : "text-brand"}`}>
                {pnl.net < 0 ? signed(pnl.net) : num(pnl.net)}
              </dd>
            </div>
          </dl>
          <p className="mt-0.5 text-[13px] text-slate-600">
            {pnl.net < 0 ? (
              <>Costs are higher than sales {span}.</>
            ) : (
              <>
                <span className="tnum font-semibold text-ink">{pct(pnl.margin)}</span> of sales kept as profit.
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
