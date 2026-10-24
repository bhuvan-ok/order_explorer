import { optionKey, type Field } from '../fields/fields'
import type { Operator } from '../filter/model'
import styles from './FilterPanel.module.css'

type Props = {
  field: Field
  operator: Operator
  values: string[]
  onChange: (values: string[]) => void
}

/** The value input that fits the field type: text box, number box(es), date input(s) or a checklist. */
export function ValueInput({ field, operator, values, onChange }: Props) {
  if (field.type === 'enum') {
    return (
      <div role="group" aria-label={`${field.label} values`} className={styles.checks}>
        {(field.options ?? []).map((option) => {
          const key = optionKey(option.value)
          const checked = values.includes(key)
          return (
            <label key={key} className={styles.check}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(checked ? values.filter((v) => v !== key) : [...values, key])
                }
              />
              {option.label}
            </label>
          )
        })}
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <input
        type="text"
        className={styles.control}
        aria-label={`${field.label} value`}
        placeholder="Value"
        value={values[0] ?? ''}
        onChange={(e) => onChange([e.target.value])}
      />
    )
  }

  const inputProps =
    field.type === 'number'
      ? ({ type: 'number', step: 'any', inputMode: 'decimal', placeholder: 'Number' } as const)
      : ({ type: 'date' } as const)
  const setAt = (index: number, value: string) => {
    const next = [...values]
    next[index] = value
    onChange(next)
  }

  if (operator !== 'between') {
    return (
      <input
        {...inputProps}
        className={styles.control}
        aria-label={`${field.label} value`}
        value={values[0] ?? ''}
        onChange={(e) => setAt(0, e.target.value)}
      />
    )
  }

  return (
    <div className={styles.between}>
      <input
        {...inputProps}
        className={styles.control}
        aria-label={`${field.label} from`}
        value={values[0] ?? ''}
        onChange={(e) => setAt(0, e.target.value)}
      />
      <span>and</span>
      <input
        {...inputProps}
        className={styles.control}
        aria-label={`${field.label} to`}
        value={values[1] ?? ''}
        onChange={(e) => setAt(1, e.target.value)}
      />
    </div>
  )
}
