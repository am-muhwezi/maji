/** Pure state transitions. The React store is a thin wrapper around `reduce`. */
import { unitPrice } from "./catalog";
import { addDays } from "./format";
import { canCloseDay } from "./ledger";
import { seed } from "./seed";
import type {
  Expense,
  ExpenseCategory,
  ExpensePayment,
  OpsState,
  PaymentMethod,
  ProductId,
  ResolutionKind,
  SaleKind,
} from "./types";

/** Days of credit given on a new credit sale. */
export const CREDIT_TERMS_DAYS = 30;

export type Action =
  | {
      type: "recordSale";
      customer: string;
      customerNote?: string;
      productId: ProductId;
      kind: SaleKind;
      qty: number;
      payment: PaymentMethod;
      time: string;
    }
  | { type: "recordProduction"; productId: ProductId; qty: number }
  | { type: "setCount"; productId: ProductId; physical: number | null }
  | {
      type: "recordExpense";
      category: ExpenseCategory;
      description: string;
      vendor: string;
      amount: number;
      payment: ExpensePayment;
      approvedBy: string;
    }
  | { type: "markPaid"; saleId: string }
  | { type: "resolveVariance"; productId: ProductId; kind: ResolutionKind; note: string }
  | { type: "closeDay"; by: string }
  | { type: "reopenDay" }
  | { type: "reset"; today: string };

const isCount = (n: number) => Number.isInteger(n) && n > 0;

function nextNumber(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) {
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/**
 * Apply one action. Invalid actions (non-positive quantities, edits to a closed day,
 * unknown ids) return the same state object so callers can detect a no-op by identity.
 */
export function reduce(state: OpsState, action: Action): OpsState {
  switch (action.type) {
    case "recordSale": {
      if (state.dayClosed || !isCount(action.qty) || !action.customer.trim()) return state;
      const n = nextNumber(state.sales.map((s) => s.receipt), "SL-");
      const sale = {
        id: `s${n}`,
        receipt: `SL-${n}`,
        day: state.today,
        time: action.time,
        customer: action.customer.trim(),
        customerNote: action.customerNote?.trim() || undefined,
        productId: action.productId,
        kind: action.kind,
        qty: action.qty,
        amount: unitPrice(action.productId, action.kind) * action.qty,
        payment: action.payment,
        dueDay: action.payment === "credit" ? addDays(state.today, CREDIT_TERMS_DAYS) : undefined,
      };
      return {
        ...state,
        sales: [...state.sales, sale],
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, sales: l.sales + action.qty } : l,
        ),
      };
    }

    case "recordProduction": {
      if (state.dayClosed || !isCount(action.qty)) return state;
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, production: l.production + action.qty } : l,
        ),
      };
    }

    case "setCount": {
      if (state.dayClosed) return state;
      const p = action.physical;
      if (p !== null && !(Number.isInteger(p) && p >= 0)) return state;
      return {
        ...state,
        lines: state.lines.map((l) => (l.productId === action.productId ? { ...l, physical: p } : l)),
        // A new count invalidates any earlier explanation for this product.
        resolutions: state.resolutions.filter(
          (r) => !(r.productId === action.productId && r.day === state.today),
        ),
      };
    }

    case "recordExpense": {
      if (!isCount(action.amount) || !action.description.trim()) return state;
      const n = nextNumber(state.expenses.map((e) => e.ref), "EXP-");
      const expense: Expense = {
        id: `e${n}`,
        ref: `EXP-${String(n).padStart(3, "0")}`,
        day: state.today,
        category: action.category,
        description: action.description.trim(),
        vendor: action.vendor.trim() || "Not specified",
        amount: action.amount,
        payment: action.payment,
        approvedBy: action.approvedBy,
      };
      return { ...state, expenses: [expense, ...state.expenses] };
    }

    case "markPaid": {
      const target = state.sales.find((s) => s.id === action.saleId);
      if (!target || target.payment !== "credit" || target.paidDay) return state;
      return {
        ...state,
        sales: state.sales.map((s) => (s.id === action.saleId ? { ...s, paidDay: state.today } : s)),
      };
    }

    case "resolveVariance": {
      if (state.dayClosed) return state;
      const others = state.resolutions.filter(
        (r) => !(r.productId === action.productId && r.day === state.today),
      );
      return {
        ...state,
        resolutions: [
          ...others,
          { productId: action.productId, kind: action.kind, note: action.note.trim(), day: state.today },
        ],
      };
    }

    case "closeDay": {
      if (state.dayClosed || !canCloseDay(state).ok) return state;
      return { ...state, dayClosed: true, closedBy: action.by };
    }

    case "reopenDay":
      return state.dayClosed ? { ...state, dayClosed: false, closedBy: undefined } : state;

    case "reset":
      return seed(action.today);
  }
}
