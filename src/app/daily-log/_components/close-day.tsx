"use client";

import { CircleCheck, Lock, LockOpen, TriangleAlert } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/ui/primitives";
import { CURRENT_USER } from "@/lib/catalog";
import { canCloseDay } from "@/lib/ledger";
import { useStore } from "@/lib/store";

export function CloseDay() {
  const { state, dispatch, notify } = useStore();

  if (state.dayClosed) {
    return (
      <Card>
        <div role="status" className="flex flex-col gap-4 rounded-lg bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Day closed by {state.closedBy ?? "someone"}</p>
              <p className="text-[13px] text-slate-600">Today&apos;s counts are locked. Reopen only to fix a mistake.</p>
            </div>
          </div>
          <Button
            icon={LockOpen}
            onClick={() => {
              if (dispatch({ type: "reopenDay" })) notify("Day reopened. You can edit counts again.");
            }}
          >
            Reopen
          </Button>
        </div>
      </Card>
    );
  }

  const check = canCloseDay(state);
  return (
    <Card>
      <CardHeader title="Close the day" hint="Closing locks today's counts so the numbers can't change by accident." />
      <div className="flex flex-col gap-4 border-t border-line-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {check.ok ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CircleCheck className="size-4 shrink-0" aria-hidden />
            Everything is counted and explained. Ready to close.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              Not ready yet: <span className="font-semibold text-ink">{check.reason}</span>.
            </span>
          </p>
        )}
        <Button
          variant={check.ok ? "primary" : "secondary"}
          icon={Lock}
          disabled={!check.ok}
          className="w-full sm:w-auto"
          onClick={() => {
            if (dispatch({ type: "closeDay", by: CURRENT_USER.name })) notify("Day closed. Today's numbers are locked.");
          }}
        >
          Close day
        </Button>
      </div>
    </Card>
  );
}
