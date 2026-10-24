import { FIELD_BY_KEY, FIELDS, type FieldKey } from '../fields/fields'
import { conditionProblem } from '../filter/compile'
import { OPERATORS, type Condition, type Operator } from '../filter/model'
import styles from './FilterPanel.module.css'
import { ValueInput } from './ValueInput'

type Props = {
  condition: Condition
  autoFocus: boolean
  onChange: (change: Partial<Pick<Condition, 'operator' | 'values'>>) => void
  onFieldChange: (field: FieldKey) => void
  onRemove: () => void
}

export function ConditionEditor({
  condition,
  autoFocus,
  onChange,
  onFieldChange,
  onRemove,
}: Props) {
  const field = FIELD_BY_KEY[condition.field]
  const operators = OPERATORS[field.type]
  const problem = conditionProblem(condition)

  function changeOperator(operator: Operator) {
    // "between" uses two values, every other operator one.
    const keep = operator === 'between' ? 2 : 1
    onChange({ operator, values: condition.values.slice(0, keep) })
  }

  return (
    <div className={styles.condition}>
      <div className={styles.conditionRow}>
        <select
          className={styles.control}
          aria-label="Field"
          value={condition.field}
          onChange={(e) => onFieldChange(e.target.value as FieldKey)}
          // Focus jumps to a newly added condition so a filter can be built from the keyboard.
          autoFocus={autoFocus}
        >
          {FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        {operators.length > 1 ? (
          <select
            className={styles.control}
            aria-label="Operator"
            value={condition.operator}
            onChange={(e) => changeOperator(e.target.value as Operator)}
          >
            {operators.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={styles.fixedOperator}>{operators[0].label}</span>
        )}
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Remove condition"
          title="Remove condition"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <ValueInput
        field={field}
        operator={condition.operator}
        values={condition.values}
        onChange={(values) => onChange({ values })}
      />
      {problem && <p className={styles.problem}>{problem} · not applied yet</p>}
    </div>
  )
}
