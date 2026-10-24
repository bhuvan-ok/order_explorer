import { FIELD_BY_KEY, type FieldKey } from '../fields/fields'
import { newId, OPERATORS, type Condition, type Filter, type Group } from './model'

// Pure helpers that return a new Filter; the UI never mutates filter state in place.

const DEFAULT_FIELD: FieldKey = 'status'

export function newCondition(field: FieldKey = DEFAULT_FIELD): Condition {
  return { id: newId(), field, operator: OPERATORS[FIELD_BY_KEY[field].type][0].value, values: [] }
}

export function addGroup(filter: Filter): { filter: Filter; condition: Condition } {
  const condition = newCondition()
  const group: Group = { id: newId(), conditions: [condition] }
  return { filter: { groups: [...filter.groups, group] }, condition }
}

export function addCondition(
  filter: Filter,
  groupId: string,
): { filter: Filter; condition: Condition } {
  const condition = newCondition()
  return {
    filter: mapGroup(filter, groupId, (g) => ({ ...g, conditions: [...g.conditions, condition] })),
    condition,
  }
}

export function updateCondition(
  filter: Filter,
  conditionId: string,
  change: Partial<Omit<Condition, 'id'>>,
): Filter {
  return {
    groups: filter.groups.map((g) => ({
      ...g,
      conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, ...change } : c)),
    })),
  }
}

/** A new field has a different type, so its operator and values start fresh. */
export function changeField(filter: Filter, conditionId: string, field: FieldKey): Filter {
  const operator = OPERATORS[FIELD_BY_KEY[field].type][0].value
  return updateCondition(filter, conditionId, { field, operator, values: [] })
}

/** Removes a condition; a group left without conditions is removed too. */
export function removeCondition(filter: Filter, conditionId: string): Filter {
  return {
    groups: filter.groups
      .map((g) => ({ ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }))
      .filter((g) => g.conditions.length > 0),
  }
}

export function removeGroup(filter: Filter, groupId: string): Filter {
  return { groups: filter.groups.filter((g) => g.id !== groupId) }
}

function mapGroup(filter: Filter, groupId: string, fn: (group: Group) => Group): Filter {
  return { groups: filter.groups.map((g) => (g.id === groupId ? fn(g) : g)) }
}
