# H-E-B Operations Command Center — Brand & Style Guide

Reusable design system for H-E-B warehouse operations dashboards. Dark industrial theme with sharp geometry, high-density data display, and the official H-E-B color palette.

---

## Color Palette

### Core

| Token | Hex | Usage |
|---|---|---|
| Background | `#1a1a1a` | Page background |
| Card | `#242424` | Card/panel surfaces |
| Card Hover | `#2e2e2e` | Hover states on cards/rows |
| Sidebar | `#141414` | Sidebar navigation background |
| Border | `rgba(220,220,220,0.12)` | 1px borders throughout |

### Text

| Token | Hex | Usage |
|---|---|---|
| Primary | `#e8eaed` | Body text, headings |
| Secondary | `#97a3ae` | Labels, axis ticks, nav items (Digital Light) |
| Muted | `#666c80` | Timestamps, subtle metadata |

### Accents

| Token | Hex | Usage |
|---|---|---|
| H-E-B Red | `#dc291e` | Primary brand accent — KPI stripes, cost lines, Refresh button, branding text |
| Teal | `#00b2a9` | Secondary accent — section headers, chart bars, active nav indicators, links |
| Green | `#34d399` | Status: OK/connected |
| Amber | `#fbbf24` | Status: loading/warning, rank badges |
| Smokey Gray | `#4c4d4f` | Table headers, column backgrounds |

### Removed Colors (do not use)

`accent-blue`, `accent-purple`, `accent-cyan`, `accent-pink`, `accent-indigo` — replaced by teal as the single secondary accent.

---

## Typography

### Font Stack

| Role | Family | Weight | Class | Usage |
|---|---|---|---|---|
| Body | Gotham SSm Book | 400 | (default) | All body text |
| Heading | Gotham SSm Bold | 700 | `.font-heading` | Labels, nav items, section titles, buttons |
| Display | Gotham SSm Black | 900 | `.font-display` | KPI values, hero numbers |
| Data | JetBrains Mono | 400–600 | `.font-mono-data` | Numeric cells, pick codes, dates |

### Font Files (self-hosted woff2)

```
GothamSSm-Light_Web.woff2    (300)
GothamSSm-Book_Web.woff2     (400)
GothamSSm-Medium_Web.woff2   (500)
GothamSSm-Bold_Web.woff2     (700)
GothamSSm-Black_Web.woff2    (900)
```

JetBrains Mono loaded from Google Fonts:
```
https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap
```

### Text Styling Patterns

- **KPI labels:** `text-[10px] uppercase tracking-[0.2em] font-heading text-text-secondary`
- **KPI values:** `text-2xl font-display tracking-tight`
- **Section titles:** `text-xs font-heading uppercase tracking-wider text-white` (on teal background)
- **Table headers:** `text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-smokey`
- **Nav items:** `text-[11px] font-heading uppercase tracking-wider`
- **StatusBar title:** `text-base font-heading uppercase tracking-widest text-white`

---

## Geometry & Spacing

### Sharp Corners (no border-radius)

Everything uses `rounded-none` — cards, buttons, inputs, rank badges, chart bars, tooltips, scrollbar thumbs. This is the defining visual characteristic of the industrial aesthetic.

### Borders

- All cards/panels: `border border-border` (1px, rgba white at 12% opacity)
- Table rows: `border-b border-border/40`
- Dividers: `border-b border-border`

### Spacing

- Card padding: `p-4`
- Grid gaps: `gap-3` (KPIs), `gap-4` (cards)
- Page padding: `p-4` (taskpane), `p-5` (dialog)

---

## Components

### KPI Card

```
┌──────────────────────────┐
│ ███ RED STRIPE (3px) ███ │  ← bg-accent-red, always red
│ LABEL                    │  ← font-heading, tracking-[0.2em], uppercase
│ $6,419.09                │  ← font-display, colored by type
│ Today                    │  ← text-text-muted
└──────────────────────────┘
```

Color options for value text: `red`, `teal`, `amber`, `green`. Top stripe is always H-E-B Red.

### Section Card

```
┌─────────────────────────────────┐
│ ██ TEAL HEADER BAR ██  [badge]  │  ← bg-accent-teal, full width
│                                 │
│  (content)                      │
│                                 │
└─────────────────────────────────┘
```

- Header: `bg-accent-teal`, white uppercase text, `font-heading`, `tracking-wider`
- Badge: `bg-black/30 text-white` pill on the teal bar

