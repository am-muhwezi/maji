"use client";

import { Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, StatRow } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { SaleStatus } from "@/components/ui/status";
import {
  PAYMENT_LABEL,
  SALE_KIND_LABEL,
  product,
  unitPrice,
} from "@/lib/catalog";
import { day, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Sale } from "@/lib/types";

/** Full details of one receipt, with a print button. */
export function ReceiptSheet({
  sale,
  today,
  onClose,
}: {
  sale: Sale | null;
  today: string;
  onClose: () => void;
}) {
  const p = sale ? product(sale.productId) : null;
  return (
    <Sheet
      open={sale !== null}
      onClose={onClose}
      title={sale ? `Receipt ${sale.receipt}` : "Receipt"}
      description={sale ? `${day(sale.day)} at ${sale.time}` : undefined}
      footer={
        sale && (
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              icon={Printer}
              className="w-full"
              onClick={() => window.print()}
            >
              Print receipt
            </Button>
            <VoidControl key={sale.id} sale={sale} onVoided={onClose} />
          </div>
        )
      }
    >
      {sale && p && (
        <dl className="divide-y divide-line-soft">
          <StatRow
            label="Customer"
            value={
              sale.customerNote
                ? `${sale.customer} · ${sale.customerNote}`
                : sale.customer
            }
          />
          <StatRow label="Product" value={`${p.name} (${p.detail})`} />
          <StatRow label="Type" value={SALE_KIND_LABEL[sale.kind]} />
          <StatRow label="Quantity" value={String(sale.qty)} />
          <StatRow
            label="Unit price"
            value={money(unitPrice(sale.productId, sale.kind))}
          />
          <StatRow label="Paid by" value={PAYMENT_LABEL[sale.payment]} />
          <StatRow
            label="Status"
            value={<SaleStatus sale={sale} today={today} />}
          />
          {sale.dueDay && <StatRow label="Due on" value={day(sale.dueDay)} />}
          {sale.paidDay && (
            <StatRow label="Paid on" value={day(sale.paidDay)} />
          )}
          <StatRow label="Total" value={money(sale.amount)} strong />
        </dl>
      )}
    </Sheet>
  );
}

const dangerOutline =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-50";

/**
 * Void a receipt entered by mistake. Two steps (ask, then confirm) because it removes
 * the sale and puts the stock back. Only today's receipts on an open day qualify.
 */
function VoidControl({ sale, onVoided }: { sale: Sale; onVoided: () => void }) {
  const { state, dispatch, notify } = useStore();
  const [asking, setAsking] = useState(false);

  if (sale.day !== state.today || state.dayClosed) {
    return (
      <p className="text-center text-[12px] text-slate-500">
        {state.dayClosed
          ? "The day is closed, so receipts can no longer be voided."
          : "Only today's receipts can be voided."}
      </p>
    );
  }

  if (!asking) {
    return (
      <button
        type="button"
        className={dangerOutline}
        onClick={() => setAsking(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        Void receipt
      </button>
    );
  }

  const confirm = () => {
    if (dispatch({ type: "voidSale", saleId: sale.id })) {
      notify(`${sale.receipt} voided · ${sale.qty} back in stock`);
      onVoided();
    } else {
      notify(`Could not void ${sale.receipt}`, "error");
      setAsking(false);
    }
  };

  return (
    <div
      role="group"
      aria-label={`Confirm voiding ${sale.receipt}`}
      className="rounded-lg border border-rose-200 bg-rose-50 p-3"
    >
      <p className="text-[13px] text-rose-800">
        Void {sale.receipt}? It is removed from today&apos;s sales and{" "}
        {sale.qty} × {product(sale.productId).name} goes back into stock.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
          Cancel
        </Button>
        <Button size="sm" variant="danger" onClick={confirm} autoFocus>
          Yes, void it
        </Button>
      </div>
    </div>
  );
}
