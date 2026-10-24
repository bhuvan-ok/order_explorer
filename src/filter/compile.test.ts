import { describe, expect, it } from 'vitest'
import type { Order } from '../data/types'
import type { FieldKey } from '../fields/fields'
import { compileFilter, conditionProblem } from './compile'
import type { Condition, Filter, Operator } from './model'

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ORD-0000001',
    schemaVersion: 2,
    customer: 'Priya Gupta',
    email: 'priya@example.com',
    status: 'shipped',
    amount: 5000,
    currency: 'INR',
    createdAt: Date.UTC(2025, 2, 14, 9, 30),
    updatedAt: null,
    region: 'NORTH',
    channel: 'web',
    paymentMethod: 'upi',
    priority: null,
    itemCount: 2,
    notes: 'Fragile items',
    ...overrides,
  }
}

let n = 0
const cond = (field: FieldKey, operator: Operator, ...values: string[]): Condition => ({
  id: `c${++n}`,
  field,
  operator,
  values,
})
const filterOf = (...groups: Condition[][]): Filter => ({
  groups: groups.map((conditions, i) => ({ id: `g${i}`, conditions })),
})
const matches = (o: Order, ...groups: Condition[][]) => {
  const predicate = compileFilter(filterOf(...groups))
  return predicate ? predicate(o) : true
}

describe('compileFilter', () => {
  it('returns null (show everything) when there is nothing to apply', () => {
    expect(compileFilter({ groups: [] })).toBeNull()
    expect(compileFilter(filterOf([cond('customer', 'contains', '  ')]))).toBeNull()
  })

  it('ORs conditions inside a group and ANDs groups', () => {
    const shipped = cond('status', 'in', 'shipped')
    const delivered = cond('status', 'in', 'delivered')
    const big = cond('amount', 'gt', '4000')
    const huge = cond('amount', 'gt', '9000')
    expect(matches(order(), [delivered, shipped], [big])).toBe(true)
    expect(matches(order(), [delivered, shipped], [huge])).toBe(false)
    expect(matches(order(), [delivered])).toBe(false)
  })

  it('matches text case-insensitively', () => {
    expect(matches(order(), [cond('customer', 'contains', 'GUPTA')])).toBe(true)
    expect(matches(order(), [cond('notes', 'notContains', 'fragile')])).toBe(false)
    expect(matches(order(), [cond('id', 'equals', 'ord-0000001')])).toBe(true)
    expect(matches(order(), [cond('id', 'equals', 'ORD-00000')])).toBe(false)
  })

  it('treats empty notes as empty text', () => {
    expect(matches(order({ notes: '' }), [cond('notes', 'notContains', 'x')])).toBe(true)
  })

  it('compares numbers, with between including both ends', () => {
    expect(matches(order(), [cond('amount', 'equals', '5000')])).toBe(true)
    expect(matches(order(), [cond('amount', 'lt', '5000')])).toBe(false)
    expect(matches(order(), [cond('amount', 'between', '5000', '6000')])).toBe(true)
    expect(matches(order(), [cond('amount', 'between', '1', '4999.99')])).toBe(false)
  })

  it('compares dates as whole UTC days', () => {
    expect(matches(order(), [cond('createdAt', 'before', '2025-03-14')])).toBe(false)
    expect(matches(order(), [cond('createdAt', 'before', '2025-03-15')])).toBe(true)
    expect(matches(order(), [cond('createdAt', 'after', '2025-03-14')])).toBe(false)
    expect(matches(order(), [cond('createdAt', 'after', '2025-03-13')])).toBe(true)
    expect(matches(order(), [cond('createdAt', 'between', '2025-03-14', '2025-03-14')])).toBe(true)
  })

  it('never matches a missing updatedAt with a date condition', () => {
    expect(matches(order(), [cond('updatedAt', 'after', '2000-01-01')])).toBe(false)
  })

  it('lets the user pick "None" for a missing priority', () => {
    expect(matches(order(), [cond('priority', 'in', 'none')])).toBe(true)
    expect(matches(order({ priority: 1 }), [cond('priority', 'in', 'none', '2')])).toBe(false)
    expect(matches(order({ priority: 2 }), [cond('priority', 'in', 'none', '2')])).toBe(true)
  })
})

describe('conditionProblem', () => {
  it('explains why a condition is ignored', () => {
    expect(conditionProblem(cond('status', 'in'))).toBe('Pick at least one value')
    expect(conditionProblem(cond('amount', 'equals'))).toBe('Enter a number')
    expect(conditionProblem(cond('createdAt', 'before'))).toBe('Pick a date')
    expect(conditionProblem(cond('amount', 'between', '10'))).toBe('Enter both numbers')
    expect(conditionProblem(cond('amount', 'between', '10', '5'))).toMatch(/larger/)
    expect(conditionProblem(cond('createdAt', 'after', '2025-13'))).toBe('Pick a date')
    expect(conditionProblem(cond('amount', 'gt', '10'))).toBeNull()
  })
})
