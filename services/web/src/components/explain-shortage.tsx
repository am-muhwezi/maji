"use client";

import { useState } from "react";
import { ChoiceGroup, Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import { product } from "@/lib/catalog";
import { num, ugx } from "@/lib/format";
import { expected, variance, varianceValue } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import type { ProductId, ResolutionKind } from "@/lib/types";

export const RESOLUTION_LABEL: Record<ResolutionKind, string> = {
  spillage: "Breakage or spillage",
  recount: "Recounted, count is right",
  driver: "Driver or route to follow up",
};

/**
 * Record why a product came up short. Used from Daily Log and Stock.
 * Pass `productId = null` to keep it closed.
 */
export function ExplainShortageSheet({ productId, onClose }: { productId: ProductId | null; onClose: () => void }) {
  return (
    <Sheet open={productId !== null} onClose={onClose} title="Explain a shortage" description="Pick the most likely reason. You can change it later today.">
      {productId && <ExplainForm key={productId} productId={productId} onDone={onClose} />}
    </Sheet>
  );
}

function ExplainForm({ productId, onDone }: { productId: ProductId; onDone: () => void }) {
  const { state, dispatch, notify } = useStore();
  const line = state.lines.find((l) => l.productId === productId)!;
  const existing = state.resolutions.find((r) => r.productId === productId && r.day === state.today);
  const [kind, setKind] = useState<ResolutionKind>(existing?.kind ?? "spillage");
  const [note, setNote] = useState(existing?.note ?? "");
  const v = variance(line) ?? 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dispatch({ type: "resolveVariance", productId, kind, note })) return;
        notify(`${product(productId).name}: shortage explained`);
        onDone();
      }}
    >
      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-canvas p-4 text-center">
        <div><dt className="text-[12px] text-slate-500">Expected</dt><dd className="tnum text-lg font-semibold">{num(expected(line))}</dd></div>
        <div><dt className="text-[12px] text-slate-500">Counted</dt><dd className="tnum text-lg font-semibold">{num(line.physical ?? 0)}</dd></div>
        <div><dt className="text-[12px] text-slate-500">Missing</dt><dd className="tnum text-lg font-semibold text-rose-600">{num(-v)}</dd></div>
      </dl>
      <p className="-mt-2 text-[13px] text-slate-600">
        {product(productId).name}, worth about <span className="tnum font-semibold text-ink">{ugx(-varianceValue(line))}</span> at refill price.
      </p>
      <ChoiceGroup
        label="Reason"
        value={kind}
        onChange={setKind}
        columns={2}
        options={(Object.keys(RESOLUTION_LABEL) as ResolutionKind[]).map((k) => ({ value: k, label: RESOLUTION_LABEL[k] }))}
      />
      <Field label="Note" htmlFor="explain-note" hint="Optional. Who, where, what happened.">
        <Input id="explain-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Route 4 manifest missing 12 bottles" />
      </Field>
      <p className="text-[12px] text-slate-500">Found a counting mistake instead? Change the count on the Daily Log.</p>
      <Button type="submit" variant="primary" className="w-full">Save explanation</Button>
    </form>
  );
}
