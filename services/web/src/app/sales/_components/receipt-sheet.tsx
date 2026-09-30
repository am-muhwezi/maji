"use client";

import { Printer } from "lucide-react";
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
        <Button
          variant="primary"
          icon={Printer}
          className="w-full"
          onClick={() => window.print()}
        >
          Print receipt
        </Button>
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
