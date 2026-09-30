# AquaFlow Operations (web)

Operations app for a water bottling plant: production, sales, stock counts, expenses and a monthly report.
It replaces the Excel workbook, so every number is calculated in one tested place instead of in cell formulas.

Built from the Stitch designs in `../../stitch_water_business_management_dashboard/` and the design system in
`hydroflow_operations/DESIGN.md`. The screens were simplified for first-day use (see "Design decisions").

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Data is sample data kept in the browser (localStorage, key `hydroflow.ops.v2`). It resets automatically on a
new calendar day, or on demand with **How this works → Reset sample data**. No backend, no accounts.

## Pages

| Route        | Answers                                                     | Main action        |
|--------------|-------------------------------------------------------------|--------------------|
| `/`          | How is the plant doing today and this month?                | Quick actions      |
| `/daily-log` | Production, end-of-shift stock count, close the day         | Add production     |
| `/sales`     | Today's receipts and money customers owe (`?show=owed`)     | Record sale        |
| `/stock`     | What's on hand, what's missing, what to reorder             | Count stock        |
| `/expenses`  | Money spent this month, by category                         | Log expense        |
| `/reports`   | Month-to-date profit and loss, printable                    | Print or save PDF  |

**New entry** (sidebar button, or the round + button on phones) records a sale, a production batch or an expense
from any page.

## The daily routine the UI is built around

1. Add production as batches finish.
2. Record every sale (credit sales show under Money owed until marked paid).
3. Log expenses when paid.
4. At shift end: Daily Log → type the counted stock → explain any shortage → **Close day**.
   Closing is blocked until every product is counted and every shortage has a reason; a closed day is read-only.

## Code map

```
src/lib/          deterministic core, no React
  types.ts        domain types
  catalog.ts      products, prices, labels, budgets
  ledger.ts       all business math: expected stock, variance, P&L, receivables aging, roll-ups
  reducer.ts      pure state transitions (record sale, count, close day...), rejects invalid input
  seed.ts         sample data anchored to today
  format.ts       RWF / number / date formatting (fixed tables, identical on server and browser)
  store.tsx       React context + localStorage persistence around reducer.ts
src/components/
  ui/             primitives, table, form, sheet, charts, status badges
  shell/          sidebar (260px ≥1280, 72px rail ≥1024), top bar, phone tab bar, help, toasts
  entry/          the New entry sheet and its three forms
src/app/<route>/  one folder per page
```

Rule: pages never compute business numbers themselves; they call `ledger.ts`.

## Checks

```bash
npm test             # vitest: ledger math, reducer rules, formatting, persistence (<1s)
npm run typecheck
npm run lint
npm run e2e          # Playwright: every page renders clean at 3 widths + the core flows (needs `npm run dev` running)
npm run build
node scripts/screens.mjs /tmp/hydroflow/screens   # screenshots of every page at 1440/1024/390, flags overflow + console errors
```

## Design decisions

- **Tokens:** the DESIGN.md hex values are Tailwind's slate/sky/emerald/amber/rose scales, used directly. Semantic
  extras (`brand`, `canvas`, `line`, elevation tiers, `tnum`) live in `src/app/globals.css`.
- **Numbers** always use tabular figures (`tnum`) and are right-aligned in tables.
- **Charts** use a two-series pair (`#075985` / `#38bdf8`) that passed the colorblind-safety validator. The Stitch
  multi-colour expense bar and donut failed it, so category breakdowns are single-hue ranked bars instead.
- **Cut for clarity:** 6→4 KPI tiles per page, period switchers with no data behind them, route map, plant photos,
  "why web beats Excel" banner, fake audit hashes, duplicate export/help buttons, 24-page pagination.
- **Colour meaning** is fixed everywhere: green = done/paid, amber = waiting, red = needs you now, always with a text label.
