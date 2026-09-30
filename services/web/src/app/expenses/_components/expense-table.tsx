"use client";

import { Plus, Receipt, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardHeader, Empty, Segmented } from "@/components/ui/primitives";
import { SearchBox } from "@/components/ui/form";
import { Cell2, TFoot, THead, Table, Td, Th, Tr } from "@/components/ui/table";
import { EXPENSE_LABEL, EXPENSE_PAYMENT_LABEL } from "@/lib/catalog";
import { num, shortDay, money } from "@/lib/format";
import type { CategoryTotal } from "@/lib/ledger";
import type { Expense } from "@/lib/types";
import { filterExpenses, sumAmount, type CategoryFilter } from "./month-expenses";

/** The page's main card: this month's expenses with search and a category filter. */
export function ExpenseTable({
  expenses,
  categories,
  onOpen,
  onLog,
}: {
  /** This month's expenses, already newest first. */
  expenses: Expense[];
  /** Categories with spending this month (order used for the filter). */
  categories: CategoryTotal[];
  onOpen: (e: Expense) => void;
  onLog: () => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<CategoryFilter>("all");

  // A category with no entries has no filter chip; fall back to "All" rather than show a hidden filter.
  const category: CategoryFilter = picked === "all" || categories.some((c) => c.category === picked) ? picked : "all";

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    return m;
  }, [expenses]);

  const shown = useMemo(() => filterExpenses(expenses, query, category), [expenses, query, category]);
  const total = sumAmount(shown);
  const filtering = query.trim() !== "" || category !== "all";

  const clear = () => {
    setQuery("");
    setPicked("all");
  };

  return (
    <Card>
      <CardHeader
        title="This month's expenses"
        hint={filtering ? `${shown.length} of ${expenses.length} shown · tap a row for details` : "Newest first · tap a row for details"}
      />
      {expenses.length > 0 && (
        <div className="flex flex-col gap-3 px-5 pb-4">
          <SearchBox value={query} onChange={setQuery} placeholder="Search description, vendor or ref" label="Search expenses" />
          <Segmented
            label="Filter by category"
            value={category}
            onChange={setPicked}
            options={[
              { value: "all" as CategoryFilter, label: "All", count: expenses.length },
              ...categories.map((c) => ({ value: c.category as CategoryFilter, label: c.label, count: counts.get(c.category) ?? 0 })),
            ]}
          />
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="border-t border-line">
          <Empty icon={Receipt} title="No expenses logged this month">
            Log fuel, power, wages or repairs as you pay them.
          </Empty>
          <div className="-mt-6 flex justify-center pb-10">
            <Button variant="primary" icon={Plus} onClick={onLog}>
              Log expense
            </Button>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <div className="border-t border-line">
          <Empty icon={SearchX} title="No expenses match">
            Nothing this month matches {query.trim() ? <>&ldquo;{query.trim()}&rdquo;</> : "this filter"}
            {category !== "all" ? <> in {EXPENSE_LABEL[category]}</> : null}.
          </Empty>
          <div className="-mt-6 flex justify-center pb-10">
            <Button onClick={clear}>Clear filters</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Phone: stacked list, the table's four columns do not fit at 390px. */}
          <ul className="border-t border-line md:hidden">
            {shown.map((e) => (
              <li key={e.id} className="border-b border-line-soft">
                <button
                  type="button"
                  onClick={() => onOpen(e)}
                  aria-label={`Open ${e.ref}, ${e.description}`}
                  className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{e.description}</span>
                    <span className="block truncate text-[13px] text-slate-500">{e.vendor}</span>
                    <span className="mt-0.5 block text-[12px] text-slate-500">
                      <span className="font-semibold text-brand">{e.ref}</span> · {shortDay(e.day)} · {EXPENSE_LABEL[e.category]}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-sm font-semibold text-ink">{num(e.amount)}</span>
                </button>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3 bg-canvas px-5 py-3 text-sm font-semibold text-ink">
              <span>
                {shown.length} {shown.length === 1 ? "expense" : "expenses"}
                {filtering && <span className="ml-1 font-normal text-slate-500">(filtered)</span>}
              </span>
              <span className="tnum">{money(total)}</span>
            </li>
          </ul>
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <Th>Ref</Th>
                  <Th>What for</Th>
                  <Th className="hidden md:table-cell">Category</Th>
                  <Th className="hidden md:table-cell">Paid by</Th>
                  <Th num>Amount</Th>
                </tr>
              </THead>
              <tbody>
                {shown.map((e) => (
                  <Tr key={e.id} className="cursor-pointer" onClick={() => onOpen(e)}>
                    <Td className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onOpen(e);
                        }}
                        aria-label={`Open ${e.ref}, ${e.description}`}
                        className="rounded-sm text-left font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {e.ref}
                      </button>
                      <div className="text-[13px] text-slate-500">{shortDay(e.day)}</div>
                    </Td>
                    <Td>
                      <Cell2 primary={e.description} secondary={e.vendor} />
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Badge>{EXPENSE_LABEL[e.category]}</Badge>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-slate-600 md:table-cell">{EXPENSE_PAYMENT_LABEL[e.payment]}</Td>
                    <Td num className="font-semibold text-ink">
                      {num(e.amount)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <TFoot>
                <tr>
                  <Td colSpan={2} className="text-ink">
                    {shown.length} {shown.length === 1 ? "expense" : "expenses"}
                    {filtering && <span className="ml-1 font-normal text-slate-500">(filtered)</span>}
                  </Td>
                  <Td colSpan={2} />
                  <Td num className="text-ink">
                    {money(total)}
                  </Td>
                </tr>
              </TFoot>
            </Table>
          </div>
        </>
      )}
    </Card>
  );
}
