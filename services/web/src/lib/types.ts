export type ProductId = "b20" | "j20" | "d19" | "b10" | "p5";

export interface Product {
  id: ProductId;
  name: string;
  /** Second line under the name, e.g. material or pack size. */
  detail: string;
  litres: number;
  /** Price of a refill (customer brings the empty). */
  refillPrice: number;
  /** Price of a new container including water. */
  newPrice: number;
}

/** One row of today's stock ledger for a finished product. */
export interface StockLine {
  productId: ProductId;
  opening: number;
  production: number;
  sales: number;
  /** Physical count at close of shift. `null` until someone counts it. */
  physical: number | null;
}

export type MaterialKind = "empties" | "packaging" | "raw";

export interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  onHand: number;
  unit: string;
  /** Below this, the item shows "Reorder". */
  reorderAt: number;
  /** Storage capacity, used for the fill bar. */
  capacity: number;
}

export type SaleKind = "refill" | "new" | "exchange";
export type PaymentMethod = "cash" | "mtn" | "airtel" | "credit";

export interface Sale {
  id: string;
  receipt: string;
  day: string; // ISO date
  time: string; // "HH:MM"
  customer: string;
  customerNote?: string;
  productId: ProductId;
  kind: SaleKind;
  qty: number;
  amount: number;
  payment: PaymentMethod;
  /** Credit sales only: day the invoice is due. */
  dueDay?: string;
  /** Credit sales only: set once the customer pays. */
  paidDay?: string;
}

export type ExpenseCategory =
  | "power"
  | "payroll"
  | "transport"
  | "packaging"
  | "water"
  | "repairs";

export type ExpensePayment = "bank" | "mobile" | "cash" | "cheque";

export interface Expense {
  id: string;
  ref: string;
  day: string;
  category: ExpenseCategory;
  description: string;
  vendor: string;
  amount: number;
  payment: ExpensePayment;
  approvedBy: string;
}

export type ResolutionKind = "spillage" | "recount" | "driver";

export interface VarianceResolution {
  productId: ProductId;
  kind: ResolutionKind;
  note: string;
  day: string;
}

/** Daily sales in UGX for the weekly chart. */
export interface DayVolume {
  day: string;
  refill: number;
  newBottle: number;
}

export interface OpsState {
  today: string;
  lines: StockLine[];
  materials: Material[];
  sales: Sale[];
  expenses: Expense[];
  resolutions: VarianceResolution[];
  /** Sales before the first day covered by `sales`, this month. */
  monthRevenueBefore: number;
  monthLitresBefore: number;
  /** Share of `monthRevenueBefore` per product (sums to 1). */
  monthMixBefore: Record<ProductId, number>;
  /** Prior days of the week (oldest first); today is computed from `sales`. */
  weekBefore: DayVolume[];
  dayClosed: boolean;
  closedBy?: string;
}
