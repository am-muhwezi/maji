"use client";

import {
  Clock,
  Download,
  Plus,
  ReceiptText,
  HandCoins,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useQuickEntry } from "@/components/entry/quick-entry";
import {
  Button,
  Kpi,
  KpiGrid,
  PageHeader,
  Segmented,
} from "@/components/ui/primitives";
import { CURRENCY, compact, num } from "@/lib/format";
import {
  agingTotals,
  collectedOn,
  receivables,
  salesOn,
  salesSummary,
} from "@/lib/ledger";
import { CREDIT_TERMS_DAYS } from "@/lib/reducer";
import { useStore } from "@/lib/store";
import { OwedView } from "./_components/owed-view";
import { ReceiptsView } from "./_components/receipts-view";
import {
  csvFilename,
  filterSales,
  newestFirst,
  NO_FILTERS,
  salesCsv,
  type SaleFilters,
} from "./_components/sales-data";

type View = "receipts" | "owed";

/** useSearchParams needs a Suspense boundary in Next 16, so the page body lives in <SalesPage>. */
export function Page() {
  return (
    <Suspense>
      <SalesPage />
    </Suspense>
  );
}

function SalesPage() {
  const { state, notify } = useStore();
  const { openEntry } = useQuickEntry();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view: View = params.get("show") === "owed" ? "owed" : "receipts";
  const [filters, setFilters] = useState<SaleFilters>(NO_FILTERS);

  const todays = useMemo(
    () => newestFirst(salesOn(state.sales, state.today)),
    [state.sales, state.today],
  );
  const shown = useMemo(() => filterSales(todays, filters), [todays, filters]);
  const owed = useMemo(
    () => receivables(state.sales, state.today),
    [state.sales, state.today],
  );

  const sum = salesSummary(todays);
  const collected = collectedOn(state.sales, state.today);
  const creditToday = todays.filter((s) => s.payment === "credit").length;
  const aging = agingTotals(owed);
  const overdueCount = owed.filter((r) => r.bucket === "overdue").length;

  const setView = (v: View) => {
    const next = new URLSearchParams(params.toString());
    if (v === "owed") next.set("show", "owed");
    else next.delete("show");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const exportCsv = () => {
    if (shown.length === 0) {
      notify("Nothing to export: no receipts match the filters", "error");
      return;
    }
    const blob = new Blob([salesCsv(shown)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename(state.today);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(`Exported ${shown.length} receipt${shown.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales"
        description="Every receipt today, and money customers still owe."
        actions={
          <>
            <Button icon={Download} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => openEntry("sale")}
            >
              Record sale
            </Button>
          </>
        }
      />

      <KpiGrid>
        <Kpi
          label="Collected today"
          value={compact(collected.total)}
          unit={CURRENCY}
          icon={Wallet}
          foot={
            <>
              <span className="whitespace-nowrap">
                cash {compact(collected.cash)} ·
              </span>{" "}
              <span className="whitespace-nowrap">
                mobile {compact(collected.mobile)}
              </span>
              {collected.creditRepaid > 0 && (
                <>
                  {" "}
                  <span className="whitespace-nowrap">
                    + {compact(collected.creditRepaid)} old credit
                  </span>
                </>
              )}
            </>
          }
        />
        <Kpi
          label="Sold on credit today"
          value={compact(sum.byMethod.credit)}
          unit={CURRENCY}
          icon={HandCoins}
          foot={
            creditToday === 0 ? (
              "None today"
            ) : (
              <>
                <span className="whitespace-nowrap">
                  {creditToday} receipt{creditToday === 1 ? "" : "s"},
                </span>{" "}
                <span className="whitespace-nowrap">
                  due in {CREDIT_TERMS_DAYS} days
                </span>
              </>
            )
          }
        />
        <Kpi
          label="Money owed"
          value={compact(aging.total)}
          unit={CURRENCY}
          icon={Clock}
          valueTone={aging.overdue > 0 ? "danger" : "ink"}
          footTone={aging.overdue > 0 ? "down" : "neutral"}
          foot={
            <>
              <span className="whitespace-nowrap">
                {aging.accounts} customer{aging.accounts === 1 ? "" : "s"} ·
              </span>{" "}
              <span className="whitespace-nowrap">{overdueCount} overdue</span>
            </>
          }
          href="/sales?show=owed"
        />
        <Kpi
          label="Receipts today"
          value={num(sum.receipts)}
          icon={ReceiptText}
          foot={`${num(sum.units)} units sold`}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4">
        <div className="max-w-full self-start">
          <Segmented<View>
            label="Show"
            value={view}
            onChange={setView}
            options={[
              {
                value: "receipts",
                label: "Today's receipts",
                count: todays.length,
              },
              { value: "owed", label: "Money owed", count: owed.length },
            ]}
          />
        </div>
        {view === "receipts" ? (
          <ReceiptsView
            todays={todays}
            shown={shown}
            filters={filters}
            onFilters={setFilters}
            today={state.today}
            onRecordSale={() => openEntry("sale")}
          />
        ) : (
          <OwedView list={owed} today={state.today} />
        )}
      </div>
    </div>
  );
}
