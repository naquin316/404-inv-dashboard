---
name: add-component
description: Scaffold a new dashboard tab component following existing FlowCutsTab/FinalShortsTab patterns
disable-model-invocation: true
---

# Add Dashboard Component

Create a new dashboard tab component following the established patterns in this project.

## Arguments

The user should provide:
- **Component name** (e.g., "ReceivingTab", "DamageTracker")
- **Data source** — which Excel sheet it reads from

## Steps

1. **Define types** in `src/types/index.ts`:
   - Add interfaces for the new data shape
   - Follow existing naming conventions (`FlowCutsData`, `ShortRecord`)

2. **Create the component** at `src/components/dashboard/{ComponentName}.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { cn } from '@/lib/utils';
import { fmt$, fmtN, fmtPct } from '@/lib/utils';

interface {ComponentName}Props {
  data: {DataType};
}

export function {ComponentName}({ data }: {ComponentName}Props) {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard title="Metric" value={fmtN(data.metric)} />
      </div>

      {/* Charts and tables */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content here */}
        </CardContent>
      </Card>
    </div>
  );
}
```

3. **Conventions to follow:**
   - Use `cn()` for conditional Tailwind classes
   - Use formatting helpers from `@/lib/utils` (`fmt$`, `fmtN`, `fmtPct`, `fmtDate`)
   - Use `KpiCard` for top-level metrics
   - Use `Card`/`CardHeader`/`CardContent` for sections
   - Use Recharts (`BarChart`, `LineChart`, `PieChart`) for visualizations
   - Use Tailwind dark theme classes (colors defined in `src/index.css` `@theme` block)
   - Component accepts data as props — does NOT fetch data itself

4. **Wire up the tab** in `App.tsx`:
   - Add a new tab option to the tab state
   - Render the component when that tab is active
   - Pass data from `useExcelData`

5. **Wire up in dialog** in `DialogApp.tsx`:
   - Add the same tab and pass data from message handler

6. **Add Excel parsing** in `useExcelData` hook if reading from a new sheet.

7. **Run build check** to verify no type errors:
```bash
npm run build
```
