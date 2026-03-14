# 404 INV Dashboard — Roadmap & Vision

## Current State (v1.0)

The dashboard is live and functional as a React-based Office.js Excel Add-In:
- Reads Flow Cuts and Final Short Tracker sheets from the open workbook
- Renders KPIs, Recharts visualizations, searchable tables
- Pop-out dialog for full-screen viewing and printing
- CI/CD via GitHub Actions → Cloudflare Pages (~40s deploys)
- Commit SHA displayed in header for build verification
- 30-second auto-reload of sheet data

**What's missing:** The add-in can display data but cannot trigger a refresh of the underlying Power Query connections. Users must manually refresh in Excel (Data tab → Refresh All) before the dashboard shows updated numbers.

---

## Near-Term (v1.x — Incremental Improvements)

### VBA Companion Macro
Add a VBA module to the workbook template that provides a one-click "Refresh & View" experience. The macro calls `ActiveWorkbook.RefreshAll` with `BackgroundQuery = False` (synchronous), waits for completion, then the add-in's 30-second poll picks up the fresh data. This is a pragmatic bridge until server-side refresh exists.

### Print-Optimized Layouts
The pop-out dialog supports printing but the layout could be refined — dedicated print CSS with page breaks between sections, header/footer with date and build info, landscape orientation for charts.

### Additional KPIs & Metrics
The sheet data likely has more signal than we're currently surfacing. Potential additions: week-over-week trends, rolling averages, worst-day highlights, selector leaderboards, partner cost rankings.

### Error Handling & Offline Resilience
Better error states when sheets don't match expected format, graceful degradation when cells are empty or renamed, toast notifications for load failures.

---

## Mid-Term (v2.0 — Server-Side Data Layer)

This is the biggest architectural leap: adding a Cloudflare Workers backend with D1 database.

### Cloudflare Worker API
A Worker that serves as the data backend:
- `GET /api/flow-cuts?week=current` — returns structured Flow Cuts data
- `GET /api/shorts?date=2026-03-14` — returns Final Shorts data
- `GET /api/history?range=30d` — returns historical trends
- `POST /api/upload` — accepts data snapshots from Excel or automation

### D1 Historical Database
Store every day's data in Cloudflare D1 (SQLite at the edge):
- `flow_cuts_daily` — daily aggregates over time
- `flow_cuts_drivers` — top drivers per week
- `shorts_records` — individual short events with dates
- `shift_notes` — team annotations and handoff notes

This unlocks **historical trending** — "how do this week's flow cuts compare to the same week last year?" — which is impossible with the current single-workbook approach.

### Dual Data Mode
The add-in would support two modes:
1. **Excel Mode** (current) — reads from the open workbook via Office.js
2. **API Mode** (new) — fetches from the Cloudflare Worker API

Toggle between them in the UI. API mode works even without a workbook open (as a standalone web app at the Cloudflare Pages URL).

### Automated Data Pipeline
Replace the manual Power Query refresh with a scheduled Cloudflare Worker (Cron Trigger) that fetches data from the upstream source on a schedule and stores it in D1. The "what feeds Power Query" question needs to be answered to build this — it could be a SQL database, an API, a SharePoint list, or something else inside HEB's systems.

---

## Long-Term (v3.0 — Platform Features)

### Write-Back Forms
Add forms directly in the add-in for:
- **Shift handoff notes** — outgoing shift leaves context for incoming shift
- **Issue tagging** — mark specific shorts with root cause codes
- **Action items** — assign follow-ups to team members
These write to D1 via the Worker API and are visible to the next person who opens the dashboard.

### Push Alerts (Workers + Email/Slack)
Cloudflare Workers can send notifications when thresholds are breached:
- "Flow cuts cost exceeded $X today"
- "Partner Y has 3x normal shorts this week"
- Delivered via email (Cloudflare Email Workers) or Slack webhook

### PDF Report Generation
Scheduled Workers that generate a weekly PDF summary:
- Cover page with week number, date range, key KPIs
- Charts rendered server-side (e.g., via Puppeteer on Cloudflare Containers or SVG generation)
- Emailed to distribution list automatically

### Cross-Site Aggregation
If other HEB DCs adopt the same dashboard, a central Worker could aggregate data across sites:
- Compare DC 404 vs DC 405 flow cuts
- Identify system-wide trends
- Corporate-level rollup dashboard

### Custom Excel Functions (LAMBDA / Office.js Custom Functions)
Register custom functions like `=DASHBOARD.FLOWCUTS.COST("2026-W11")` that fetch data from the Worker API directly into cells. This brings the server-side data back into Excel formulas for teams that prefer working in the grid.

### Real-Time Updates via Server-Sent Events
Instead of 30-second polling, the add-in could open an SSE connection to the Worker. When new data arrives in D1, the Worker pushes it to all connected clients instantly.

---

## Technical Debt & Cleanup

- **TypeScript strictness:** Some `any` types in Recharts Tooltip formatters should be properly typed once Recharts ships better TS support
- **Testing:** No test suite currently. Add Vitest for unit tests on data parsing logic (useExcelData), component rendering tests with React Testing Library
- **Accessibility:** Add ARIA labels to charts, keyboard navigation for tabs, screen reader support for KPI cards
- **Bundle analysis:** Run `vite-bundle-visualizer` to identify optimization opportunities (Recharts is the heaviest dependency)
- **Manifest migration:** XML manifests are legacy. Microsoft is moving to JSON-based unified manifests. Migrate when the format stabilizes.

---

## Infrastructure Credentials Reference

For any future Claude session working on this project:

| Resource | Value |
|----------|-------|
| GitHub Repo | `naquin316/404-inv-dashboard` |
| Cloudflare Project | `404-inv-dashboard` |
| Cloudflare Account ID | `5d740087456dd563977be1dab939712e` |
| Live URL | `https://404-inv-dashboard.pages.dev` |
| Manifest UUID | `1c3b57fd-3808-47cc-85ba-c59edf066bda` |
| CI/CD | GitHub Actions → Cloudflare Pages |
| Node Version | 20 |
| Package Manager | npm with `legacy-peer-deps=true` |
