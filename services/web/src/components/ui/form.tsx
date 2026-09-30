"use client";

import clsx from "clsx";
import { Minus, Plus, Search } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

const control =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-shadow focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 disabled:bg-slate-50";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={clsx(control, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={clsx(control, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(control, "pl-9")}
      />
    </div>
  );
}

/** Whole-number stepper: big touch targets, arrow keys adjust by 1, Shift+arrow by 10. */
export function Stepper({ value, onChange, min = 0, max = 100_000, label, id }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; id?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1))} className="grid w-10 place-items-center bg-slate-100 text-slate-600 hover:bg-slate-200">
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id={inputId}
        inputMode="numeric"
        aria-label={label}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(clamp(digits === "" ? 0 : Number(digits)));
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowUp") { e.preventDefault(); onChange(clamp(value + step)); }
          if (e.key === "ArrowDown") { e.preventDefault(); onChange(clamp(value - step)); }
        }}
        className="tnum w-full min-w-0 border-0 text-center text-sm font-semibold text-ink focus:outline-none"
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1))} className="grid w-10 place-items-center bg-slate-100 text-slate-600 hover:bg-slate-200">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** Radio cards for a small set of choices (payment method, sale type). */
export function ChoiceGroup<T extends string>({ value, onChange, options, label, columns = 2 }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; hint?: string }[]; label: string; columns?: 2 | 3 | 4 }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-slate-700">{label}</legend>
      <div className={clsx("grid gap-2", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-3", columns === 4 && "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={clsx(
                "flex cursor-pointer flex-col rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400",
                active ? "border-brand bg-sky-50 text-brand-active" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
              )}
            >
              <input type="radio" className="sr-only" name={label} value={o.value} checked={active} onChange={() => onChange(o.value)} />
              <span className="font-medium">{o.label}</span>
              {o.hint && <span className={clsx("text-[12px]", active ? "text-sky-700" : "text-slate-500")}>{o.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
