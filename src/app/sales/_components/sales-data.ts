/**
 * Pure helpers for the Sales page: filtering, ordering, per-product roll-up and CSV export.
 * Kept out of JSX so they are tested once (see sales-data.test.ts).
 */
import { CURRENCY } from "@/lib/format";
import { PAYMENT_LABEL, SALE_KIND_LABEL, product } from "@/lib/catalog";
import { isOutstanding } from "@/lib/ledger";
import type { PaymentMethod, ProductId, Sale, SaleKind } from "@/lib/types";

export type KindFilter = "all" | SaleKind;
export type PaymentFilter = "all" | PaymentMethod;

export interface SaleFilters {
  query: string;
  kind: KindFilter;
  payment: PaymentFilter;
}

export const NO_FILTERS: SaleFilters = {
  query: "",
  kind: "all",
  payment: "all",
};

export function hasFilters(f: SaleFilters): boolean {
  return f.query.trim() !== "" || f.kind !== "all" || f.payment !== "all";
}

/** Newest first: later day, then later time, then higher receipt number. */
export function newestFirst(sales: Sale[]): Sale[] {
  return [...sales].sort(
    (a, b) =>
      b.day.localeCompare(a.day) ||
      b.time.localeCompare(a.time) ||
      receiptNumber(b.receipt) - receiptNumber(a.receipt),
  );
}

function receiptNumber(receipt: string): number {
  const n = Number(receipt.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Search matches customer, customer note, receipt number or product name (case-insensitive). */
export function filterSales(sales: Sale[], f: SaleFilters): Sale[] {
  const q = f.query.trim().toLowerCase();
  return sales.filter((s) => {
    if (f.kind !== "all" && s.kind !== f.kind) return false;
    if (f.payment !== "all" && s.payment !== f.payment) return false;
    if (!q) return true;
    const hay = [
      s.customer,
      s.customerNote ?? "",
      s.receipt,
      product(s.productId).name,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function totalAmount(sales: Sale[]): number {
  return sales.reduce((a, s) => a + s.amount, 0);
}

export interface ProductDayRow {
  productId: ProductId;
  label: string;
  value: number;
  units: number;
  share: number;
}

/** Amount and units per product, largest amount first. Share is of the total amount. */
export function byProduct(sales: Sale[]): ProductDayRow[] {
  const sums = new Map<ProductId, { value: number; units: number }>();
  for (const s of sales) {
    const cur = sums.get(s.productId) ?? { value: 0, units: 0 };
    sums.set(s.productId, {
      value: cur.value + s.amount,
      units: cur.units + s.qty,
    });
  }
  const total = totalAmount(sales);
  return [...sums.entries()]
    .map(([productId, { value, units }]) => ({
      productId,
      label: product(productId).name,
      value,
      units,
      share: total === 0 ? 0 : value / total,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Plain-words status used in the CSV and the receipt sheet. */
export function paymentStatusText(s: Sale): string {
  if (!isOutstanding(s)) return s.paidDay ? `Paid ${s.paidDay}` : "Paid";
  return s.dueDay ? `Owed, due ${s.dueDay}` : "Owed";
}

const CSV_HEADER = [
  "Receipt",
  "Date",
  "Time",
  "Customer",
  "Note",
  "Product",
  "Type",
  "Qty",
  `Amount (${CURRENCY})`,
  "Payment",
  "Status",
];

function cell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC 4180 CSV with CRLF line endings. Amounts are plain integers so Excel sums them. */
export function salesCsv(sales: Sale[]): string {
  const rows = sales.map((s) => [
    s.receipt,
    s.day,
    s.time,
    s.customer,
    s.customerNote ?? "",
    product(s.productId).name,
    SALE_KIND_LABEL[s.kind],
    s.qty,
    s.amount,
    PAYMENT_LABEL[s.payment],
    paymentStatusText(s),
  ]);
  return (
    [CSV_HEADER, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}

export function csvFilename(day: string): string {
  return `aquaflow-sales-${day}.csv`;
}
