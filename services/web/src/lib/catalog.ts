import type {
  ExpenseCategory,
  ExpensePayment,
  PaymentMethod,
  Product,
  ProductId,
  SaleKind,
} from "./types";

export const PRODUCTS: Product[] = [
  { id: "b20", name: "20L Bottle", detail: "Polycarbonate", litres: 20, refillPrice: 5_000, newPrice: 35_000 },
  { id: "j20", name: "20L Jerrycan", detail: "Food-grade HDPE", litres: 20, refillPrice: 4_500, newPrice: 25_000 },
  { id: "d19", name: "18.9L Dispenser", detail: "Corporate standard", litres: 18.9, refillPrice: 5_000, newPrice: 30_000 },
  { id: "b10", name: "10L Bottle", detail: "Family size", litres: 10, refillPrice: 3_500, newPrice: 15_000 },
  { id: "p5", name: "5L Pack", detail: "Box of 4", litres: 20, refillPrice: 13_000, newPrice: 13_000 },
];

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

export function product(id: ProductId): Product {
  const p = byId.get(id);
  if (!p) throw new Error(`Unknown product ${id}`);
  return p;
}

/** Unit price for a sale. An exchange (customer swaps a damaged shell) costs refill + 1,000. */
export function unitPrice(id: ProductId, kind: SaleKind): number {
  const p = product(id);
  if (kind === "new") return p.newPrice;
  if (kind === "exchange") return p.refillPrice + 1_000;
  return p.refillPrice;
}

export const SALE_KIND_LABEL: Record<SaleKind, string> = {
  refill: "Refill",
  new: "New bottle",
  exchange: "Exchange",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
  credit: "Credit",
};

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  power: "Electricity",
  payroll: "Salaries",
  transport: "Transport & fuel",
  packaging: "Packaging",
  water: "Water supply",
  repairs: "Repairs",
};

/** Chart colors per expense category, fixed so a category keeps its color everywhere. */
export const EXPENSE_COLOR: Record<ExpenseCategory, string> = {
  power: "#0284c7",
  payroll: "#0ea5e9",
  transport: "#38bdf8",
  packaging: "#7dd3fc",
  water: "#64748b",
  repairs: "#cbd5e1",
};

export const EXPENSE_PAYMENT_LABEL: Record<ExpensePayment, string> = {
  bank: "Bank transfer",
  mobile: "Mobile money",
  cash: "Petty cash",
  cheque: "Cheque",
};

/** Monthly sales target. */
export const MONTHLY_BUDGET = 48_000_000;
/** Monthly spending limit. */
export const EXPENSE_BUDGET = 33_000_000;
export const WEEKLY_SLIP_TARGET = 1_600;
export const TANK_CAPACITY_L = 30_000;
export const PLANT_NAME = "Plant 1 · Main Bottling";
export const CURRENT_USER = { name: "David Mugisha", role: "Operations Manager" };
