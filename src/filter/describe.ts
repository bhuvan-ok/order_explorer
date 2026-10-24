import { FIELD_BY_KEY, optionKey, type Field } from '../fields/fields'
import { formatAmount, formatCount } from '../format/format'
import { conditionProblem } from './compile'
import { OPERATORS, type Condition, type Filter } from './model'

/** Short human-readable text for a chip, e.g. "Status: Shipped, Delivered" or "Amount > ₹1,000.00". */
export function describeCondition(condition: Condition): string {
  const field = FIELD_BY_KEY[condition.field]
  const { operator, values } = condition

  if (field.type === 'enum') {
    const labels = (field.options ?? [])
      .filter((option) => values.includes(optionKey(option.value)))
      .map((option) => option.label)
    return `${field.label}: ${labels.join(', ')}`
  }

  const symbol = OPERATORS[field.type].find((o) => o.value === operator)?.symbol ?? operator
  const show = (value: string) => formatValue(field, value)

  if (operator === 'between') {
    return `${field.label} ${show(values[0])} – ${show(values[1])}`
  }
  return `${field.label} ${symbol} ${show(values[0])}`
}

function formatValue(field: Field, value: string): string {
  if (field.type === 'text') return `"${value.trim()}"`
  if (field.type === 'number') {
    const n = Number(value)
    return field.key === 'amount' ? formatAmount(n) : formatCount(n)
  }
  return value
}

export type ChipGroup = { id: string; chips: { id: string; label: string }[] }

/** The applied part of the filter: only complete conditions, and only groups that have one. */
export function filterChips(filter: Filter): ChipGroup[] {
  return filter.groups
    .map((group) => ({
      id: group.id,
      chips: group.conditions
        .filter((condition) => conditionProblem(condition) === null)
        .map((condition) => ({ id: condition.id, label: describeCondition(condition) })),
    }))
    .filter((group) => group.chips.length > 0)
}
