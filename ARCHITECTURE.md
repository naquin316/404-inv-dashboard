# 404 INV Dashboard — Architecture Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Excel Desktop (HEB)                      │
│  ┌──────────────┐   ┌────────────────────────────────────┐  │
│  │  Workbook     │   │  Office.js Add-In (Task Pane)      │  │
│  │              │   │                                    │  │
│  │  Flow Cuts   │──▶│  React App                         │  │
│  │  Sheet       │   │  ├── useExcelData hook              │  │
│  │              │   │  │   └── Excel.run() reads sheets   │  │
│  │  Final Short │──▶│  ├── FlowCutsTab (Recharts)        │  │
│  │  Tracker     │   │  ├── FinalShortsTab (Recharts)     │  │
│  │              │   │  ├── KPI Cards                     │  │
│  │  (Power Query│   │  └── StatusBar (commit SHA, etc.)  │  │
│  │   refreshes  │   └────────────┬───────────────────────┘  │
│  │   data)      │                │                           │
│  └──────────────┘                │ displayDialogAsync()      │
│                                  ▼                           │
│                    ┌──────────────────────┐                  │
│                    │  Pop-Out Dialog       │                  │
│                    │  (Full-screen view)   │                  │
│                    │  messageParent/Child  │                  │
│                    └──────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Hosted on
                           ▼
              ┌──────────────────────┐
              │  Cloudflare Pages    │
              │  CDN + Static Host   │
              │  404-inv-dashboard   │
              │  .pages.dev          │
              └──────────┬───────────┘
                         │
                         │ Deployed by
                         ▼
              ┌──────────────────────┐
              │  GitHub Actions      │
              │  push main →         │
              │  npm ci → build →    │
              │  wrangler deploy     │
              └──────────┬───────────┘
                         │
                         │ Source
                         ▼
              ┌──────────────────────┐
              │  GitHub Repo         │
              │  naquin316/          │
              │  404-inv-dashboard   │
              └──────────────────────┘
```

## Data Flow

### Reading Excel Data (useExcelData.ts)

The entire data pipeline is in `src/hooks/useExcelData.ts`. It uses the Office.js `Excel.run()` API to read sheets from the open workbook.

```
Excel Workbook
    │
    ├── Sheet: "Flow Cuts" (or similar name match)
    │   │
    │   └── getUsedRange().load('values')
    │       │
    │       ├── findVal() scans for known labels
    │       │   ├── "TOTAL ITEMS" → totalItems
    │       │   ├── "TOTAL SKUs" → totalSKUs
    │       │   ├── "TOTAL COST" → totalCost
    │       │   └── "TRUE CUTS" → trueCuts
    │       │
    │       ├── "TOP COST DRIVERS" section → TopDriver[]
    │       │   (scans rows after header for rank/pick/desc/cost/qty/total)
    │       │
    │       ├── "TOP 5 SELECTORS" section → TopSelector[]
    │       │   (name, qty, pct)
    │       │
    │       ├── "DAILY BREAKDOWN" section → DailyEntry[]
    │       │   (date, items, skus, cost, trueCuts per day)
    │       │
    │       └── TIME_BUCKET detection → timeline
    │           (half-hour buckets with qty and cost)
    │
    └── Sheet: "Final Short Tracker" (or match)
        │
        └── getUsedRange().load('values')
            │
            └── Row 1 = headers, remaining rows = ShortRecord[]
                (RPT_DT, PRODUCT, DESCRIPTION, PARTNER,
                 FINAL_SHORTS, COST, JobTitle, etc.)
```

### Auto-Refresh Cycle

The hook runs a `setInterval` every 30 seconds that re-reads the sheets. This means if the underlying data changes (e.g., user manually refreshes Power Query), the dashboard picks it up within 30 seconds automatically.

### Dialog Communication

```
TaskPane (App.tsx)
    │
    ├── openDialog() → Office.context.ui.displayDialogAsync(dialogUrl)
    │
    ├── Dialog sends "ready" message via messageParent()
    │
    ├── TaskPane responds with data via dialog.messageChild(JSON.stringify(data))
    │
    └── Dialog receives data, renders FlowCutsTab + FinalShortsTab
        with wide=true for full-screen layout
