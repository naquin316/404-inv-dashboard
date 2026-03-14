# 404 INV Dashboard — Project Context

> **Owner:** Ryan (handlanedesigns@gmail.com)
> **Role:** HEB Warehouse 404 — Inventory Operations
> **GitHub:** [naquin316/404-inv-dashboard](https://github.com/naquin316/404-inv-dashboard)
> **Live URL:** [404-inv-dashboard.pages.dev](https://404-inv-dashboard.pages.dev)
> **Cloudflare Account ID:** 5d740087456dd563977be1dab939712e

---

## What This Is

An **Office.js Excel Add-In** that turns existing Excel workbooks at HEB Warehouse 404 into a live operational dashboard. It reads two key spreadsheets — **Flow Cuts** and **Final Short Tracker** — and renders KPIs, charts, tables, and trend visualizations directly inside Excel's task pane. There's also a pop-out dialog for full-screen viewing and printing.

This is NOT a standalone web app. It runs inside Excel as a side panel add-in and reads data from whatever workbook is currently open.

## Why It Exists

Ryan manages inventory operations at HEB DC 404. Every week the team tracks flow cuts (items that couldn't be fulfilled) and final shorts (end-of-process shortages). The raw data lives in Excel workbooks with Power Query connections pulling from HEB systems. Before this dashboard, interpreting the data meant scrolling through rows and mentally aggregating. Now it's visual, instant, and shareable.

## How It Got Here (The Journey)

This project evolved through several phases across multiple sessions:

1. **Phase 1 — Standalone HTML + SheetJS:** Started as a simple drag-and-drop HTML file. User drops an Excel file, SheetJS parses it, renders tables and charts. Worked but was disconnected from Excel.

2. **Phase 2 — Office.js Add-In (Plain HTML):** Rewrote as a proper Office.js add-in using `taskpane.html` and `dialog.html`. Now reads live data from the open workbook via `Excel.run()`. Deployed to Cloudflare Pages with a sideloaded manifest.

3. **Phase 3 — React + Recharts + Tailwind:** The current version. Full React app with TypeScript, Recharts for data visualization, Tailwind for styling. Multi-page Vite build (taskpane + pop-out dialog). GitHub Actions CI/CD auto-deploys to Cloudflare Pages on push to `main`.

Each phase kept the same core purpose — read the Excel data and make it visual — but expanded what's possible.

## How Ryan Thinks About This

Ryan is operations-first, not a developer by trade, but deeply technical and always pushing for "what's next." Key mindset points:

- **The Excel workbook is the source of truth.** The team lives in Excel. Any solution must work *inside* Excel, not ask people to switch tools.
- **Visual > tabular.** Charts, KPIs, color-coded status — the dashboard should tell the story at a glance.
- **Automation matters.** CI/CD was a priority from day one. Push code, it deploys. No manual steps.
- **Iterate fast, ship often.** The commit SHA displays right in the header so Ryan can always verify which build is running.
- **Data refresh is the holy grail.** The one persistent gap: Office.js cannot reliably trigger Power Query refreshes. This has been researched extensively (including a full deep-research report on the topic). The conclusion: Office.js `refreshAllDataConnections()` is preview-only and unreliable for Power Query sources. VBA companion macros or server-side data pipelines are the viable paths forward.

## The Two Data Sheets

### Flow Cuts Sheet
Contains weekly flow cut data with these sections:
- **Header area:** Title, week number, date range, period
- **Summary metrics:** Total items, SKUs, cost, true cuts
- **Top Cost Drivers:** Top 10 items by cost impact (pick number, description, case cost, qty, total)
- **Top 5 Selectors:** Who's selecting the most cuts
- **Daily Breakdown:** Day-by-day items, SKUs, cost, true cuts
- **Timeline:** Half-hour time buckets showing qty and cost distribution

### Final Short Tracker Sheet
A flat table with columns like RPT_DT, PRODUCT, DESCRIPTION, PARTNER, FINAL_SHORTS, COST, JobTitle. Each row is one short event. The dashboard aggregates by team (JobTitle) and partner, with a searchable data table.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 19 + TypeScript | Component architecture, type safety, ecosystem |
| Build | Vite 8 | Fast builds, multi-page support, HMR |
| Charts | Recharts 3.8 | React-native charting, composable, good defaults |
| Styling | Tailwind CSS 4 | Utility-first, dark theme via `@theme` block |
| Office Integration | Office.js | `Excel.run()`, dialog API, message passing |
| Hosting | Cloudflare Pages | Global CDN, instant deploys, free tier |
| CI/CD | GitHub Actions | Push to main → build → deploy (~40 seconds) |
| Utilities | clsx, tailwind-merge, class-variance-authority, lucide-react |

## Key Files

```
inv-dashboard-react/
├── index.html              # Taskpane entry (loads Office.js)
├── dialog.html             # Pop-out dialog entry
├── vite.config.ts          # Vite config (React, Tailwind, multi-page, commit SHA injection)
├── .npmrc                  # legacy-peer-deps=true (Vite 8 compat)
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions → Cloudflare Pages
├── public/
│   ├── _redirects           # /taskpane.html → / (manifest compat)
│   ├── icon-*.png           # Add-in icons (16, 32, 80, 128)
│   └── 404_INV_Dashboard_AddIn_manifest.xml
├── src/
│   ├── App.tsx              # Main taskpane app (tab switching, init)
│   ├── DialogApp.tsx        # Pop-out dialog (receives data via messages)
│   ├── main.tsx             # Taskpane entry point
│   ├── dialog-main.tsx      # Dialog entry point
│   ├── index.css            # Tailwind + custom dark theme
│   ├── globals.d.ts         # TypeScript globals (__COMMIT_SHA__, etc.)
│   ├── types/index.ts       # All TypeScript interfaces
│   ├── lib/utils.ts         # cn(), fmt$(), fmtN(), fmtPct(), fmtDate()
│   ├── hooks/
│   │   ├── useExcelData.ts  # Core data loading — reads sheets via Excel.run()
│   │   └── useDialog.ts     # Pop-out dialog management
│   └── components/
│       ├── ui/
│       │   ├── Card.tsx      # Generic card wrapper
│       │   ├── KpiCard.tsx   # Color-coded KPI card
│       │   └── StatusBar.tsx # Header with commit SHA, status, controls
│       └── dashboard/
│           ├── FlowCutsTab.tsx     # Flow Cuts charts + tables
│           └── FinalShortsTab.tsx  # Final Shorts charts + tables
```

## The Manifest

The add-in uses an XML manifest sideloaded into Excel:
- **UUID:** `1c3b57fd-3808-47cc-85ba-c59edf066bda`
- **Version:** `1.0.0.0`
- **Taskpane URL:** `https://404-inv-dashboard.pages.dev/taskpane.html` (redirects to `/`)
- **Dialog URL:** `https://404-inv-dashboard.pages.dev/dialog.html`

## Known Limitations & Active Problems

1. **Power Query Refresh:** Office.js cannot trigger Power Query refreshes reliably. `refreshAllDataConnections()` is preview-only and threw "not a function" in testing. The `Excel.Query.refresh()` method is in `Excel-js-preview` only, not available in stable builds on Semi-Annual Enterprise Channel. Workarounds: VBA companion macro, "Refresh on Open" workbook setting, or moving data pipeline server-side.

2. **Peer Dependency Conflicts:** Vite 8 + `@tailwindcss/vite` has peer dep conflicts. Solved with `.npmrc` containing `legacy-peer-deps=true`.

3. **Recharts TypeScript:** Tooltip `formatter` prop types are finicky. Solved by using `(v: any)` and `Number(v)` wrapping.

## Deployment

Pushing to `main` triggers automatic deployment:
```
git push origin main
→ GitHub Actions (Node 20, npm ci, npm run build)
→ cloudflare/wrangler-action deploys dist/ to Cloudflare Pages
→ Live in ~40 seconds
```

The status bar in the dashboard shows the current commit SHA as a clickable link to the GitHub commit.

## Where This Is Going

See ROADMAP.md for the full vision, but the big themes are:
- **Server-side data layer** (Cloudflare Workers + D1) to decouple from Power Query
- **Write-back forms** for shift handoff notes and team annotations
- **Cross-site aggregation** if other DCs adopt
- **Push notifications** via Workers for threshold alerts
- **PDF/email reports** auto-generated from dashboard data
