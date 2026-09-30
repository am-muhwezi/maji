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
  /** Who entered or signed off the expense. */
  recordedBy: string;
}

export type ResolutionKind = "spillage" | "recount" | "driver";

export interface VarianceResolution {
  productId: ProductId;
  kind: ResolutionKind;
  note: string;
  day: string;
}

/** Sales for one day in RWF, split by kind. */
export interface DayVolume {
  day: string;
  refill: number;
  newBottle: number;
}

/**
 * Sales for a past day that are not itemised in `sales` (only recent receipts are kept
 * line by line). Revenue for any period = history in range + itemised sales in range.
 */
export interface HistoryDay extends DayVolume {
  litres: number;
}

export interface OpsState {
  today: string;
  lines: StockLine[];
  materials: Material[];
  sales: Sale[];
  expenses: Expense[];
  resolutions: VarianceResolution[];
  /** One entry per past day (oldest first), never including today. */
  history: HistoryDay[];
  /** How `history` revenue splits across products (sums to 1). */
  historyMix: Record<ProductId, number>;
  dayClosed: boolean;
  closedBy?: string;
}
