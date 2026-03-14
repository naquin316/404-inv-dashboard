---
name: excel-data
description: Reference patterns for Office.js Excel data fetching, sheet parsing, useExcelData hook conventions, serial date handling, and dialog communication
---

# Excel / Office.js Data Patterns

This skill provides reference knowledge for working with Excel data in this project. Auto-triggers when working with Excel.run(), sheet parsing, data hooks, or Office.js APIs.

## Core Pattern: Excel.run()

All Excel interactions must happen inside an `Excel.run()` callback. The context (`ctx`) provides access to worksheets, ranges, and values.

```typescript
await Excel.run(async (ctx) => {
  const sheet = ctx.workbook.worksheets.getItem("Sheet Name");
  const range = sheet.getUsedRange();
  range.load("values");
  await ctx.sync();
  // range.values is now a 2D array: string[][]
  const rows = range.values;
});
```

## Key Rules

- **Always call `ctx.sync()`** after loading properties — values aren't available until sync completes.
- **Load only what you need** — use `range.load("values")` not `range.load()`.
- **Handle missing sheets gracefully** — wrap `getItem()` in try/catch or use `getItemOrNullObject()`.
- **Office.js is async** — all `Excel.run()` calls return Promises.

## Sheet Parsing: Flow Cuts

The `useExcelData` hook parses the Flow Cuts sheet by scanning for known labels using a `findVal()` helper:

```
Excel Workbook → Sheet: "Flow Cuts" (or similar name match)
  → getUsedRange().load('values')
    → findVal() scans for known labels:
        "TOTAL ITEMS" → totalItems
        "TOTAL SKUs"  → totalSKUs
        "TOTAL COST"  → totalCost
        "TRUE CUTS"   → trueCuts
    → "TOP COST DRIVERS" section → TopDriver[]
        (scans rows after header for rank/pick/desc/cost/qty/total)
    → "TOP 5 SELECTORS" section → TopSelector[]
        (name, qty, pct)
    → "DAILY BREAKDOWN" section → DailyEntry[]
        (date, items, skus, cost, trueCuts per day)
    → TIME_BUCKET detection → timeline
        (half-hour buckets with qty and cost)
```

## Sheet Parsing: Final Short Tracker

Flat table parsing:
```
Sheet: "Final Short Tracker" (or match)
  → getUsedRange().load('values')
    → Row 1 = headers, remaining rows = ShortRecord[]
    → Columns: RPT_DT, PRODUCT, DESCRIPTION, PARTNER,
               FINAL_SHORTS, COST, JobTitle, etc.
```

## Excel Serial Date Handling

Excel stores dates as serial numbers (days since 1/1/1900) and times as fractions:

```typescript
// Convert serial to JS Date
const jsDate = new Date((serial - 25569) * 86400000);

// Extract time from serial (fractional part)
const fractional = serial % 1;
const totalMinutes = fractional * 24 * 60;
const hours = Math.floor(totalMinutes / 60);
const minutes = Math.floor(totalMinutes % 60);
```

Time buckets use 30-minute intervals for the timeline chart.

## useExcelData Hook Conventions

The `useExcelData` hook (`src/hooks/useExcelData.ts`) is the single data layer:

- Initializes Office.js via `Office.onReady()`
- Parses the "Flow Cuts" sheet into `FlowCutsData`
- Parses the "Final Short Tracker" sheet into `ShortRecord[]`
- Auto-refreshes every 30 seconds via `setInterval`
- Exposes `status` (loading/ready/error) and `error` state
- Returns typed data objects matching interfaces in `src/types/index.ts`
- Returns `loadAllData()` for manual refresh trigger

## Dialog Data Flow

The dialog window does NOT read Excel directly. Data flows:

```
TaskPane (App.tsx)
  → openDialog() → Office.context.ui.displayDialogAsync(dialogUrl)
  → Dialog sends "ready" message via messageParent()
  → TaskPane responds with data via dialog.messageChild(JSON.stringify(data))
  → Dialog receives via Office.EventType.DialogParentMessageReceived handler
  → Dialog renders FlowCutsTab + FinalShortsTab with wide=true
```

## Adding a New Sheet Parser

1. Add new TypeScript interfaces to `src/types/index.ts`
2. Add a parsing function in `useExcelData` following the existing pattern:
   - Get the sheet by name (use name matching, not exact — sheets may vary)
   - Load the used range values
   - Map rows to typed objects (skip header row for flat tables, use label scanning for structured sheets)
3. Add the new data to the hook's return value
4. Update both `App.tsx` and `DialogApp.tsx` to pass the new data
5. Update dialog message payload in `useDialog`

## Known Constraint: Power Query Refresh

**Office.js CANNOT trigger Power Query refreshes.** This has been extensively researched:
- `refreshAllDataConnections()` — preview API only, threw "not a function" in testing
- `Excel.Query.refresh()` — only in `Excel-js-preview` CDN, not stable builds
- Office.js is sandboxed — cannot call VBA, cannot access COM, cannot simulate keyboard shortcuts
- The async `context.sync()` model means even if refresh triggers, you can't wait for completion

**Workarounds:**
1. VBA companion macro with manual trigger
2. Workbook "Refresh on Open" setting
3. Server-side data pipeline (Cloudflare Worker fetches data directly, stores in D1)
