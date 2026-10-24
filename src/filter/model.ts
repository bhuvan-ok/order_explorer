import type { FieldKey, FieldType } from '../fields/fields'

export type Operator =
  'contains' | 'notContains' | 'equals' | 'gt' | 'lt' | 'between' | 'before' | 'after' | 'in'

/**
 * A condition is a field, an operator and its values. Values are kept as the raw strings the user
 * typed (so "12." or a half-typed date is not lost) and are only parsed when the filter is
 * compiled:
 * - text / number / date: [value] or, for "between", [from, to]
 * - enum: the picked option keys (see optionKey)
 */
export type Condition = {
  id: string
  field: FieldKey
  operator: Operator
  values: string[]
}

/** Conditions inside a group are combined with OR. */
export type Group = { id: string; conditions: Condition[] }

/** Groups are combined with AND. Only one level of grouping. */
export type Filter = { groups: Group[] }

export const EMPTY_FILTER: Filter = { groups: [] }

export type OperatorOption = { value: Operator; label: string; symbol: string }

/** The operators each field type offers, in menu order. The first one is the default. */
export const OPERATORS: Record<FieldType, OperatorOption[]> = {
  text: [
    { value: 'contains', label: 'contains', symbol: 'contains' },
    { value: 'notContains', label: 'does not contain', symbol: 'does not contain' },
    { value: 'equals', label: 'equals', symbol: '=' },
  ],
  number: [
    { value: 'equals', label: 'equals', symbol: '=' },
    { value: 'gt', label: 'greater than', symbol: '>' },
    { value: 'lt', label: 'less than', symbol: '<' },
    { value: 'between', label: 'between', symbol: 'between' },
  ],
  date: [
    { value: 'before', label: 'before', symbol: 'before' },
    { value: 'after', label: 'after', symbol: 'after' },
    { value: 'between', label: 'between', symbol: 'between' },
  ],
  enum: [{ value: 'in', label: 'is one of', symbol: 'is' }],
}

export function isOperatorFor(type: FieldType, operator: Operator): boolean {
  return OPERATORS[type].some((o) => o.value === operator)
}

let lastId = 0
export const newId = () => `f${++lastId}`
