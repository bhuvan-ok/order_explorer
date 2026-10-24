import { describe, expect, it } from 'vitest'
import type { FieldKey } from '../fields/fields'
import { describeCondition, filterChips } from './describe'
import type { Condition, Operator } from './model'

const cond = (field: FieldKey, operator: Operator, ...values: string[]): Condition => ({
  id: `${field}-${operator}`,
  field,
  operator,
  values,
})

describe('describeCondition', () => {
  it('lists picked options by label, in menu order', () => {
    expect(describeCondition(cond('status', 'in', 'delivered', 'shipped'))).toBe(
      'Status: Shipped, Delivered',
    )
    expect(describeCondition(cond('priority', 'in', 'none', '1'))).toBe('Priority: 1 – High, None')
  })

  it('formats numbers, amounts, text and dates', () => {
    expect(describeCondition(cond('amount', 'gt', '123456.5'))).toBe('Amount > ₹1,23,456.50')
    expect(describeCondition(cond('itemCount', 'between', '2', '5'))).toBe('Items 2 – 5')
    expect(describeCondition(cond('customer', 'contains', ' gupta '))).toBe(
      'Customer contains "gupta"',
    )
    expect(describeCondition(cond('createdAt', 'after', '2025-03-14'))).toBe(
      'Created (UTC) after 2025-03-14',
    )
  })
})

describe('filterChips', () => {
  it('leaves out incomplete conditions and empty groups', () => {
    const chips = filterChips({
      groups: [
        { id: 'g1', conditions: [cond('status', 'in'), cond('amount', 'gt', '10')] },
        { id: 'g2', conditions: [cond('customer', 'contains', '')] },
      ],
    })
    expect(chips).toEqual([{ id: 'g1', chips: [{ id: 'amount-gt', label: 'Amount > ₹10.00' }] }])
  })
})
