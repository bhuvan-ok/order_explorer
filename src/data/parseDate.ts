const DAY_MONTH_YEAR = /^(\d{2})\/(\d{2})\/(\d{4})$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/
const HAS_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/

/**
 * Reads the four date formats found in orders.json and returns epoch milliseconds (UTC),
 * or null when the value is missing or not a valid date.
 *
 * - ISO with timezone:    "2025-03-14T09:30:00.000Z"
 * - ISO without timezone: "2025-03-14T09:30:00"  -> treated as UTC
 * - Epoch seconds:        1741944600
 * - Day/month/year:       "14/03/2025"           -> midnight UTC
 */
export function parseDate(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value * 1000 : null
  }
  if (typeof value !== 'string') return null

  const text = value.trim()

  const dmy = DAY_MONTH_YEAR.exec(text)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const ms = Date.UTC(year, month - 1, day)
    // Date.UTC silently rolls over invalid days (31/02 -> 03/03), so check it round-trips.
    const check = new Date(ms)
    const valid =
      check.getUTCFullYear() === year &&
      check.getUTCMonth() === month - 1 &&
      check.getUTCDate() === day
    return valid ? ms : null
  }

  if (ISO_DATE_TIME.test(text)) {
    // Without an explicit zone, Date.parse would use the viewer's local time.
    const ms = Date.parse(HAS_TIMEZONE.test(text) ? text : `${text}Z`)
    return Number.isNaN(ms) ? null : ms
  }

  return null
}
