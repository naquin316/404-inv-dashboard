---
name: dev
description: Start the Vite development server for the Excel Office Add-in
disable-model-invocation: true
---

# Start Development Server

Run the Vite dev server for the 404 Inventory Dashboard Excel Add-in.

## Steps

1. Run the dev server:

```bash
npm run dev
```

2. The dev server starts at `https://localhost:5173` (Vite default with HTTPS for Office Add-in compatibility).

3. **To sideload the add-in in Excel:**
   - Open Excel on the web or desktop
   - Go to **Insert → Office Add-ins → Upload My Add-in**
   - Upload the `manifest.xml` file from the project root
   - The taskpane will load from the local dev server

4. The dashboard reads from the active Excel workbook's "Flow Cuts" and "Final Short Tracker" sheets.

5. Hot Module Replacement (HMR) is enabled — edits to React components will reflect immediately in the taskpane.
