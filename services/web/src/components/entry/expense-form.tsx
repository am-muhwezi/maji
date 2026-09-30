"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ChoiceGroup, Field, Input, Select } from "@/components/ui/form";
import { CURRENT_USER, EXPENSE_LABEL, EXPENSE_PAYMENT_LABEL } from "@/lib/catalog";
import { ugx } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ExpenseCategory, ExpensePayment } from "@/lib/types";

export function ExpenseForm({ onDone }: { onDone: () => void }) {
  const { dispatch, notify } = useStore();
  const [category, setCategory] = useState<ExpenseCategory>("transport");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [amountText, setAmountText] = useState("");
  const [payment, setPayment] = useState<ExpensePayment>("cash");
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  const amount = Number(amountText.replace(/[^\d]/g, "")) || 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const next = {
          description: description.trim() ? undefined : "Say what it was for.",
          amount: amount > 0 ? undefined : "Enter the amount paid.",
        };
        setErrors(next);
        if (next.description || next.amount) return;
        const ok = dispatch({ type: "recordExpense", category, description, vendor, amount, payment, approvedBy: "Operations Mgr" });
        if (!ok) return;
        notify(`Expense saved: ${ugx(amount)}`);
        onDone();
      }}
    >
      <Field label="Category" htmlFor="exp-category">
        <Select id="exp-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
          {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map((c) => (
            <option key={c} value={c}>{EXPENSE_LABEL[c]}</option>
          ))}
        </Select>
      </Field>
      <Field label="What was it for?" htmlFor="exp-desc" error={errors.description}>
        <Input id="exp-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Diesel for truck UBG-112" />
      </Field>
      <Field label="Paid to" htmlFor="exp-vendor" hint="Optional">
        <Input id="exp-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. TotalEnergies" />
      </Field>
      <Field label="Amount (UGX)" htmlFor="exp-amount" error={errors.amount}>
        <Input
          id="exp-amount"
          inputMode="numeric"
          className="tnum"
          value={amount ? amount.toLocaleString("en-UG") : amountText}
          onChange={(e) => setAmountText(e.target.value)}
          placeholder="0"
        />
      </Field>
      <ChoiceGroup
        label="Paid by"
        value={payment}
        onChange={setPayment}
        columns={2}
        options={(Object.keys(EXPENSE_PAYMENT_LABEL) as ExpensePayment[]).map((p) => ({ value: p, label: EXPENSE_PAYMENT_LABEL[p] }))}
      />
      <p className="text-[12px] text-slate-500">Recorded by {CURRENT_USER.name}.</p>
      <Button type="submit" variant="primary" className="w-full">Save expense</Button>
    </form>
  );
}
