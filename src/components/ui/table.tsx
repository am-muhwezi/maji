import clsx from "clsx";
import type { ComponentProps } from "react";

/**
 * Spreadsheet-replacement table. 48px rows, slate-50 header, sky-50 hover with a brand
 * left accent. Numbers: pass `num` to right-align with tabular figures.
 * On narrow screens the wrapper scrolls horizontally; pages should also hide low-value
 * columns below `md` with `className="hidden md:table-cell"`.
 */
export function Table({ className, children, ...rest }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx("w-full border-collapse text-sm", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-y border-line bg-canvas">{children}</thead>;
}

export function Th({ num, className, children, ...rest }: ComponentProps<"th"> & { num?: boolean }) {
  return (
    <th
      scope="col"
      className={clsx(
        "h-10 px-4 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase first:pl-5 last:pr-5",
        num ? "text-right" : "text-left",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Tr({ className, children, interactive = true, tone, ...rest }: ComponentProps<"tr"> & { interactive?: boolean; tone?: "danger" | "muted" }) {
  return (
    <tr
      className={clsx(
        "border-b border-line-soft last:border-b-0",
        interactive && "transition-colors hover:bg-sky-50 [&>td:first-child]:border-l-2 [&>td:first-child]:border-l-transparent hover:[&>td:first-child]:border-l-brand",
        tone === "danger" && "bg-rose-50/60",
        tone === "muted" && "text-slate-400",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({ num, className, children, ...rest }: ComponentProps<"td"> & { num?: boolean }) {
  return (
    <td
      className={clsx(
        "h-12 px-4 py-2.5 align-middle first:pl-5 last:pr-5",
        num ? "tnum text-right whitespace-nowrap" : "text-left",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Two-line cell: primary text over a muted detail. */
export function Cell2({ primary, secondary }: { primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="font-medium text-ink">{primary}</div>
      {secondary && <div className="text-[13px] text-slate-500">{secondary}</div>}
    </div>
  );
}

export function TFoot({ children }: { children: React.ReactNode }) {
  return <tfoot className="border-t border-line bg-canvas font-semibold">{children}</tfoot>;
}