### StatusBar

```
┌─────────────────────────────────────────────────────────┐
│ OPERATIONS COMMAND CENTER  sha   ● Status  [Print] [Refresh] │
└─────────────────────────────────────────────────────────┘
```

- Background: solid `bg-card` (no gradient)
- Title: white, `font-heading`, uppercase, `tracking-widest`
- Refresh button: `bg-accent-red`, white text, `font-heading`, uppercase
- Secondary buttons: `border border-border`, hover `border-accent-teal text-accent-teal`
- Status dot: semantic colors (green/amber/red)

### Sidebar Navigation

**Vertical (dialog/wide view):**
- Width: 160px, `bg-sidebar` (#141414)
- Top: "HEB 404" in `font-display text-accent-red`
- Active item: 3px `border-l-accent-teal` + `bg-card-hover`
- Inactive: `text-text-secondary`

**Horizontal (taskpane/narrow view):**
- Compact strip below StatusBar, `bg-card`
- Active item: 2px `border-b-accent-teal` + `bg-card-hover`

---

## Charts (Recharts)

### Colors

| Element | Fill | Stroke | Width |
|---|---|---|---|
| Bars | `#00b2a960` (teal 38%) | `#00b2a9` | 1px |
| Cost/value line | — | `#dc291e` (H-E-B Red) | 1.5px |
| Line dots | `#dc291e` | — | r=3 |

### Styling

- **No border-radius on bars** — remove all `radius` props
- **Grid:** `strokeDasharray="3 3"`, color `var(--color-border)`
- **Axis ticks:** `{ fill: 'var(--color-text-secondary)', fontSize: 10 }`
- **Tooltip:** `borderRadius: 2`, `background: var(--color-card)`, `border: 1px solid var(--color-border)`
- **Legend:** `fontSize: 11`
- **Uniform bar color** — no per-bar `<Cell>` rainbow coloring

### Chart Constants (copy-paste ready)

```tsx
const CHART_GRID = 'var(--color-border)'
const CHART_TICK = { fill: 'var(--color-text-secondary)', fontSize: 10 }
const CHART_TICK_SM = { fill: 'var(--color-text-secondary)', fontSize: 9 }
const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 2,
  fontSize: 12,
}
```

---

## Tables

### Header Row

```html
<th class="bg-smokey text-[10px] font-semibold uppercase tracking-wider text-text-muted p-2">
```

### Data Cells

- Numeric values: add `font-mono-data tabular-nums`
- Pick/code columns: `font-mono-data text-accent-teal`
- Cost totals: `font-mono-data text-accent-red font-semibold`
- Row hover: `hover:bg-card-hover transition-colors`
- Row border: `border-b border-border/40`

### Rank Badges

```html
<span class="inline-flex items-center justify-center w-5 h-5 rounded-none text-[11px] font-bold bg-accent-amber/15 text-accent-amber">1</span>
```

Rank 1: amber, Rank 2: slate-400, Rank 3: amber-500, Rest: text-muted

### Search Input

```html
<input class="w-full bg-background border border-border rounded-none px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-teal transition-colors" />
```

---

## CSS Custom Properties (Tailwind v4 @theme)

```css
@theme {
  --color-background:     #1a1a1a;
  --color-card:           #242424;
  --color-card-hover:     #2e2e2e;
  --color-border:         rgba(220, 220, 220, 0.12);
  --color-text-primary:   #e8eaed;
  --color-text-secondary: #97a3ae;
  --color-text-muted:     #666c80;
  --color-accent-red:     #dc291e;
  --color-accent-teal:    #00b2a9;
  --color-accent-green:   #34d399;
  --color-accent-amber:   #fbbf24;
  --color-smokey:         #4c4d4f;
  --color-sidebar:        #141414;
}
```

---

## Print Styles

- `.no-print` class hides sidebar, nav, buttons
- `print-color-adjust: exact` preserves dark backgrounds
- Body overrides to white background with dark text at 11px

---

## Design Principles

1. **Sharp, not soft.** Zero border-radius. Industrial precision.
2. **Two accents only.** H-E-B Red for brand/action, Teal for data/navigation.
3. **Dark always.** Single dark theme creates visual separation from Excel's white background.
4. **Data density.** Small text (10–12px), tight padding, monospace numbers.
5. **Gotham everywhere.** Brand font reinforces H-E-B identity at every level.
