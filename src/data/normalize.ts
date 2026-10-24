import { parseDate } from './parseDate'
import {
  CHANNELS,
  PAYMENT_METHODS,
  PRIORITIES,
  REGIONS,
  STATUSES,
  type Order,
  type RawOrder,
} from './types'

export type NormalizeResult = {
  orders: Order[]
  /** Records that could not be read at all (e.g. no id or no valid createdAt). */
  skipped: number
  /** Records dropped because another record with the same id was kept. */
  duplicatesRemoved: number
}

/**
 * The single place where the messy source data is cleaned (see data-notes.md).
 * Nothing after this function fixes data: the grid, filter and export only see `Order`.
 */
export function normalizeOrders(raw: unknown[]): NormalizeResult {
  const byId = new Map<string, Order>()
  let skipped = 0
  let duplicatesRemoved = 0

  for (const item of raw) {
    const order = normalizeOrder(item)
    if (!order) {
      skipped++
      continue
    }
    const kept = byId.get(order.id)
    if (!kept) {
      byId.set(order.id, order)
      continue
    }
    duplicatesRemoved++
    // Records are visited in file order, so `order` always appears later than `kept`.
    // Map.set on an existing key keeps the key's original position.
    if (shouldReplace(kept, order)) byId.set(order.id, order)
  }

  return { orders: [...byId.values()], skipped, duplicatesRemoved }
}

/**
 * Rule 7: keep the record with the later updatedAt; if only one has an updatedAt keep that one;
 * if neither has one (or they are equal) keep the one that appears later in the file.
 */
function shouldReplace(kept: Order, later: Order): boolean {
  if (kept.updatedAt !== null && later.updatedAt !== null) {
    return later.updatedAt >= kept.updatedAt
  }
  if (kept.updatedAt !== null) return false
  return true
}

function normalizeOrder(item: unknown): Order | null {
  if (typeof item !== 'object' || item === null) return null
  const r = item as RawOrder

  const id = asText(r.id)
  const schemaVersion = r.schemaVersion === 1 || r.schemaVersion === 2 ? r.schemaVersion : null
  const createdAt = parseDate(r.createdAt)
  const amount = toRupees(r.amount, schemaVersion)
  const status = pick(STATUSES, asText(r.status).toLowerCase())
  const region = pick(REGIONS, asText(r.region).toUpperCase())
  const channel = pick(CHANNELS, asText(r.channel).toLowerCase())
  const paymentMethod = pick(PAYMENT_METHODS, asText(r.paymentMethod).toLowerCase())
  const itemCount = Number(r.itemCount)

  if (
    !id ||
    schemaVersion === null ||
    createdAt === null ||
    amount === null ||
    !status ||
    !region ||
    !channel ||
    !paymentMethod ||
    !Number.isFinite(itemCount)
  ) {
    return null
  }

  return {
    id,
    schemaVersion,
    // Rule 1: v1 uses customer_name, v2 uses customerName.
    customer: asText(r.customerName ?? r.customer_name),
    email: asText(r.customerEmail),
    status,
    amount,
    // Rule 10: some records have "INR " with a trailing space.
    currency: asText(r.currency),
    createdAt,
    // Rule 5: null and missing both become null.
    updatedAt: parseDate(r.updatedAt),
    region,
    channel,
    paymentMethod,
    // Rule 8: missing priority is kept as null and shown as "None".
    priority: pick(PRIORITIES, r.priority) ?? null,
    itemCount,
    // Rule 9: kept as plain text; null and '' both become ''.
    notes: typeof r.notes === 'string' ? r.notes : '',
  }
}

/**
 * Rules 2 and 3: amount may be a number or a numeric string, and v1 stores paise.
 * The unit conversion happens after parsing, so a v1 string like "131452" is still paise.
 */
function toRupees(value: unknown, schemaVersion: 1 | 2 | null): number | null {
  // Number('') is 0, so empty strings are rejected explicitly.
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN
  if (!Number.isFinite(n)) return null
  const rupees = schemaVersion === 1 ? n / 100 : n
  // Round to whole paise to remove floating-point noise (e.g. 0.1 + 0.2).
  return Math.round(rupees * 100) / 100
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Rule 6: returns the canonical value if it is one of the allowed ones (after casing is fixed). */
function pick<T extends string | number>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.find((candidate) => candidate === value)
}