```

## Build Pipeline

### Vite Configuration

Multi-page build with two HTML entry points:

```typescript
build: {
  rollupOptions: {
    input: {
      main: 'index.html',      // → /index.html (taskpane)
      dialog: 'dialog.html',   // → /dialog.html (pop-out)
    },
  },
}
```

Build-time constants injected via `define`:
- `__COMMIT_SHA__` — git short hash or `CF_PAGES_COMMIT_SHA` fallback
- `__BUILD_TIME__` — ISO timestamp

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on: push (main branch)
steps:
  1. checkout
  2. setup-node (v20)
  3. npm ci (--legacy-peer-deps via .npmrc)
  4. npm run build (tsc + vite build)
  5. cloudflare/wrangler-action@v3
     → deploys dist/ to Cloudflare Pages
```

Secrets required in GitHub repo:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### URL Routing

The manifest references `/taskpane.html` but Vite builds to `/index.html`. A `public/_redirects` file handles this:

```
/taskpane.html / 200
```

## Component Architecture

```
App.tsx (TaskPane)
├── StatusBar
│   ├── Title + Commit SHA badge (links to GitHub commit)
│   ├── Status dot (ok/loading/err/waiting)
│   ├── Pop Out button → useDialog hook
│   └── Refresh button → useExcelData.loadAllData()
├── Tab Switcher (Flow Cuts | Final Shorts)
├── FlowCutsTab (when active)
│   ├── KpiCard × 4 (items, SKUs, cost, true cuts)
│   ├── Card: Top Cost Drivers (table + horizontal BarChart)
│   ├── Card: Top 5 Selectors (table)
│   ├── Card: Daily Breakdown (ComposedChart — bars + line)
│   └── Card: Timeline (ComposedChart — bars + line by time bucket)
└── FinalShortsTab (when active)
    ├── KpiCard × 3 (total shorts, total cost, unique products)
    ├── Card: By Team (BarChart)
    ├── Card: By Partner (horizontal BarChart)
    └── Card: Data Table (searchable, scrollable)

DialogApp.tsx (Pop-Out)
├── StatusBar (isTaskPane=false, has Print button)
├── FlowCutsTab (wide=true → 4-col KPI grid, side-by-side charts)
└── FinalShortsTab (wide=true)
```

## Styling System

Tailwind CSS 4 with custom `@theme` block in `src/index.css`:

```css
@theme {
  --color-background: #0f1117;
  --color-card: #1a1d27;
  --color-card-hover: #22263a;
  --color-border: #2a2e3f;
  --color-text: #e4e4e7;
  --color-text-muted: #a1a1aa;
  --color-accent-blue: #3b82f6;
  --color-accent-purple: #8b5cf6;
  --color-accent-green: #10b981;
  --color-accent-amber: #f59e0b;
  --color-accent-red: #ef4444;
  --color-accent-cyan: #06b6d4;
}
```

Dark theme by default. All colors referenced via Tailwind utilities like `bg-card`, `text-accent-blue`, etc.

## Type System

All data types defined in `src/types/index.ts`:
- `FlowCutsData` — full Flow Cuts sheet parsed into structured data
- `TopDriver` — individual cost driver row
- `TopSelector` — individual selector row
- `DailyEntry` — one day of the daily breakdown
- `ShortRecord` — one row from Final Short Tracker
- `StatusState` — 'ok' | 'loading' | 'err' | 'waiting'

## Excel Serial Date Handling

Excel stores dates as serial numbers (days since 1/1/1900) and times as fractions. The `useExcelData` hook handles this:
- Full dates: `new Date((serial - 25569) * 86400000)` converts to JS Date
- Time extraction: `serial % 1` gets the fractional part, multiply by `24 * 60` for minutes
- Time buckets use 30-minute intervals for the timeline chart

## Security Notes

- The add-in runs in a sandboxed iframe within Excel
- Office.js has no access to VBA, COM, or the file system
- The manifest must be sideloaded (not from AppSource)
- Cloudflare Pages serves over HTTPS with automatic certificates
- GitHub Actions secrets store Cloudflare credentials
