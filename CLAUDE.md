# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**404 Inventory Dashboard** — A Microsoft Excel Office Add-in (taskpane) built with React that reads inventory data directly from Excel worksheets and displays it as an interactive dashboard with KPIs, charts, and tables. There are no HTTP APIs; all data comes from Office.js `Excel.run()` calls.

**Owner:** Ryan — HEB Warehouse 404, Inventory Operations
**GitHub:** `naquin316/404-inv-dashboard`
**Live URL:** `https://404-inv-dashboard.pages.dev`
**Manifest UUID:** `1c3b57fd-3808-47cc-85ba-c59edf066bda`

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # TypeScript check (tsc -b) + Vite production build
npm run lint      # ESLint across all files
npm run preview   # Serve dist/ locally
```

Deployment is automated via GitHub Actions → Cloudflare Pages (wrangler). Push to `main` triggers deploy (~40 seconds).

## Architecture

### Dual Entry Points (Multi-Page Vite Build)

- **Taskpane:** `index.html` → `src/main.tsx` → `App.tsx` — Runs inside Excel's task pane sidebar
- **Dialog:** `dialog.html` → `src/dialog-main.tsx` → `DialogApp.tsx` — Pop-out window for full-screen view

Both entry points render the same dashboard tabs (Flow Cuts / Final Shorts) but the dialog receives data via Office.js message passing (`messageChild`/`messageParent`), not by reading Excel directly.

### Data Flow

```
Excel Workbook (source of truth)
  → useExcelData hook (parses "Flow Cuts" and "Final Short Tracker" sheets every 30s)
  → App.tsx renders FlowCutsTab or FinalShortsTab
  → useDialog sends data to pop-out dialog via Office.js messaging
  → DialogApp.tsx renders same tabs with received data
```

### Sheet Parsing Details

**Flow Cuts sheet** — parsed by scanning for known labels:
- `findVal()` scans for "TOTAL ITEMS", "TOTAL SKUs", "TOTAL COST", "TRUE CUTS" → summary metrics
- "TOP COST DRIVERS" section → `TopDriver[]` (rank, pick, desc, cost, qty, total)
- "TOP 5 SELECTORS" section → `TopSelector[]` (name, qty, pct)
- "DAILY BREAKDOWN" section → `DailyEntry[]` (date, items, skus, cost, trueCuts per day)
- TIME_BUCKET detection → timeline (half-hour buckets with qty and cost)

**Final Short Tracker sheet** — flat table:
- Row 1 = headers, remaining rows = `ShortRecord[]`
- Columns: RPT_DT, PRODUCT, DESCRIPTION, PARTNER, FINAL_SHORTS, COST, JobTitle

**Excel serial dates:** `new Date((serial - 25569) * 86400000)`. Time extraction: `serial % 1 * 24 * 60` for minutes.

### Key Custom Hooks

- **`useExcelData`** — Office.js initialization, sheet parsing, auto-refresh (30s interval), status/error state. This is the core data layer.
- **`useDialog`** — Dialog lifecycle (open/close), message passing between taskpane and dialog, ready-state tracking.

### Component Tree

```
App.tsx (TaskPane)
├── StatusBar (title, commit SHA badge, status dot, pop-out button, refresh button)
├── Tab Switcher (Flow Cuts | Final Shorts)
├── FlowCutsTab
│   ├── KpiCard × 4 (items, SKUs, cost, true cuts)
│   ├── Card: Top Cost Drivers (table + horizontal BarChart)
│   ├── Card: Top 5 Selectors (table)
│   ├── Card: Daily Breakdown (ComposedChart — bars + line)
│   └── Card: Timeline (ComposedChart — bars + line by time bucket)
└── FinalShortsTab
    ├── KpiCard × 3 (total shorts, total cost, unique products)
    ├── Card: By Team (BarChart)
    ├── Card: By Partner (horizontal BarChart)
    └── Card: Data Table (searchable, scrollable)

