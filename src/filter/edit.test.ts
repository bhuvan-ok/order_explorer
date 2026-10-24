import { describe, expect, it } from 'vitest'
import { addCondition, addGroup, changeField, removeCondition, updateCondition } from './edit'
import { EMPTY_FILTER } from './model'

describe('filter editing', () => {
  it('adds a group with one default condition', () => {
    const { filter, condition } = addGroup(EMPTY_FILTER)
    expect(filter.groups).toHaveLength(1)
    expect(filter.groups[0].conditions).toEqual([condition])
    expect(condition).toMatchObject({ field: 'status', operator: 'in', values: [] })
  })

  it('resets operator and values when the field changes type', () => {
    const { filter, condition } = addGroup(EMPTY_FILTER)
    const withValue = updateCondition(filter, condition.id, { values: ['shipped'] })
    const changed = changeField(withValue, condition.id, 'amount')
    expect(changed.groups[0].conditions[0]).toMatchObject({
      field: 'amount',
      operator: 'equals',
      values: [],
    })
  })

  it('removes a group once its last condition is removed', () => {
    const first = addGroup(EMPTY_FILTER)
    const second = addCondition(first.filter, first.filter.groups[0].id)
    const one = removeCondition(second.filter, first.condition.id)
    expect(one.groups[0].conditions).toEqual([second.condition])
    expect(removeCondition(one, second.condition.id).groups).toEqual([])
  })
})
