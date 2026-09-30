import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap select-none";

const buttonVariant: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-active shadow-tier1",
  secondary:
    "bg-white text-slate-800 border border-line hover:bg-canvas hover:border-slate-300 active:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink",
  danger: "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700",
};

const buttonSize: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra?: string) {
  return clsx(buttonBase, buttonVariant[variant], buttonSize[size], extra);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
}

export function Button({ variant = "secondary", size = "md", icon: Icon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
}

export function LinkButton({ variant = "secondary", size = "md", icon: Icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
      {children}
    </Link>
  );
}

/* ---------- Card ---------- */

export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={clsx("rounded-lg border border-line bg-white shadow-tier1", className)} {...rest}>
      {children}
    </section>
  );
}

/** Standard card header: title, optional one-line hint, optional right-side slot. */
export function CardHeader({ title, hint, action, className }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-slate-500">{hint}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */

/** Every page opens with the same block: title, one plain sentence, at most one primary action. */
export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px] sm:leading-9">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ---------- Badge ---------- */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const badgeTone: Record<Tone, string> = {
  neutral: "bg-slate-100 border-slate-300 text-slate-700",
  info: "bg-sky-100 border-sky-200 text-sky-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  danger: "bg-rose-50 border-rose-200 text-rose-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- KPI tile ---------- */

export function Kpi({
  label,
  value,
  unit,
  icon: Icon,
  foot,
  footTone = "neutral",
  valueTone = "ink",
  href,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  foot?: ReactNode;
  footTone?: "neutral" | "up" | "down";
  valueTone?: "ink" | "brand" | "danger";
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="grid size-7 place-items-center rounded-md bg-sky-100 text-brand">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={clsx(
            "tnum text-[26px] leading-8 font-semibold tracking-tight sm:text-[28px]",
            valueTone === "ink" && "text-ink",
            valueTone === "brand" && "text-brand",
            valueTone === "danger" && "text-rose-600",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {foot && (
        <p
          className={clsx(
            "mt-1 text-[13px]",
            footTone === "neutral" && "text-slate-500",
            footTone === "up" && "text-emerald-700",
            footTone === "down" && "text-rose-600",
          )}
        >
          {foot}
        </p>
      )}
    </>
  );
  const cls = "block rounded-lg border border-line bg-white p-5 shadow-tier1";
  return href ? (
    <Link href={href} className={clsx(cls, "transition-colors hover:border-sky-300")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function KpiGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 }) {
  return (
    <div className={clsx("grid grid-cols-2 gap-3 sm:gap-4", cols === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3")}>
      {children}
    </div>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors",
              active ? "bg-white text-brand shadow-tier1" : "text-slate-600 hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={clsx("tnum text-[11px]", active ? "text-sky-600" : "text-slate-400")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Progress ---------- */

export function Progress({ value, tone = "brand", label }: { value: number; tone?: "brand" | "success" | "warning" | "danger"; label: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={clsx(
          "h-full rounded-full",
          tone === "brand" && "bg-brand",
          tone === "success" && "bg-emerald-500",
          tone === "warning" && "bg-amber-500",
          tone === "danger" && "bg-rose-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ---------- Alert banner ---------- */

export function Alert({
  tone = "danger",
  icon: Icon,
  title,
  children,
  action,
}: {
  tone?: "danger" | "warning" | "info" | "success";
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={clsx(
        "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center",
        tone === "danger" && "border-rose-200 bg-rose-50",
        tone === "warning" && "border-amber-200 bg-amber-50",
        tone === "info" && "border-sky-200 bg-sky-50",
        tone === "success" && "border-emerald-200 bg-emerald-50",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon
          aria-hidden
          className={clsx(
            "mt-0.5 size-5 shrink-0",
            tone === "danger" && "text-rose-600",
            tone === "warning" && "text-amber-600",
            tone === "info" && "text-brand",
            tone === "success" && "text-emerald-600",
          )}
        />
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-ink">{title}</span>
          {children && <> {children}</>}
        </p>
      </div>
      {action && <div className="shrink-0 pl-8 sm:pl-0">{action}</div>}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{children}</p>}
    </div>
  );
}

/* ---------- Stat row (label / value pairs inside cards) ---------- */

export function StatRow({ label, value, strong, tone }: { label: ReactNode; value: ReactNode; strong?: boolean; tone?: "danger" | "success" | "brand" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd
        className={clsx(
          "tnum text-right text-sm",
          strong ? "font-semibold" : "font-medium",
          tone === "danger" ? "text-rose-600" : tone === "success" ? "text-emerald-700" : tone === "brand" ? "text-brand" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
