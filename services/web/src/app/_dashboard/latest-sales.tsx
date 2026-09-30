"use client";

import clsx from "clsx";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Card, CardHeader, Empty, LinkButton } from "@/components/ui/primitives";
import { SaleStatus } from "@/components/ui/status";
import { Cell2, Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { product } from "@/lib/catalog";
import { num, money } from "@/lib/format";
import { useStore } from "@/lib/store";
import { latestSales } from "./summary";

export function LatestSales({ className }: { className?: string }) {
  const { state } = useStore();
  const rows = latestSales(state.sales, state.today);

  return (
    <Card className={clsx("min-w-0", className)}>
      <CardHeader
        title="Latest sales today"
        hint="The last five receipts, newest first."
        action={
          <LinkButton href="/sales" variant="ghost" size="sm" icon={ArrowRight} className="flex-row-reverse">
            All sales
          </LinkButton>
        }
      />
      {rows.length === 0 ? (
        <Empty icon={ShoppingCart} title="No sales yet today">Use New entry to record one; it appears here right away.</Empty>
      ) : (
        <>
          {/* Stacked list where the card is narrow (phone, and the 2/3 column at 1024-1279px); table elsewhere. */}
          <ul className="divide-y divide-line-soft border-t border-line-soft md:hidden lg:block xl:hidden">
            {rows.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{s.customer}</div>
                  <div className="truncate text-[13px] text-slate-500">
                    <span className="tnum">{s.time}</span> · {product(s.productId).name} × {num(s.qty)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tnum text-sm font-semibold text-ink">{money(s.amount)}</span>
                  <SaleStatus sale={s} today={state.today} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block lg:hidden xl:block">
            <Table>
              <THead>
                <tr>
                  <Th className="w-20">Time</Th>
                  <Th>Customer</Th>
                  <Th>Product</Th>
                  <Th num>Amount (RWF)</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {rows.map((s) => (
                  <Tr key={s.id}>
                    <Td className="tnum text-slate-500">{s.time}</Td>
                    <Td>
                      <Cell2 primary={s.customer} secondary={s.customerNote} />
                    </Td>
                    <Td className="whitespace-nowrap text-slate-700">
                      {product(s.productId).name} × {num(s.qty)}
                    </Td>
                    <Td num className="font-semibold text-ink">{num(s.amount)}</Td>
                    <Td>
                      <SaleStatus sale={s} today={state.today} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </Card>
  );
}
