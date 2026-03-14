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

### Workbook Registry & Detection

The app supports multiple Excel workbooks via a config-driven registry. On startup, `useWorkbookDetection` reads sheet names from the open workbook and matches against `src/config/registry.ts` to determine which pages to show. If no workbook matches, a `LandingPage` is displayed.

**Adding a new workbook** requires only 3 steps:
1. Write a loader function in `src/data/loaders.ts`
2. Create a tab component in `src/components/dashboard/`
3. Add an entry to `workbookRegistry` in `src/config/registry.ts`

No changes to App, Sidebar, or hooks needed.

### Data Flow

```
Excel Workbook (source of truth)
  → useWorkbookDetection (reads sheet names, matches against workbookRegistry)
  → useExcelData(availablePages) — calls each page's dataLoader, returns Record<string, any>
  → App.tsx renders Sidebar + active page component
  → useDialog sends Record<string, any> to pop-out dialog via Office.js messaging
  → DialogApp.tsx infers workbook from data keys, renders same sidebar + pages
```

### Key Layers

- **`src/config/registry.ts`** — Declarative `workbookRegistry: WorkbookDefinition[]` mapping workbooks → pages (id, label, icon, sheet name, component, dataLoader)
- **`src/data/loaders.ts`** — Pure async sheet parsers (`loadFlowCuts`, `loadShorts`). No hooks or state — take `ctx`, return data.
- **`src/hooks/useWorkbookDetection.ts`** — Reads sheet names on Office.js ready, finds best-matching workbook from registry, returns `WorkbookContext`
- **`src/hooks/useExcelData.ts`** — Accepts `PageDefinition[]`, loops over pages calling each `dataLoader(ctx)`, returns `Record<string, any>` keyed by page id. Auto-refreshes every 30s.
- **`src/hooks/useDialog.ts`** — Dialog lifecycle. `sendData` and `openDialog` accept `Record<string, any>` (generic, not hardcoded to specific data types).
- **`src/components/ui/Sidebar.tsx`** — Taskpane: 40px icon rail that expands to ~176px on hover (CSS `group` + `transition-all`). Dialog: always-expanded ~160px sidebar. Uses icons from `PageDefinition`.
- **`src/components/LandingPage.tsx`** — Shown when no workbook matches. Lists expected sheets and detected sheets.

### Sheet Parsing Details

**Flow Cuts sheet** — parsed by `loadFlowCuts` in `src/data/loaders.ts`:
- `findVal()` scans for "Total Items Shorted", "Total Affected SKUs", "Total Cost Impact", "True Cuts (Confirmed Losses)" → summary metrics
- "TOP COST DRIVERS" section → `TopDriver[]` (rank, pick, desc, cost, qty, total)
- "TOP 5 SELECTORS" section → `TopSelector[]` (name, qty, pct)
- "DAILY BREAKDOWN" section → `DailyEntry[]` (date, items, skus, cost, trueCuts per day)
- TIME_BUCKET detection → timeline (half-hour buckets with qty and cost)

**Final Short Tracker sheet** — parsed by `loadShorts` in `src/data/loaders.ts`:
- Row 1 = headers, remaining rows = `ShortRecord[]`
- Columns: RPT_DT, PRODUCT, DESCRIPTION, PARTNER, FINAL_SHORTS, COST, JobTitle

**Excel serial dates:** `new Date((serial - 25569) * 86400000)`. Time extraction: `serial % 1 * 24 * 60` for minutes.

### Component Tree

```
App.tsx (TaskPane)
├── useWorkbookDetection() → WorkbookContext
├── useExcelData(availablePages) → Record<string, any>
├── Sidebar (icon rail, workbook icon + page icons)
├── StatusBar (title, commit SHA badge, status dot, pop-out button, refresh button)
└── Active page component with data[activePageId]
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

DialogApp.tsx (Pop-Out) — same pages with wide=true, always-expanded sidebar
LandingPage — fallback when no workbook matches
```

### Component Layers

- **`src/components/ui/`** — Reusable primitives (Card, KpiCard, StatusBar, Sidebar)
- **`src/components/dashboard/`** — Feature components (FlowCutsTab, FinalShortsTab) that accept data props and render KPIs, charts, tables
- **`src/components/LandingPage.tsx`** — Fallback for unrecognized workbooks
- **`src/types/index.ts`** — All TypeScript interfaces (`FlowCutsData`, `ShortRecord`, `StatusState`, `PageDefinition`, `WorkbookDefinition`, `WorkbookContext`, etc.)
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
- **Workbook registry over hardcoded tabs:** Config-driven `workbookRegistry` in `src/config/registry.ts` allows adding new workbook support without touching App, Sidebar, or hooks. Detection via sheet name matching.

## Known Constraints

- **Power Query refresh is NOT possible from Office.js.** Extensively researched — `refreshAllDataConnections()` is preview-only and unreliable. `Excel.Query.refresh()` exists only in beta CDN. Office.js cannot call VBA or access COM. Workarounds: VBA companion macro, "Refresh on Open" setting, or server-side data pipeline.
- **Vite 8 peer dep conflict:** `.npmrc` sets `legacy-peer-deps=true` for `@tailwindcss/vite` compatibility.
- **Recharts TypeScript:** Tooltip `formatter` prop types need `(v: any)` with `Number(v)` wrapping.
- **Sheet layout is owned by HEB's Power Query setup, not us.** Changes to parsing logic must match the actual sheet format.

## Tech Stack

React 19, TypeScript 5.9 (strict), Vite 8, Tailwind CSS 4, Recharts 3.8, lucide-react icons, Office.js (Excel APIs), clsx, tailwind-merge, class-variance-authority

## Notes

- `.npmrc` sets `legacy-peer-deps=true` for Vite 8 peer dependency compatibility
- No React Router — page switching is local state (`useState`), pages are defined in the workbook registry
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
