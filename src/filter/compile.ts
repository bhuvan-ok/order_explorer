import type { Order } from '../data/types'
import { FIELD_BY_KEY, optionKey, type FieldKey } from '../fields/fields'
import type { Condition, Filter } from './model'

type Predicate = (order: Order) => boolean
type Compiled = { predicate: Predicate } | { problem: string }

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/

/**
 * Turns the filter into one function that is run on every order. All parsing (numbers, dates,
 * lower-casing the search text) happens here once, not once per order.
 *
 * Returns null when no condition is complete, meaning "show everything".
 * Groups are ANDed; conditions inside a group are ORed. Incomplete conditions are ignored.
 */
export function compileFilter(filter: Filter): Predicate | null {
  const groups: Predicate[][] = []
  for (const group of filter.groups) {
    const predicates: Predicate[] = []
    for (const condition of group.conditions) {
      const compiled = compileCondition(condition)
      if ('predicate' in compiled) predicates.push(compiled.predicate)
    }
    if (predicates.length > 0) groups.push(predicates)
  }
  if (groups.length === 0) return null

  return (order) => {
    for (const group of groups) {
      let anyMatch = false
      for (const predicate of group) {
        if (predicate(order)) {
          anyMatch = true
          break
        }
      }
      if (!anyMatch) return false
    }
    return true
  }
}

/** Why a condition is being ignored, or null if it is complete and applied. */
export function conditionProblem(condition: Condition): string | null {
  const compiled = compileCondition(condition)
  return 'problem' in compiled ? compiled.problem : null
}

function compileCondition({ field, operator, values }: Condition): Compiled {
  const type = FIELD_BY_KEY[field].type

  if (type === 'text') {
    const needle = (values[0] ?? '').trim().toLowerCase()
    if (!needle) return { problem: 'Enter a value' }
    const text = (order: Order) => lowerText(order, field)
    if (operator === 'contains') return { predicate: (o) => text(o).includes(needle) }
    if (operator === 'notContains') return { predicate: (o) => !text(o).includes(needle) }
    return { predicate: (o) => text(o) === needle }
  }

  if (type === 'number') {
    const get = (order: Order) => order[field] as number
    const a = parseNumber(values[0])
    const b = parseNumber(values[1])
    if (a === null) return { problem: 'Enter a number' }
    if (operator === 'gt') return { predicate: (o) => get(o) > a }
    if (operator === 'lt') return { predicate: (o) => get(o) < a }
    if (operator === 'between') {
      if (b === null) return { problem: 'Enter both numbers' }
      if (a > b) return { problem: 'The first number is larger than the second' }
      return { predicate: (o) => get(o) >= a && get(o) <= b }
    }
    return { predicate: (o) => get(o) === a }
  }

  if (type === 'date') {
    // Dates are whole UTC days, matching how dates are shown in the grid.
    const get = (order: Order) => order[field] as number | null
    const a = parseDay(values[0])
    const b = parseDay(values[1])
    if (a === null) return { problem: 'Pick a date' }
    if (operator === 'before') return { predicate: (o) => isBefore(get(o), a) }
    if (operator === 'after') return { predicate: (o) => isOnOrAfter(get(o), a + DAY_MS) }
    if (b === null) return { problem: 'Pick both dates' }
    if (a > b) return { problem: 'The first date is after the second' }
    return { predicate: (o) => isOnOrAfter(get(o), a) && isBefore(get(o), b + DAY_MS) }
  }

  // enum: "is one of"
  if (values.length === 0) return { problem: 'Pick at least one value' }
  const picked = new Set(values)
  return { predicate: (o) => picked.has(optionKey(o[field] as string | number | null)) }
}

const isBefore = (time: number | null, limit: number) => time !== null && time < limit
const isOnOrAfter = (time: number | null, limit: number) => time !== null && time >= limit

function parseNumber(text: string | undefined): number | null {
  if (!text?.trim()) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

/** "2025-03-14" from <input type="date"> -> midnight UTC of that day. */
function parseDay(text: string | undefined): number | null {
  if (!text || !DATE_INPUT.test(text)) return null
  const ms = Date.parse(`${text}T00:00:00Z`)
  return Number.isNaN(ms) ? null : ms
}

// Lower-cased text is cached per order so a text filter does not re-lowercase 50,000 strings on
// every keystroke. A WeakMap lets the cache disappear together with the orders.
const lowerCache = new WeakMap<Order, Partial<Record<FieldKey, string>>>()

function lowerText(order: Order, field: FieldKey): string {
  let entry = lowerCache.get(order)
  if (!entry) {
    entry = {}
    lowerCache.set(order, entry)
  }
  let text = entry[field]
  if (text === undefined) {
    text = String(order[field] ?? '').toLowerCase()
    entry[field] = text
  }
  return text
}
