---
name: HydroFlow Operations
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006387'
  on-tertiary: '#ffffff'
  tertiary-container: '#007da9'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  metric-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  metric-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  metric-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  tabular-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-compact: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system replaces cumbersome, dense desktop spreadsheets with a crystalline, breathable SaaS environment tailored for industrial beverage operations, dispatch managers, and plant accountants. The brand tone balances operational precision with liquid clarity—evoking pristine purity, rapid comprehension, and effortless logistical control.

The visual style merges **Minimalism** with **Modern Data Ergonomics**. It relies on expansive slate-white breathing room, crisp micro-lines, and deliberate aqua accents rather than decorative gradients or visual clutter. The emotional goal is immediate cognitive decompression: factory floor managers and route auditors must grasp daily batch yields, bottle deposit liabilities, credit aging, and inventory leakages in a single scan without Excel eye fatigue. Visual density is low-to-medium across macro navigation, shifting to hyper-structured tabular rhythm within high-throughput auditing views.

## Colors

The palette directly references the crystalline clarity of bottled drinking water juxtaposed against industrial deep oceanic structural bases.

### Core Architecture
- **Primary Canvas & Surfaces**: Crisp pure white (`#ffffff`) for elevated container cards, backed by cool stream surface gray (`#f8fafc`) for outer canvas foundations.
- **Structural Nav & Deep Neutrals**: `#0f172a` (Slate 900) anchors top navigation bars and active primary metric headers, while `#1e293b` (Slate 800) forms secondary table headings and strong structural dividers.
- **Water Spectrum Accents**:
  - `#0284c7` (Sky 600): Interactive primary actions, selected row highlights, and active tabs.
  - `#0ea5e9` (Sky 500): Hover states, interactive icons, and secondary focus indicators.
  - `#38bdf8` (Sky 400): Sparklines, micro-charts, and non-blocking operational progress gauges.
  - `#e0f2fe` (Sky 100): Subtle contextual fill behind operational filters, tag containers, and selected tabular rows.

### Operational State & Variance Indicators
- **Positive & Reconciled (Emerald)**: `#10b981` (Surface: `#ecfdf5`, Border: `#a7f3d0`) designates settled balances, optimal production outputs, and collected cash.
- **Pending & Attention (Amber)**: `#f59e0b` (Surface: `#fffbeb`, Border: `#fde68a`) flags depot variances, delayed returnable empty-bottle crates, and payment processing.
- **Critical Variance & Credit Limit Exceeded (Rose)**: `#f43f5e` (Surface: `#fff1f2`, Border: `#fecdd3`) demands immediate supervisor intervention for batch contamination losses, pallet count discrepancies, or overdue distributor credit defaults.

### Grid & Boundary Rules
Borders and dividers strictly utilize `#e2e8f0` (Slate 200) for primary card outlines and table rows, dropping to `#f1f5f9` (Slate 100) for intra-card cell dividers. Never use pure black (`#000000`) for data borders.

## Typography

The type scale bifurcates responsibilities cleanly: **Plus Jakarta Sans** delivers geometric authority, structural warmth, and crisp legibility to section titles and dashboard hero headers; **Inter** governs all tabular listings, transaction ledgers, inventory counts, and micro-labels.

### Tabular Formatting
All numeric ledger metrics, currency quantities, unit volumes (Litres, 18.9L Carboys, 500ml shrink-wrap packs), and financial calculations must render using CSS OpenType feature settings: `font-feature-settings: 'tnum' on, 'zero' on, 'cv02' on`. This eliminates horizontal digit jitter during real-time telemetric updates and maintains flawless vertical decimal alignment across spreadsheet replacements.

## Layout & Spacing

The layout model uses a desktop-first, highly responsive 12-column fluid grid designed for 1080p, 1440p, and rugged tablet displays mounted in bottling facilities.

### Grid Anatomy
- **Desktop (1280px+)**: 12-column grid with a fixed 260px collapsible operational navigation sidebar, `margin: 2rem`, and `gutter: 1.5rem`.
- **Tablet Landscape (1024px - 1279px)**: 12-column grid, compact 72px iconified sidebar, `margin: 1.5rem`, `gutter: 1rem`.
- **Tablet Portrait & Mobile (<1023px)**: 4 to 8-column layout, bottom-sheet command drawer, `margin: 1rem`, `gutter-compact: 0.75rem`.

### Density & Rhythms
Unlike legacy Excel rows crammed at 20px height, tables utilize a minimum 48px row height default (36px for high-density production runs), allowing clear touch targets for distribution drivers and line managers. Section padding follows an 8-point baseline scale (`space-xs` through `space-2xl`), enforcing strict alignment between inventory metric headers and their respective analytical tables.

## Elevation & Depth

