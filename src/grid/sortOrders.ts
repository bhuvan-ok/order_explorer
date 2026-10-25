import type { Order } from '../data/types'
import { FIELD_BY_KEY, type FieldKey } from '../fields/fields'

export type SortDirection = 'asc' | 'desc'
export type SortState = { key: FieldKey; direction: SortDirection }

/**
 * Returns a new array sorted by the field's type: numbers and dates numerically, text and enum
 * labels alphabetically (case-insensitive). Empty values (null) always go last, in both directions. Ties are broken
 * by id so the same sort always gives the same order.
 */
export function sortOrders(orders: Order[], sort: SortState | null): Order[] {
  if (!sort) return orders
  const field = FIELD_BY_KEY[sort.key]
  const sign = sort.direction === 'asc' ? 1 : -1

  // Read (and lower-case) each sort value once, n times, instead of inside the comparator,
  // n log n times. Comparing lower-cased strings directly is ~2.5x faster than Intl.Collator and
  // gives the same order for this data (all names and emails are plain ASCII); accented text
  // would need a collator.
  const keyed = orders.map((order) => {
    const value = field.sortValue(order)
    return { order, value: typeof value === 'string' ? value.toLowerCase() : value }
  })

  keyed.sort((a, b) => {
    if (a.value === null || b.value === null) {
      if (a.value !== b.value) return a.value === null ? 1 : -1
    } else {
      const diff =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value - b.value
          : a.value < b.value
            ? -1
            : a.value > b.value
              ? 1
              : 0
      if (diff !== 0) return diff * sign
    }
    return a.order.id < b.order.id ? -1 : a.order.id > b.order.id ? 1 : 0
  })

  return keyed.map((entry) => entry.order)
}

/** Header click: a new column sorts ascending, the same column flips direction. */
export function nextSort(current: SortState | null, key: FieldKey): SortState {
  if (current?.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: 'asc' }
}
