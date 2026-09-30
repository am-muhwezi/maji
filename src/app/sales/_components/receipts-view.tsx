"use client";

import { SearchX, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { RankedBars } from "@/components/ui/charts";
import {
  Button,
  Card,
  CardHeader,
  Empty,
  Segmented,
} from "@/components/ui/primitives";
import { SearchBox, Select } from "@/components/ui/form";
import { Cell2, TFoot, Table, Td, THead, Th, Tr } from "@/components/ui/table";
import { SaleStatus } from "@/components/ui/status";
import { PAYMENT_LABEL, SALE_KIND_LABEL, product } from "@/lib/catalog";
import { CURRENCY, num, money } from "@/lib/format";
import type { PaymentMethod, Sale } from "@/lib/types";
import { ReceiptSheet } from "./receipt-sheet";
import {
  byProduct,
  hasFilters,
  NO_FILTERS,
  totalAmount,
  type KindFilter,
  type PaymentFilter,
  type SaleFilters,
} from "./sales-data";

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "refill", label: SALE_KIND_LABEL.refill },
  { value: "new", label: SALE_KIND_LABEL.new },
  { value: "exchange", label: SALE_KIND_LABEL.exchange },
];

const PAYMENTS: PaymentMethod[] = ["cash", "mtn", "airtel", "credit"];

/**
 * Today's receipts: filters, the receipt table, and today's product split.
 * `today` = all of today's sales (newest first); `shown` = after filters. Filters are owned
 * by the page so CSV export uses exactly what is on screen.
 */
export function ReceiptsView({
  todays,
  shown,
  filters,
  onFilters,
  today,
  onRecordSale,
}: {
  todays: Sale[];
  shown: Sale[];
  filters: SaleFilters;
  onFilters: (f: SaleFilters) => void;
  today: string;
  onRecordSale: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = todays.find((s) => s.id === openId) ?? null;
  const products = byProduct(todays);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-3 px-5 pt-5 pb-4 lg:flex-row lg:items-center">
          <SearchBox
            value={filters.query}
            onChange={(query) => onFilters({ ...filters, query })}
            placeholder="Customer, receipt # or product"
            label="Search today's receipts"
          />
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Segmented
              label="Sale type"
              value={filters.kind}
              onChange={(kind) => onFilters({ ...filters, kind })}
              options={KIND_OPTIONS}
            />
            <div className="w-full sm:w-44">
              <Select
                aria-label="Payment method"
                value={filters.payment}
                onChange={(e) =>
                  onFilters({
                    ...filters,
                    payment: e.target.value as PaymentFilter,
                  })
                }
              >
                <option value="all">All payments</option>
                {PAYMENTS.map((p) => (
                  <option key={p} value={p}>
                    {PAYMENT_LABEL[p]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {todays.length === 0 ? (
          <div className="border-t border-line">
            <Empty icon={ShoppingCart} title="No sales yet today">
              Receipts appear here as soon as you record a sale.
            </Empty>
            <div className="-mt-6 flex justify-center pb-10">
              <Button variant="primary" size="sm" onClick={onRecordSale}>
                Record sale
              </Button>
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="border-t border-line">
            <Empty icon={SearchX} title="No receipts match these filters">
              Try a different name or receipt number, or clear the filters to
              see all {todays.length} receipts.
            </Empty>
            <div className="-mt-6 flex justify-center pb-10">
              <Button size="sm" onClick={() => onFilters(NO_FILTERS)}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul
              className="border-t border-line md:hidden"
              aria-label="Today's receipts, newest first"
            >
              {shown.map((s) => (
                <li key={s.id} className="border-b border-line-soft">
                  <button
                    type="button"
                    onClick={() => setOpenId(s.id)}
                    aria-label={`Open receipt ${s.receipt}, ${s.customer}, ${money(s.amount)}`}
                    className="flex w-full flex-col gap-1.5 px-4 py-3 text-left hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                  >
                    <span className="flex w-full items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium text-ink">
                        {s.customer}
                      </span>
                      <span className="tnum shrink-0 text-sm font-semibold text-ink">
                        {num(s.amount)}
                      </span>
                    </span>
                    <span className="text-[13px] text-slate-500">
                      {product(s.productId).name} × {num(s.qty)} ·{" "}
                      {SALE_KIND_LABEL[s.kind]}
                    </span>
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="tnum text-[12px] text-slate-500">
                        <span className="font-semibold text-brand">
                          {s.receipt}
                        </span>{" "}
                        · {s.time}
                      </span>
                      <SaleStatus sale={s} today={today} />
                    </span>
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between bg-canvas px-4 py-3 text-sm font-semibold">
                <span className="text-slate-600">
                  {shown.length} receipt{shown.length === 1 ? "" : "s"}
                  {hasFilters(filters) && (
                    <span className="font-normal text-slate-500">
                      {" "}
                      of {todays.length}
                    </span>
                  )}
                </span>
                <span className="tnum text-ink">
                  {money(totalAmount(shown))}
                </span>
              </li>
            </ul>
            <div className="hidden md:block">
              <Table>
                <caption className="sr-only">
                  Today&apos;s receipts, newest first. Select a row to see the
                  full receipt.
                </caption>
                <THead>
                  <tr>
                    <Th>Receipt</Th>
                    <Th>Customer</Th>
                    <Th>Product</Th>
                    <Th num>Qty</Th>
                    <Th num>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </THead>
                <tbody>
                  {shown.map((s) => {
                    const p = product(s.productId);
                    return (
                      <Tr
                        key={s.id}
                        className="cursor-pointer focus-visible:bg-sky-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                        tabIndex={0}
                        aria-label={`Open receipt ${s.receipt}, ${s.customer}, ${money(s.amount)}`}
                        onClick={() => setOpenId(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenId(s.id);
                          }
                        }}
                      >
                        <Td className="whitespace-nowrap">
                          <div className="font-semibold text-brand">
                            {s.receipt}
                          </div>
                          <div className="tnum text-[13px] text-slate-500">
                            {s.time}
                          </div>
                        </Td>
                        <Td>
                          <Cell2
                            primary={s.customer}
                            secondary={s.customerNote}
                          />
                        </Td>
                        <Td>
                          <Cell2
                            primary={p.name}
                            secondary={SALE_KIND_LABEL[s.kind]}
                          />
                        </Td>
                        <Td num>{num(s.qty)}</Td>
                        <Td num className="font-semibold text-ink">
                          {num(s.amount)}
                        </Td>
                        <Td>
                          <SaleStatus sale={s} today={today} />
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
                <TFoot>
                  <tr>
                    <Td colSpan={2} className="text-slate-600">
                      {shown.length} receipt{shown.length === 1 ? "" : "s"}
                      {hasFilters(filters) && (
                        <span className="font-normal text-slate-500">
                          {" "}
                          of {todays.length}
                        </span>
                      )}
                    </Td>
                    <Td colSpan={2} />
                    <Td num className="text-ink">
                      {money(totalAmount(shown))}
                    </Td>
                    <Td />
                  </tr>
                </TFoot>
              </Table>
            </div>
          </>
        )}
      </Card>

      {products.length > 0 && (
        <Card>
          <CardHeader
            title="Today by product"
            hint={`Share of today's sales, in ${CURRENCY}.`}
          />
          <div className="px-5 pb-5">
            <RankedBars
              rows={products.map((r) => ({
                label: r.label,
                value: r.value,
                share: r.share,
                note: `${num(r.units)} sold`,
              }))}
            />
          </div>
        </Card>
      )}

      <ReceiptSheet sale={open} today={today} onClose={() => setOpenId(null)} />
    </div>
  );
}
