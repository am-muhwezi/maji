"use client";

import clsx from "clsx";
import { ArrowLeft, Factory, Receipt, ShoppingCart, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { ExpenseForm } from "./expense-form";
import { ProductionForm } from "./production-form";
import { SaleForm } from "./sale-form";

export type EntryKind = "sale" | "production" | "expense";

const KINDS: { kind: EntryKind; title: string; hint: string; icon: LucideIcon }[] = [
  { kind: "sale", title: "Record a sale", hint: "Refills, new bottles, credit orders", icon: ShoppingCart },
  { kind: "production", title: "Add production", hint: "A finished batch off the line", icon: Factory },
  { kind: "expense", title: "Log an expense", hint: "Fuel, power, wages, repairs", icon: Receipt },
];

interface QuickEntryValue {
  openEntry: (kind?: EntryKind) => void;
}

const Ctx = createContext<QuickEntryValue | null>(null);

export function useQuickEntry(): QuickEntryValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useQuickEntry must be used inside <QuickEntryProvider>");
  return v;
}

/** One global entry point for the three things people record all day. */
export function QuickEntryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EntryKind | null>(null);
  // Remount forms on every open so they always start clean.
  const [session, setSession] = useState(0);

  const openEntry = useCallback((k?: EntryKind) => {
    setKind(k ?? null);
    setSession((n) => n + 1);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openEntry }), [openEntry]);

  const active = KINDS.find((k) => k.kind === kind);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        title={active ? active.title : "New entry"}
        description={active ? active.hint : "What do you want to record?"}
      >
        {!active ? (
          <div className="grid gap-3">
            {KINDS.map(({ kind: k, title, hint, icon: Icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-sky-100 text-brand">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-[13px] text-slate-500">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div key={session}>
            <button
              type="button"
              onClick={() => setKind(null)}
              className={clsx("-mt-1 mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-ink")}
            >
              <ArrowLeft className="size-3.5" aria-hidden /> Other entry types
            </button>
            {kind === "sale" && <SaleForm onDone={close} />}
            {kind === "production" && <ProductionForm onDone={close} />}
            {kind === "expense" && <ExpenseForm onDone={close} />}
          </div>
        )}
      </Sheet>
    </Ctx.Provider>
  );
}