DialogApp.tsx (Pop-Out) — same tabs with wide=true for expanded layouts
```

### Component Layers

- **`src/components/ui/`** — Reusable primitives (Card, KpiCard, StatusBar)
- **`src/components/dashboard/`** — Feature components (FlowCutsTab, FinalShortsTab) that accept data props and render KPIs, charts, tables
- **`src/types/index.ts`** — All TypeScript interfaces (`FlowCutsData`, `ShortRecord`, `StatusState`, etc.)
- **`src/lib/utils.ts`** — Formatting helpers (`fmt$`, `fmtN`, `fmtPct`, `fmtDate`, `cn`)

### Styling

Tailwind CSS 4 with custom dark theme defined via `@theme` block in `src/index.css` (no tailwind.config file). Uses `class-variance-authority` for component variants and `tailwind-merge` via the `cn()` utility.

Theme tokens: `--color-background`, `--color-card`, `--color-card-hover`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent-blue`, `--color-accent-purple`, `--color-accent-green`, `--color-accent-amber`, `--color-accent-red`, `--color-accent-cyan`.

Dark theme is the only theme — intentional for visual separation from Excel's white background.

### Office.js Globals

`Office` and `Excel` are global objects provided by Office.js (loaded via CDN in HTML files). Their types are declared in `src/globals.d.ts` along with build-time constants `__COMMIT_SHA__` and `__BUILD_TIME__`.

### Manifest Redirect

The Office Add-in manifest points to `/taskpane.html`, but Vite outputs `/index.html`. A Cloudflare `_redirects` file rewrites `/taskpane.html → /` with a 200 status.

## Key Decisions

- **Office.js add-in over standalone web app:** Team lives in Excel. No export/upload friction.
- **React over plain HTML:** Plain HTML version hit maintainability wall. React gives component composition and hooks.
- **Recharts over alternatives:** Declarative, lightweight, covers needed chart types. nivo was runner-up.
- **30-second polling over Office.js events:** `onChanged` fires on every cell edit, too noisy. Polling is simple and predictable.
- **Cloudflare over Azure/GitHub Pages:** Already had account, free tier, natural path to Workers + D1 for server-side features later.
- **Dark theme only:** Creates visual separation from Excel's white background, reduces eye strain during shifts.

## Known Constraints

- **Power Query refresh is NOT possible from Office.js.** Extensively researched — `refreshAllDataConnections()` is preview-only and unreliable. `Excel.Query.refresh()` exists only in beta CDN. Office.js cannot call VBA or access COM. Workarounds: VBA companion macro, "Refresh on Open" setting, or server-side data pipeline.
- **Vite 8 peer dep conflict:** `.npmrc` sets `legacy-peer-deps=true` for `@tailwindcss/vite` compatibility.
- **Recharts TypeScript:** Tooltip `formatter` prop types need `(v: any)` with `Number(v)` wrapping.
- **Sheet layout is owned by HEB's Power Query setup, not us.** Changes to parsing logic must match the actual sheet format.

## Tech Stack

React 19, TypeScript 5.9 (strict), Vite 8, Tailwind CSS 4, Recharts 3.8, lucide-react icons, Office.js (Excel APIs), clsx, tailwind-merge, class-variance-authority

## Notes

- `.npmrc` sets `legacy-peer-deps=true` for Vite 8 peer dependency compatibility
- No React Router — tab switching is local state (`useState`)
- No external APIs or database — Excel workbook is the sole data source
- Path alias: `@/` maps to `src/`
- Commit SHA displays as clickable badge in status bar linking to GitHub commit
- CI/CD secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` in GitHub repo settings

## Extended Documentation

See `docs/` for detailed reference documents:
- `docs/ARCHITECTURE.md` — Full system diagrams, data flow, build pipeline, security notes
- `docs/DECISIONS.md` — 11 decision log entries with rationale and alternatives considered
- `docs/PROJECT_CONTEXT.md` — Project history, owner context, data sheets, known limitations
- `docs/ROADMAP.md` — Vision from v1.x through v3.0 (Workers + D1, write-back, alerts, cross-site)
