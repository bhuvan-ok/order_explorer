import { describe, expect, it } from 'vitest'
import { parseDate } from './parseDate'

const MARCH_14_0930_UTC = Date.UTC(2025, 2, 14, 9, 30, 0)

describe('parseDate', () => {
  it('reads ISO with a timezone', () => {
    expect(parseDate('2025-03-14T09:30:00.000Z')).toBe(MARCH_14_0930_UTC)
    expect(parseDate('2025-03-14T15:00:00+05:30')).toBe(MARCH_14_0930_UTC)
  })

  it('treats ISO without a timezone as UTC, not local time', () => {
    expect(parseDate('2025-03-14T09:30:00')).toBe(MARCH_14_0930_UTC)
  })

  it('reads epoch seconds', () => {
    expect(parseDate(1741944600)).toBe(MARCH_14_0930_UTC)
  })

  it('reads day/month/year as midnight UTC', () => {
    expect(parseDate('14/03/2025')).toBe(Date.UTC(2025, 2, 14))
  })

  it('rejects impossible day/month/year dates instead of rolling them over', () => {
    expect(parseDate('31/02/2025')).toBeNull()
    expect(parseDate('01/13/2025')).toBeNull()
  })

  it('returns null for missing or unreadable values', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('')).toBeNull()
    expect(parseDate('yesterday')).toBeNull()
    expect(parseDate(Number.NaN)).toBeNull()
  })
})
