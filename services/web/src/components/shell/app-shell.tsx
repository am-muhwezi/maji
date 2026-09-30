"use client";

import clsx from "clsx";
import { Bell, CheckCircle2, CircleHelp, LogOut, MoreHorizontal, Plus, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/logo";
import { useQuickEntry } from "@/components/entry/quick-entry";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/primitives";
import { CURRENT_USER, PLANT_NAME, product } from "@/lib/catalog";
import { longDay, signed, money } from "@/lib/format";
import { openShortages, receivables } from "@/lib/ledger";
import { useStore } from "@/lib/store";
import { isActive, NAV } from "./nav";

/* ---------- Alerts: the only things that need a human today ---------- */

interface AlertItem {
  id: string;
  tone: "danger" | "warning";
  title: string;
  detail: string;
  href: string;
}

function useAlerts(): AlertItem[] {
  const { state } = useStore();
  const items: AlertItem[] = [];
  for (const l of openShortages(state)) {
    const p = product(l.productId);
    const v = (l.physical ?? 0) - (l.opening + l.production - l.sales);
    items.push({ id: `short-${l.productId}`, tone: "danger", title: `${p.name}: ${signed(v)} units short`, detail: "Count does not match expected stock", href: "/stock" });
  }
  for (const r of receivables(state.sales, state.today).filter((r) => r.bucket === "overdue")) {
    items.push({ id: `od-${r.sale.id}`, tone: "warning", title: `${r.sale.customer} is ${-r.dueIn} days overdue`, detail: `${money(r.sale.amount)} unpaid`, href: "/sales?show=owed" });
  }
  return items;
}

/* ---------- Sidebar (≥1024px) ---------- */

function Sidebar({ onHelp }: { onHelp: () => void }) {
  const pathname = usePathname();
  const { state } = useStore();
  const { openEntry } = useQuickEntry();
  const shortages = openShortages(state).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-white lg:flex xl:w-[260px] print:hidden">
      <div className="flex h-16 items-center justify-center px-4 xl:justify-start xl:px-5">
        <span className="xl:hidden"><LogoMark /></span>
        <span className="hidden xl:block"><Logo /></span>
      </div>

      <div className="mx-3 mb-3 hidden items-center gap-2 rounded-md bg-canvas px-3 py-2 text-[12px] font-medium text-slate-600 xl:flex">
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <span className="truncate">{PLANT_NAME}</span>
        <span className="ml-auto text-emerald-700">Online</span>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon, hint }) => {
          const active = isActive(pathname, href);
          const badge = href === "/stock" && shortages > 0 ? shortages : 0;
          return (
            <Link
              key={href}
              href={href}
              title={`${label}: ${hint}`}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors xl:justify-start",
                active ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="hidden xl:inline">{label}</span>
              {badge > 0 && (
                <>
                  <span className={clsx("ml-auto hidden rounded-full px-2 py-0.5 text-[11px] font-semibold xl:inline", active ? "bg-white/20 text-white" : "bg-rose-50 text-rose-700")}>
                    {badge} to check
                  </span>
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 xl:hidden" aria-label={`${badge} to check`} />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 p-3">
        <Button variant="primary" icon={Plus} onClick={() => openEntry()} className="h-11 w-full px-0 xl:px-4" aria-label="New entry">
          <span className="hidden xl:inline">New entry</span>
        </Button>
        <button type="button" onClick={onHelp} className="flex h-10 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink xl:justify-start" title="How this works">
          <CircleHelp className="size-5" aria-hidden />
          <span className="hidden xl:inline">How this works</span>
        </button>
        <div className="flex items-center gap-3 rounded-lg bg-canvas p-2 xl:p-3">
          <span className="mx-auto grid size-9 shrink-0 place-items-center rounded-full bg-sky-900 text-[13px] font-semibold text-white xl:mx-0" aria-hidden>DM</span>
          <div className="hidden min-w-0 flex-1 xl:block">
            <div className="truncate text-sm font-semibold text-ink">{CURRENT_USER.name}</div>
            <div className="truncate text-[12px] text-slate-500">{CURRENT_USER.role}</div>
          </div>
          <button type="button" className="hidden size-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-ink xl:grid" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Top bar ---------- */

function AlertsButton() {
  const alerts = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={alerts.length ? `${alerts.length} alerts` : "No alerts"}
        className="relative grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-ink"
      >
        <Bell className="size-5" aria-hidden />
        {alerts.length > 0 && (
          <span className="tnum absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-bold text-white">{alerts.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-fade-in rounded-lg border border-slate-300 bg-white shadow-tier2">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Needs attention</div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-600">
              <CheckCircle2 className="size-5 text-emerald-500" aria-hidden /> All clear. Nothing needs you right now.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <TriangleAlert className={clsx("mt-0.5 size-4 shrink-0", a.tone === "danger" ? "text-rose-500" : "text-amber-500")} aria-hidden />
                    <span>
                      <span className="block text-sm font-medium text-ink">{a.title}</span>
                      <span className="block text-[12px] text-slate-500">{a.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TopBar({ onHelp }: { onHelp: () => void }) {
  const { state } = useStore();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-6 xl:px-8 print:static print:border-0 print:px-0">
      <span className="lg:hidden"><LogoMark /></span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink" suppressHydrationWarning>{longDay(state.today)}</div>
        <div className="truncate text-[12px] text-slate-500">
          {state.dayClosed ? "Day closed" : "Shift open"} · All amounts in RWF
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 print:hidden">
        <button type="button" onClick={onHelp} className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-ink lg:hidden" aria-label="How this works">
          <CircleHelp className="size-5" aria-hidden />
        </button>
        <AlertsButton />
      </div>
    </header>
  );
}

/* ---------- Phone tab bar (<1024px) ---------- */

const PHONE_TABS = ["/", "/daily-log", "/sales", "/stock"];

function Tab({ href, label, icon: Icon, active, expanded, onClick }: { href?: string; label: string; icon: LucideIcon; active: boolean; expanded?: boolean; onClick?: () => void }) {
  const cls = clsx("flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-brand" : "text-slate-500");
  const inner = (<><Icon className="size-5" aria-hidden />{label}</>);
  return href ? (
    <Link href={href} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
  ) : (
    <button type="button" className={cls} onClick={onClick} aria-expanded={expanded}>{inner}</button>
  );
}

function PhoneNav() {
  const pathname = usePathname();
  const { openEntry } = useQuickEntry();
  const [more, setMore] = useState(false);
  const tabs = NAV.filter((n) => PHONE_TABS.includes(n.href));
  const extra = NAV.filter((n) => !PHONE_TABS.includes(n.href));
  const extraActive = extra.some((n) => isActive(pathname, n.href));

  return (
    <>
      <button
        type="button"
        onClick={() => openEntry()}
        aria-label="New entry"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-brand text-white shadow-tier3 hover:bg-brand-hover active:bg-brand-active lg:hidden print:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </button>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden">
        {tabs.map((t) => (
          <Tab key={t.href} href={t.href} label={t.short} icon={t.icon} active={isActive(pathname, t.href)} />
        ))}
        <Tab label="More" icon={MoreHorizontal} active={extraActive} expanded={more} onClick={() => setMore(true)} />
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="More">
        <div className="grid gap-2">
          {extra.map(({ href, label, hint, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMore(false)} className="flex items-center gap-3 rounded-lg border border-line p-3 hover:bg-sky-50">
              <span className="grid size-10 place-items-center rounded-lg bg-sky-100 text-brand"><Icon className="size-5" aria-hidden /></span>
              <span>
                <span className="block font-semibold text-ink">{label}</span>
                <span className="block text-[13px] text-slate-500">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </Sheet>
    </>
  );
}

/* ---------- First-day guide ---------- */

const ROUTINE = [
  { title: "Add production as batches finish", body: "Tap New entry → Add production. Each batch adds to today's stock." },
  { title: "Record every sale", body: "New entry → Record a sale. Pick Credit if the customer pays later; it appears under money owed." },
  { title: "Log expenses when you pay", body: "New entry → Log an expense. Fuel, power, wages and repairs each have a category." },
  { title: "Count stock and close the day", body: "At shift end, open Daily Log, type the physical count for each product, explain any shortage, then Close day." },
];

function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch, notify, state } = useStore();
  return (
    <Sheet open={open} onClose={onClose} title="How this works" description="Your daily routine in four steps.">
      <ol className="flex flex-col gap-4">
        {ROUTINE.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="tnum grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-[13px] font-semibold text-brand">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-[13px] text-slate-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-lg bg-canvas p-4 text-[13px] text-slate-600">
        <p className="font-semibold text-ink">Reading the colours</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          <li><span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />Green: balanced, paid, on track.</li>
          <li><span className="mr-2 inline-block size-2 rounded-full bg-amber-500" />Amber: waiting on something (credit due, stock low).</li>
          <li><span className="mr-2 inline-block size-2 rounded-full bg-rose-500" />Red: needs you now (shortage, overdue).</li>
        </ul>
      </div>
      <div className="mt-6 border-t border-line pt-4">
        <p className="text-[13px] text-slate-500">This demo keeps data in your browser. Resetting restores today&apos;s sample data.</p>
        <Button
          size="sm"
          className="mt-3"
          onClick={() => {
            dispatch({ type: "reset", today: state.today });
            notify("Sample data restored");
            onClose();
          }}
        >
          Reset sample data
        </Button>
      </div>
    </Sheet>
  );
}

/* ---------- Toast ---------- */

function Toaster() {
  const { toast } = useStore();
  return (
    <div aria-live="polite" className="print:hidden pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6">
      {toast && (
        <div key={toast.id} className={clsx("pointer-events-auto flex animate-sheet-up items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-tier3", toast.tone === "success" ? "bg-slate-900" : "bg-rose-600")}>
          {toast.tone === "success" ? <CheckCircle2 className="size-4 text-emerald-400" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ---------- Shell ---------- */

export function AppShell({ children }: { children: ReactNode }) {
  const [help, setHelp] = useState(false);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow-tier2">Skip to content</a>
      <Sidebar onHelp={() => setHelp(true)} />
      <div className="lg:pl-[72px] xl:pl-[260px] print:pl-0">
        <TopBar onHelp={() => setHelp(true)} />
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-28 md:px-6 lg:pb-12 xl:px-8 xl:pt-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
      <PhoneNav />
      <HelpSheet open={help} onClose={() => setHelp(false)} />
      <Toaster />
    </>
  );
}
