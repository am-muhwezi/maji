import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, LinkButton } from "@/components/ui/primitives";
import { compact, CURRENCY } from "@/lib/format";
import { AGING_LABEL, AGING_ORDER, type AgingBucket, type agingTotals } from "@/lib/ledger";

/** Colour only when there is money in the bucket; an empty bucket is always neutral. */
const TONE: Record<AgingBucket, string> = {
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  "due-soon": "border-amber-200 bg-amber-50 text-amber-800",
  current: "border-line bg-white text-ink",
};
const NEUTRAL = "border-line bg-white text-slate-500";

/** Unpaid credit sales today, split by how urgent they are (same order and words as Sales). */
export function MoneyOwedCard({ totals, className }: { totals: ReturnType<typeof agingTotals>; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Money owed"
        hint={
          totals.accounts === 0
            ? "Every credit sale is paid."
            : `As of today: ${CURRENCY} ${compact(totals.total)} unpaid from ${totals.accounts} customer${totals.accounts === 1 ? "" : "s"}.`
        }
        action={
          <LinkButton href="/sales?show=owed" size="sm" icon={ArrowRight} className="print:hidden">
            Follow up
          </LinkButton>
        }
      />
      <div className="grid grid-cols-3 gap-2 px-5 pb-5 sm:gap-3">
        {AGING_ORDER.map((b) => (
          <div
            key={b}
            data-bucket={b}
            className={clsx("min-w-0 rounded-lg border px-3 py-3 sm:px-4", totals[b] > 0 ? TONE[b] : NEUTRAL, "print:border-slate-300 print:bg-white")}
          >
            <p className="text-[12px] leading-4 font-semibold">{AGING_LABEL[b].label}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
              <span className="tnum text-lg font-semibold sm:text-xl">{compact(totals[b])}</span>
              <span className="text-[12px] font-medium opacity-70">{CURRENCY}</span>
            </p>
            <p className="mt-0.5 hidden text-[12px] text-slate-500 sm:block print:hidden">{AGING_LABEL[b].hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
