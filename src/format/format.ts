// Formatters are created once: building an Intl formatter is far slower than using one.
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const integer = new Intl.NumberFormat('en-IN')

export const EMPTY = '—'

/** 123456.5 -> "₹1,23,456.50" (Indian digit grouping). */
export function formatAmount(value: number): string {
  return rupees.format(value)
}

/** 50000 -> "50,000" */
export function formatCount(value: number): string {
  return integer.format(value)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Epoch ms -> "2025-03-14 09:30", always in UTC so every viewer sees the same value. */
export function formatDateTime(ms: number | null): string {
  if (ms === null) return EMPTY
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
