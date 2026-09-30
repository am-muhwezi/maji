import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, LinkButton } from "@/components/ui/primitives";
import { compact } from "@/lib/format";
import type { AgingBucket, agingTotals } from "@/lib/ledger";

const BUCKETS: { key: AgingBucket; label: string; hint: string; tone: string }[] = [
  { key: "current", label: "Not due yet", hint: "More than 7 days left", tone: "border-line bg-white text-ink" },
  { key: "due-soon", label: "Due soon", hint: "Due within 7 days", tone: "border-amber-200 bg-amber-50 text-amber-800" },
  { key: "overdue", label: "Overdue", hint: "Past the due date", tone: "border-rose-200 bg-rose-50 text-rose-700" },
];

/** Unpaid credit sales split by how urgent they are. */
export function MoneyOwedCard({ totals, className }: { totals: ReturnType<typeof agingTotals>; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Money owed"
        hint={
          totals.accounts === 0
            ? "Every credit sale is paid."
            : `RWF ${compact(totals.total)} unpaid from ${totals.accounts} customer${totals.accounts === 1 ? "" : "s"}.`
        }
        action={
          <LinkButton href="/sales?show=owed" size="sm" icon={ArrowRight} className="print:hidden">
            Follow up
          </LinkButton>
        }
      />
      <div className="grid grid-cols-3 gap-2 px-5 pb-5 sm:gap-3">
        {BUCKETS.map((b) => (
          <div key={b.key} className={clsx("min-w-0 rounded-lg border px-3 py-3 sm:px-4", b.tone, "print:border-slate-300 print:bg-white")}>
            <p className="text-[12px] font-semibold">{b.label}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="tnum text-lg font-semibold sm:text-xl">{compact(totals[b.key])}</span>
              <span className="text-[12px] font-medium opacity-70">RWF</span>
            </p>
            <p className="mt-0.5 hidden text-[12px] text-slate-500 sm:block print:hidden">{b.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
