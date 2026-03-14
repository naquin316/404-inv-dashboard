# 404 INV Dashboard — Decision Log

This document captures the key decisions made during development, the alternatives considered, and why we went the direction we did. Read this to understand the reasoning behind the architecture.

---

## Decision 1: Office.js Add-In vs. Standalone Web App

**Chosen:** Office.js Add-In that runs inside Excel's task pane

**Alternatives considered:**
- Standalone HTML page with drag-and-drop file upload (SheetJS)
- Power BI embedded dashboard
- Separate web app with file upload API

**Why:** The team lives in Excel. Asking them to open a separate tool and upload files adds friction and breaks the workflow. An add-in reads the live workbook data directly — no export, no upload, no context switching. The standalone SheetJS version was actually built first (Phase 1) and worked, but the workflow of "save file, open browser, drag file" was too many steps for daily use.

---

## Decision 2: React + TypeScript Over Plain HTML

**Chosen:** React 19 + TypeScript via Vite

**Alternatives considered:**
- Keep the plain HTML/vanilla JS add-in (which was working)
- Vue.js or Svelte

**Why:** The plain HTML version worked but was hitting a wall on maintainability. Adding charts, tabs, and interactive features to a single HTML file was becoming unwieldy. React gives us component composition (KpiCard, Card, StatusBar are all reusable), hooks for data management (useExcelData, useDialog), and TypeScript catches bugs before they ship. The "if we make it React we open the door to a ton of possibilities" conversation was the turning point. React was chosen over Vue/Svelte because the charting ecosystem (Recharts, nivo, shadcn) is deepest in React.

---

## Decision 3: Recharts Over Other Charting Libraries

**Chosen:** Recharts 3.8

**Alternatives considered:**
- shadcn/ui charts (built on Recharts anyway)
- nivo (more chart types, D3-based)
- Plotly.js (full-featured but heavy)
- Chart.js (canvas-based, less React-native)
- visx (low-level D3 + React primitives)

**Why:** We evaluated the awesome-dataviz list extensively. shadcn charts would have required their full component system. nivo was the runner-up — great variety and accessibility — but Recharts won on simplicity: it's declarative, composable with JSX, lightweight, and covers the chart types we need (Bar, ComposedChart with Line overlay, horizontal bars). The API is intuitive enough that adding new chart types doesn't require deep D3 knowledge.

---

## Decision 4: Tailwind CSS 4 for Styling

**Chosen:** Tailwind CSS 4 via `@tailwindcss/vite` plugin

**Why:** Utility-first CSS means no separate stylesheet management. The custom `@theme` block gives us a consistent dark color palette across every component. Tailwind 4 specifically because it works as a Vite plugin — no PostCSS config, no `tailwind.config.js`. The tradeoff: Vite 8 + `@tailwindcss/vite` has a peer dependency conflict. Solved permanently with `.npmrc` setting `legacy-peer-deps=true`.

---

## Decision 5: Cloudflare Pages Over Other Hosting

**Chosen:** Cloudflare Pages (static hosting)

**Alternatives considered:**
- GitHub Pages
- Vercel
- Netlify
- Azure Static Web Apps (HEB is Microsoft shop)

**Why:** Already had Cloudflare account and familiarity with Wrangler. Free tier is generous. Global CDN means fast loads from the Excel add-in. Most importantly: Cloudflare Pages + Workers + D1 gives us a natural path to server-side features later (data API, scheduled jobs, historical storage) without changing providers. GitHub Pages was considered but doesn't support `_redirects` and has slower deploys. Azure would make sense in an HEB IT context but adds complexity for a team-level tool.

---

## Decision 6: GitHub Actions CI/CD

**Chosen:** GitHub Actions with `cloudflare/wrangler-action@v3`

**Why:** Push to `main`, deployed in ~40 seconds. No manual build steps, no FTP, no remembering to run commands. The workflow is: edit code → commit → push → it's live. The commit SHA shows in the dashboard header so we always know which build is running. This was a priority from the start — Ryan wanted the "push and it deploys" experience.

