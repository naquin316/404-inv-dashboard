export interface FlowCutsData {
  title: string
  weekNum: string
  dateStr: string
  periodStr: string
  totalItems: number
  totalSKUs: number
  totalCost: number
  trueCuts: number
  topDrivers: TopDriver[]
  topSelectors: TopSelector[]
  summary: Record<string, unknown>
  daily: DailyEntry[]
  dailyTotal?: { items: number; skus: number; cost: number; trueCuts: number }
  timeline: Record<string, { qty: number; cost: number }>
}

export interface TopDriver {
  rank: number
  pick: string
  desc: string
  caseCost: number
  qty: number
  totalCost: number
}

export interface TopSelector {
  rank: number
  name: string
  qty: number
  pct: number
}

export interface DailyEntry {
  date: unknown
  items: number
  skus: number
  cost: number
  trueCuts: number
}

export interface ShortRecord {
  [key: string]: unknown
  RPT_DT?: unknown
  PRODUCT?: string
  DESCRIPTION?: string
  PARTNER?: string
  FINAL_SHORTS?: number
  COST?: number
  JobTitle?: string
}

export type StatusState = 'ok' | 'loading' | 'err' | 'waiting'

export interface PageDefinition {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  sheet: string
  component: React.ComponentType<{ data: any; wide?: boolean }>
  dataLoader: (ctx: any) => Promise<any>
}

export interface WorkbookDefinition {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  pages: PageDefinition[]
}

export interface WorkbookContext {
  workbook: WorkbookDefinition | null
  availablePages: PageDefinition[]
  allSheetNames: string[]
}