To avoid visual fatigue during 8-hour dispatch shifts, this design system avoids multi-layer skeuomorphism and dark dropshadows. Depth is established through **low-contrast micro-outlines** and **ambient water-tinted soft diffusion**.

### Elevation Tiers
- **Tier 0 (Canvas Base)**: `#f8fafc`. Unadorned structural foundation.
- **Tier 1 (Surface Containers & Tables)**: Pure `#ffffff` surface, bounded by a 1px solid border of `#e2e8f0`. Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Tier 2 (Floating Popovers & Quick Action Drawers)**: `#ffffff` surface, 1px solid border `#cbd5e1`. Shadow: `0 10px 15px -3px rgba(2, 132, 199, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- **Tier 3 (Batch Discrepancy Modals & Route Overlays)**: `#ffffff` with a subtle 1px border `#94a3b8`. Ambient shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`. Backdropped by `#0f172a` tinted at 40% opacity with a `backdrop-blur: 4px`.

## Shapes

The interface embraces a rounded level of **2** (`0.5rem` / 8px default radius), establishing a balanced aesthetic that feels clean and dependable.

- **KPI Cards & Data Tables**: `0.5rem` (8px) corner radius. Structural corners remain sharp enough to align tightly on data-dense grids without wasting screen real estate.
- **Pill Badges (Status, Payment Types, Variances)**: `9999px` full-capsule radius for instant recognition as lightweight interactive or informational tags.
- **Form Controls & Search**: `0.375rem` (6px) radius for input fields, date pickers, and unit steppers.
- **Modal Containers & Slide-out Drawers**: `rounded-lg` (`1rem` / 16px) corner radius.

## Components

### Buttons
- **Primary Button**: Solid `#0284c7`, text `#ffffff`, font weight 600. On hover: `#0ea5e9`. Active: `#0369a1`. Padding: `0.5rem 1rem`. Radius: 8px. Focus ring: 2px offset with `#38bdf8`.
- **Secondary / Outline**: `#ffffff` background, 1px solid `#e2e8f0`, text `#1e293b`. Hover: `#f8fafc` background with border `#cbd5e1`.
- **Destructive / Variance Reject**: Solid `#f43f5e`, text `#ffffff`. Hover: `#e11d48`.

### Status & Payment Method Pill Badges
Full-capsule (`rounded-full`) badges with `0.25rem 0.625rem` padding and uppercase-weighted `label-sm` typography:
- **Cash**: Slate badge. Background `#f1f5f9`, border `#cbd5e1`, text `#334155`.
- **Mobile Money**: Deep sky badge. Background `#e0f2fe`, border `#bae6fd`, text `#0284c7`.
- **Credit / Ledger**: Amber alert badge. Background `#fffbeb`, border `#fde68a`, text `#b45309`.
- **Settled / Positive Run**: Emerald badge. Background `#ecfdf5`, border `#a7f3d0`, text `#047857`.
- **Deficit / Shortage Alert**: Rose badge. Background `#fff1f2`, border `#fecdd3`, text `#be123c`.

### Data Tables (The Spreadsheet Replacement)
- **Container**: Card wrapper with 1px border `#e2e8f0` and 8px border radius.
- **Header Row**: `#f8fafc` background, border-bottom 1px solid `#e2e8f0`. Typography: `label-md` in `#475569`, text uppercase, tracked +0.02em.
- **Data Rows**: Default height 48px, background `#ffffff`, alternate zebra tint optional (`#fcfdfe`). Hover state: `#f0f9ff` (Sky 50) with interactive left border accent in `#0284c7`.
- **Numerical Alignment**: Strict right-alignment for currencies, quantities, and weights with monospaced tabular numerals (`tabular-data`). Left-alignment for product descriptions, routes, and client names.

### Metric KPI Summary Cards
Built with an interior padding of `1.25rem`, these display the core operations numbers:
- **Top Micro-Header**: `label-md` in `#64748b` accompanied by a 24x24px soft-tinted icon container (e.g., `#e0f2fe` background with `#0284c7` glyph).
- **Core Value**: `metric-xl` in `#0f172a`.
- **Sub-Metric Footer**: Compact comparison badge (`+4.2% vs yesterday` or `-12 Carboys Variance`) displaying either emerald green or rose text based on inventory threshold logic.

### Input Fields & Steppers
- Height: 40px standard. Background: `#ffffff`. Border: 1px `#cbd5e1`. Text: `body-md` in `#0f172a`.
- Quantity adjustment stepper buttons for bottle counts utilize subtle `#f1f5f9` backgrounds with instant arithmetic keyboard shortcuts (Tab / Arrow keys).
- Active state transitions smoothly to border `#0284c7` with a subtle box-shadow ring: `0 0 0 3px rgba(2, 132, 199, 0.15)`.