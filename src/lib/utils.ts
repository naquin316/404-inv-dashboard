import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt$(v: number): string {
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtN(v: number): string {
  return Number(v).toLocaleString('en-US')
}

export function fmtPct(v: number): string {
  return (Number(v) * 100).toFixed(1) + '%'
}

export function fmtDate(v: unknown): string {
  if (!v) return ''
  const d = (v instanceof Date) ? v : new Date(v as string)
  return isNaN(d.getTime()) ? String(v) : (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear()
}
