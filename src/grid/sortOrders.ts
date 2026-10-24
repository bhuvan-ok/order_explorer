import type { Order } from '../data/types'
import { FIELD_BY_KEY, type FieldKey } from '../fields/fields'

export type SortDirection = 'asc' | 'desc'
export type SortState = { key: FieldKey; direction: SortDirection }

// Case-insensitive and number-aware ("item 2" before "item 10"); one shared instance is much
// faster than calling localeCompare for every comparison.
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

/**
 * Returns a new array sorted by the field's type: numbers and dates numerically, text and enum
 * labels alphabetically. Empty values (null) always go last, in both directions. Ties are broken
 * by id so the same sort always gives the same order.
 */
export function sortOrders(orders: Order[], sort: SortState | null): Order[] {
  if (!sort) return orders
  const field = FIELD_BY_KEY[sort.key]
  const sign = sort.direction === 'asc' ? 1 : -1

  // Read each sort value once (n reads) instead of inside the comparator (n log n reads).
  const keyed = orders.map((order) => ({ order, value: field.sortValue(order) }))

  keyed.sort((a, b) => {
    if (a.value === null || b.value === null) {
      if (a.value !== b.value) return a.value === null ? 1 : -1
    } else {
      const diff =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value - b.value
          : collator.compare(String(a.value), String(b.value))
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
