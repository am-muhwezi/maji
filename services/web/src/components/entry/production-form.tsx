"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Field, Select, Stepper } from "@/components/ui/form";
import { PRODUCTS, product } from "@/lib/catalog";
import { num } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ProductId } from "@/lib/types";

export function ProductionForm({ onDone, initialProduct = "b20" }: { onDone: () => void; initialProduct?: ProductId }) {
  const { dispatch, notify, state } = useStore();
  const [productId, setProductId] = useState<ProductId>(initialProduct);
  const [qty, setQty] = useState(50);
  const line = state.lines.find((l) => l.productId === productId);

  if (state.dayClosed) {
    return <p className="text-sm text-slate-600">Today&apos;s ledger is closed. Reopen it from Daily Log to add production.</p>;
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dispatch({ type: "recordProduction", productId, qty })) return;
        notify(`Added ${num(qty)} × ${product(productId).name}`);
        onDone();
      }}
    >
      <Field label="Product" htmlFor="prod-product">
        <Select id="prod-product" value={productId} onChange={(e) => setProductId(e.target.value as ProductId)}>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.detail}</option>
          ))}
        </Select>
      </Field>
      <Field
        label="Units filled and capped"
        htmlFor="prod-qty"
        hint={line ? `Already produced today: ${num(line.production)}` : undefined}
      >
        <Stepper id="prod-qty" label="units produced" value={qty} min={1} onChange={setQty} />
      </Field>
      <div className="rounded-lg bg-canvas px-4 py-3 text-sm text-slate-600">
        Adds <span className="tnum font-semibold text-ink">{num(qty * product(productId).litres)} L</span> to today&apos;s output.
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={qty < 1}>Add to today</Button>
    </form>
  );
}
