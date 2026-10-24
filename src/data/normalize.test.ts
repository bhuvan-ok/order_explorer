import { describe, expect, it } from 'vitest'
import { normalizeOrders } from './normalize'

function raw(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ORD-0000001',
    schemaVersion: 2,
    customerName: 'Priya Gupta',
    customerEmail: 'priya@example.com',
    status: 'delivered',
    amount: 309.53,
    currency: 'INR',
    createdAt: '2026-03-09T00:44:53.000Z',
    updatedAt: null,
    region: 'EAST',
    channel: 'store',
    priority: 3,
    paymentMethod: 'netbanking',
    itemCount: 1,
    notes: null,
    ...overrides,
  }
}

function one(overrides: Record<string, unknown>) {
  const { orders } = normalizeOrders([raw(overrides)])
  expect(orders).toHaveLength(1)
  return orders[0]
}

describe('normalizeOrders', () => {
  it('rule 1: reads the customer name from either field', () => {
    expect(one({ customerName: 'A' }).customer).toBe('A')
    expect(one({ schemaVersion: 1, customerName: undefined, customer_name: 'B' }).customer).toBe(
      'B',
    )
  })

  it('rule 2: converts v1 paise to rupees and keeps v2 rupees', () => {
    expect(one({ schemaVersion: 1, amount: 30780 }).amount).toBe(307.8)
    expect(one({ schemaVersion: 2, amount: 309.53 }).amount).toBe(309.53)
  })

  it('rule 3: reads string amounts, still respecting the v1 unit', () => {
    expect(one({ schemaVersion: 2, amount: '4599.5' }).amount).toBe(4599.5)
    expect(one({ schemaVersion: 1, amount: '131452' }).amount).toBe(1314.52)
  })

  it('rule 4: stores createdAt as epoch ms for every format', () => {
    expect(one({ createdAt: 1741944600 }).createdAt).toBe(Date.UTC(2025, 2, 14, 9, 30))
    expect(one({ createdAt: '14/03/2025' }).createdAt).toBe(Date.UTC(2025, 2, 14))
  })

  it('rule 5: treats null and missing updatedAt the same', () => {
    expect(one({ updatedAt: null }).updatedAt).toBeNull()
    expect(one({ updatedAt: undefined }).updatedAt).toBeNull()
    expect(one({ updatedAt: '2026-03-10T00:00:00.000Z' }).updatedAt).toBe(Date.UTC(2026, 2, 10))
  })

  it('rule 6: fixes status and region casing', () => {
    expect(one({ status: 'SHIPPED' }).status).toBe('shipped')
    expect(one({ status: 'Shipped' }).status).toBe('shipped')
    expect(one({ region: 'south' }).region).toBe('SOUTH')
  })

  it('rule 8: keeps a missing priority as null', () => {
    expect(one({ priority: undefined }).priority).toBeNull()
    expect(one({ priority: 1 }).priority).toBe(1)
  })

  it('rule 9: keeps HTML-like notes as plain text and turns null into an empty string', () => {
    const note = '<b>URGENT</b> Fragile <script>alert(1)</script>'
    expect(one({ notes: note }).notes).toBe(note)
    expect(one({ notes: null }).notes).toBe('')
    expect(one({ notes: '' }).notes).toBe('')
  })

  it('rule 10: trims the currency', () => {
    expect(one({ currency: 'INR ' }).currency).toBe('INR')
  })

  describe('rule 7: duplicate ids', () => {
    const keep = (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const { orders, duplicatesRemoved } = normalizeOrders([raw(a), raw(b)])
      expect(orders).toHaveLength(1)
      expect(duplicatesRemoved).toBe(1)
      return orders[0].customer
    }

    it('keeps the later updatedAt when both have one', () => {
      const early = { updatedAt: '2024-06-02T00:00:00.000Z' }
      const late = { updatedAt: '2024-06-23T00:00:00.000Z' }
      expect(keep({ ...late, customerName: 'first' }, { ...early, customerName: 'second' })).toBe(
        'first',
      )
      expect(keep({ ...early, customerName: 'first' }, { ...late, customerName: 'second' })).toBe(
        'second',
      )
    })

    it('keeps the one that has an updatedAt when only one does', () => {
      const dated = { updatedAt: '2024-06-23T00:00:00.000Z' }
      expect(keep({ ...dated, customerName: 'first' }, { customerName: 'second' })).toBe('first')
      expect(keep({ customerName: 'first' }, { ...dated, customerName: 'second' })).toBe('second')
    })

    it('keeps the later one in the file when neither has an updatedAt', () => {
      expect(keep({ customerName: 'first' }, { customerName: 'second' })).toBe('second')
    })

    it('keeps the position of the first occurrence', () => {
      const { orders } = normalizeOrders([
        raw({ id: 'A', updatedAt: undefined }),
        raw({ id: 'B' }),
        raw({ id: 'A', updatedAt: '2024-01-01T00:00:00.000Z', customerName: 'newer' }),
      ])
      expect(orders.map((o) => o.id)).toEqual(['A', 'B'])
      expect(orders[0].customer).toBe('newer')
    })
  })

  it('skips records that cannot be read instead of failing', () => {
    const result = normalizeOrders([
      raw(),
      null,
      raw({ id: '' }),
      raw({ createdAt: 'not a date' }),
      raw({ status: 'lost' }),
      raw({ amount: '' }),
    ])
    expect(result.orders).toHaveLength(1)
    expect(result.skipped).toBe(5)
  })
})
