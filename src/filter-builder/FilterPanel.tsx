import { Fragment, useState } from 'react'
import buttons from '../components/Button.module.css'
import {
  addCondition,
  addGroup,
  changeField,
  removeCondition,
  removeGroup,
  updateCondition,
} from '../filter/edit'
import type { Condition, Filter } from '../filter/model'
import { ConditionEditor } from './ConditionEditor'
import styles from './FilterPanel.module.css'

type Props = {
  filter: Filter
  onChange: (filter: Filter) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Left sidebar for building the filter. It sits beside the grid (not over it) so results stay
 * visible while the filter is edited; on a short 13" screen it also keeps vertical space for rows.
 */
export function FilterPanel({ filter, onChange, open, onOpenChange }: Props) {
  // The condition that should receive focus when it first appears.
  const [focusId, setFocusId] = useState<string | null>(null)
  const conditionCount = filter.groups.reduce((n, g) => n + g.conditions.length, 0)

  if (!open) {
    return (
      <aside className={styles.rail} aria-label="Filters">
        <button
          type="button"
          className={styles.railButton}
          aria-expanded="false"
          aria-label="Show filters"
          title="Show filters"
          onClick={() => onOpenChange(true)}
        >
          <span aria-hidden="true">»</span>
          <span className={styles.railLabel}>
            Filters{conditionCount > 0 && ` (${conditionCount})`}
          </span>
        </button>
      </aside>
    )
  }

  function add(result: { filter: Filter; condition: Condition }) {
    onChange(result.filter)
    setFocusId(result.condition.id)
  }

  return (
    <aside className={styles.panel} aria-label="Filters">
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Filters</h2>
        <button
          type="button"
          className={styles.iconButton}
          aria-expanded="true"
          aria-label="Hide filters"
          title="Hide filters"
          onClick={() => onOpenChange(false)}
        >
          «
        </button>
      </div>

      {filter.groups.length === 0 && (
        <p className={styles.note}>No filters yet, so every order is shown.</p>
      )}

      {filter.groups.map((group, groupIndex) => (
        <Fragment key={group.id}>
          {groupIndex > 0 && <div className={styles.and}>and</div>}
          <section className={styles.group} aria-label={`Group ${groupIndex + 1}`}>
            <div className={styles.groupHeader}>
              <span>
                Group {groupIndex + 1} · matches <strong>any</strong> of
              </span>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => onChange(removeGroup(filter, group.id))}
              >
                Remove group
              </button>
            </div>
            {group.conditions.map((condition, conditionIndex) => (
              <Fragment key={condition.id}>
                {conditionIndex > 0 && <div className={styles.or}>or</div>}
                <ConditionEditor
                  condition={condition}
                  autoFocus={condition.id === focusId}
                  onChange={(change) => onChange(updateCondition(filter, condition.id, change))}
                  onFieldChange={(field) => onChange(changeField(filter, condition.id, field))}
                  onRemove={() => onChange(removeCondition(filter, condition.id))}
                />
              </Fragment>
            ))}
            <button
              type="button"
              className={styles.textButton}
              onClick={() => add(addCondition(filter, group.id))}
            >
              + Add condition (or)
            </button>
          </section>
        </Fragment>
      ))}

      <button type="button" className={buttons.button} onClick={() => add(addGroup(filter))}>
        {filter.groups.length === 0 ? '+ Add filter' : '+ Add group (and)'}
      </button>
    </aside>
  )
}
