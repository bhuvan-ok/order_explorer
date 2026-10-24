import { describe, expect, it } from 'vitest'
import type { Order } from '../data/types'
import { nextSort, sortOrders } from './sortOrders'

function order(id: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    schemaVersion: 2,
    customer: 'Name',
    email: 'name@example.com',
    status: 'pending',
    amount: 100,
    currency: 'INR',
    createdAt: 0,
    updatedAt: null,
    region: 'NORTH',
    channel: 'web',
    paymentMethod: 'upi',
    priority: 1,
    itemCount: 1,
    notes: '',
    ...overrides,
  }
}

const ids = (orders: Order[]) => orders.map((o) => o.id)

describe('sortOrders', () => {
  it('sorts amounts as numbers, not as text', () => {
    const list = [
      order('a', { amount: 900 }),
      order('b', { amount: 10000 }),
      order('c', { amount: 50 }),
    ]
    expect(ids(sortOrders(list, { key: 'amount', direction: 'asc' }))).toEqual(['c', 'a', 'b'])
    expect(ids(sortOrders(list, { key: 'amount', direction: 'desc' }))).toEqual(['b', 'a', 'c'])
  })

  it('sorts dates by time', () => {
    const list = [
      order('a', { createdAt: Date.UTC(2025, 0, 2) }),
      order('b', { createdAt: Date.UTC(2024, 11, 31) }),
    ]
    expect(ids(sortOrders(list, { key: 'createdAt', direction: 'asc' }))).toEqual(['b', 'a'])
  })

  it('sorts text case-insensitively', () => {
    const list = [order('a', { customer: 'bob' }), order('b', { customer: 'Alice' })]
    expect(ids(sortOrders(list, { key: 'customer', direction: 'asc' }))).toEqual(['b', 'a'])
  })

  it('puts empty updatedAt last in both directions', () => {
    const list = [
      order('a', { updatedAt: null }),
      order('b', { updatedAt: Date.UTC(2025, 0, 1) }),
      order('c', { updatedAt: Date.UTC(2026, 0, 1) }),
    ]
    expect(ids(sortOrders(list, { key: 'updatedAt', direction: 'asc' }))).toEqual(['b', 'c', 'a'])
    expect(ids(sortOrders(list, { key: 'updatedAt', direction: 'desc' }))).toEqual(['c', 'b', 'a'])
  })

  it('puts missing priority (None) last', () => {
    const list = [
      order('a', { priority: null }),
      order('b', { priority: 3 }),
      order('c', { priority: 1 }),
    ]
    expect(ids(sortOrders(list, { key: 'priority', direction: 'desc' }))).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties by id and does not change the input array', () => {
    const list = [order('c'), order('a'), order('b')]
    expect(ids(sortOrders(list, { key: 'amount', direction: 'desc' }))).toEqual(['a', 'b', 'c'])
    expect(ids(list)).toEqual(['c', 'a', 'b'])
  })
})

describe('nextSort', () => {
  it('sorts a new column ascending and flips the same column', () => {
    expect(nextSort(null, 'amount')).toEqual({ key: 'amount', direction: 'asc' })
    expect(nextSort({ key: 'amount', direction: 'asc' }, 'amount')).toEqual({
      key: 'amount',
      direction: 'desc',
    })
    expect(nextSort({ key: 'amount', direction: 'desc' }, 'amount')).toEqual({
      key: 'amount',
      direction: 'asc',
    })
    expect(nextSort({ key: 'amount', direction: 'desc' }, 'id')).toEqual({
      key: 'id',
      direction: 'asc',
    })
  })
})
