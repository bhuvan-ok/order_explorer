import { describe, expect, it } from 'vitest'
import ordersJson from '../../public/orders.json?raw'
import { normalizeOrders } from './normalize'
import { STATUSES } from './types'

// Runs the normalizer on the real, unmodified orders.json to check the counts in data-notes.md.
describe('normalizeOrders on orders.json', () => {
  const raw = JSON.parse(ordersJson) as unknown[]
  const { orders, skipped, duplicatesRemoved } = normalizeOrders(raw)

  it('reads every record and removes the ~30 duplicate ids', () => {
    expect(raw).toHaveLength(50_030)
    expect(skipped).toBe(0)
    expect(duplicatesRemoved).toBe(30)
    expect(orders).toHaveLength(50_000)
    expect(new Set(orders.map((o) => o.id)).size).toBe(50_000)
  })

  it('ends up with exactly five statuses and one currency', () => {
    expect(new Set(orders.map((o) => o.status))).toEqual(new Set(STATUSES))
    expect(new Set(orders.map((o) => o.currency))).toEqual(new Set(['INR']))
  })

  it('has a valid date and amount on every order', () => {
    expect(orders.every((o) => Number.isFinite(o.createdAt))).toBe(true)
    expect(orders.every((o) => Number.isFinite(o.amount) && o.amount > 0)).toBe(true)
  })
})
