"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ChoiceGroup, Field, Input, Select, Stepper } from "@/components/ui/form";
import { PAYMENT_LABEL, PRODUCTS, SALE_KIND_LABEL, unitPrice } from "@/lib/catalog";
import { num, ugx } from "@/lib/format";
import { CREDIT_TERMS_DAYS } from "@/lib/reducer";
import { useStore } from "@/lib/store";
import type { PaymentMethod, ProductId, SaleKind } from "@/lib/types";

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SaleForm({ onDone }: { onDone: () => void }) {
  const { dispatch, notify, state } = useStore();
  const [customer, setCustomer] = useState("Walk-in");
  const [productId, setProductId] = useState<ProductId>("b20");
  const [kind, setKind] = useState<SaleKind>("refill");
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [error, setError] = useState<string | null>(null);

  const price = unitPrice(productId, kind);
  const total = price * qty;

  if (state.dayClosed) {
    return <p className="text-sm text-slate-600">Today&apos;s ledger is closed. Reopen it from Daily Log to record more sales.</p>;
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!customer.trim()) return setError("Enter a customer name, or Walk-in.");
        if (qty < 1) return setError("Quantity must be at least 1.");
        const ok = dispatch({ type: "recordSale", customer, productId, kind, qty, payment, time: nowHHMM() });
        if (!ok) return setError("Could not save this sale. Check the details and try again.");
        notify(`Sale saved: ${ugx(total)}`);
        onDone();
      }}
    >
      <Field label="Customer" htmlFor="sale-customer" error={error ?? undefined}>
        <Input id="sale-customer" value={customer} onChange={(e) => { setCustomer(e.target.value); setError(null); }} onFocus={(e) => e.target.select()} autoComplete="off" />
      </Field>

      <Field label="Product" htmlFor="sale-product">
        <Select id="sale-product" value={productId} onChange={(e) => setProductId(e.target.value as ProductId)}>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.detail}</option>
          ))}
        </Select>
      </Field>

      <ChoiceGroup
        label="Type"
        value={kind}
        onChange={setKind}
        columns={3}
        options={(["refill", "new", "exchange"] as SaleKind[]).map((k) => ({ value: k, label: SALE_KIND_LABEL[k], hint: num(unitPrice(productId, k)) }))}
      />

      <Field label="Quantity" htmlFor="sale-qty">
        <Stepper id="sale-qty" label="quantity" value={qty} min={1} onChange={setQty} />
      </Field>

      <ChoiceGroup
        label="Payment"
        value={payment}
        onChange={setPayment}
        columns={4}
        options={(["cash", "mtn", "airtel", "credit"] as PaymentMethod[]).map((p) => ({ value: p, label: PAYMENT_LABEL[p] }))}
      />
      {payment === "credit" && (
        <p className="-mt-3 text-[12px] text-amber-700">Due in {CREDIT_TERMS_DAYS} days. It will show under money owed until marked paid.</p>
      )}

      <div className="flex items-center justify-between rounded-lg bg-canvas px-4 py-3">
        <span className="text-sm text-slate-600">{num(qty)} × {num(price)}</span>
        <span className="tnum text-lg font-semibold text-ink">{ugx(total)}</span>
      </div>

      <Button type="submit" variant="primary" className="w-full">Save sale</Button>
    </form>
  );
}