**Gotcha encountered:** The GitHub PAT initially didn't have the `workflow` scope, so the workflow file had to be uploaded manually through the GitHub web UI. Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) also had to be added manually because the PAT didn't have secrets write scope.

---

## Decision 7: Multi-Page Vite Build (Taskpane + Dialog)

**Chosen:** Vite `rollupOptions.input` with two HTML entry points

**Why:** Office.js requires separate URLs for the taskpane and pop-out dialog. The dialog runs in its own window with its own DOM. Rather than building two separate apps, Vite's multi-page support lets us share all components and hooks between both entry points while producing separate bundles. The `_redirects` file maps `/taskpane.html → /` because the manifest expects that path but Vite outputs `index.html`.

---

## Decision 8: Build-Time Commit SHA Injection

**Chosen:** Vite `define` with `execSync('git rev-parse --short HEAD')`

**Alternatives considered:**
- Runtime API call to GitHub
- Environment variable at deploy time only
- Manual version bumping

**Why:** The SHA displays as a clickable badge in the status bar, linking to the exact commit on GitHub. This makes debugging trivial — "what build are you running?" has an instant, clickable answer. The `execSync` approach works locally and in CI. Cloudflare Pages also sets `CF_PAGES_COMMIT_SHA` as a fallback.

---

## Decision 9: 30-Second Auto-Reload Instead of Office.js Events

**Chosen:** `setInterval` every 30 seconds to re-read sheet data

**Alternatives considered:**
- `worksheet.onChanged` event handler
- Manual refresh only (button click)
- `workbook.onSelectionChanged` as a proxy

**Why:** Office.js does have `onChanged` events, but they fire on every cell edit — which is noisy and can cause performance issues in large workbooks. A 30-second poll is simple, predictable, and low-overhead. Combined with the manual Refresh button for immediate updates, it provides a good balance. If the user refreshes Power Query (via VBA or manually), the dashboard picks up new data within 30 seconds without any explicit action.

---

## Decision 10: Not Pursuing Office.js Data Refresh (For Now)

**Chosen:** Accept that Office.js cannot trigger Power Query refreshes

**Research done:**
- Tested `workbook.refreshAllDataConnections()` — threw "not a function" error
- Tested `table.refresh()` — doesn't exist on the Table class
- `isSetSupported('ExcelApi', '1.17')` returned true but the method still failed
- Commissioned deep research on Office.js Power Query capabilities for Version 2508

**Findings:**
- `refreshAllDataConnections()` only works reliably for Power BI and SharePoint data sources
- `Excel.Query.refresh()` exists only in `Excel-js-preview` (beta CDN), not stable builds
- Office.js is sandboxed — it cannot call VBA, cannot access COM, cannot simulate keyboard shortcuts
- The async `context.sync()` model means even if refresh triggers, you can't wait for completion
- Microsoft's official stance is "by design" — they're prioritizing cloud-authenticated sources

**Viable workarounds identified:**
1. VBA companion macro with manual trigger (user clicks separate button)
2. Workbook "Refresh on Open" setting (data refreshes when file opens)
3. Server-side data pipeline (Cloudflare Worker fetches data directly, stores in D1)

**Why we paused:** The VBA approach works today but adds a second button. The server-side approach is the real solution but requires understanding what data sources Power Query is pulling from and replicating that logic. This is the next major evolution of the project.

---

## Decision 11: Dark Theme by Default

**Chosen:** Dark color scheme as the only theme

**Why:** The dashboard is a secondary panel inside Excel, often viewed alongside bright white spreadsheets. A dark theme creates visual separation — you glance at the panel and immediately know you're looking at the dashboard, not the spreadsheet. It also reduces eye strain during long shifts. The gradient accents (blue, purple, green, amber) pop against the dark background for quick scanning.
